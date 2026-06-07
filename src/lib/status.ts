import {
  Loader2,
  Pause,
  Hourglass,
  AlertTriangle,
  CheckCircle2,
  Brain,
  ClipboardCheck,
} from "lucide-react";
import type { AgentStatus } from "@/types";

export interface StatusConfig {
  label: string;
  /** Tailwind text color class. */
  text: string;
  /** Tailwind background tint class. */
  bg: string;
  /** Tailwind border class. */
  border: string;
  /** Raw hex for the pulse dot / glow. */
  dot: string;
  icon: typeof Loader2;
}

export const statusConfig: Record<AgentStatus, StatusConfig> = {
  working: {
    label: "กำลังทำงาน",
    text: "text-cyan-300",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/30",
    dot: "#22d3ee",
    icon: Loader2,
  },
  thinking: {
    label: "กำลังคิด",
    text: "text-violet-300",
    bg: "bg-violet-400/10",
    border: "border-violet-400/30",
    dot: "#a78bfa",
    icon: Brain,
  },
  idle: {
    label: "ว่าง",
    text: "text-slate-300",
    bg: "bg-slate-400/10",
    border: "border-slate-400/25",
    dot: "#94a3b8",
    icon: Pause,
  },
  reviewing: {
    label: "กำลังตรวจทาน",
    text: "text-sky-300",
    bg: "bg-sky-400/10",
    border: "border-sky-400/30",
    dot: "#38bdf8",
    icon: ClipboardCheck,
  },
  waiting: {
    label: "กำลังรอ",
    text: "text-amber-300",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    dot: "#fbbf24",
    icon: Hourglass,
  },
  error: {
    label: "ข้อผิดพลาด",
    text: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    dot: "#fb7185",
    icon: AlertTriangle,
  },
  done: {
    label: "เสร็จสิ้น",
    text: "text-emerald-300",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    dot: "#34d399",
    icon: CheckCircle2,
  },
};

/** Statuses that count as an agent actively progressing work. */
export const ACTIVE_STATUSES: AgentStatus[] = ["thinking", "working", "reviewing"];
