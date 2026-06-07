/**
 * GET /api/tiktok/login
 * Starts the TikTok OAuth flow: sets short-lived httpOnly PKCE + CSRF cookies
 * and 302-redirects the browser to TikTok's authorization page.
 */
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthorizeUrl, createPkce, createState, getTikTokConfig } from "@/lib/tiktok";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cfg = getTikTokConfig();
  if (!cfg.ok) {
    // Missing env — bounce back to the dashboard with a clear error code.
    const url = new URL("/", req.url);
    url.searchParams.set("tiktok_error", "missing_config");
    url.searchParams.set("missing", cfg.missing.join(","));
    return NextResponse.redirect(url);
  }

  const { verifier, challenge } = createPkce();
  const state = createState();
  const authorizeUrl = buildAuthorizeUrl(cfg.config, state, challenge);

  const res = NextResponse.redirect(authorizeUrl);
  const secure = req.nextUrl.protocol === "https:";
  const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure, path: "/", maxAge: 600 };
  res.cookies.set("tiktok_oauth_state", state, cookieOpts);
  res.cookies.set("tiktok_oauth_verifier", verifier, cookieOpts);
  return res;
}
