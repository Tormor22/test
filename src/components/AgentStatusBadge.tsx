"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { statusConfig } from "@/lib/status";
import type { AgentStatus } from "@/types";

interface Props {
  status: AgentStatus;
  className?: string;
  /** Show the animated pulse dot. */
  pulse?: boolean;
  size?: "sm" | "md";
}

export default function AgentStatusBadge({
  status,
  className,
  pulse = true,
  size = "md",
}: Props) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        cfg.bg,
        cfg.border,
        cfg.text,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {pulse ? (
        <span className="relative flex h-2 w-2">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full"
            style={{ backgroundColor: cfg.dot }}
            animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: cfg.dot }}
          />
        </span>
      ) : (
        <Icon className={cn("h-3.5 w-3.5", status === "working" && "animate-spin")} />
      )}
      {cfg.label}
    </span>
  );
}
