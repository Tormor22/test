"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ListChecks,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { useAgents, useLogs } from "@/store/DashboardProvider";
import { getAgent } from "@/data/agents";
import { clock } from "@/lib/utils";
import type { DailyReport as DailyReportData } from "@/types";

function Section({
  icon: Icon,
  title,
  color,
  items,
}: {
  icon: LucideIcon;
  title: string;
  color: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color }}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h4>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DailyReport() {
  const agents = useAgents();
  const logs = useLogs();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agents: agents.map((a) => ({
            name: a.name,
            role: a.role,
            status: a.status,
            currentTask: a.currentTask,
            progress: a.progress,
          })),
          logs: logs.slice(0, 25).map((l) => ({
            agent: getAgent(l.agentId)?.name ?? l.agentId,
            level: l.level,
            message: l.message,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `เกิดข้อผิดพลาด (${res.status})`);
      setReport(data.report);
      setGeneratedAt(data.generatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "สร้างรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-violet-300" />
          รายงานสรุปจาก AI
          <span className="text-xs font-normal text-slate-500">โดยหัวหน้าทีม (Claude)</span>
        </h2>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-1.5 text-sm font-medium text-violet-200 transition hover:bg-violet-400/20 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "กำลังสร้าง…" : report ? "สร้างใหม่" : "สร้างรายงาน"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {!error && !report && !loading && (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-slate-500"
          >
            กดปุ่ม “สร้างรายงาน” เพื่อให้หัวหน้าทีม AI สรุปสถานะการผลิตจากข้อมูลสดบนแดชบอร์ด
          </motion.p>
        )}

        {report && !loading && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div>
              <p className="text-base font-semibold text-white">{report.headline}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{report.summary}</p>
            </div>

            {report.blockers.length > 0 && (
              <div>
                <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  อุปสรรค
                </h4>
                <ul className="space-y-1">
                  {report.blockers.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                      <span>
                        <span className="font-medium text-rose-200">{b.agent}</span> — {b.issue}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Section icon={CheckCircle2} title="เสร็จแล้ว" color="#34d399" items={report.shipped} />
              <Section icon={CircleDot} title="กำลังทำ" color="#22d3ee" items={report.inProgress} />
              <Section icon={ListChecks} title="ลำดับถัดไป" color="#a78bfa" items={report.nextUp} />
              <Section icon={ShieldAlert} title="ความเสี่ยง" color="#fbbf24" items={report.risks} />
            </div>

            {generatedAt && (
              <p className="border-t border-white/10 pt-3 text-xs text-slate-500">
                สร้างเมื่อ {clock(generatedAt)} · อ้างอิงข้อมูลสด ณ ขณะกดสร้าง
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
