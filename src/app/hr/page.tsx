"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserCog, ArrowLeft, Building2, Users, History } from "lucide-react";
import WorkforceStats from "@/components/hr/WorkforceStats";
import HRAgentCard from "@/components/hr/HRAgentCard";
import DepartmentMap from "@/components/hr/DepartmentMap";
import HRActionTimeline from "@/components/hr/HRActionTimeline";
import {
  UnderperformersCard,
  TopPerformersCard,
  TerminatedCard,
  ReplacementQueueCard,
  ProbationCard,
  CriticalAlertsCard,
} from "@/components/hr/HRCards";
import { hrAgents, hrActions, replacements } from "@/data/hr";

export default function HRPage() {
  const agents = hrAgents;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative mb-6 overflow-hidden rounded-3xl bg-radial-glow p-6 sm:p-8"
      >
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-400/15 text-indigo-300 shadow-glow-violet">
              <UserCog className="h-7 w-7" />
            </span>
            <div>
              <h1 className="neon-text text-2xl font-bold tracking-tight text-white sm:text-3xl">ฝ่ายบุคคล Agent (HR)</h1>
              <p className="mt-1 text-sm text-slate-400">
                ติดตามทีมงาน · ประเมินผล · ปลดออก · หาคนแทน · ทดลองงาน
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            ศูนย์ปฏิบัติการ
          </Link>
        </div>
      </motion.header>

      {/* Workforce status summary */}
      <section className="mb-6">
        <WorkforceStats agents={agents} />
      </section>

      {/* Department map + critical alerts */}
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-300" />
            <h2 className="text-sm font-semibold text-white">ผังแผนก</h2>
            <span className="text-xs text-slate-500">7 แผนก · สถานะเรียลไทม์</span>
          </div>
          <DepartmentMap agents={agents} />
        </div>
        <CriticalAlertsCard agents={agents} />
      </section>

      {/* The seven HR cards (§8) */}
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UnderperformersCard agents={agents} />
        <TopPerformersCard agents={agents} />
        <ProbationCard agents={agents} />
        <ReplacementQueueCard replacements={replacements} />
        <TerminatedCard agents={agents} />
        <div className="glass flex flex-col rounded-2xl p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <History className="h-4 w-4 text-violet-300" />
            กิจกรรม HR ล่าสุด
          </h2>
          <div className="max-h-[360px] flex-1 overflow-y-auto pr-1">
            <HRActionTimeline actions={hrActions} />
          </div>
        </div>
      </section>

      {/* Full workforce grid */}
      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-white">ทีมงานทั้งหมด</h2>
          <span className="text-xs text-slate-500">{agents.length} agents · สุขภาพ, คะแนน และทดลองงาน</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((a, i) => (
            <HRAgentCard key={a.id} agent={a} index={i} />
          ))}
        </div>
      </section>

      <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-600">
        AgentOps Dashboard · Agent HR Manager · monitor-only view · mock telemetry
      </footer>
    </main>
  );
}
