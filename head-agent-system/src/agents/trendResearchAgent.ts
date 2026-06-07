/**
 * Trend Research Agent.
 * ⚠️ Do not execute directly. Only accepts tasks from the Supervisor Agent
 *    (enforced by BaseAgent.executeTask). Step 1 of the team pipeline.
 *
 * Output is produced by Claude (claude-opus-4-8) when ANTHROPIC_API_KEY is set;
 * otherwise the deterministic mock() runs so the demo/tests work offline.
 */
import { BaseAgent, type AgentRunResult, type LlmSpec } from "./baseAgent.js";
import { S } from "../llm/claudeClient.js";
import type { AgentTask } from "../tasks/taskTypes.js";

class TrendResearchAgent extends BaseAgent {
  readonly agent_id = "trend_research_agent";
  readonly agent_name = "Pulse";
  readonly role = "Trend Research Agent";
  readonly capabilities = ["trend_scan", "audio_rank", "niche_match"];

  protected llmSpec(_task: AgentTask): LlmSpec {
    return {
      system:
        "You are a short-form video trend researcher for TikTok / Reels / Shorts. " +
        "Find a strong, current angle for the given topic and score its trend strength. Be specific and concrete.",
      instructions:
        "Research the topic and produce: a one-line trend_reason, 3-6 relevant hashtags, a competitor_reference URL, " +
        "a sharp content_angle, and a trend_score from 1-10.",
      schema: S.obj(
        {
          topic: S.str(),
          trend_reason: S.str("Why this is trending right now"),
          hashtags: S.arr(S.str(), "3-6 relevant hashtags, each starting with #"),
          competitor_reference: S.str("URL of a comparable performing video"),
          content_angle: S.str("The specific angle/hook strategy"),
          trend_score: S.num("1-10"),
        },
        ["topic", "trend_reason", "hashtags", "competitor_reference", "content_angle", "trend_score"],
      ),
    };
  }

  protected async mock(task: AgentTask): Promise<AgentRunResult> {
    const topic = String(task.input.topic ?? "Untitled");
    const faults = (task.input._faults as string[] | undefined) ?? [];
    if (faults.includes(this.agent_id) && !this.isCorrection(task)) {
      return { output: { topic, hashtags: ["#fyp"] }, scores: { trend_score: 5 } };
    }
    return {
      output: {
        topic,
        trend_reason: `"${topic}" is spiking with rising search + sound usage this week.`,
        hashtags: ["#fyp", `#${topic.replace(/\s+/g, "").toLowerCase()}`, "#howto", "#viral"],
        competitor_reference: "https://www.tiktok.com/@competitor/video/123456",
        content_angle: "Contrarian myth-buster with a fast payoff in the first 2 seconds.",
        trend_score: 8,
      },
      scores: { trend_score: 8 },
    };
  }
}

export const trendResearchAgent = new TrendResearchAgent();
