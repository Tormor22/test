/**
 * Video Editor Agent.
 * ⚠️ Do not execute directly. Only accepts tasks from the Supervisor Agent.
 *    Step 6 of the team pipeline. Claude-powered when ANTHROPIC_API_KEY is set.
 *
 * Note: a real deployment would drive FFmpeg/Remotion here. Claude plans the
 * assembly + returns the export metadata the pipeline validates.
 */
import { BaseAgent, type AgentRunResult, type LlmSpec } from "./baseAgent.js";
import { S } from "../llm/claudeClient.js";
import type { AgentTask } from "../tasks/taskTypes.js";

class VideoEditorAgent extends BaseAgent {
  readonly agent_id = "video_editor_agent";
  readonly agent_name = "Splice";
  readonly role = "Video Editor Agent";
  readonly capabilities = ["timeline_assemble", "render_export", "effect_apply"];

  protected llmSpec(_task: AgentTask): LlmSpec {
    return {
      system:
        "You assemble the final vertical short from the approved assets, voiceover, and subtitles. " +
        "aspect_ratio MUST be '9:16', video_file MUST end in .mp4, audio_synced MUST be true.",
      instructions:
        "Return video_file (.mp4 path), aspect_ratio ('9:16'), resolution (e.g. '1080x1920'), duration (seconds), " +
        "audio_synced (true), and video_quality_score (1-10, >= 8).",
      schema: S.obj(
        {
          video_file: S.str("Path ending in .mp4"),
          aspect_ratio: S.enum(["9:16"]),
          resolution: S.str("e.g. 1080x1920"),
          duration: S.num("Seconds"),
          audio_synced: S.bool("Must be true"),
          video_quality_score: S.num("1-10, must be >= 8"),
        },
        ["video_file", "aspect_ratio", "resolution", "duration", "audio_synced", "video_quality_score"],
      ),
    };
  }

  protected async mock(task: AgentTask): Promise<AgentRunResult> {
    const faults = (task.input._faults as string[] | undefined) ?? [];
    if (faults.includes(this.agent_id) && !this.isCorrection(task)) {
      return {
        output: { video_file: "./out/final.mov", aspect_ratio: "16:9", resolution: "1920x1080", duration: 30, audio_synced: false },
        scores: { video_quality_score: 6 },
      };
    }
    return {
      output: {
        video_file: "./out/final.mp4",
        aspect_ratio: "9:16",
        resolution: "1080x1920",
        duration: 30,
        audio_synced: true,
        video_quality_score: 9,
      },
      scores: { video_quality_score: 9 },
    };
  }
}

export const videoEditorAgent = new VideoEditorAgent();
