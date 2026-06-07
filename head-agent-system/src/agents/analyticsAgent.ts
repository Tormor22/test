/**
 * Analytics Agent.
 * ⚠️ Do not execute directly. Only accepts tasks from the Supervisor Agent.
 *    Step 9 (final) of the team pipeline. Claude-powered when ANTHROPIC_API_KEY is set.
 *
 * Note: a real deployment would pull metrics from the platform API. Claude
 * structures the metrics + next-content recommendations.
 */
import { BaseAgent, type AgentRunResult, type LlmSpec } from "./baseAgent.js";
import { S } from "../llm/claudeClient.js";
import type { AgentTask } from "../tasks/taskTypes.js";

class AnalyticsAgent extends BaseAgent {
  readonly agent_id = "analytics_agent";
  readonly agent_name = "Insight";
  readonly role = "Analytics Agent";
  readonly capabilities = ["metrics_pull", "retention_analyze", "report_write"];

  protected llmSpec(_task: AgentTask): LlmSpec {
    return {
      system:
        "You report post-publish performance for the video and recommend next content. " +
        "Provide concrete metrics and at least two actionable recommendations.",
      instructions:
        "Return a metrics object (views, likes, comments, shares, saves, completion_rate, engagement_rate, watch_time, " +
        "best_posting_time) and a recommendations array of strings.",
      schema: S.obj(
        {
          metrics: S.obj(
            {
              views: S.num(),
              likes: S.num(),
              comments: S.num(),
              shares: S.num(),
              saves: S.num(),
              completion_rate: S.num("0-1"),
              engagement_rate: S.num("0-1"),
              watch_time: S.num("seconds"),
              best_posting_time: S.str(),
            },
            ["views", "completion_rate", "engagement_rate"],
          ),
          recommendations: S.arr(S.str(), "At least 2 next-content recommendations"),
        },
        ["metrics", "recommendations"],
      ),
    };
  }

  protected async mock(_task: AgentTask): Promise<AgentRunResult> {
    return {
      output: {
        metrics: {
          views: 124_300,
          likes: 9800,
          comments: 410,
          shares: 1200,
          saves: 2300,
          completion_rate: 0.62,
          engagement_rate: 0.11,
          watch_time: 21,
          best_posting_time: "19:00",
        },
        recommendations: ["Double down on myth-buster hooks", "Test a 15s cut for retention"],
      },
    };
  }
}

export const analyticsAgent = new AnalyticsAgent();
