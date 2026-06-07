import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "3 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว", "เมื่อสักครู่" จาก ISO timestamp. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(then)) return "—";
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "เมื่อสักครู่";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.round(hr / 24);
  return `${day} วันที่แล้ว`;
}

/** Short clock label e.g. "14:08:32". */
export function clock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return d.toLocaleTimeString("en-GB", { hour12: false });
}
