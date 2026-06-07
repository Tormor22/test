import {
  Activity,
  Pause,
  Loader2,
  AlertTriangle,
  HeartCrack,
  Ban,
  RefreshCw,
  GraduationCap,
  ShieldAlert,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";
import type { HRStatus, HRDepartment, PerformanceBand } from "@/types/hr";

export interface HRStatusConfig {
  label: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
  icon: LucideIcon;
}

/** Visual config for each of the 10 HR lifecycle statuses (§10). */
export const hrStatusConfig: Record<HRStatus, HRStatusConfig> = {
  active: { label: "พร้อมทำงาน", text: "text-emerald-300", bg: "bg-emerald-400/10", border: "border-emerald-400/30", dot: "#34d399", icon: Activity },
  busy: { label: "กำลังทำงาน", text: "text-cyan-300", bg: "bg-cyan-400/10", border: "border-cyan-400/30", dot: "#22d3ee", icon: Loader2 },
  idle: { label: "ว่าง", text: "text-slate-300", bg: "bg-slate-400/10", border: "border-slate-400/25", dot: "#94a3b8", icon: Pause },
  warning: { label: "เตือน", text: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/30", dot: "#fbbf24", icon: AlertTriangle },
  failed: { label: "ล้มเหลว", text: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/30", dot: "#fb7185", icon: HeartCrack },
  terminated: { label: "ปลดออก", text: "text-rose-400", bg: "bg-rose-600/10", border: "border-rose-600/40", dot: "#f43f5e", icon: Ban },
  replacing: { label: "กำลังหาคนแทน", text: "text-violet-300", bg: "bg-violet-400/10", border: "border-violet-400/30", dot: "#a78bfa", icon: RefreshCw },
  onboarding: { label: "กำลังเริ่มงาน", text: "text-sky-300", bg: "bg-sky-400/10", border: "border-sky-400/30", dot: "#38bdf8", icon: GraduationCap },
  probation: { label: "ทดลองงาน", text: "text-blue-300", bg: "bg-blue-400/10", border: "border-blue-400/30", dot: "#60a5fa", icon: ShieldAlert },
  disabled: { label: "กักบริเวณ", text: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "#fb923c", icon: PauseCircle },
};

/** Color for a performance band (used by rings + health bars). */
export const bandColor = (band: PerformanceBand): string =>
  ({ excellent: "#34d399", good: "#22d3ee", monitor: "#fbbf24", warning: "#fb923c", replace: "#f43f5e" })[band];

export const scoreColor = (score: number): string =>
  score >= 90 ? "#34d399" : score >= 75 ? "#22d3ee" : score >= 60 ? "#fbbf24" : score >= 40 ? "#fb923c" : "#f43f5e";

export const DEPARTMENT_LABELS: Record<HRDepartment, string> = {
  content_research: "ค้นคว้าคอนเทนต์",
  content_creation: "ผลิตคอนเทนต์",
  production: "โปรดักชัน",
  quality_control: "ควบคุมคุณภาพ",
  publishing: "เผยแพร่",
  analytics: "วิเคราะห์ข้อมูล",
  management: "บริหารจัดการ",
};

export const WARNING_LABELS: Record<number, string> = {
  0: "ปกติ",
  1: "เตือนเบื้องต้น",
  2: "เตือนเรื่องผลงาน",
  3: "เตือนครั้งสุดท้าย",
  4: "ปลดออก",
};
