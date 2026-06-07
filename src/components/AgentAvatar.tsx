"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

interface Props {
  agent: Agent;
  size?: number;
  /** Adds the animated rotating conic ring (used in detail panel). */
  ring?: boolean;
  className?: string;
}

/**
 * Renders the agent's avatar image when present, and falls back to a clean
 * generated placeholder (unique icon + gradient + initials) when the image
 * file is missing. Image paths under /public/images/agents/ are already wired
 * up — drop a real PNG in and it shows automatically.
 */
export default function AgentAvatar({ agent, size = 56, ring = false, className }: Props) {
  const [errored, setErrored] = useState(false);
  const Icon = agent.icon;
  const initials = agent.name.slice(0, 2).toUpperCase();

  const inner = (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-2xl",
        className
      )}
      style={{ width: size, height: size }}
    >
      {!errored ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={agent.avatar}
          alt={`รูปประจำตัวของ ${agent.name}`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center bg-gradient-to-br text-white",
            agent.gradient
          )}
        >
          <Icon className="h-[42%] w-[42%] opacity-95" strokeWidth={1.75} />
          <span
            className="mt-0.5 font-semibold leading-none tracking-wide"
            style={{ fontSize: Math.max(9, size * 0.16) }}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  );

  if (!ring) return inner;

  return (
    <div className="relative grid place-items-center" style={{ width: size + 10, height: size + 10 }}>
      <div className="conic-ring absolute inset-0 animate-spin rounded-[20px] opacity-70 [animation-duration:6s] blur-[2px]" />
      <div className="absolute inset-[3px] rounded-[18px] bg-ink-900" />
      <div className="relative">{inner}</div>
    </div>
  );
}
