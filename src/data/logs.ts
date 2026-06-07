import type { LogEntry } from "@/types";

const ago = (s: number) => new Date(Date.now() - s * 1000).toISOString();

export const logs: LogEntry[] = [
  { id: "l1", agentId: "qa-policy", timestamp: ago(8), level: "error", message: "บล็อกวิดีโอ 1 — เพลงประกอบถูกจำกัดสิทธิ์บน TikTok" },
  { id: "l2", agentId: "voiceover", timestamp: ago(20), level: "info", message: "กำลังเรนเดอร์เสียงพากย์วิดีโอ 3 — 60% (แนบการจับเวลาระดับคำแล้ว)" },
  { id: "l3", agentId: "orchestrator", timestamp: ago(35), level: "warning", message: "พักวิดีโอ 1 ไว้ — ส่งงานเปลี่ยนเพลงให้เอเจนต์ค้นหาแอสเซ็ต และหยุดการเผยแพร่ชั่วคราว" },
  { id: "l4", agentId: "asset-finder", timestamp: ago(52), level: "info", message: "กำลังจัดหาฟุตเทจสำหรับวิดีโอ 2 — จับคู่ได้ 8 จาก 14 จังหวะ" },
  { id: "l5", agentId: "hook-caption", timestamp: ago(70), level: "success", message: "ฮุก 3 แบบพร้อมแล้วสำหรับวิดีโอ 4 (CTR สูงสุด: 'ไม่มีใครเคยบอกคุณเรื่องนี้')" },
  { id: "l6", agentId: "voiceover", timestamp: ago(95), level: "success", message: "เรนเดอร์และปรับระดับเสียงพากย์วิดีโอ 2 เรียบร้อย (-14 LUFS)" },
  { id: "l7", agentId: "script-writer", timestamp: ago(140), level: "success", message: "อนุมัติสคริปต์ครบทั้ง 5 ชิ้น — ความยาว 31–44 วินาที ส่งต่อให้ Spark แล้ว" },
  { id: "l8", agentId: "video-editor", timestamp: ago(180), level: "info", message: "เรนเดอร์ฉบับร่างของวิดีโอ 1 แล้ว (1080×1920, 30fps) — ส่งให้ QA" },
  { id: "l9", agentId: "analytics", timestamp: ago(240), level: "success", message: "ส่งรายงานประจำสัปดาห์แล้ว — การรักษาคนดูช่วง 3 วินาทีแรก +9% เทียบสัปดาห์ก่อน วิดีโอยอดนิยม 142k วิว" },
  { id: "l10", agentId: "trend-research", timestamp: ago(300), level: "success", message: "ส่งสรุปเทรนด์แล้ว — 5 หัวข้อ ให้คะแนนเสียงมาแรง 3 รายการ" },
  { id: "l11", agentId: "orchestrator", timestamp: ago(360), level: "info", message: "เริ่มชุดงาน #47 แล้ว — มอบสคริปต์ให้ Scribe และงานเสียงให้ Echo" },
  { id: "l12", agentId: "subtitle", timestamp: ago(420), level: "debug", message: "โหลดพรีเซ็ตสไตล์คำบรรยายแล้ว — กำลังรอตัวตัดต่อชิ้นแรกที่เสร็จ" },
  { id: "l13", agentId: "hook-caption", timestamp: ago(480), level: "info", message: "เขียนคำบรรยายและแฮชแท็กสำหรับวิดีโอ 1–3 แล้ว" },
  { id: "l14", agentId: "asset-finder", timestamp: ago(560), level: "warning", message: "ตัดคลิป 2 ชิ้นของวิดีโอ 1 ออก — ตรวจลิขสิทธิ์ไม่ผ่าน" },
  { id: "l15", agentId: "trend-research", timestamp: ago(640), level: "debug", message: "สแกนโพสต์ 1,240 รายการบน TikTok/Reels/Shorts คัดซ้ำเหลือ 18 เทรนด์" },
];

export const logsForAgent = (agentId: string) =>
  logs.filter((l) => l.agentId === agentId).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

/** Most-recent-first, for the global stream. */
export const recentLogs = [...logs].sort(
  (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)
);
