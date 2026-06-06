# Deployment & Configuration

Everything needed to ship **app.ovfleet.com** (web), the iOS/Android apps, and
the auth/email pipeline. Companion to the auth code in `src/providers/AuthProvider.tsx`
and `src/lib/authRedirect.ts`.

## Architecture at a glance

```
                       ┌──────────────────────────┐
   ovfleet.com  ──────▶│  Marketing site (separate)│
   (Cloudflare)        └──────────────────────────┘

                       ┌──────────────────────────┐
 app.ovfleet.com ─────▶│  This app — web build     │──┐
   (static SPA)        └──────────────────────────┘  │
                                                      ├──▶  Supabase
   iOS / Android ─────▶  Native build of THIS code  ──┘    (Postgres + Auth)
   (EAS / local)                                            │
                                                            └──▶ Resend (email)
```

**Key takeaway:** the web app and the mobile apps are independent clients of the
same Supabase backend. **Where you host the web app (Hostinger, Cloudflare Pages,
EAS Hosting, …) has _zero_ impact on the mobile apps.** The only shared surface is
the deep-link scheme `overflow-rentals://`, which both platforms honor identically.

---

## 1. Supabase credentials — verified ✅

| Value | Setting |
|---|---|
| `https://gwcylyxbmzoyxsevripv.supabase.co` | `EXPO_PUBLIC_SUPABASE_URL` |
| `sb_publishable_qLO4FxD-5Kmd8ey0ZlhfFw_W8gPOndS` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

These match the live **TuroSaas** project (active, schema applied, RLS enabled on
all 12 tables). The publishable key is **safe to ship** — Row-Level Security scopes
every row to `auth.uid() = user_id`. They are already baked into every `eas.json`
build profile, so native builds pick them up automatically.

---

## 2. Auth URL configuration (required for a smooth signup)

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://app.ovfleet.com`
  > Your current value is `app.ovfleet.com` **without the scheme** — add `https://`,
  > otherwise Supabase can build malformed confirmation links.
- **Redirect URLs (allow list):**
  ```
  https://app.ovfleet.com/**
  https://app.ovfleet.com
  https://ovf.expo.app/**     (Expo preview — optional)
  http://localhost:8081/**    (local web dev)
  overflow-rentals://**       (iOS + Android deep link)
  ```

**Why:** the app sends `emailRedirectTo = <current web origin>` on web and
`overflow-rentals://` on native. Supabase only honors redirect targets that match
the allow list; anything else falls back to the Site URL. Your screenshot lists
`https://ovfleet.com` (the **marketing** site) but **not** `https://app.ovfleet.com`
(the **app**) — add the app origin so web confirmations land back in the app.

Also enable **Leaked Password Protection** (Authentication → Policies) — it is
currently disabled (flagged by the security advisor) and blocks known-compromised
passwords at signup with no UX cost.

---

## 3. Email via Resend

### 3a. Auth emails over Resend SMTP

Supabase → **Authentication → Emails → SMTP Settings → Enable custom SMTP**:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (STARTTLS) |
| Username | `resend` |
| Password | _your Resend API key_ |
| Sender email | `no-reply@app.ovfleet.com` (must be on the Resend-verified domain) |
| Sender name | `Overflow Fleet` |

This routes signup-confirmation, password-reset, and magic-link emails through your
verified domain instead of Supabase's rate-limited shared sender.

The default `{{ .ConfirmationURL }}` template works as-is with the app's PKCE
deep-link handling.

**Optional, most robust (cross-device):** change the Confirm-signup and Reset-password
templates to deep-link with the token hash, so a link opened on a _different_ device
than signup still works:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .EmailActionType }}
```

`createSessionFromUrl()` already handles `token_hash` + `verifyOtp`, so no code change
is needed to adopt this.

### 3b. Product / transactional emails (future)

`supabase/functions/send-email/` is a ready-to-deploy Edge Function that sends through
the Resend API. The key is a **runtime secret**, never committed:

```bash
supabase functions deploy send-email --project-ref gwcylyxbmzoyxsevripv
supabase secrets set RESEND_API_KEY=<your_resend_key> --project-ref gwcylyxbmzoyxsevripv
# optional override of the From address:
supabase secrets set EMAIL_FROM="Overflow Fleet <no-reply@app.ovfleet.com>" --project-ref gwcylyxbmzoyxsevripv
```

Invoke from the app:

```ts
await supabase.functions.invoke('send-email', {
  body: { to: 'host@example.com', subject: 'Your payout is on the way', html: '<p>…</p>' },
});
```

---

## 4. Web deployment (app.ovfleet.com)

The web build is a **static SPA** (`app.json → web.output: "single"`). It needs only
static file hosting plus an SPA fallback — **no Node.js server required.**

```bash
npx expo export -p web    # -> dist/
```

Provide the public env vars at export time (local `.env`, or the host's build env):
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### Option A — Hostinger (your current plan)

1. Upload the **contents of `dist/`** to the document root mapped to `app.ovfleet.com`.
2. `public/.htaccess` (in this repo, copied into `dist/`) handles SPA routing,
   forces HTTPS, and sets sane cache headers on Apache.
3. Point `app.ovfleet.com` (Cloudflare DNS) at Hostinger and enable SSL. If Cloudflare
   proxies the record, switch SSL/TLS mode to **Full (strict)** once Hostinger serves a
   valid certificate.

> Hostinger's Node support is **not** needed for this static export. You'd only need it
> if you later switch to `web.output: "server"` for SSR / API routes.

### Option B — Cloudflare Pages (recommended — you already run Cloudflare)

1. Pages → connect the GitHub repo. Build command `npx expo export -p web`, output dir `dist`.
2. `public/_redirects` (in this repo) gives SPA routing automatically.
3. Add custom domain `app.ovfleet.com` (DNS is automatic since the zone is on Cloudflare).
4. Add `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` as Pages build env vars.

Free, global CDN, auto-deploy on every push — a cleaner fit than Hostinger for a static SPA.

---

## 5. Mobile builds (iOS + Android, in sync)

Both platforms build from this same codebase and talk to the same Supabase project.
Already aligned in `app.json`:

- Bundle id / package: `com.overflowrentals.app`
- Deep-link scheme: `overflow-rentals` → email links open the app identically on both
- `ITSAppUsesNonExemptEncryption: false`, automatic light/dark, new architecture on

EAS project: **@vavqo/turo-business-app** (`98bbd266-0134-4dd1-b25e-8c9a80a38d2a`).
Supabase env vars are baked per profile in `eas.json` (verified correct).

### Without a paid Expo plan

- **EAS Build free tier** works (limited concurrency / longer queue):
  ```bash
  eas build --profile preview --platform android   # APK
  eas build --profile preview --platform ios        # simulator build
  ```
- **EAS Update** (OTA JS updates) free tier works: `eas update --branch production`.
- **Or build entirely locally**, no Expo subscription required:
  ```bash
  npx expo run:android    # needs Android Studio
  npx expo run:ios        # needs macOS + Xcode
  ```
- Store submission needs the platform developer accounts (Apple $99/yr, Google $25 once),
  which are independent of Expo.

Hosting the web app on Hostinger does **not** affect any of the above.

---

## 6. Security checklist (action required)

- **Rotate the secrets shared in chat** — the Resend API key, Cloudflare API token, and
  Expo access token. Treat any secret pasted into a chat/transcript as compromised and
  regenerate it in each provider's dashboard. (The Supabase publishable/anon key is public
  by design — no action.)
- **Apply migration `003`** (`supabase/migrations/003_lock_down_rls_auto_enable.sql`) — it
  revokes API `EXECUTE` on the `rls_auto_enable` helper, clearing a security advisor.
- **Enable Leaked Password Protection** in Supabase Auth.
- **Never commit server secrets.** `.env` holds only `EXPO_PUBLIC_*` publishable values;
  server secrets live in Supabase function secrets or the web host's env settings.
