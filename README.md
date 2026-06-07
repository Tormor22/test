# AgentOps Dashboard

A production-style operations dashboard (Next.js 15 / React 19 / Tailwind) for
monitoring an AI agent video-production pipeline — agent status, the live agent
office, workflow graph, task queue, logs, errors & blockers, an AI supervisor
briefing, and **TikTok account connection via the official TikTok Login Kit (OAuth v2)**.

The UI is in Thai; brand/technical names stay in English.

---

## Quick start (terminal)

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file (gitignored). See "Environment variables" below.
cp .env.example .env.local        # then edit .env.local
#   Windows PowerShell:  Copy-Item .env.example .env.local

# 3. Run the dev server
npm run dev

# 4. Open the dashboard
#    http://localhost:3000
```

The dashboard runs **without any keys** — it uses a built-in mock data simulation,
and the TikTok button shows a clear "not configured" state until you add the
TikTok env vars. Add keys to unlock TikTok login and the AI briefing.

### Scripts

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at http://localhost:3000 |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Run the production build |
| `npm run lint` | Lint |

---

## Environment variables

Create **`.env.local`** in the project root (it is gitignored). Everything is optional —
the dashboard degrades gracefully when a value is missing.

```bash
# --- TikTok Login Kit (OAuth v2) — server-side only ---
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=http://localhost:3000/api/tiktok/callback
TIKTOK_SCOPES=user.info.basic,video.list,video.upload

# --- AI Supervisor briefing (optional, Claude) ---
# ANTHROPIC_API_KEY=sk-ant-...

# --- Live event source (optional) ---
# NEXT_PUBLIC_WS_URL=ws://localhost:4000/agent-events
```

> 🔒 **Security:** `TIKTOK_CLIENT_SECRET` is used **only** on the server (in the
> `/api/tiktok/callback` route). It is never sent to the browser and must never be
> prefixed with `NEXT_PUBLIC_`. The app never asks for, automates, or stores your
> TikTok username/password — it uses the official OAuth redirect only.

---

## TikTok login — Developer Portal setup

### 1. Create an app and add Login Kit
1. Go to **TikTok for Developers** → <https://developers.tiktok.com/>
2. **Manage apps → Connect an app** (create a new app), fill in name/icon/description.
3. **Add products → Login Kit.**

### 2. Get your keys (→ env vars)
In the app's **Credentials / Basic information**:

| TikTok Portal | Env variable |
|---|---|
| **Client key** | `TIKTOK_CLIENT_KEY` |
| **Client secret** | `TIKTOK_CLIENT_SECRET` |

### 3. Add the Redirect URI
In **Login Kit → Redirect URI**, add this **exact** value (must match
`TIKTOK_REDIRECT_URI` byte-for-byte — scheme, host, port, path):

```
http://localhost:3000/api/tiktok/callback
```

For production also add `https://YOURDOMAIN/api/tiktok/callback` and set
`TIKTOK_REDIRECT_URI` to it. TikTok requires **HTTPS** for non-localhost URIs;
`http://localhost` is allowed for development.

### 4. Scopes / permissions
- **`user.info.basic`** — works immediately; gives display name + avatar (used for the
  "Connected" chip). Start here.
- **`video.list`**, **`video.upload`** — add these to your app **and get them approved**
  in the portal first. Until approved, requesting them makes the authorization step
  fail. Once approved, keep them in `TIKTOK_SCOPES`.

### 5. Test login locally
```bash
npm run dev
# open http://localhost:3000
# click "เชื่อมต่อ TikTok" (top-right)
```
You'll be redirected to TikTok, approve access, and land back on the dashboard with
the chip showing **เชื่อมต่อแล้ว** + your account name/avatar.

---

## How TikTok OAuth works here

```
Browser ── GET /api/tiktok/login ─▶ sets httpOnly PKCE + CSRF state cookies, 302 → TikTok
TikTok  ── user approves ─────────▶ 302 → /api/tiktok/callback?code&state
Server  ── verify state, exchange code (+client secret + PKCE) ─▶ open.tiktokapis.com
Server  ── fetch profile, store tokens in /.data (gitignored) ──▶ 302 → /?tiktok=connected
Browser ── GET /api/tiktok/status ─▶ { connected, account }   (tokens never sent to client)
```

| Endpoint | Purpose |
|---|---|
| `GET /api/tiktok/login` | Start OAuth (redirect to TikTok) |
| `GET /api/tiktok/callback` | Verify + exchange code, store tokens |
| `GET /api/tiktok/status` | Connection status for the UI (no tokens) |
| `POST /api/tiktok/disconnect` | Clear stored tokens |

Tokens are stored server-side in `/.data/tiktok-tokens.json` (gitignored, mode `600`),
with automatic refresh. For production, replace `src/lib/tiktokStore.ts` with an
encrypted DB / secrets manager scoped per user.

---

## Error states (all handled, shown in Thai on the dashboard)

| Situation | Behavior |
|---|---|
| Missing `TIKTOK_CLIENT_KEY` / `SECRET` / `REDIRECT_URI` | Button disabled + "ยังตั้งค่าไม่ครบ … (ดู .env.example)"; `/api/tiktok/login` redirects back with `?tiktok_error=missing_config` |
| Invalid redirect URI | TikTok rejects on its page (URI must match the portal); token exchange also guarded |
| User cancels on TikTok | `?tiktok_error=access_denied` → "คุณปฏิเสธการอนุญาต…" |
| Callback error / state mismatch (CSRF) | `?tiktok_error=invalid_callback` → "การเรียกกลับไม่ถูกต้อง…" |
| Token exchange failure | `?tiktok_error=token_exchange` → "แลกเปลี่ยนโทเค็นไม่สำเร็จ…" |
| Expired token | auto-refresh; if refresh fails → "โทเค็นหมดอายุ… เชื่อมต่อใหม่" |
| Not connected | chip shows "ยังไม่ได้เชื่อมต่อ TikTok" + Connect button |

---

## Project layout

```
src/
  app/
    page.tsx                  Main dashboard
    hr/page.tsx               Agent HR Manager
    api/
      tiktok/{login,callback,status,disconnect}/route.ts   TikTok OAuth
      daily-report/route.ts   AI supervisor briefing (Claude)
  components/                 UI: hero, stats, office, workflow graph, agents,
                              activity log, task queue, errors&blockers,
                              system health, daily report, TikTokConnect
  lib/tiktok.ts               TikTok OAuth helpers (server-only)
  lib/tiktokStore.ts          Server-side token storage + refresh
  data/                       Mock data for the simulation
```

> Note: sibling folders `head-agent-system/`, `subtitle-agent/`,
> `video-editor-agent/`, and `agents/` are **separate backend subprojects** with
> their own `package.json`/`tsconfig`. They are excluded from this dashboard's
> TypeScript build. See each folder's own README.
