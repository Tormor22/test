/**
 * Script Writer Agent.
 * ⚠️ Do not execute directly. Only accepts tasks from the Supervisor Agent.
 *    Step 2 of the team pipeline. Claude-powered when ANTHROPIC_API_KEY is set.
 */
import { BaseAgent, type AgentRunResult, type LlmSpec } from "./baseAgent.js";
import { S } from "../llm/claudeClient.js";
import type { AgentTask } from "../tasks/taskTypes.js";

class ScriptWriterAgent extends BaseAgent {
  readonly agent_id = "script_writer_agent";
  readonly agent_name = "Scribe";
  readonly role = "Script Writer Agent";
  readonly capabilities = ["script_draft", "retention_score", "voice_match"];

  protected llmSpec(_task: AgentTask): LlmSpec {
    return {
      system:
        "You are a short-form video scriptwriter optimizing for retention. Use the approved trend angle from upstream. " +
        "Write a scroll-stopping hook (>= 10 chars, ideally a question/number/pattern-interrupt), a tight body, and a clear single CTA. " +
        "Avoid policy-risk claims (no 'guaranteed', 'miracle', 'cure', 'get rich quick').",
      instructions:
        "Write a 30s script with: hook, body, cta, duration (seconds), tone, at least 2 A/B variations, " +
        "and self-assessed hook_score and script_quality_score (1-10).",
      schema: S.obj(
        {
          hook: S.str("Strong first line, >= 10 chars"),
          body: S.str(),
          cta: S.str("Single clear call to action"),
          duration: S.num("Seconds, e.g. 30"),
          tone: S.str(),
          variations: S.arr(
            S.obj({ hook: S.str(), angle: S.str() }, ["hook", "angle"]),
            "At least 2 alternative hooks for A/B testing",
          ),
          hook_score: S.num("1-10"),
          script_quality_score: S.num("1-10"),
        },
        ["hook", "body", "cta", "duration", "tone", "variations", "hook_score", "script_quality_score"],
      ),
    };
  }

  protected async mock(task: AgentTask): Promise<AgentRunResult> {
    const topic = String(task.input.topic ?? "Untitled");
    const faults = (task.input._faults as string[] | undefined) ?? [];
    if (faults.includes(this.agent_id) && !this.isCorrection(task)) {
      return {
        output: { hook: "Hi", body: "stuff", cta: "", duration: 30, tone: "flat", variations: [] },
        scores: { hook_score: 4, script_quality_score: 5 },
      };
    }
    return {
      output: {
        hook: `Stop scrolling — here's why ${topic} is everything you got wrong.`,
        body: `A tight 3-point breakdown of ${topic} with a concrete example and a surprising stat.`,
        cta: "Follow for part 2 and comment your biggest question.",
        duration: 30,
        tone: "energetic, confident, friendly",
        variations: [
          { hook: `Nobody talks about this side of ${topic}…`, angle: "curiosity" },
          { hook: `${topic} in 30 seconds — go.`, angle: "speed" },
        ],
        hook_score: 9,
        script_quality_score: 9,
      },
      scores: { hook_score: 9, script_quality_score: 9 },
    };
  }
}

export const scriptWriterAgent = new ScriptWriterAgent();
