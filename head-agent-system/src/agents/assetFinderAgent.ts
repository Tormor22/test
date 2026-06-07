/**
 * Asset Finder Agent.
 * ⚠️ Do not execute directly. Only accepts tasks from the Supervisor Agent.
 *    Step 3 of the team pipeline. Claude-powered when ANTHROPIC_API_KEY is set.
 */
import { BaseAgent, type AgentRunResult, type LlmSpec } from "./baseAgent.js";
import { S } from "../llm/claudeClient.js";
import type { AgentTask } from "../tasks/taskTypes.js";

class AssetFinderAgent extends BaseAgent {
  readonly agent_id = "asset_finder_agent";
  readonly agent_name = "Scout";
  readonly role = "Asset Finder Agent";
  readonly capabilities = ["stock_search", "license_check", "asset_pack"];

  protected llmSpec(_task: AgentTask): LlmSpec {
    return {
      system:
        "You source b-roll, images, and SFX for a short video. EVERY asset MUST carry a recognised license " +
        "(one of: royalty-free, cc0, cc-by, licensed, owned, public-domain, stock-licensed) and a commercial usage_permission. " +
        "Never propose copyrighted material (no 'official music video', 'movie clip', 'tv show', 'rights-restricted').",
      instructions:
        "Propose 2-4 assets that fit the script beats. For each asset include type, source_url, file_path, license, " +
        "usage_permission, and relevance_score (1-10). Also return an overall asset_relevance_score (1-10) and copyright_risk.",
      schema: S.obj(
        {
          assets: S.arr(
            S.obj(
              {
                type: S.str(),
                source_url: S.str(),
                file_path: S.str(),
                license: S.enum(["royalty-free", "cc0", "cc-by", "licensed", "owned", "public-domain", "stock-licensed"]),
                usage_permission: S.str(),
                relevance_score: S.num("1-10"),
              },
              ["type", "source_url", "file_path", "license", "usage_permission", "relevance_score"],
            ),
            "2-4 licensed assets",
          ),
          asset_relevance_score: S.num("1-10"),
          copyright_risk: S.enum(["low", "medium", "high"]),
        },
        ["assets", "asset_relevance_score", "copyright_risk"],
      ),
    };
  }

  protected async mock(task: AgentTask): Promise<AgentRunResult> {
    const faults = (task.input._faults as string[] | undefined) ?? [];
    if (faults.includes(this.agent_id) && !this.isCorrection(task)) {
      return {
        output: { assets: [{ source_url: "official music video rip", license: "", relevance_score: 5 }] },
        scores: { asset_relevance_score: 5 },
      };
    }
    return {
      output: {
        assets: [
          {
            type: "footage",
            source_url: "https://cdn.pexels.com/video/abc.mp4",
            file_path: "./assets/clip1.mp4",
            license: "royalty-free",
            usage_permission: "commercial",
            relevance_score: 9,
          },
          {
            type: "sfx",
            source_url: "https://cdn.freesound.org/whoosh.mp3",
            file_path: "./assets/whoosh.mp3",
            license: "cc0",
            usage_permission: "commercial",
            relevance_score: 8,
          },
        ],
        asset_relevance_score: 9,
        copyright_risk: "low",
      },
      scores: { asset_relevance_score: 9, copyright_risk: "low" },
    };
  }
}

export const assetFinderAgent = new AssetFinderAgent();
