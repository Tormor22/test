"use client";

import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import AgentStatusBadge from "./AgentStatusBadge";
import { statusConfig } from "@/lib/status";
import { timeAgo, cn } from "@/lib/utils";
import type { Agent } from "@/types";

interface Props {
  agent: Agent;
  index?: number;
  onSelect: (agent: Agent) => void;
}

export default function AgentCard({ agent, index = 0, onSelect }: Props) {
  const cfg = statusConfig[agent.status];

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(agent)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 110, damping: 16 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      className="group glass relative w-full overflow-hidden rounded-2xl p-4 text-left transition-shadow hover:shadow-glow"
    >
      {/* accent glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: agent.accent }}
      />

      <div className="flex items-start gap-3">
        <div className="relative">
          <AgentAvatar agent={agent} size={52} />
          {/* pulse indicator dot */}
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full"
              style={{ backgroundColor: cfg.dot }}
              animate={{ scale: [1, 2.1], opacity: [0.7, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
            <span
              className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-ink-900"
              style={{ backgroundColor: cfg.dot }}
            />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-white">{agent.name}</h3>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300" />
          </div>
          <p className="truncate text-xs text-slate-400">{agent.role}</p>
          <div className="mt-2">
            <AgentStatusBadge status={agent.status} size="sm" />
          </div>
        </div>
      </div>

      {/* current task */}
      <div className="mt-3.5 rounded-xl border border-white/5 bg-black/20 p-2.5">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">งานปัจจุบัน</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-slate-200">{agent.currentTask}</p>
      </div>

      {/* progress */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">ความคืบหน้า</span>
          <span className="font-medium text-slate-200">{agent.progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", agent.gradient)}
            initial={{ width: 0 }}
            animate={{ width: `${agent.progress}%` }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.9, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <Clock className="h-3.5 w-3.5" />
        <span>ใช้งานล่าสุด {timeAgo(agent.lastActivity)}</span>
      </div>
    </motion.button>
  );
}
