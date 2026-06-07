"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Gauge, Zap, ServerCog } from "lucide-react";
import { ACTIVE_STATUSES } from "@/lib/status";
import { useAgents } from "@/store/DashboardProvider";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

interface Metric {
  label: string;
  value: number;
  unit: string;
  icon: typeof Cpu;
  color: string;
  /** width % for the bar */
  pct: number;
}

function buildMetrics(agents: Agent[]): Metric[] {
  const active = agents.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;
  const utilization = agents.length ? Math.round((active / agents.length) * 100) : 0;
  return [
    { label: "ภาระประมวลผล", value: 62, unit: "%", icon: Cpu, color: "#22d3ee", pct: 62 },
    { label: "การใช้งานเอเจนต์", value: utilization, unit: "%", icon: ServerCog, color: "#a78bfa", pct: utilization },
    { label: "อัตราการประมวลผลโทเค็น", value: 18.4, unit: "k/s", icon: Zap, color: "#34d399", pct: 74 },
    { label: "อัตราข้อผิดพลาด", value: 0.6, unit: "%", icon: Gauge, color: "#fb7185", pct: 12 },
  ];
}

export default function SystemHealth() {
  const agents = useAgents();
  const metrics = buildMetrics(agents);
  // tiny live "heartbeat" for the throughput sparkline-ish bar
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        const jitter = m.label === "อัตราการประมวลผลโทเค็น" ? (tick % 2 === 0 ? 4 : -3) : 0;
        const pct = Math.max(4, Math.min(100, m.pct + jitter));
        return (
          <div key={m.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <Icon className="h-4 w-4" style={{ color: m.color }} />
                {m.label}
              </span>
              <span className="font-mono text-sm font-medium text-white">
                {m.value}
                <span className="ml-0.5 text-xs text-slate-500">{m.unit}</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="relative h-full rounded-full"
                style={{ backgroundColor: m.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 90, damping: 18 }}
              >
                <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </motion.div>
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className={cn("text-sm text-emerald-300")}>ระบบหลักทั้งหมดทำงานปกติ</span>
      </div>
    </div>
  );
}
