/**
 * Base class for every specialized agent.
 *
 * ⚠️  AGENTS MUST NOT BE EXECUTED DIRECTLY.
 *     - An agent only accepts tasks from the Supervisor Agent.
 *     - executeTask() rejects any task whose `assigned_by !== "supervisor_agent"`.
 *     - Agents cannot create workflows, assign tasks, call other agents, or
 *       approve their own work. They only transform input → structured output.
 *
 * The authorization guard, timeout and error handling live here once so every
 * subclass inherits identical, non-bypassable behaviour.
 */
import { SUPERVISOR_ID, type AgentOutput, type AgentTask } from "../tasks/taskTypes.js";
import { extractScores, generateStructured, isLlmEnabled, type JsonSchema } from "../llm/claudeClient.js";

const DEFAULT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS ?? 120_000);

export interface AgentRunResult {
  output: Record<string, unknown>;
  scores?: Record<string, unknown>;
}

/** What an agent needs to produce its output via Claude (structured output). */
export interface LlmSpec {
  /** System prompt describing the agent's role + output contract. */
  system: string;
  /** JSON Schema for the `output` object the agent must return. */
  schema: JsonSchema;
  /** Task-specific instructions appended to the generated user prompt. */
  instructions: string;
  maxTokens?: number;
}

export abstract class BaseAgent {
  abstract readonly agent_id: string;
  abstract readonly agent_name: string;
  abstract readonly role: string;
  abstract readonly capabilities: string[];
  protected timeoutMs = DEFAULT_TIMEOUT_MS;

  /**
   * Deterministic, offline output. Used for the demo, tests, and whenever the
   * Claude path is disabled (no ANTHROPIC_API_KEY). Also honours the `_faults`
   * fault-injection flag for exercising the correction loop.
   */
  protected abstract mock(task: AgentTask): Promise<AgentRunResult>;

  /**
   * Spec for the Claude-powered path. Return `null` to always use `mock()`.
   * Override in each agent to define its system prompt + output schema.
   */
  protected llmSpec(_task: AgentTask): LlmSpec | null {
    return null;
  }

  /**
   * The actual work, chosen by the base class: call Claude when enabled and a
   * spec exists, otherwise fall back to the deterministic mock. The Supervisor
   * is the only caller (via runTask → executeTask); agents never run the loop.
   */
  protected async run(task: AgentTask): Promise<AgentRunResult> {
    const spec = this.llmSpec(task);
    if (spec && isLlmEnabled()) {
      const output = await generateStructured<Record<string, unknown>>({
        system: spec.system,
        prompt: this.buildPrompt(task, spec.instructions),
        schema: spec.schema,
        maxTokens: spec.maxTokens,
      });
      return { output, scores: extractScores(output) };
    }
    return this.mock(task);
  }

  /** Build the user prompt from the brief, approved upstream outputs, and any correction. */
  protected buildPrompt(task: AgentTask, instructions: string): string {
    const topic = String(task.input.topic ?? "Untitled");
    const upstream = (task.input.upstream ?? {}) as Record<string, unknown>;
    const parts = [`Topic: ${topic}`];
    if (Object.keys(upstream).length) {
      parts.push(`Approved outputs from earlier pipeline stages (JSON):\n${JSON.stringify(upstream, null, 2)}`);
    }
    parts.push(instructions);
    if (task.correction) {
      parts.push(
        `A previous attempt was REJECTED by the Supervisor. Address every issue below, do not repeat them:\n${task.correction}`,
      );
    }
    parts.push("Return ONLY the JSON object required by the schema — no prose, no markdown fences.");
    return parts.join("\n\n");
  }

  /** The ONLY public entry. Enforces supervisor-only authorization. */
  async executeTask(task: AgentTask): Promise<AgentOutput> {
    // Guardrail: refuse anything not assigned by the Supervisor Agent.
    if (task.assigned_by !== SUPERVISOR_ID) {
      return this.fail(task, ["Unauthorized task. Agents only accept tasks from Supervisor Agent."]);
    }
    if (task.assigned_agent_id !== this.agent_id) {
      return this.fail(task, [`Task routed to "${task.assigned_agent_id}" but received by "${this.agent_id}".`]);
    }

    // Test/demo hook: a "hard fault" fails on every attempt (never self-heals),
    // used to exercise the 3-strike escalation path.
    const hardFaults = (task.input?._hardFaults as string[] | undefined) ?? [];
    if (hardFaults.includes(this.agent_id)) {
      return this.fail(task, ["Simulated persistent failure (hard fault)."]);
    }

    try {
      const { output, scores } = await this.withTimeout(this.run(task));
      return {
        task_id: task.task_id,
        workflow_id: task.workflow_id,
        agent_id: this.agent_id,
        status: "completed",
        output,
        scores,
      };
    } catch (e) {
      return this.fail(task, [e instanceof Error ? e.message : String(e)]);
    }
  }

  protected fail(task: AgentTask, errors: string[]): AgentOutput {
    return {
      task_id: task.task_id,
      workflow_id: task.workflow_id,
      agent_id: this.agent_id,
      status: "failed",
      output: {},
      errors,
    };
  }

  /** True when the Supervisor injected a correction instruction for a re-run. */
  protected isCorrection(task: AgentTask): boolean {
    return Boolean(task.correction) && task.retry_count > 0;
  }

  private withTimeout(p: Promise<AgentRunResult>): Promise<AgentRunResult> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Agent "${this.agent_id}" timed out after ${this.timeoutMs}ms`)), this.timeoutMs);
      p.then(
        (r) => {
          clearTimeout(t);
          resolve(r);
        },
        (err) => {
          clearTimeout(t);
          reject(err);
        },
      );
    });
  }
}
