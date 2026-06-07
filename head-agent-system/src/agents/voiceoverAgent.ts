/**
 * Voiceover Agent.
 * ⚠️ Do not execute directly. Only accepts tasks from the Supervisor Agent.
 *    Step 4 of the team pipeline. Claude-powered when ANTHROPIC_API_KEY is set.
 *
 * Note: a real deployment would call a TTS provider here and upload the audio.
 * Claude plans the delivery + returns the metadata the pipeline validates.
 */
import { BaseAgent, type AgentRunResult, type LlmSpec } from "./baseAgent.js";
import { S } from "../llm/claudeClient.js";
import type { AgentTask } from "../tasks/taskTypes.js";

class VoiceoverAgent extends BaseAgent {
  readonly agent_id = "voiceover_agent";
  readonly agent_name = "Echo";
  readonly role = "Voiceover Agent";
  readonly capabilities = ["tts_render", "timing_markup", "audio_normalize"];

  protected llmSpec(_task: AgentTask): LlmSpec {
    return {
      system:
        "You plan the voiceover for the approved script. Choose a voice profile and delivery that match the tone, " +
        "and report the audio metadata. duration MUST be > 0. audio_file MUST be a plausible file path ending in .mp3 or .wav.",
      instructions:
        "Return audio_file (path), language, voice_type, speed (e.g. 1.0), emotion, duration (seconds, > 0), " +
        "and voiceover_quality_score (1-10).",
      schema: S.obj(
        {
          audio_file: S.str("Path ending in .mp3 or .wav"),
          language: S.str(),
          voice_type: S.str(),
          speed: S.num(),
          emotion: S.str(),
          duration: S.num("Seconds, must be > 0"),
          voiceover_quality_score: S.num("1-10"),
        },
        ["audio_file", "language", "voice_type", "speed", "emotion", "duration", "voiceover_quality_score"],
      ),
    };
  }

  protected async mock(task: AgentTask): Promise<AgentRunResult> {
    const faults = (task.input._faults as string[] | undefined) ?? [];
    if (faults.includes(this.agent_id) && !this.isCorrection(task)) {
      return {
        output: { audio_file: "not-a-file", language: "en", voice_type: "male", speed: 1, emotion: "neutral", duration: 0 },
        scores: { voiceover_quality_score: 5 },
      };
    }
    return {
      output: {
        audio_file: "./out/voiceover.mp3",
        language: "en",
        voice_type: "female-warm",
        speed: 1.05,
        emotion: "energetic",
        duration: 30,
        voiceover_quality_score: 9,
      },
      scores: { voiceover_quality_score: 9 },
    };
  }
}

export const voiceoverAgent = new VoiceoverAgent();
