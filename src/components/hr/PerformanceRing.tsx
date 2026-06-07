"use client";

import { motion } from "framer-motion";
import { scoreColor } from "@/lib/hrStatus";

interface Props {
  /** 0-100 score. */
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
}

/** Animated SVG progress ring showing a 0-100 performance score (§19). */
export default function PerformanceRing({ score, size = 64, stroke = 6, label }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  const dash = (Math.max(0, Math.min(100, score)) / 100) * c;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-sm font-semibold text-white">{score}</span>
        {label && <span className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-500">{label}</span>}
      </div>
    </div>
  );
}
