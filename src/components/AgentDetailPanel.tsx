"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Brain, ListTree, ScrollText, Wrench, Target } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import AgentStatusBadge from "./AgentStatusBadge";
import TaskQueue from "./TaskQueue";
import ActivityTimeline from "./ActivityTimeline";
import { useLogsForAgent } from "@/store/DashboardProvider";
import { timeAgo, clock, cn } from "@/lib/utils";
import type { Agent } from "@/types";

interface Props {
  agent: Agent | null;
  onClose: () => void;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Brain;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="h-4 w-4 text-slate-400" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function AgentDetailPanel({ agent, onClose }: Props) {
  // Hooks must run unconditionally; resolves to [] when no agent is selected.
  const agentLogs = useLogsForAgent(agent?.id ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {agent && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key={agent.id}
            className="glass-strong fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            {/* header */}
            <div className="relative overflow-hidden border-b border-white/10 p-5">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25 blur-3xl"
                style={{ backgroundColor: agent.accent }}
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
                aria-label="ปิดแผง"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-4">
                <AgentAvatar agent={agent} size={68} ring />
                <div>
                  <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
                  <p className="text-sm text-slate-400">{agent.role}</p>
                  <div className="mt-2">
                    <AgentStatusBadge status={agent.status} size="sm" />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{agent.description}</p>
              <p className="mt-2 text-xs text-slate-500">ใช้งานล่าสุด {timeAgo(agent.lastActivity)}</p>
            </div>

            {/* body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <Section icon={Target} title="งานปัจจุบัน">
                <p className="text-sm text-slate-200">{agent.currentTask}</p>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-400">ความคืบหน้า</span>
                    <span className="font-medium text-slate-200">{agent.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className={cn("h-full rounded-full bg-gradient-to-r", agent.gradient)}
                      initial={{ width: 0 }}
                      animate={{ width: `${agent.progress}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </Section>

              <Section icon={ListTree} title="คิวงาน">
                <TaskQueue agentId={agent.id} />
              </Section>

              <Section icon={Brain} title="หน่วยความจำ / บริบท">
                <p className="text-sm leading-relaxed text-slate-300">{agent.memorySummary}</p>
              </Section>

              <Section icon={Wrench} title="การใช้งานเครื่องมือ">
                <ul className="space-y-2">
                  {agent.toolUsage.map((t) => (
                    <li key={t.tool} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-slate-300">{t.tool}</span>
                      <span className="flex items-center gap-2 text-slate-500">
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-slate-300">
                          {t.count}×
                        </span>
                        <span className="text-xs">{clock(t.lastUsed)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section icon={ScrollText} title="บันทึกล่าสุด">
                <ActivityTimeline logs={agentLogs} />
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
