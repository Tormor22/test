"use client";

import { Radio } from "lucide-react";
import { useConnection } from "@/store/DashboardProvider";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/types";

const meta: Record<ConnectionStatus, { label: string; text: string; dot: string; pulse: boolean }> = {
  connecting: { label: "กำลังเชื่อมต่อ", text: "text-amber-300", dot: "bg-amber-400", pulse: true },
  live: { label: "สด", text: "text-emerald-300", dot: "bg-emerald-400", pulse: true },
  reconnecting: { label: "กำลังเชื่อมต่อใหม่", text: "text-amber-300", dot: "bg-amber-400", pulse: true },
  offline: { label: "ออฟไลน์", text: "text-slate-400", dot: "bg-slate-500", pulse: false },
};

/** Pill reflecting the real connection status of the live event source. */
export default function LiveBadge({ className }: { className?: string }) {
  const connection = useConnection();
  const m = meta[connection];

  return (
    <span className={cn("glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs", m.text, className)}>
      <span className="relative flex h-2 w-2">
        {m.pulse && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", m.dot)} />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", m.dot)} />
      </span>
      <Radio className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}
