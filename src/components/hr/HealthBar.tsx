"use client";

import { motion } from "framer-motion";
import { scoreColor } from "@/lib/hrStatus";
import { cn } from "@/lib/utils";

interface Props {
  /** 0-100 value. */
  value: number;
  label?: string;
  className?: string;
}

/** Thin animated health/value bar coloured by the score band (§19). */
export default function HealthBar({ value, label, className }: Props) {
  const color = scoreColor(value);
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">{label}</span>
          <span className="font-medium text-slate-200">{Math.round(value)}</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
