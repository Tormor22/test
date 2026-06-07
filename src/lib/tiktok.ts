/**
 * TikTok Login Kit (OAuth v2) — SERVER-ONLY helpers.
 *
 * This module reads TIKTOK_CLIENT_SECRET and must never be imported by client
 * components. The browser only ever talks to the /api/tiktok/* route handlers,
 * which in turn use this module. We use the official authorization-code flow
 * with PKCE + a CSRF `state` value — no username/password is ever handled.
 *
 * Docs: https://developers.tiktok.com/doc/login-kit-web
 */
import { createHash, randomBytes } from "node:crypto";

const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USERINFO_URL = "https://open.tiktokapis.com/v2/user/info/";

/** Scopes requested. `user.info.basic` covers open_id, display_name, avatar_url. */
const DEFAULT_SCOPES = ["user.info.basic"];

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export type ConfigResult =
  | { ok: true; config: TikTokConfig }
  | { ok: false; missing: string[] };

/** Read + validate env. Returns the missing var names instead of throwing. */
export function getTikTokConfig(): ConfigResult {
  const clientKey = process.env.TIKTOK_CLIENT_KEY ?? "";
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET ?? "";
  const redirectUri = process.env.TIKTOK_REDIRECT_URI ?? process.env.TIKTOK_REDIRECT_URL ?? "";

  const missing: string[] = [];
  if (!clientKey) missing.push("TIKTOK_CLIENT_KEY");
  if (!clientSecret) missing.push("TIKTOK_CLIENT_SECRET");
  if (!redirectUri) missing.push("TIKTOK_REDIRECT_URL");
  if (missing.length) return { ok: false, missing };

  const scopes = (process.env.TIKTOK_SCOPES ?? DEFAULT_SCOPES.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { ok: true, config: { clientKey, clientSecret, redirectUri, scopes } };
}

// --- PKCE + CSRF helpers ---------------------------------------------------

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface Pkce {
  verifier: string;
  challenge: string;
}

/** Generate a PKCE verifier/challenge pair (S256). */
export function createPkce(): Pkce {
  const verifier = base64url(randomBytes(48)); // 64 url-safe chars
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

/** Opaque anti-CSRF token stored in an httpOnly cookie and echoed by TikTok. */
export function createState(): string {
  return base64url(randomBytes(16));
}

/** Build the TikTok authorization URL the user is redirected to. */
export function buildAuthorizeUrl(config: TikTokConfig, state: string, codeChallenge: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_key", config.clientKey);
  url.searchParams.set("scope", config.scopes.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

// --- Token exchange + refresh ---------------------------------------------

export interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  refresh_expires_in: number; // seconds
  open_id: string;
  scope: string;
  token_type: string;
}

interface TikTokTokenError {
  error?: string;
  error_description?: string;
  log_id?: string;
}

/** Exchange the authorization code for tokens (PKCE code_verifier required). */
export async function exchangeCodeForToken(
  config: TikTokConfig,
  code: string,
  codeVerifier: string,
): Promise<TikTokTokenResponse> {
  const body = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });
  return postToken(body);
}

/** Use a refresh token to obtain a fresh access token. */
export async function refreshAccessToken(
  config: TikTokConfig,
  refreshToken: string,
): Promise<TikTokTokenResponse> {
  const body = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return postToken(body);
}

async function postToken(body: URLSearchParams): Promise<TikTokTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body,
  });
  const json = (await res.json()) as TikTokTokenResponse & TikTokTokenError;
  if (!res.ok || json.error) {
    throw new Error(json.error_description || json.error || `Token request failed (HTTP ${res.status})`);
  }
  return json;
}

// --- User info -------------------------------------------------------------

export interface TikTokAccount {
  open_id: string;
  union_id?: string;
  display_name?: string;
  avatar_url?: string;
}

/** Fetch the connected user's basic profile. */
export async function fetchUserInfo(accessToken: string): Promise<TikTokAccount> {
  const url = new URL(USERINFO_URL);
  url.searchParams.set("fields", "open_id,union_id,avatar_url,display_name");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = (await res.json()) as {
    data?: { user?: TikTokAccount };
    error?: { code?: string; message?: string };
  };
  if (json.error && json.error.code && json.error.code !== "ok") {
    throw new Error(json.error.message || "Failed to fetch TikTok user info");
  }
  return json.data?.user ?? { open_id: "" };
}
