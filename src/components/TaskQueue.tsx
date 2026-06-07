"use client";

import { motion } from "framer-motion";
import { CircleDot, CircleDashed, Ban, CheckCircle2, type LucideIcon } from "lucide-react";
import { tasks, tasksForAgent } from "@/data/tasks";
import { getAgent } from "@/data/agents";
import { clock, cn } from "@/lib/utils";
import type { Task, TaskState } from "@/types";

const stateMeta: Record<TaskState, { icon: LucideIcon; color: string; label: string }> = {
  "in-progress": { icon: CircleDot, color: "#22d3ee", label: "กำลังดำเนินการ" },
  queued: { icon: CircleDashed, color: "#94a3b8", label: "อยู่ในคิว" },
  blocked: { icon: Ban, color: "#fb7185", label: "ติดขัด" },
  done: { icon: CheckCircle2, color: "#34d399", label: "เสร็จสิ้น" },
};

const priorityMeta: Record<Task["priority"], string> = {
  low: "text-slate-400 bg-slate-400/10",
  medium: "text-blue-300 bg-blue-400/10",
  high: "text-amber-300 bg-amber-400/10",
  critical: "text-rose-300 bg-rose-500/10",
};

/** Thai labels for the priority badge (display only — keys drive the styling/logic). */
const priorityLabel: Record<Task["priority"], string> = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
  critical: "เร่งด่วน",
};

/** Sort order for the global view: live work first, finished work last. */
const stateRank: Record<TaskState, number> = {
  "in-progress": 0,
  blocked: 1,
  queued: 2,
  done: 3,
};

interface Props {
  /** Scope to a single agent. Omit for a global, all-agents queue. */
  agentId?: string;
}

export default function TaskQueue({ agentId }: Props) {
  const global = !agentId;
  const items = agentId
    ? tasksForAgent(agentId)
    : [...tasks].sort((a, b) => stateRank[a.state] - stateRank[b.state]);

  if (!items.length) {
    return <p className="text-sm text-slate-500">ไม่มีงานในคิว</p>;
  }

  return (
    <ul className={cn("space-y-2", global && "sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0")}>
      {items.map((task, i) => {
        const meta = stateMeta[task.state];
        const Icon = meta.icon;
        const agent = global ? getAgent(task.agentId) : undefined;
        return (
          <motion.li
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2"
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", task.state === "in-progress" && "animate-pulse")}
              style={{ color: meta.color }}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm",
                  task.state === "done" ? "text-slate-500 line-through" : "text-slate-200"
                )}
              >
                {task.title}
              </p>
              <p className="text-[11px] text-slate-500">
                {agent && (
                  <span style={{ color: agent.accent }}>{agent.name} · </span>
                )}
                {meta.label} · คาดเสร็จ {clock(task.eta)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide",
                priorityMeta[task.priority]
              )}
            >
              {priorityLabel[task.priority]}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}
