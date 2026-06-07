"use client";

import { AlertTriangle, Ban, ShieldAlert, CheckCircle2, type LucideIcon } from "lucide-react";
import { useAgents, useConnection, useLogs } from "@/store/DashboardProvider";
import { tasks } from "@/data/tasks";
import { getAgent } from "@/data/agents";
import { clock, cn } from "@/lib/utils";

/**
 * Errors & Blockers — surfaces anything that needs attention:
 *  - agents currently in an error state (live store)
 *  - blocked / critical tasks (queue)
 *  - the most recent error-level log lines
 *
 * Handles loading (event source still connecting), empty (all clear) and the
 * normal populated state.
 */
function Row({ icon: Icon, color, title, meta }: { icon: LucideIcon; color: string; title: string; meta: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-200">{title}</p>
        <p className="text-[11px] text-slate-500">{meta}</p>
      </div>
    </li>
  );
}

export default function ErrorsBlockers() {
  const agents = useAgents();
  const logs = useLogs();
  const connection = useConnection();

  const erroredAgents = agents.filter((a) => a.status === "error");
  const blockedTasks = tasks.filter((t) => t.state === "blocked");
  const criticalTasks = tasks.filter((t) => t.priority === "critical" && t.state !== "done");
  const errorLogs = logs.filter((l) => l.level === "error").slice(0, 4);

  const total = erroredAgents.length + blockedTasks.length + criticalTasks.length + errorLogs.length;

  // Loading: the live source hasn't delivered the first snapshot yet.
  if (connection === "connecting" && agents.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <Header count={null} />
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  // Empty: nothing wrong.
  if (total === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <Header count={0} />
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-6 text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm">ไม่มีข้อผิดพลาดหรือสิ่งกีดขวาง — ระบบทำงานปกติ</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <Header count={total} />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {/* Errored agents */}
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">เอเจนต์ที่มีข้อผิดพลาด</p>
          {erroredAgents.length === 0 ? (
            <p className="text-xs text-slate-600">— ไม่มี —</p>
          ) : (
            <ul className="space-y-2">
              {erroredAgents.map((a) => (
                <Row key={a.id} icon={ShieldAlert} color="#fb7185" title={a.name} meta={a.currentTask} />
              ))}
            </ul>
          )}
        </div>

        {/* Blocked / critical tasks */}
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">งานที่ติดขัด / เร่งด่วน</p>
          {blockedTasks.length === 0 && criticalTasks.length === 0 ? (
            <p className="text-xs text-slate-600">— ไม่มี —</p>
          ) : (
            <ul className="space-y-2">
              {blockedTasks.map((t) => (
                <Row
                  key={t.id}
                  icon={Ban}
                  color="#fb7185"
                  title={t.title}
                  meta={`${getAgent(t.agentId)?.name ?? t.agentId} · ติดขัด`}
                />
              ))}
              {criticalTasks
                .filter((t) => t.state !== "blocked")
                .map((t) => (
                  <Row
                    key={t.id}
                    icon={AlertTriangle}
                    color="#fbbf24"
                    title={t.title}
                    meta={`${getAgent(t.agentId)?.name ?? t.agentId} · เร่งด่วน`}
                  />
                ))}
            </ul>
          )}
        </div>

        {/* Recent error logs */}
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">ข้อผิดพลาดล่าสุด</p>
          {errorLogs.length === 0 ? (
            <p className="text-xs text-slate-600">— ไม่มี —</p>
          ) : (
            <ul className="space-y-2">
              {errorLogs.map((l) => (
                <Row
                  key={l.id}
                  icon={AlertTriangle}
                  color="#fb7185"
                  title={l.message}
                  meta={`${getAgent(l.agentId)?.name ?? l.agentId} · ${clock(l.timestamp)}`}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ count }: { count: number | null }) {
  return (
    <h2 className={cn("flex items-center gap-2 text-sm font-semibold text-white")}>
      <AlertTriangle className="h-4 w-4 text-rose-300" />
      ข้อผิดพลาดและสิ่งกีดขวาง
      {count != null && count > 0 && (
        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-300">{count}</span>
      )}
    </h2>
  );
}
