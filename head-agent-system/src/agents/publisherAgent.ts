/**
 * Publisher Agent.
 * ⚠️ Do not execute directly. Only accepts tasks from the Supervisor Agent.
 *    Step 8 of the team pipeline. Claude-powered when ANTHROPIC_API_KEY is set.
 *
 * Note: a real deployment would call the platform upload API here. Claude
 * drafts the caption/hashtags + returns the publish metadata.
 */
import { BaseAgent, type AgentRunResult, type LlmSpec } from "./baseAgent.js";
import { S } from "../llm/claudeClient.js";
import type { AgentTask } from "../tasks/taskTypes.js";

class PublisherAgent extends BaseAgent {
  readonly agent_id = "publisher_agent";
  readonly agent_name = "Beacon";
  readonly role = "Publisher Agent";
  readonly capabilities = ["schedule_slot", "platform_upload", "publish_verify"];

  protected llmSpec(_task: AgentTask): LlmSpec {
    return {
      system:
        "You publish the approved video. Write a strong caption and hashtags, pick a schedule time, and report the result. " +
        "post_status MUST be 'published' on success and post_url MUST be a valid https URL.",
      instructions:
        "Return platform, caption, hashtags (array), scheduled_time (ISO 8601), post_status ('published'), " +
        "and post_url (a valid https URL).",
      schema: S.obj(
        {
          platform: S.enum(["tiktok", "youtube_shorts", "reels"]),
          caption: S.str(),
          hashtags: S.arr(S.str()),
          scheduled_time: S.str("ISO 8601 timestamp"),
          post_status: S.enum(["published", "scheduled", "failed"]),
          post_url: S.str("Valid https URL"),
        },
        ["platform", "caption", "hashtags", "scheduled_time", "post_status", "post_url"],
      ),
    };
  }

  protected async mock(task: AgentTask): Promise<AgentRunResult> {
    const topic = String(task.input.topic ?? "Untitled");
    const faults = (task.input._faults as string[] | undefined) ?? [];
    if (faults.includes(this.agent_id) && !this.isCorrection(task)) {
      return {
        output: { platform: "tiktok", caption: "x", hashtags: ["#fyp"], scheduled_time: "now", post_status: "failed", post_url: "" },
      };
    }
    return {
      output: {
        platform: "tiktok",
        caption: `${topic} explained in 30s 👇`,
        hashtags: ["#fyp", "#howto", "#viral"],
        scheduled_time: new Date(Date.now() + 3_600_000).toISOString(),
        post_status: "published",
        post_url: "https://www.tiktok.com/@you/video/7777777777",
      },
    };
  }
}

export const publisherAgent = new PublisherAgent();
