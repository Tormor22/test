import type { WorkflowEdge } from "@/types";

/**
 * Fixed positions for each agent node in the pipeline graph (React Flow
 * coordinate space). Laid out left → right following the production flow, with
 * the three parallel asset-prep lanes (hook / voiceover / asset) stacked.
 */
export const NODE_LAYOUT: { id: string; pos: { x: number; y: number } }[] = [
  { id: "orchestrator", pos: { x: 0, y: 170 } },
  { id: "trend-research", pos: { x: 210, y: 170 } },
  { id: "script-writer", pos: { x: 420, y: 170 } },
  { id: "hook-caption", pos: { x: 640, y: 40 } },
  { id: "voiceover", pos: { x: 640, y: 170 } },
  { id: "asset-finder", pos: { x: 640, y: 300 } },
  { id: "video-editor", pos: { x: 870, y: 170 } },
  { id: "subtitle", pos: { x: 1090, y: 170 } },
  { id: "qa-policy", pos: { x: 1300, y: 170 } },
  { id: "publisher", pos: { x: 1510, y: 170 } },
  { id: "analytics", pos: { x: 1720, y: 170 } },
];

/** Directed handoffs that make up the short-form video production pipeline. */
export const WORKFLOW_EDGES: WorkflowEdge[] = [
  { id: "e-orc-trd", source: "orchestrator", target: "trend-research", label: "โจทย์งาน" },
  { id: "e-trd-scr", source: "trend-research", target: "script-writer", label: "เทรนด์" },
  { id: "e-scr-hok", source: "script-writer", target: "hook-caption", label: "สคริปต์" },
  { id: "e-scr-vo", source: "script-writer", target: "voiceover", label: "สคริปต์" },
  { id: "e-scr-ast", source: "script-writer", target: "asset-finder", label: "จังหวะเนื้อหา" },
  { id: "e-hok-edt", source: "hook-caption", target: "video-editor", label: "คำบรรยาย" },
  { id: "e-vo-edt", source: "voiceover", target: "video-editor", label: "เสียงพากย์" },
  { id: "e-ast-edt", source: "asset-finder", target: "video-editor", label: "ฟุตเทจ" },
  { id: "e-edt-sub", source: "video-editor", target: "subtitle", label: "ตัวตัดต่อ" },
  { id: "e-sub-qa", source: "subtitle", target: "qa-policy", label: "ใส่ซับแล้ว" },
  { id: "e-qa-pub", source: "qa-policy", target: "publisher", label: "อนุมัติแล้ว" },
  { id: "e-pub-ana", source: "publisher", target: "analytics", label: "เผยแพร่แล้ว" },
];
