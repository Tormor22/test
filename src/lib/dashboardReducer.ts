/**
 * Pure reducer that folds a stream of {@link AgentEvent}s into the live
 * dashboard state. Kept free of React so it can be unit-tested in isolation.
 */
import { agents as seedAgents } from "@/data/agents";
import { recentLogs } from "@/data/logs";
import type { Agent, AgentEvent, LogEntry } from "@/types";

export interface DashboardState {
  agents: Agent[];
  logs: LogEntry[];
}

/** Keep the live log buffer bounded so it never grows without limit. */
const MAX_LOGS = 60;

let logSeq = 0;
const nextLogId = () => `live-${Date.now().toString(36)}-${(logSeq++).toString(36)}`;

/** Fresh starting state — deep-ish clones so the static seed is never mutated. */
export function initDashboardState(): DashboardState {
  return {
    agents: seedAgents.map((a) => ({ ...a })),
    logs: recentLogs.slice(0, MAX_LOGS).map((l) => ({ ...l })),
  };
}

export function dashboardReducer(state: DashboardState, event: AgentEvent): DashboardState {
  switch (event.type) {
    case "status":
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.id === event.agentId
            ? {
                ...a,
                status: event.status,
                lastActivity: event.at,
                progress: event.status === "done" ? 100 : a.progress,
                currentTask: event.task ?? a.currentTask,
              }
            : a
        ),
      };

    case "progress":
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.id === event.agentId
            ? { ...a, progress: Math.max(0, Math.min(100, event.progress)), lastActivity: event.at }
            : a
        ),
      };

    case "log": {
      const entry: LogEntry = {
        id: nextLogId(),
        agentId: event.agentId,
        timestamp: event.at,
        level: event.level,
        message: event.message,
      };
      return { ...state, logs: [entry, ...state.logs].slice(0, MAX_LOGS) };
    }

    default:
      return state;
  }
}
