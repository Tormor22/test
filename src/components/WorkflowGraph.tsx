"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AgentAvatar from "./AgentAvatar";
import { statusConfig, ACTIVE_STATUSES } from "@/lib/status";
import { NODE_LAYOUT, WORKFLOW_EDGES } from "@/data/workflow";
import { useAgents, useAgent } from "@/store/DashboardProvider";
import type { Agent } from "@/types";

interface AgentNodeData {
  agentId: string;
  onSelect: (agent: Agent) => void;
  [key: string]: unknown;
}
type AgentFlowNode = Node<AgentNodeData, "agent">;

/** Custom pipeline node — reads its agent from the live store so it updates in place. */
function AgentNode({ data }: NodeProps<AgentFlowNode>) {
  const agent = useAgent(data.agentId);
  if (!agent) return null;
  const cfg = statusConfig[agent.status];

  return (
    <button
      type="button"
      onClick={() => data.onSelect(agent)}
      className="group flex w-[150px] flex-col gap-2 rounded-xl border border-white/10 bg-ink-850/90 p-2.5 text-left shadow-lg backdrop-blur transition hover:border-white/25"
      style={{ boxShadow: `0 0 0 1px ${cfg.dot}22, 0 8px 24px -12px ${cfg.dot}55` }}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} className="!h-1.5 !w-1.5 !border-0 !bg-slate-600" />
      <Handle type="source" position={Position.Right} isConnectable={false} className="!h-1.5 !w-1.5 !border-0 !bg-slate-600" />

      <div className="flex items-center gap-2">
        <span className="relative">
          <span
            className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-ink-850"
            style={{ backgroundColor: cfg.dot }}
          />
          <AgentAvatar agent={agent} size={32} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">{agent.name}</p>
          <p className="truncate text-[10px]" style={{ color: cfg.dot }}>
            {cfg.label}
          </p>
        </div>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${agent.progress}%`, backgroundColor: cfg.dot }}
        />
      </div>
    </button>
  );
}

const nodeTypes = { agent: AgentNode };

export default function WorkflowGraph({ onSelect }: { onSelect: (agent: Agent) => void }) {
  const agents = useAgents();

  // Node identities + positions are stable; the node component pulls live data.
  const nodes = useMemo<AgentFlowNode[]>(
    () =>
      NODE_LAYOUT.map((n) => ({
        id: n.id,
        type: "agent",
        position: n.pos,
        data: { agentId: n.id, onSelect },
      })),
    [onSelect]
  );

  // Edges recompute from live status so handoffs "light up" when work flows.
  const edges = useMemo<Edge[]>(
    () =>
      WORKFLOW_EDGES.map((e) => {
        const src = agents.find((a) => a.id === e.source);
        const flowing = !!src && (ACTIVE_STATUSES.includes(src.status) || src.status === "done");
        const color = src ? statusConfig[src.status].dot : "#475569";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: flowing,
          labelStyle: { fill: "#94a3b8", fontSize: 10 },
          labelBgStyle: { fill: "#0e1124", fillOpacity: 0.8 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: flowing ? color : "#334155",
          },
          style: {
            stroke: flowing ? color : "#334155",
            strokeWidth: flowing ? 2 : 1.5,
            opacity: flowing ? 0.95 : 0.45,
          },
        };
      }),
    [agents]
  );

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.3}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        panOnScroll={false}
      >
        <Background gap={24} size={1} color="rgba(148,163,184,0.12)" />
        <Controls showInteractive={false} className="!border-white/10 !bg-ink-850/80" />
      </ReactFlow>
    </div>
  );
}
