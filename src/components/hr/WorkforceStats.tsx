"use client";

import { motion } from "framer-motion";
import { Users, Activity, AlertTriangle, Ban, RefreshCw, ShieldAlert, Gauge, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HRAgent } from "@/types/hr";

interface Stat {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
  tint: string;
}

/** "Agent Workforce Status" summary cards (§8). */
export default function WorkforceStats({ agents }: { agents: HRAgent[] }) {
  const count = (...s: HRAgent["status"][]) => agents.filter((a) => s.includes(a.status)).length;
  const avg = agents.length ? Math.round(agents.reduce((t, a) => t + a.performanceScore, 0) / agents.length) : 0;

  const stats: Stat[] = [
    { label: "Agent ทั้งหมด", value: agents.length, icon: Users, accent: "#60a5fa", tint: "from-blue-500/20" },
    { label: "ทำงานอยู่", value: count("active", "busy"), icon: Activity, accent: "#34d399", tint: "from-emerald-500/20" },
    { label: "ถูกเตือน", value: count("warning"), icon: AlertTriangle, accent: "#fbbf24", tint: "from-amber-500/20" },
    { label: "ล้มเหลว / กักบริเวณ", value: count("failed", "disabled"), icon: Ban, accent: "#fb7185", tint: "from-rose-500/20" },
    { label: "กำลังหาคนแทน", value: count("replacing", "terminated"), icon: RefreshCw, accent: "#a78bfa", tint: "from-violet-500/20" },
    { label: "ทดลองงาน", value: count("probation", "onboarding"), icon: ShieldAlert, accent: "#38bdf8", tint: "from-sky-500/20" },
    { label: "คะแนนเฉลี่ย", value: `${avg}`, icon: Gauge, accent: "#22d3ee", tint: "from-cyan-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 120, damping: 16 }}
            className={cn("glass relative overflow-hidden rounded-2xl p-4 bg-gradient-to-b to-transparent", s.tint)}
          >
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: s.accent }} />
            <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: `${s.accent}1a`, color: s.accent }}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="mt-3">
              <span className="block text-3xl font-semibold tracking-tight text-white">{s.value}</span>
              <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
