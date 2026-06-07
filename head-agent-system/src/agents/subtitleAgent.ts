/**
 * Subtitle Agent.
 * ⚠️ Do not execute directly. Only accepts tasks from the Supervisor Agent.
 *    Step 5 of the team pipeline. Claude-powered when ANTHROPIC_API_KEY is set.
 */
import { BaseAgent, type AgentRunResult, type LlmSpec } from "./baseAgent.js";
import { S } from "../llm/claudeClient.js";
import type { AgentTask } from "../tasks/taskTypes.js";

class SubtitleAgent extends BaseAgent {
  readonly agent_id = "subtitle_agent";
  readonly agent_name = "Sync";
  readonly role = "Subtitle Agent";
  readonly capabilities = ["transcribe_align", "subtitle_style", "burn_in"];

  protected llmSpec(_task: AgentTask): LlmSpec {
    return {
      system:
        "You generate styled, accurately-timed subtitles for the approved cut, aligned to the voiceover. " +
        "format MUST be one of srt/ass/vtt. timing_accuracy MUST be >= 8 (subtitles must be well-synced).",
      instructions:
        "Return subtitle_file (path), format (srt/ass/vtt), burned_in (boolean), keyword_highlights (array of words), " +
        "timing_accuracy (1-10, >= 8), and subtitle_accuracy_score (1-10, >= 8).",
      schema: S.obj(
        {
          subtitle_file: S.str(),
          format: S.enum(["srt", "ass", "vtt"]),
          burned_in: S.bool(),
          keyword_highlights: S.arr(S.str()),
          timing_accuracy: S.num("1-10, must be >= 8"),
          subtitle_accuracy_score: S.num("1-10, must be >= 8"),
        },
        ["subtitle_file", "format", "burned_in", "keyword_highlights", "timing_accuracy", "subtitle_accuracy_score"],
      ),
    };
  }

  protected async mock(task: AgentTask): Promise<AgentRunResult> {
    const faults = (task.input._faults as string[] | undefined) ?? [];
    if (faults.includes(this.agent_id) && !this.isCorrection(task)) {
      // Classic: subtitles ~1.5s out of sync (accuracy below the 8 threshold).
      return {
        output: { subtitle_file: "./out/subs.srt", format: "srt", burned_in: true, keyword_highlights: ["why"], timing_accuracy: 6 },
        scores: { subtitle_accuracy_score: 6 },
      };
    }
    return {
      output: {
        subtitle_file: "./out/subs.ass",
        format: "ass",
        burned_in: true,
        keyword_highlights: ["stop", "why", "part 2"],
        timing_accuracy: 9,
        subtitle_accuracy_score: 9,
      },
      scores: { subtitle_accuracy_score: 9 },
    };
  }
}

export const subtitleAgent = new SubtitleAgent();
