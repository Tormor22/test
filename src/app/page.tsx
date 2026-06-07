"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Cpu, ListTree, Workflow, UserCog } from "lucide-react";
import DashboardHero from "@/components/DashboardHero";
import DashboardStats from "@/components/DashboardStats";
import AgentCard from "@/components/AgentCard";
import AgentOffice from "@/components/AgentOffice";
import AgentDetailPanel from "@/components/AgentDetailPanel";
import ActivityTimeline from "@/components/ActivityTimeline";
import SystemHealth from "@/components/SystemHealth";
import DailyReport from "@/components/DailyReport";
import ErrorsBlockers from "@/components/ErrorsBlockers";
import WorkflowGraph from "@/components/WorkflowGraph";
import TaskQueue from "@/components/TaskQueue";
import TikTokConnect from "@/components/TikTokConnect";
import { useAgents, useLogs } from "@/store/DashboardProvider";

export default function Page() {
  const agents = useAgents();
  const logs = useLogs();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = agents.find((a) => a.id === selectedId) ?? null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top nav — TikTok connection + jump to the Agent HR Manager section */}
      <div className="mb-3 flex flex-wrap items-start justify-end gap-3">
        <TikTokConnect />
        <Link
          href="/hr"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <UserCog className="h-4 w-4 text-indigo-300" />
          Agent HR Manager
        </Link>
      </div>

      {/* Hero banner (uses the generated concept render) */}
      <DashboardHero agentCount={agents.length} />

      {/* Stats */}
      <section className="mb-6">
        <DashboardStats />
      </section>

      {/* AI daily report (Supervisor briefing via Claude) */}
      <section className="mb-6">
        <DailyReport />
      </section>

      {/* Errors & blockers */}
      <section className="mb-6">
        <ErrorsBlockers />
      </section>

      {/* Office + System health */}
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgentOffice onSelect={(a) => setSelectedId(a.id)} />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="h-4 w-4 text-cyan-300" />
            สุขภาพระบบ
          </h2>
          <SystemHealth />
        </div>
      </section>

      {/* Pipeline workflow graph */}
      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-white">เวิร์กโฟลว์การผลิต</h2>
          <span className="text-xs text-slate-500">เทรนด์ → สคริปต์ → … → วิเคราะห์ผล · ส่งต่องานแบบเรียลไทม์</span>
        </div>
        <WorkflowGraph onSelect={(a) => setSelectedId(a.id)} />
      </section>

      {/* Agents grid + activity feed */}
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">เอเจนต์</h2>
            <span className="text-xs text-slate-500">คลิกที่การ์ดเพื่อดูรายละเอียดทั้งหมด</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} index={i} onSelect={(a) => setSelectedId(a.id)} />
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Activity className="h-4 w-4 text-violet-300" />
            สตรีมกิจกรรม
          </h2>
          <div className="max-h-[560px] overflow-y-auto pr-1">
            <ActivityTimeline logs={logs} showAgent />
          </div>
        </div>
      </section>

      {/* Global task queue */}
      <section className="mb-6">
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <ListTree className="h-4 w-4 text-cyan-300" />
            คิวงาน
            <span className="ml-1 text-xs font-normal text-slate-500">จากเอเจนต์ทั้งหมด</span>
          </h2>
          <TaskQueue />
        </div>
      </section>

      <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-600">
        แดชบอร์ด AgentOps · มุมมองสำหรับติดตามเท่านั้น · ข้อมูลจำลอง
      </footer>

      <AgentDetailPanel agent={selected} onClose={() => setSelectedId(null)} />
    </main>
  );
}
