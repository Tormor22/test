import type { Task } from "@/types";

const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const ahead = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

export const tasks: Task[] = [
  // Orchestrator
  { id: "t-orc-1", agentId: "orchestrator", title: "ประสานงานชุดงาน #47 (วิดีโอ 5 เรื่อง)", state: "in-progress", priority: "high", eta: ahead(120) },
  { id: "t-orc-2", agentId: "orchestrator", title: "ปลดล็อกวิดีโอ 1 หลังถูก QA ตั้งธงด้านนโยบาย", state: "blocked", priority: "critical", eta: ahead(20) },
  { id: "t-orc-3", agentId: "orchestrator", title: "เริ่มสแกนเทรนด์ของชุดงาน #48", state: "queued", priority: "low", eta: ahead(300) },

  // Trend Research
  { id: "t-trd-1", agentId: "trend-research", title: "ส่งสรุปเทรนด์ประจำสัปดาห์", state: "done", priority: "high", eta: ago(38) },
  { id: "t-trd-2", agentId: "trend-research", title: "ติดตามเสียงที่กำลังมาแรงสำหรับชุดงานถัดไป", state: "queued", priority: "medium", eta: ahead(180) },

  // Script Writer
  { id: "t-scr-1", agentId: "script-writer", title: "เขียนสคริปต์ 5 ชิ้นจากสรุปเทรนด์", state: "done", priority: "high", eta: ago(26) },
  { id: "t-scr-2", agentId: "script-writer", title: "แก้สคริปต์ 1 (ย่อให้เหลือ 35 วินาที)", state: "queued", priority: "medium", eta: ahead(45) },

  // Hook & Caption
  { id: "t-hok-1", agentId: "hook-caption", title: "ฮุกและคำบรรยายสำหรับวิดีโอ 4 และ 5", state: "in-progress", priority: "high", eta: ahead(25) },
  { id: "t-hok-2", agentId: "hook-caption", title: "เลือกฮุกที่ดีที่สุดของแต่ละวิดีโอ", state: "queued", priority: "medium", eta: ahead(60) },

  // Voiceover
  { id: "t-vo-1", agentId: "voiceover", title: "เรนเดอร์เสียงพากย์สำหรับวิดีโอ 3", state: "in-progress", priority: "high", eta: ahead(15) },
  { id: "t-vo-2", agentId: "voiceover", title: "เรนเดอร์เสียงพากย์สำหรับวิดีโอ 4 และ 5", state: "queued", priority: "medium", eta: ahead(90) },

  // Asset Finder
  { id: "t-ast-1", agentId: "asset-finder", title: "จัดหาฟุตเทจสำหรับวิดีโอ 2", state: "in-progress", priority: "high", eta: ahead(35) },
  { id: "t-ast-2", agentId: "asset-finder", title: "เปลี่ยนเพลงที่ถูกตั้งธงในวิดีโอ 1", state: "queued", priority: "critical", eta: ahead(18) },

  // Video Editor
  { id: "t-edt-1", agentId: "video-editor", title: "ประกอบตัวตัดต่อสำหรับวิดีโอ 2", state: "blocked", priority: "high", eta: ahead(80) },
  { id: "t-edt-2", agentId: "video-editor", title: "ส่งออกวิดีโอ 1 ใหม่หลังเปลี่ยนเพลง", state: "queued", priority: "critical", eta: ahead(40) },

  // Subtitle
  { id: "t-sub-1", agentId: "subtitle", title: "ฝังซับลงในตัวตัดต่อของวิดีโอ 1", state: "queued", priority: "high", eta: ahead(50) },

  // QA / Policy
  { id: "t-qa-1", agentId: "qa-policy", title: "ตรวจวิดีโอ 1 อีกครั้งหลังเปลี่ยนเพลง", state: "blocked", priority: "critical", eta: ahead(30) },
  { id: "t-qa-2", agentId: "qa-policy", title: "ตรวจสอบนโยบายวิดีโอ 2–5", state: "queued", priority: "high", eta: ahead(140) },

  // Publisher
  { id: "t-pub-1", agentId: "publisher", title: "ตั้งเวลาเผยแพร่วิดีโอที่อนุมัติแล้วไปยัง 3 แพลตฟอร์ม", state: "queued", priority: "medium", eta: ahead(160) },

  // Analytics
  { id: "t-ana-1", agentId: "analytics", title: "ส่งรายงานผลการทำงานของสัปดาห์ที่แล้ว", state: "done", priority: "medium", eta: ago(15) },
  { id: "t-ana-2", agentId: "analytics", title: "ป้อนข้อมูลฮุกยอดนิยมกลับไปให้ Spark", state: "queued", priority: "low", eta: ahead(220) },
];

export const tasksForAgent = (agentId: string) => tasks.filter((t) => t.agentId === agentId);

export const completedToday = tasks.filter((t) => t.state === "done").length + 16;
