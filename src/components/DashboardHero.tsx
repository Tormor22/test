"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu } from "lucide-react";
import LiveBadge from "./LiveBadge";

/**
 * Full-width hero banner. Uses the generated concept render at
 * /images/dashboard/dashboard-hero.png and falls back to a pure gradient
 * if the file is missing.
 */
export default function DashboardHero({ agentCount }: { agentCount: number }) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6 overflow-hidden rounded-3xl border border-white/10"
    >
      {/* background image */}
      <div className="absolute inset-0">
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/dashboard/dashboard-hero.png"
            alt="ศูนย์บัญชาการ AgentOps"
            className="h-full w-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950" />
        )}
      </div>

      {/* legibility overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/70 to-ink-950/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />

      {/* content */}
      <div className="relative flex min-h-[200px] flex-col justify-between gap-6 p-6 sm:min-h-[240px] sm:p-8 lg:flex-row lg:items-end">
        <div className="flex items-center gap-4">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-glow">
            <Cpu className="h-6 w-6 text-white" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">ปฏิบัติการ AI</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white neon-text sm:text-3xl lg:text-4xl">
              ศูนย์บัญชาการ AgentOps
            </h1>
            <p className="mt-1 max-w-lg text-sm text-slate-300/90">
              ติดตาม AI Agent จำนวน {agentCount} ตัวแบบเรียลไทม์ — ทั้งสถานะ งาน ความคืบหน้า บันทึกการทำงาน และออฟฟิศแบบสด
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LiveBadge />
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-slate-300">
            <Activity className="h-3.5 w-3.5" />
            อัปเดตเมื่อสักครู่
          </span>
        </div>
      </div>
    </motion.section>
  );
}
