/**
 * GET /api/tiktok/callback
 * TikTok redirects here with `code` + `state` (or an `error`). We verify the
 * CSRF state, exchange the code for tokens (PKCE), fetch the profile, store the
 * tokens server-side, then redirect back to the dashboard with a status flag.
 */
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForToken, fetchUserInfo, getTikTokConfig } from "@/lib/tiktok";
import { saveTokens } from "@/lib/tiktokStore";

export const runtime = "nodejs";

function backToDashboard(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/", req.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = NextResponse.redirect(url);
  // Always clear the transient oauth cookies.
  res.cookies.delete("tiktok_oauth_state");
  res.cookies.delete("tiktok_oauth_verifier");
  return res;
}

export async function GET(req: NextRequest) {
  const cfg = getTikTokConfig();
  if (!cfg.ok) return backToDashboard(req, { tiktok_error: "missing_config" });

  const sp = req.nextUrl.searchParams;

  // 1. User denied or TikTok returned an error.
  const oauthError = sp.get("error");
  if (oauthError) {
    const code = oauthError === "access_denied" ? "access_denied" : "authorization_failed";
    return backToDashboard(req, { tiktok_error: code });
  }

  // 2. Validate code + CSRF state against the cookie we set in /login.
  const code = sp.get("code");
  const state = sp.get("state");
  const cookieState = req.cookies.get("tiktok_oauth_state")?.value;
  const verifier = req.cookies.get("tiktok_oauth_verifier")?.value;

  if (!code || !state || !cookieState || state !== cookieState || !verifier) {
    return backToDashboard(req, { tiktok_error: "invalid_callback" });
  }

  // 3. Exchange the code for tokens, then fetch the profile.
  try {
    const token = await exchangeCodeForToken(cfg.config, code, verifier);

    let account = { open_id: token.open_id };
    try {
      account = await fetchUserInfo(token.access_token);
    } catch {
      // Profile fetch is best-effort; we still consider the account connected.
    }

    await saveTokens({
      openId: token.open_id,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      refreshExpiresIn: token.refresh_expires_in,
      scope: token.scope,
      account,
    });

    return backToDashboard(req, { tiktok: "connected" });
  } catch {
    return backToDashboard(req, { tiktok_error: "token_exchange" });
  }
}
