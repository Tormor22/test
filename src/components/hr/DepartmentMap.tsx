"use client";

import { motion } from "framer-motion";
import { DEPARTMENT_LABELS, hrStatusConfig } from "@/lib/hrStatus";
import type { HRAgent, HRDepartment } from "@/types/hr";

const ORDER: HRDepartment[] = [
  "content_research",
  "content_creation",
  "production",
  "quality_control",
  "publishing",
  "analytics",
  "management",
];

/** "Department rooms" office layout (§9, §19). */
export default function DepartmentMap({ agents }: { agents: HRAgent[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ORDER.map((dept, di) => {
        const members = agents.filter((a) => a.department === dept);
        if (members.length === 0) return null;
        const avg = Math.round(members.reduce((t, a) => t + a.performanceScore, 0) / members.length);
        return (
          <motion.div
            key={dept}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: di * 0.05 }}
            className="glass rounded-2xl border-white/5 bg-grid-faint bg-grid p-3.5"
          >
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">{DEPARTMENT_LABELS[dept]}</h3>
              <span className="text-[11px] text-slate-500">เฉลี่ย {avg}</span>
            </div>
            <div className="space-y-1.5">
              {members.map((a) => {
                const cfg = hrStatusConfig[a.status];
                const Icon = a.icon;
                return (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ backgroundColor: `${a.accent}1a`, color: a.accent }}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{a.name}</span>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cfg.dot }} title={cfg.label} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
