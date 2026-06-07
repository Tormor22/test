"use client";

import { motion } from "framer-motion";
import AgentAvatar from "./AgentAvatar";
import LiveBadge from "./LiveBadge";
import { statusConfig } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useAgents } from "@/store/DashboardProvider";
import type { Agent } from "@/types";

function TypingDots({ color }: { color: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -1.5, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function Worker({ agent, onSelect }: { agent: Agent; onSelect: (a: Agent) => void }) {
  const cfg = statusConfig[agent.status];
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(agent)}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${agent.desk.x}%`, top: `${agent.desk.y}%` }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 14 }}
      whileHover={{ scale: 1.08, zIndex: 20 }}
    >
      {/* desk glow puddle */}
      <span
        className="absolute left-1/2 top-[58%] h-8 w-16 -translate-x-1/2 rounded-full opacity-30 blur-xl"
        style={{ backgroundColor: agent.accent }}
      />
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5 + agent.desk.x / 40, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center"
      >
        {/* status pulse ring */}
        <span className="relative">
          <motion.span
            className="absolute inset-0 rounded-2xl"
            style={{ boxShadow: `0 0 0 2px ${cfg.dot}` }}
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.35, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <AgentAvatar agent={agent} size={44} className="ring-1 ring-white/10" />
        </span>

        {/* nameplate */}
        <div className="mt-2 flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-ink-850/80 px-2 py-1 backdrop-blur">
          <span className="text-[11px] font-medium leading-none text-white">{agent.name}</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
            {agent.status === "working" ? (
              <TypingDots color={cfg.dot} />
            ) : (
              <span className="text-[9px] uppercase tracking-wide" style={{ color: cfg.dot }}>
                {cfg.label}
              </span>
            )}
          </span>
        </div>
      </motion.div>
    </motion.button>
  );
}

export default function AgentOffice({ onSelect }: { onSelect: (agent: Agent) => void }) {
  const agents = useAgents();
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60">
      {/* floor grid */}
      <div className="absolute inset-0 bg-grid-faint bg-grid [mask-image:radial-gradient(80%_80%_at_50%_40%,black,transparent)]" />
      {/* ambient color washes */}
      <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

      {/* floating ambient icons */}
      {[
        { left: "30%", top: "12%", d: 5 },
        { left: "55%", top: "48%", d: 6.5 },
        { left: "12%", top: "82%", d: 5.5 },
      ].map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-white/30"
          style={{ left: p.left, top: p.top }}
          animate={{ y: [0, -14, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* label */}
      <div className="absolute left-4 top-4 z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">พื้นที่ทำงานสด</p>
          <p className="text-sm text-slate-300">ออฟฟิศเอเจนต์ — เรียลไทม์</p>
        </div>
      </div>
      <div className="absolute right-4 top-4 z-10">
        <LiveBadge />
      </div>

      {agents.map((agent) => (
        <Worker key={agent.id} agent={agent} onSelect={onSelect} />
      ))}

      {/* subtle scanline sweep */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent"
        animate={{ x: ["-10%", "120%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
