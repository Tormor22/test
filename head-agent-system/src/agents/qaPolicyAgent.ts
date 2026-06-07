/**
 * QA / Policy Check Agent.
 * ⚠️ Do not execute directly. Only accepts tasks from the Supervisor Agent.
 *    Step 7 of the team pipeline. Claude-powered when ANTHROPIC_API_KEY is set.
 *
 * Reviews the assembled video's upstream outputs and reports quality + risk.
 * The Supervisor independently re-validates — this agent does not self-approve.
 */
import { BaseAgent, type AgentRunResult, type LlmSpec } from "./baseAgent.js";
import { S } from "../llm/claudeClient.js";
import type { AgentTask } from "../tasks/taskTypes.js";

class QaPolicyAgent extends BaseAgent {
  readonly agent_id = "qa_policy_agent";
  readonly agent_name = "Aegis";
  readonly role = "QA / Policy Check Agent";
  readonly capabilities = ["policy_scan", "audio_fingerprint", "claim_check"];

  protected llmSpec(_task: AgentTask): LlmSpec {
    return {
      system:
        "You are a strict pre-publish QA + policy reviewer. Review the approved upstream outputs (script, assets, video, subtitles) " +
        "and honestly score them. Flag policy or copyright risk where present. Do not rubber-stamp.",
      instructions:
        "Return hook_score (1-10), retention_score (1-10), policy_risk (low/medium/high), copyright_risk (low/medium/high), " +
        "brand_fit (1-10), and ready_to_publish (boolean). Set ready_to_publish=false if any score is weak or any risk is high.",
      schema: S.obj(
        {
          hook_score: S.num("1-10"),
          retention_score: S.num("1-10"),
          policy_risk: S.enum(["low", "medium", "high"]),
          copyright_risk: S.enum(["low", "medium", "high"]),
          brand_fit: S.num("1-10"),
          ready_to_publish: S.bool(),
        },
        ["hook_score", "retention_score", "policy_risk", "copyright_risk", "brand_fit", "ready_to_publish"],
      ),
    };
  }

  protected async mock(task: AgentTask): Promise<AgentRunResult> {
    const faults = (task.input._faults as string[] | undefined) ?? [];
    if (faults.includes(this.agent_id) && !this.isCorrection(task)) {
      return {
        output: {
          hook_score: 5,
          retention_score: 6,
          policy_risk: "high",
          copyright_risk: "low",
          brand_fit: 7,
          ready_to_publish: false,
        },
        scores: { hook_score: 5, brand_fit_score: 7, policy_risk: "high" },
      };
    }
    return {
      output: {
        hook_score: 9,
        retention_score: 9,
        policy_risk: "low",
        copyright_risk: "low",
        brand_fit: 9,
        ready_to_publish: true,
      },
      scores: { hook_score: 9, brand_fit_score: 9, policy_risk: "low", copyright_risk: "low" },
    };
  }
}

export const qaPolicyAgent = new QaPolicyAgent();
