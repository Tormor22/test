import type { LucideIcon } from "lucide-react";

/**
 * The seven lifecycle states an agent can be in. Ordered roughly by the way a
 * unit of work flows: it sits `idle`, starts `thinking`, does the `working`,
 * may `wait` on an upstream dependency, `review`s the result, then lands on
 * `done` — or `error` if something broke.
 */
export type AgentStatus =
  | "idle"
  | "thinking"
  | "working"
  | "waiting"
  | "reviewing"
  | "error"
  | "done";

export type TaskState = "queued" | "in-progress" | "blocked" | "done";

export interface ToolUsage {
  tool: string;
  count: number;
  lastUsed: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  /** Short tagline shown on the card. */
  tagline: string;
  /** Long-form description shown in the detail panel. */
  description: string;
  status: AgentStatus;
  /** Human-readable label for what the agent is doing right now. */
  currentTask: string;
  /** 0 - 100 */
  progress: number;
  /** ISO timestamp of last activity. */
  lastActivity: string;
  /** Path to the avatar image (may not exist yet — placeholder is rendered as fallback). */
  avatar: string;
  /** Lucide icon used for the generated placeholder avatar. */
  icon: LucideIcon;
  /** Tailwind gradient class pair, e.g. "from-cyan-400 to-blue-500". */
  gradient: string;
  /** Accent hex used for glows/rings. */
  accent: string;
  memorySummary: string;
  toolUsage: ToolUsage[];
  /** Coordinates (0-100 %) on the office floor map. */
  desk: { x: number; y: number };
}

export interface Task {
  id: string;
  agentId: string;
  title: string;
  state: TaskState;
  priority: "low" | "medium" | "high" | "critical";
  eta: string;
}

export interface LogEntry {
  id: string;
  agentId: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error" | "debug";
  message: string;
}

/**
 * Structured ops briefing produced by Claude from a snapshot of live state.
 * Shape mirrors the JSON schema enforced server-side via `output_config.format`,
 * so the route and the UI agree on the contract.
 */
export interface DailyReport {
  /** One-line overall status of the production line. */
  headline: string;
  /** 2–3 sentence narrative summary. */
  summary: string;
  /** Active blockers, each tied to the responsible agent. */
  blockers: { agent: string; issue: string }[];
  /** Work completed (done) this batch. */
  shipped: string[];
  /** Work currently in flight. */
  inProgress: string[];
  /** Recommended or queued next steps. */
  nextUp: string[];
  /** Risks / things to watch. */
  risks: string[];
}

/** A directed handoff in the production pipeline (source agent → target agent). */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  /** Optional short label describing what is handed off (e.g. "script"). */
  label?: string;
}

/** Connection state of the live event source feeding the dashboard. */
export type ConnectionStatus = "connecting" | "live" | "reconnecting" | "offline";

/**
 * A single real-time update from the agent backend. This is the wire format the
 * dashboard consumes — the mock source emits these on a timer today, and a real
 * WebSocket backend would emit the exact same shape (see {@link DashboardEventSource}).
 *
 * Maps to the spec's named events: `status` covers agent_started/agent_completed,
 * `progress` is agent_progress, `log` is agent_message, and an `error` is just a
 * `status` of "error" accompanied by a `log` at level "error".
 */
export type AgentEvent =
  | { type: "status"; agentId: string; at: string; status: AgentStatus; task?: string }
  | { type: "progress"; agentId: string; at: string; progress: number }
  | {
      type: "log";
      agentId: string;
      at: string;
      level: LogEntry["level"];
      message: string;
    };
