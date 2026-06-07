import type { LucideIcon } from "lucide-react";

/**
 * Frontend HR domain types — the display-shaped mirror of the
 * `agent-hr-manager` backend wire format (see ../../agent-hr-manager/src/types).
 * The `/hr` dashboard renders these; they arrive over the HR WebSocket in
 * production and from `@/data/hr` mock when no backend is configured.
 */

export type HRStatus =
  | "active"
  | "idle"
  | "busy"
  | "warning"
  | "failed"
  | "terminated"
  | "replacing"
  | "onboarding"
  | "probation"
  | "disabled";

export type HRDepartment =
  | "content_research"
  | "content_creation"
  | "production"
  | "quality_control"
  | "publishing"
  | "analytics"
  | "management";

export type WarningLevel = 0 | 1 | 2 | 3 | 4;

export type PerformanceBand = "excellent" | "good" | "monitor" | "warning" | "replace";

export interface ProbationState {
  status: "pending" | "in_progress" | "passed" | "failed" | "extended";
  requiredTasks: number;
  completedTasks: number;
  passedTasks: number;
}

export interface HRAgent {
  id: string;
  name: string;
  /** Functional role label, e.g. "Video Editor Agent". */
  role: string;
  department: HRDepartment;
  status: HRStatus;
  /** 0-100 overall performance. */
  performanceScore: number;
  band: PerformanceBand;
  reliabilityScore: number;
  qualityScore: number;
  /** 0-100 health (heartbeat freshness + reliability). */
  health: number;
  warningLevel: WarningLevel;
  missionCritical: boolean;
  /** How much work the agent is carrying, 0-100. */
  workload: number;
  probation: ProbationState | null;
  lastHeartbeatAt: string;
  /** Lucide icon for the role avatar. */
  icon: LucideIcon;
  accent: string;
}

export type HRActionType =
  | "monitor"
  | "warn"
  | "quarantine"
  | "terminate"
  | "replace"
  | "recruit"
  | "onboard"
  | "reassign_task"
  | "restart"
  | "probation_pass"
  | "probation_fail"
  | "escalate";

export interface HRAction {
  id: string;
  actionType: HRActionType;
  agentName: string;
  reason: string;
  at: string;
}

export interface ReplacementRecord {
  id: string;
  removedAgentName: string;
  replacementAgentName: string;
  reason: string;
  transferStatus: "pending" | "in_progress" | "completed" | "failed";
  transferredTasks: number;
  at: string;
}
