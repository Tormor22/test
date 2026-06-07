import Anthropic from "@anthropic-ai/sdk";
import { tasks } from "@/data/tasks";
import type { DailyReport } from "@/types";

/**
 * Server-side Claude call. The API key (`ANTHROPIC_API_KEY`) never leaves the
 * server — the browser posts a snapshot of the live dashboard state here, and
 * gets back a structured ops briefing. Runs on the Node runtime (the Anthropic
 * SDK is not edge-compatible).
 */
export const runtime = "nodejs";

/** Shape the client sends us (a trimmed view of the live store). */
interface AgentSnapshot {
  name: string;
  role: string;
  status: string;
  currentTask: string;
  progress: number;
}
interface LogSnapshot {
  agent: string;
  level: string;
  message: string;
}
interface ReportRequest {
  agents: AgentSnapshot[];
  logs: LogSnapshot[];
}

/** JSON schema enforced on Claude's output — mirrors the DailyReport type. */
const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    blockers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { agent: { type: "string" }, issue: { type: "string" } },
        required: ["agent", "issue"],
      },
    },
    shipped: { type: "array", items: { type: "string" } },
    inProgress: { type: "array", items: { type: "string" } },
    nextUp: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
  },
  required: ["headline", "summary", "blockers", "shipped", "inProgress", "nextUp", "risks"],
} as const;

const SYSTEM = `คุณคือ "หัวหน้าทีม" (Head Agent) ของออฟฟิศ AI ที่ผลิตวิดีโอสั้นแนวตั้งแบบอัตโนมัติ
หน้าที่ของคุณคือสรุปสถานะการทำงานปัจจุบันของทีมเอเจนต์ให้เป็นรายงานสรุปสำหรับผู้บริหาร (ops briefing) ที่กระชับและนำไปใช้ได้จริง

แนวทาง:
- เขียนเป็นภาษาไทยทั้งหมด กระชับ ตรงประเด็น และเป็นมืออาชีพ
- อ้างอิงเอเจนต์ด้วยชื่อจริงเสมอ (เช่น Maestro, Aegis, Splice)
- ระบุ blocker ที่ขัดขวางงานจริง ๆ พร้อมเอเจนต์ที่รับผิดชอบ
- "shipped" = งานที่เสร็จแล้ว, "inProgress" = งานที่กำลังทำ, "nextUp" = สิ่งที่ควรทำต่อ
- ห้ามแต่งข้อมูลที่ไม่มีในสแนปช็อต ถ้าไม่มีข้อมูลในหมวดใดให้ส่งอาเรย์ว่าง
- ตอบให้ตรงตามสคีมาที่กำหนดเท่านั้น`;

function buildSnapshot(body: ReportRequest): string {
  const agentLines = body.agents
    .map(
      (a) =>
        `- ${a.name} (${a.role}) — สถานะ: ${a.status}, ความคืบหน้า: ${a.progress}%, งานปัจจุบัน: ${a.currentTask}`
    )
    .join("\n");

  const taskLines = tasks
    .map((t) => `- [${t.state}/${t.priority}] ${t.title}`)
    .join("\n");

  const logLines = body.logs
    .slice(0, 25)
    .map((l) => `- (${l.level}) ${l.agent}: ${l.message}`)
    .join("\n");

  return [
    "## สถานะเอเจนต์",
    agentLines || "(ไม่มีข้อมูล)",
    "",
    "## คิวงาน",
    taskLines || "(ไม่มีข้อมูล)",
    "",
    "## บันทึกการทำงานล่าสุด",
    logLines || "(ไม่มีข้อมูล)",
    "",
    "จากสแนปช็อตด้านบน จงสร้างรายงานสรุปสถานะการผลิตประจำวันตามสคีมา",
  ].join("\n");
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY — เพิ่มคีย์ใน .env.local เพื่อเปิดใช้งานรายงาน AI" },
      { status: 503 }
    );
  }

  let body: ReportRequest;
  try {
    body = (await req.json()) as ReportRequest;
  } catch {
    return Response.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }
  if (!Array.isArray(body?.agents)) {
    return Response.json({ error: "ต้องมีข้อมูล agents" }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: REPORT_SCHEMA },
      },
      messages: [{ role: "user", content: buildSnapshot(body) }],
    });

    if (message.stop_reason === "refusal") {
      return Response.json({ error: "โมเดลปฏิเสธคำขอนี้" }, { status: 422 });
    }

    const text = message.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return Response.json({ error: "ไม่ได้รับเนื้อหาจากโมเดล" }, { status: 502 });
    }

    const report = JSON.parse(text.text) as DailyReport;
    return Response.json({ report, generatedAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return Response.json(
        { error: `ข้อผิดพลาดจาก Claude API: ${err.message}` },
        { status: err.status ?? 500 }
      );
    }
    return Response.json({ error: "สร้างรายงานไม่สำเร็จ" }, { status: 500 });
  }
}
