"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, CheckCircle2, AlertTriangle, XCircle, Bug, type LucideIcon } from "lucide-react";
import { getAgent } from "@/data/agents";
import { clock, cn } from "@/lib/utils";
import type { LogEntry } from "@/types";

const levelMeta: Record<LogEntry["level"], { icon: LucideIcon; color: string }> = {
  info: { icon: Info, color: "#60a5fa" },
  success: { icon: CheckCircle2, color: "#34d399" },
  warning: { icon: AlertTriangle, color: "#fbbf24" },
  error: { icon: XCircle, color: "#fb7185" },
  debug: { icon: Bug, color: "#94a3b8" },
};

interface Props {
  logs: LogEntry[];
  /** Show the agent name next to each line (for the global stream). */
  showAgent?: boolean;
  /** Stream entries in one-by-one on mount. */
  stream?: boolean;
}

export default function ActivityTimeline({ logs, showAgent = false, stream = false }: Props) {
  const [visible, setVisible] = useState(stream ? 0 : logs.length);

  useEffect(() => {
    if (!stream) {
      setVisible(logs.length);
      return;
    }
    setVisible(0);
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setVisible(n);
      if (n >= logs.length) clearInterval(id);
    }, 180);
    return () => clearInterval(id);
  }, [logs, stream]);

  return (
    <div className="relative">
      {/* vertical rail */}
      <span className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent" />
      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {logs.slice(0, visible).map((log) => {
            const meta = levelMeta[log.level];
            const Icon = meta.icon;
            const agent = showAgent ? getAgent(log.agentId) : undefined;
            return (
              <motion.li
                key={log.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="relative pl-6"
              >
                <span
                  className="absolute left-0 top-1 grid h-3.5 w-3.5 place-items-center rounded-full ring-4 ring-ink-900"
                  style={{ backgroundColor: meta.color }}
                />
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] text-slate-500">{clock(log.timestamp)}</span>
                  {agent && (
                    <span className="text-[11px] font-medium" style={{ color: agent.accent }}>
                      {agent.name}
                    </span>
                  )}
                  <Icon className="h-3 w-3 translate-y-0.5" style={{ color: meta.color }} />
                </div>
                <p className={cn("mt-0.5 text-sm leading-snug text-slate-300")}>{log.message}</p>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
