/**
 * TikTok token store — SERVER-ONLY.
 *
 * Persists the OAuth tokens to a gitignored file under `.data/`. This is
 * deliberately simple for local/dev use. In production, swap this for a real
 * secrets store or encrypted DB (the function surface stays the same).
 *
 * The access/refresh tokens NEVER leave the server: `getConnection()` returns
 * only non-sensitive fields for the dashboard to render.
 */
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { getTikTokConfig, refreshAccessToken, type TikTokAccount } from "@/lib/tiktok";

const DATA_DIR = path.join(process.cwd(), ".data");
const TOKEN_FILE = path.join(DATA_DIR, "tiktok-tokens.json");

/** Full record kept on disk (contains secrets — never sent to the browser). */
interface TokenRecord {
  openId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  refreshExpiresAt: number; // epoch ms
  scope: string;
  account: TikTokAccount;
  connectedAt: string; // ISO
}

/** Safe subset returned to the client. */
export interface PublicConnection {
  account: TikTokAccount;
  scope: string;
  expiresAt: number;
  connectedAt: string;
  /** True when the access token is expired and could not be refreshed. */
  stale: boolean;
}

export interface SaveInput {
  openId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  refreshExpiresIn: number; // seconds
  scope: string;
  account: TikTokAccount;
}

export async function saveTokens(input: SaveInput): Promise<void> {
  const record: TokenRecord = {
    openId: input.openId,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: Date.now() + input.expiresIn * 1000,
    refreshExpiresAt: Date.now() + input.refreshExpiresIn * 1000,
    scope: input.scope,
    account: input.account,
    connectedAt: new Date().toISOString(),
  };
  await persist(record);
}

export async function clearTokens(): Promise<void> {
  await rm(TOKEN_FILE, { force: true });
}

/**
 * Read the stored connection for the dashboard. Auto-refreshes the access token
 * when it is expired (or about to expire) and a valid refresh token exists.
 * Returns only non-sensitive fields, or null when not connected.
 */
export async function getConnection(): Promise<PublicConnection | null> {
  const record = await read();
  if (!record) return null;

  let current = record;
  let stale = false;

  // Refresh if the access token expires within 60s.
  if (Date.now() >= record.expiresAt - 60_000) {
    const cfg = getTikTokConfig();
    const refreshable = cfg.ok && record.refreshToken && Date.now() < record.refreshExpiresAt;
    if (refreshable) {
      try {
        const t = await refreshAccessToken(cfg.config, record.refreshToken);
        current = {
          ...record,
          accessToken: t.access_token,
          refreshToken: t.refresh_token || record.refreshToken,
          expiresAt: Date.now() + t.expires_in * 1000,
          refreshExpiresAt: Date.now() + (t.refresh_expires_in ?? 0) * 1000,
          scope: t.scope || record.scope,
        };
        await persist(current);
      } catch {
        stale = true; // keep the stored record but flag it
      }
    } else {
      stale = true;
    }
  }

  return {
    account: current.account,
    scope: current.scope,
    expiresAt: current.expiresAt,
    connectedAt: current.connectedAt,
    stale,
  };
}

// --- internals -------------------------------------------------------------

async function persist(record: TokenRecord): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(record, null, 2), { mode: 0o600 });
}

async function read(): Promise<TokenRecord | null> {
  try {
    const raw = await readFile(TOKEN_FILE, "utf8");
    return JSON.parse(raw) as TokenRecord;
  } catch {
    return null; // not connected yet / unreadable
  }
}
