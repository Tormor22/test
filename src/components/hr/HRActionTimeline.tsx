"use client";

import { motion } from "framer-motion";
import {
  Eye,
  AlertTriangle,
  PauseCircle,
  Ban,
  RefreshCw,
  UserPlus,
  GraduationCap,
  Shuffle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { HRAction, HRActionType } from "@/types/hr";

const ICONS: Record<HRActionType, { icon: LucideIcon; color: string }> = {
  monitor: { icon: Eye, color: "#94a3b8" },
  warn: { icon: AlertTriangle, color: "#fbbf24" },
  quarantine: { icon: PauseCircle, color: "#fb923c" },
  terminate: { icon: Ban, color: "#f43f5e" },
  replace: { icon: RefreshCw, color: "#a78bfa" },
  recruit: { icon: UserPlus, color: "#34d399" },
  onboard: { icon: GraduationCap, color: "#38bdf8" },
  reassign_task: { icon: Shuffle, color: "#22d3ee" },
  restart: { icon: RotateCcw, color: "#60a5fa" },
  probation_pass: { icon: CheckCircle2, color: "#34d399" },
  probation_fail: { icon: XCircle, color: "#f43f5e" },
  escalate: { icon: Siren, color: "#fb7185" },
};

const ACTION_LABELS: Record<HRActionType, string> = {
  monitor: "เฝ้าติดตาม",
  warn: "เตือน",
  quarantine: "กักบริเวณ",
  terminate: "ปลดออก",
  replace: "หาคนแทน",
  recruit: "รับสมัคร",
  onboard: "เริ่มงาน",
  reassign_task: "ย้ายงาน",
  restart: "เริ่มใหม่",
  probation_pass: "ผ่านทดลองงาน",
  probation_fail: "ไม่ผ่านทดลองงาน",
  escalate: "ส่งต่อระดับสูง",
};

/** "Recent HR actions" timeline / live activity feed (§8, §19). */
export default function HRActionTimeline({ actions }: { actions: HRAction[] }) {
  if (actions.length === 0) return <p className="py-6 text-center text-xs text-slate-500">ยังไม่มีกิจกรรม HR</p>;
  return (
    <ol className="relative space-y-3 before:absolute before:left-[11px] before:top-1 before:h-full before:w-px before:bg-white/10">
      {actions.map((a, i) => {
        const { icon: Icon, color } = ICONS[a.actionType];
        return (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative flex gap-3 pl-0"
          >
            <span className="relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 bg-ink-900" style={{ color }}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-sm text-slate-200">
                <span className="font-medium text-white">{a.agentName}</span>{" "}
                <span className="text-[11px] uppercase tracking-wide" style={{ color }}>
                  {ACTION_LABELS[a.actionType]}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">{a.reason}</p>
            </div>
            <span className="shrink-0 text-[11px] text-slate-600">{timeAgo(a.at)}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
