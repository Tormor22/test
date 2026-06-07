"use client";

import { hrStatusConfig } from "@/lib/hrStatus";
import { cn } from "@/lib/utils";
import type { HRStatus } from "@/types/hr";

interface Props {
  status: HRStatus;
  size?: "sm" | "md";
  className?: string;
}

/** Status pill for the 10 HR lifecycle states (§10). */
export default function HRStatusBadge({ status, size = "md", className }: Props) {
  const cfg = hrStatusConfig[status];
  const Icon = cfg.icon;
  const animate = status === "busy" || status === "replacing";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        cfg.bg,
        cfg.border,
        cfg.text,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", animate && "animate-spin")} />
      {cfg.label}
    </span>
  );
}
