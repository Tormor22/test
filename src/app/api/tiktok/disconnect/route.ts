/**
 * POST /api/tiktok/disconnect
 * Removes the stored tokens (local disconnect).
 */
import { clearTokens } from "@/lib/tiktokStore";

export const runtime = "nodejs";

export async function POST() {
  await clearTokens();
  return Response.json({ ok: true });
}
