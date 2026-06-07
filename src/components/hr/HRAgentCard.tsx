"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Star } from "lucide-react";
import PerformanceRing from "./PerformanceRing";
import HealthBar from "./HealthBar";
import HRStatusBadge from "./HRStatusBadge";
import { hrStatusConfig, WARNING_LABELS } from "@/lib/hrStatus";
import { timeAgo, cn } from "@/lib/utils";
import type { HRAgent } from "@/types/hr";

interface Props {
  agent: HRAgent;
  index?: number;
}

/** Workforce card: avatar, score ring, status, warning + probation badges, health (§19). */
export default function HRAgentCard({ agent, index = 0 }: Props) {
  const cfg = hrStatusConfig[agent.status];
  const Icon = agent.icon;
  const warnPulse = agent.warningLevel >= 3 || agent.status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 110, damping: 16 }}
      className={cn(
        "glass relative overflow-hidden rounded-2xl p-4",
        warnPulse && "ring-1 ring-rose-500/40",
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: agent.accent }}
      />

      <div className="flex items-start gap-3">
        {/* role avatar */}
        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${agent.accent}1a`, color: agent.accent }}>
          <Icon className="h-6 w-6" />
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            {warnPulse && (
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full"
                style={{ backgroundColor: cfg.dot }}
                animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-ink-900" style={{ backgroundColor: cfg.dot }} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-white">{agent.name}</h3>
            {agent.missionCritical && (
              <span title="งานสำคัญวิกฤติ">
                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-300 text-amber-300" />
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-400">{agent.role}</p>
          <div className="mt-1.5">
            <HRStatusBadge status={agent.status} size="sm" />
          </div>
        </div>

        <PerformanceRing score={agent.performanceScore} size={56} />
      </div>

      {/* badges row */}
      {(agent.warningLevel > 0 || agent.probation) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.warningLevel > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              L{agent.warningLevel} · {WARNING_LABELS[agent.warningLevel]}
            </span>
          )}
          {agent.probation && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[11px] text-blue-300">
              <ShieldAlert className="h-3 w-3" />
              ทดลองงาน {agent.probation.passedTasks}/{agent.probation.requiredTasks}
            </span>
          )}
        </div>
      )}

      {/* health + workload */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <HealthBar value={agent.health} label="สุขภาพ" />
        <HealthBar value={agent.workload} label="ภาระงาน" />
      </div>

      <p className="mt-2.5 text-[11px] text-slate-500">อัปเดตล่าสุด {timeAgo(agent.lastHeartbeatAt)}</p>
    </motion.div>
  );
}
