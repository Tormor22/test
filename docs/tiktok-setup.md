# TikTok Login (OAuth) — Setup

This dashboard connects to TikTok using the **official TikTok Login Kit (OAuth v2)**
authorization-code flow with PKCE. It **never** asks for or stores your TikTok
username/password — TikTok itself handles the login on its own page, and only an
access token is returned to the server.

The **Client Secret stays server-side** (used only in the `/api/tiktok/callback`
route). Tokens are stored on the server in a gitignored file (`/.data/tiktok-tokens.json`).

---

## 1. Create a TikTok app

1. Go to the **TikTok for Developers** portal: <https://developers.tiktok.com/>
2. Log in and open **Manage apps → Connect an app** (create a new app).
3. Fill in the basic app info (name, icon, description).

## 2. Add the Login Kit product

1. In your app, click **Add products** and add **Login Kit**.
2. Under Login Kit, add the scope **`user.info.basic`** (gives display name + avatar).
   - Add more scopes later only if you enable them here first, then set `TIKTOK_SCOPES`.

## 3. Get your keys

In the app's **Basic information** / **Credentials** section:

| Portal field   | Env variable           |
| -------------- | ---------------------- |
| **Client key** | `TIKTOK_CLIENT_KEY`    |
| **Client secret** | `TIKTOK_CLIENT_SECRET` (keep secret) |

## 4. Register the Redirect URI

In the Login Kit settings, add this **exact** Redirect URI (it must match
`TIKTOK_REDIRECT_URI` byte-for-byte, including scheme, host, port, and path):

```
http://localhost:3000/api/tiktok/callback
```

For a deployed site, also add your production callback, e.g.
`https://yourdomain.com/api/tiktok/callback`, and set `TIKTOK_REDIRECT_URI` to it.

> TikTok may require **HTTPS** for non-localhost redirect URIs. `localhost` over
> HTTP is allowed for development.

## 5. Configure environment variables

Create `.env.local` in the project root (this file is gitignored):

```bash
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/tiktok/callback
# optional:
# TIKTOK_SCOPES=user.info.basic
```

## 6. Run and test

```bash
npm run dev
```

Open <http://localhost:3000>, click **เชื่อมต่อ TikTok** (top-right). You'll be sent
to TikTok to authorize, then redirected back. On success the chip shows
**เชื่อมต่อแล้ว** with your display name/avatar.

---

## How it works (flow)

```
Browser ── GET /api/tiktok/login ──▶ sets PKCE+state cookies, 302 → TikTok authorize page
TikTok  ── user approves ──────────▶ 302 → /api/tiktok/callback?code&state
Server  ── verify state, exchange code (+secret+PKCE) for tokens ──▶ open.tiktokapis.com
Server  ── fetch profile, store tokens in /.data ──▶ 302 → /?tiktok=connected
Browser ── GET /api/tiktok/status ─▶ { connected, account } (no tokens ever returned)
```

## Files involved

| File | Role |
| --- | --- |
| `src/lib/tiktok.ts` | OAuth helpers (config, PKCE, authorize URL, token exchange/refresh, user info). Server-only. |
| `src/lib/tiktokStore.ts` | Server-side token storage + auto-refresh. Returns only non-sensitive fields. |
| `src/app/api/tiktok/login/route.ts` | Starts the flow (redirect to TikTok). |
| `src/app/api/tiktok/callback/route.ts` | Verifies state, exchanges code, stores tokens. |
| `src/app/api/tiktok/status/route.ts` | Safe connection status for the UI. |
| `src/app/api/tiktok/disconnect/route.ts` | Clears stored tokens. |
| `src/components/TikTokConnect.tsx` | The "เชื่อมต่อ TikTok" button + status chip. |

## Troubleshooting

| Symptom (shown on the dashboard) | Cause / fix |
| --- | --- |
| `ยังตั้งค่าไม่ครบ … (ดู .env.example)` | One or more of `TIKTOK_CLIENT_KEY/SECRET/REDIRECT_URI` is missing in `.env.local`. Restart `npm run dev` after editing env. |
| `การเรียกกลับไม่ถูกต้อง (state ไม่ตรงกัน)` | Cookies blocked, or you reused an old callback URL. Start again from the Connect button. |
| `แลกเปลี่ยนโทเค็นกับ TikTok ไม่สำเร็จ …` | Client Key/Secret wrong, or `TIKTOK_REDIRECT_URI` doesn't match the portal exactly. |
| `คุณปฏิเสธการอนุญาต…` | You clicked "Cancel" on TikTok's consent screen. |
| Token refresh fails (`โทเค็นหมดอายุ…`) | Refresh token expired — click Connect again. |

## Security notes

- The **Client Secret is never sent to the browser** and is not prefixed with `NEXT_PUBLIC_`.
- CSRF is prevented with a random `state` stored in an httpOnly cookie and verified on callback.
- PKCE (`code_challenge`/`code_verifier`) protects the code exchange.
- Tokens live in `/.data/` (gitignored, file mode `600`). For production, replace
  `src/lib/tiktokStore.ts` with an encrypted DB / secrets manager and scope tokens per user.
