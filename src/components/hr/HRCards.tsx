"use client";

import { motion } from "framer-motion";
import {
  TrendingDown,
  Ban,
  RefreshCw,
  ShieldAlert,
  Trophy,
  Siren,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { scoreColor, WARNING_LABELS } from "@/lib/hrStatus";
import { timeAgo } from "@/lib/utils";
import type { HRAgent, ReplacementRecord } from "@/types/hr";

/* -------------------------------------------------------------------------- */
/*  Shared card shell                                                          */
/* -------------------------------------------------------------------------- */

function Card({ title, icon: Icon, accent, count, children }: { title: string; icon: LucideIcon; accent: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="glass flex flex-col rounded-2xl p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="h-4 w-4" style={{ color: accent }} />
        {title}
        {count !== undefined && (
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-slate-300">{count}</span>
        )}
      </h2>
      <div className="flex-1 space-y-2">{children}</div>
    </div>
  );
}

const Empty = ({ text }: { text: string }) => <p className="py-6 text-center text-xs text-slate-500">{text}</p>;

function Row({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-2.5"
    >
      {children}
    </motion.div>
  );
}

const ScoreChip = ({ score }: { score: number }) => (
  <span className="ml-auto shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${scoreColor(score)}1a`, color: scoreColor(score) }}>
    {score}
  </span>
);

/* -------------------------------------------------------------------------- */
/*  Named cards (§8)                                                           */
/* -------------------------------------------------------------------------- */

export function UnderperformersCard({ agents }: { agents: HRAgent[] }) {
  const list = agents
    .filter((a) => a.performanceScore < 60 && !["terminated"].includes(a.status))
    .sort((a, b) => a.performanceScore - b.performanceScore);
  return (
    <Card title="Agent ผลงานต่ำกว่าเกณฑ์" icon={TrendingDown} accent="#fbbf24" count={list.length}>
      {list.length === 0 ? (
        <Empty text="ทุกคนทำผลงานสูงกว่าเกณฑ์ ✅" />
      ) : (
        list.map((a, i) => (
          <Row key={a.id} delay={i * 0.05}>
            <div className="min-w-0">
              <p className="truncate text-sm text-white">{a.name}</p>
              <p className="truncate text-[11px] text-slate-500">{a.role} · L{a.warningLevel} {WARNING_LABELS[a.warningLevel]}</p>
            </div>
            <ScoreChip score={a.performanceScore} />
          </Row>
        ))
      )}
    </Card>
  );
}

export function TopPerformersCard({ agents }: { agents: HRAgent[] }) {
  const list = [...agents].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);
  return (
    <Card title="Agent ผลงานดีเด่น" icon={Trophy} accent="#34d399" count={list.length}>
      {list.map((a, i) => (
        <Row key={a.id} delay={i * 0.05}>
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/5 text-xs font-semibold text-slate-300">{i + 1}</span>
          <div className="min-w-0">
            <p className="truncate text-sm text-white">{a.name}</p>
            <p className="truncate text-[11px] text-slate-500">{a.role}</p>
          </div>
          <ScoreChip score={a.performanceScore} />
        </Row>
      ))}
    </Card>
  );
}

export function TerminatedCard({ agents }: { agents: HRAgent[] }) {
  const list = agents.filter((a) => a.status === "terminated" || a.status === "failed" || a.status === "disabled");
  return (
    <Card title="ถูกปลด / หยุดทำงานล่าสุด" icon={Ban} accent="#fb7185" count={list.length}>
      {list.length === 0 ? (
        <Empty text="ไม่มี agent ที่ถูกปลดหรือหยุดทำงาน" />
      ) : (
        list.map((a, i) => (
          <Row key={a.id} delay={i * 0.05}>
            <div className="min-w-0">
              <p className="truncate text-sm text-white">{a.name}</p>
              <p className="truncate text-[11px] text-slate-500">{a.role}</p>
            </div>
            <span className="ml-auto shrink-0 text-[11px] text-rose-300/80">{a.status}</span>
          </Row>
        ))
      )}
    </Card>
  );
}

export function ReplacementQueueCard({ replacements }: { replacements: ReplacementRecord[] }) {
  return (
    <Card title="คิวหาคนแทน" icon={RefreshCw} accent="#a78bfa" count={replacements.length}>
      {replacements.length === 0 ? (
        <Empty text="ไม่มีการหาคนแทนที่กำลังดำเนินการ" />
      ) : (
        replacements.map((r, i) => (
          <Row key={r.id} delay={i * 0.05}>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm text-white">
                {r.removedAgentName}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-violet-300" />
                {r.replacementAgentName}
              </p>
              <p className="truncate text-[11px] text-slate-500">{r.reason}</p>
            </div>
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-[11px]"
              style={
                r.transferStatus === "completed"
                  ? { backgroundColor: "#34d3991a", color: "#34d399" }
                  : { backgroundColor: "#fbbf241a", color: "#fbbf24" }
              }
            >
              {r.transferredTasks} งาน · {r.transferStatus}
            </span>
          </Row>
        ))
      )}
    </Card>
  );
}

export function ProbationCard({ agents }: { agents: HRAgent[] }) {
  const list = agents.filter((a) => a.probation && a.probation.status !== "passed");
  return (
    <Card title="Agent ที่ทดลองงาน" icon={ShieldAlert} accent="#60a5fa" count={list.length}>
      {list.length === 0 ? (
        <Empty text="ไม่มี agent ที่อยู่ระหว่างทดลองงาน" />
      ) : (
        list.map((a, i) => (
          <Row key={a.id} delay={i * 0.05}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{a.name}</p>
              <p className="truncate text-[11px] text-slate-500">{a.role}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {Array.from({ length: a.probation!.requiredTasks }).map((_, idx) => (
                <span
                  key={idx}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: idx < a.probation!.passedTasks ? "#34d399" : "rgba(255,255,255,0.15)" }}
                />
              ))}
            </div>
          </Row>
        ))
      )}
    </Card>
  );
}

export function CriticalAlertsCard({ agents }: { agents: HRAgent[] }) {
  const list = agents.filter((a) => a.status === "failed" || a.warningLevel >= 3 || (a.missionCritical && a.health < 50));
  return (
    <Card title="แจ้งเตือนวิกฤติ" icon={Siren} accent="#f43f5e" count={list.length}>
      {list.length === 0 ? (
        <Empty text="ไม่มีการแจ้งเตือนวิกฤติ 🎉" />
      ) : (
        list.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-2.5"
          >
            <motion.span
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm text-white">
                {a.name} {a.missionCritical && <span className="text-amber-300">★</span>}
              </p>
              <p className="truncate text-[11px] text-rose-300/80">
                {a.status === "failed" ? "ขาดการเชื่อมต่อ" : a.warningLevel >= 3 ? "เตือนครั้งสุดท้าย" : "สุขภาพวิกฤติ"} · {a.role}
              </p>
            </div>
            <span className="ml-auto shrink-0 text-[11px] text-slate-500">{timeAgo(a.lastHeartbeatAt)}</span>
          </motion.div>
        ))
      )}
    </Card>
  );
}
