"use client";

import { useCallback, useEffect, useState } from "react";
import { Music2, CheckCircle2, AlertTriangle, Loader2, LogOut } from "lucide-react";

/** Non-sensitive status payload from /api/tiktok/status. */
interface TikTokStatus {
  configured: boolean;
  missing: string[];
  connected: boolean;
  account: { open_id: string; display_name?: string; avatar_url?: string } | null;
  scope: string | null;
  stale: boolean;
}

/** Maps callback error codes to clear Thai messages. */
const ERROR_MESSAGES: Record<string, string> = {
  missing_config: "ยังไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อมของ TikTok (ดู .env.example)",
  access_denied: "คุณปฏิเสธการอนุญาตให้เข้าถึงบัญชี TikTok",
  authorization_failed: "การอนุญาตจาก TikTok ล้มเหลว กรุณาลองใหม่",
  invalid_callback: "การเรียกกลับไม่ถูกต้อง (state ไม่ตรงกัน) กรุณาลองเชื่อมต่อใหม่",
  token_exchange: "แลกเปลี่ยนโทเค็นกับ TikTok ไม่สำเร็จ ตรวจสอบ Client Key/Secret และ Redirect URI",
};

export default function TikTokConnect() {
  const [status, setStatus] = useState<TikTokStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/tiktok/status", { cache: "no-store" });
      setStatus((await res.json()) as TikTokStatus);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Read ?tiktok / ?tiktok_error flags from the callback, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("tiktok");
    const err = params.get("tiktok_error");
    if (ok === "connected") setNotice({ type: "success", text: "เชื่อมต่อบัญชี TikTok สำเร็จ" });
    else if (err) setNotice({ type: "error", text: ERROR_MESSAGES[err] ?? "เกิดข้อผิดพลาดในการเชื่อมต่อ TikTok" });
    if (ok || err) {
      params.delete("tiktok");
      params.delete("tiktok_error");
      params.delete("missing");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
    void loadStatus();
  }, [loadStatus]);

  const disconnect = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/tiktok/disconnect", { method: "POST" });
      setNotice({ type: "success", text: "ตัดการเชื่อมต่อ TikTok แล้ว" });
      await loadStatus();
    } finally {
      setBusy(false);
    }
  }, [loadStatus]);

  // --- render states ---
  const pill = "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors";

  if (loading) {
    return (
      <span className={`${pill} border-white/10 bg-white/5 text-slate-300`}>
        <Loader2 className="h-4 w-4 animate-spin text-pink-300" />
        กำลังตรวจสอบ TikTok…
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {/* Connection chip */}
        {status?.connected ? (
          <span className={`${pill} border-emerald-400/30 bg-emerald-400/10 text-emerald-200`}>
            {status.account?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={status.account.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span className="max-w-[160px] truncate">
              เชื่อมต่อแล้ว{status.account?.display_name ? ` · ${status.account.display_name}` : ""}
            </span>
          </span>
        ) : (
          <span className={`${pill} border-white/10 bg-white/5 text-slate-400`}>ยังไม่ได้เชื่อมต่อ TikTok</span>
        )}

        {/* Action button */}
        {status?.connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className={`${pill} border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-50`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            ตัดการเชื่อมต่อ
          </button>
        ) : (
          <a
            href="/api/tiktok/login"
            aria-disabled={!status?.configured}
            onClick={(e) => {
              if (!status?.configured) {
                e.preventDefault();
                setNotice({
                  type: "error",
                  text: `ยังตั้งค่าไม่ครบ: ${status?.missing.join(", ") || "ตัวแปร TikTok"} (ดู .env.example)`,
                });
              }
            }}
            className={`${pill} border-pink-400/30 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 text-white hover:from-pink-500/30 hover:to-cyan-500/30 ${
              status?.configured ? "" : "cursor-not-allowed opacity-60"
            }`}
          >
            <Music2 className="h-4 w-4 text-pink-300" />
            เชื่อมต่อ TikTok
          </a>
        )}
      </div>

      {/* Notices */}
      {notice && (
        <span
          className={`inline-flex items-center gap-1.5 text-xs ${
            notice.type === "success" ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {notice.type === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {notice.text}
        </span>
      )}
      {status?.connected && status.stale && (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" />
          โทเค็นหมดอายุและรีเฟรชไม่สำเร็จ — กรุณาเชื่อมต่อใหม่
        </span>
      )}
    </div>
  );
}
