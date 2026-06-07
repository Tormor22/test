"use client";

import { motion } from "framer-motion";
import { Users, Activity, Moon, AlertTriangle, CheckCircle2, type LucideIcon } from "lucide-react";
import { completedToday } from "@/data/tasks";
import { useAgents } from "@/store/DashboardProvider";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  tint: string;
}

function buildStats(agents: Agent[]): Stat[] {
  const count = (s: string) => agents.filter((a) => a.status === s).length;
  return [
    { label: "เอเจนต์ทั้งหมด", value: agents.length, icon: Users, accent: "#60a5fa", tint: "from-blue-500/20" },
    { label: "กำลังทำงาน", value: count("working") + count("thinking") + count("reviewing"), icon: Activity, accent: "#22d3ee", tint: "from-cyan-500/20" },
    { label: "ว่าง / รอคิว", value: count("idle") + count("waiting"), icon: Moon, accent: "#fbbf24", tint: "from-amber-500/20" },
    { label: "ข้อผิดพลาด", value: count("error"), icon: AlertTriangle, accent: "#fb7185", tint: "from-rose-500/20" },
    { label: "เสร็จวันนี้", value: completedToday, icon: CheckCircle2, accent: "#34d399", tint: "from-emerald-500/20" },
  ];
}

export default function DashboardStats() {
  const agents = useAgents();
  const stats = buildStats(agents);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 120, damping: 16 }}
            className={cn(
              "glass relative overflow-hidden rounded-2xl p-4",
              "bg-gradient-to-b to-transparent",
              s.tint
            )}
          >
            <div
              className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl"
              style={{ backgroundColor: s.accent }}
            />
            <div className="flex items-center justify-between">
              <span
                className="grid h-9 w-9 place-items-center rounded-xl"
                style={{ backgroundColor: `${s.accent}1a`, color: s.accent }}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3">
              <CountUp value={s.value} />
              <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 14 }}
      className="block text-3xl font-semibold tracking-tight text-white"
    >
      {value}
    </motion.span>
  );
}
