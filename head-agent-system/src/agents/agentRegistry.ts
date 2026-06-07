/**
 * Agent Registry (spec §2). Holds every agent runtime keyed by agent_id.
 *
 * Only the Supervisor Agent reads `executeTask` from here. Nothing else in the
 * codebase is permitted to import an individual agent or call executeTask.
 */
import { agentStore, type AgentStatusRecord } from "../storage/agentStore.js";
import type { AgentOutput, AgentTask } from "../tasks/taskTypes.js";

import { trendResearchAgent } from "./trendResearchAgent.js";
import { scriptWriterAgent } from "./scriptWriterAgent.js";
import { assetFinderAgent } from "./assetFinderAgent.js";
import { voiceoverAgent } from "./voiceoverAgent.js";
import { subtitleAgent } from "./subtitleAgent.js";
import { videoEditorAgent } from "./videoEditorAgent.js";
import { qaPolicyAgent } from "./qaPolicyAgent.js";
import { publisherAgent } from "./publisherAgent.js";
import { analyticsAgent } from "./analyticsAgent.js";

interface AgentRuntime {
  agent_id: string;
  agent_name: string;
  role: string;
  capabilities: string[];
  executeTask(task: AgentTask): Promise<AgentOutput>;
}

/** Full record returned to callers (definition + live status). */
export interface AgentRecord extends Omit<AgentRuntime, "executeTask"> {
  status: AgentStatusRecord["status"];
  current_task_id: string | null;
  stats: AgentStatusRecord["stats"];
}

const ALL: AgentRuntime[] = [
  trendResearchAgent,
  scriptWriterAgent,
  assetFinderAgent,
  voiceoverAgent,
  subtitleAgent,
  videoEditorAgent,
  qaPolicyAgent,
  publisherAgent,
  analyticsAgent,
];

class AgentRegistry {
  private agents = new Map<string, AgentRuntime>();

  constructor(runtimes: AgentRuntime[]) {
    for (const a of runtimes) {
      this.agents.set(a.agent_id, a);
      agentStore.ensure(a.agent_id); // seed an idle status record
    }
  }

  has(agent_id: string): boolean {
    return this.agents.has(agent_id);
  }

  /** Used ONLY by the Supervisor to run a task. */
  getRuntime(agent_id: string): AgentRuntime {
    const a = this.agents.get(agent_id);
    if (!a) throw new Error(`No agent registered with id "${agent_id}"`);
    return a;
  }

  getRecord(agent_id: string): AgentRecord | undefined {
    const a = this.agents.get(agent_id);
    if (!a) return undefined;
    const s = agentStore.ensure(agent_id);
    return {
      agent_id: a.agent_id,
      agent_name: a.agent_name,
      role: a.role,
      capabilities: a.capabilities,
      status: s.status,
      current_task_id: s.current_task_id,
      stats: s.stats,
    };
  }

  list(): AgentRecord[] {
    return [...this.agents.keys()].map((id) => this.getRecord(id)!);
  }
}

export const agentRegistry = new AgentRegistry(ALL);
