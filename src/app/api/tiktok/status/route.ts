/**
 * GET /api/tiktok/status
 * Non-sensitive connection status for the dashboard. Never returns tokens.
 */
import { getTikTokConfig } from "@/lib/tiktok";
import { getConnection } from "@/lib/tiktokStore";

export const runtime = "nodejs";

export async function GET() {
  const cfg = getTikTokConfig();
  const connection = await getConnection();

  return Response.json({
    configured: cfg.ok,
    missing: cfg.ok ? [] : cfg.missing,
    connected: Boolean(connection),
    account: connection?.account ?? null,
    scope: connection?.scope ?? null,
    expiresAt: connection?.expiresAt ?? null,
    connectedAt: connection?.connectedAt ?? null,
    stale: connection?.stale ?? false,
  });
}
