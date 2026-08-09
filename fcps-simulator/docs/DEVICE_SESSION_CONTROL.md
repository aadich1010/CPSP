# Single-Active-Session (1-Device) Control

Implemented natively for this app's real stack: **Next.js 16 (App Router) +
Supabase Auth (`@supabase/ssr`, cookie-based) + Postgres via Supabase**.

## Files

```
supabase/migrations/20260807000000_device_session_control.sql
  active_sessions table + claim/validate/release/cleanup RPC functions

src/lib/deviceSession/
  fingerprint.ts        HMAC-SHA256 hashing (Web Crypto, Node + Edge safe)
  clientFingerprint.ts  raw client-side fingerprint (UA + screen + tab id)
  actions.ts             Server Action wrappers around the RPCs

src/components/DeviceSessionGuard.tsx
  client component: periodic full-fingerprint re-validation

src/app/auth/actions.ts        login() / logout() / logoutAllDevices()
src/lib/supabase/middleware.ts  per-request fast gatekeeper
src/app/login/page.tsx          sends fingerprint, shows the exact messages
src/app/api/cron/cleanup-device-sessions/route.ts  24h reaper (Vercel Cron)
vercel.json                     cron schedule
```

## Two-tier device check, and why

Next.js middleware runs on *every* request, including plain page
navigations (typed URL, link click, back button) -- but those requests
carry only standard browser headers, not a custom `X-Device-Fingerprint`
header a client script could attach (that's only possible on an explicit
`fetch`/Server Action call). So the full fingerprint (User-Agent + screen
resolution + a per-login random id) can only be checked when the client
explicitly calls a Server Action -- at login, and periodically from
`DeviceSessionGuard`.

- **Coarse, every request** (`middleware.ts`): compares the live
  `User-Agent` header against the plain-text `device_user_agent` captured
  at login. Cheap, always available, catches "this request is coming from
  an obviously different browser/device."
- **Precise, periodic** (`DeviceSessionGuard`, mounted in
  `dashboard/layout.tsx` and `admin/layout.tsx`): on mount and every 60s,
  calls `validateDeviceFingerprint()` with the full HMAC'd fingerprint.
  Catches a same-User-Agent spoof that the coarse check would miss.

Both paths converge on the same outcome: deactivate the `active_sessions`
row, sign out of Supabase Auth, redirect to `/login?error=...`, which
`login/page.tsx` reads and shows the exact required message in the
existing red error banner (the SPA-style "toast" from a generic
Express/React build doesn't map 1:1 onto Next.js page navigations, so this
is the idiomatic equivalent: a query-param-driven banner on the page the
user lands on).

## Known platform limitation (by design, per your decision)

`@supabase/ssr` stores the auth session in a cookie, shared by every tab of
the same browser -- not `sessionStorage`, which the browser natively scopes
per-tab. That means two *different accounts* (e.g. Paid + Demo) cannot both
stay logged in in two tabs of the *same* browser at once: logging into Tab
2 overwrites the browser's one auth cookie, and Tab 1 picks up that same
session on its next request. This is a platform-level constraint of
cookie-based SSR auth (the same reason Gmail needs a dedicated
"multiple accounts" feature), not a bug in this implementation.

The 1-device-per-account rule itself (requirement #1) is fully and
correctly enforced regardless. To run Paid and Demo simultaneously for
testing, use two different browsers, two browser profiles, or one normal +
one Incognito/private window -- each has its own cookie jar.

## Sequence: Paid logs in on Laptop, then tries Mobile

```
Paid user, Laptop            Server Action: login()          active_sessions (DB)
       |                            |                                |
       |-- submit login form ------>|                                |
       |   email, password,         |                                |
       |   fingerprint=UA+screen+id |                                |
       |                            |-- signInWithPassword() ------->| (Supabase Auth,
       |                            |<----------------- session -----|  not this table)
       |                            |-- claimDeviceSession(fp) ------>|
       |                            |     RPC: claim_device_session   |
       |                            |     BEGIN; SELECT...FOR UPDATE  |
       |                            |     WHERE user_id=P AND active  |
       |                            |     -> 0 rows -> INSERT ------->| row created,
       |                            |<-------------------- 'ok' ------|  is_active=true
       |                            |-- redirect('/dashboard') ------>|
       |<----------- dashboard ------|                                |

Paid user, Mobile            Server Action: login()          active_sessions (DB)
       |                            |                                |
       |-- submit login form ------>|                                |
       |                            |-- signInWithPassword() ------->| (succeeds --
       |                            |<----------------- session -----|  credentials valid)
       |                            |-- claimDeviceSession(fp) ------>|
       |                            |     SELECT...FOR UPDATE         |
       |                            |     -> 1 row found (Laptop's) --|
       |                            |<---------- 'device_limit_exceeded'
       |                            |-- supabase.auth.signOut() ----->| (undo the Auth
       |                            |                                 |  session just created)
       |<-- { error: "You are already logged in on another device.
       |      You can only be active on one device at a time.
       |      Please logout from the other device first." } ----------|
       |   (shown in the existing red error banner on /login)          |
```

## Anti-theft: a copied auth cookie used on a different machine

```
Attacker (stolen cookie)      middleware.ts                   active_sessions (DB)
       |                            |                                |
       |-- GET /dashboard --------->|                                |
       |   Cookie: sb-...-auth-token (stolen, valid signature)       |
       |                            |-- supabase.auth.getUser() ---->| (Supabase Auth:
       |                            |<-------------------- user -----|  cookie is genuinely
       |                            |                                 |  valid, signature-wise)
       |                            |-- SELECT active_sessions        |
       |                            |   WHERE user_id=P, is_active ->|
       |                            |<----- device_user_agent="Chrome/Win" (Laptop's)
       |                            |   live User-Agent = "Safari/iOS" (attacker's)
       |                            |   MISMATCH
       |                            |-- clear auth cookie, redirect ->|
       |<-- 302 /login?error=device_mismatch ---------------------------|
       |   ("Session invalidated due to a device mismatch.
       |     Please log in again.")

  (DeviceSessionGuard, if the attacker's page had already mounted, would
   also independently catch this within 60s via the precise fingerprint
   check and deactivate the row -- either path wins the race.)
```

## Deploy note

Every currently-logged-in user has a valid Supabase Auth cookie but (until
this ships) no `active_sessions` row. The very first protected-route
request each of them makes after deploy will therefore be treated as
"session_ended" by `middleware.ts` and force a fresh login -- this is
expected, one-time, and is the correct behavior for a security upgrade like
this, not a bug.

## Cron frequency

`vercel.json` schedules the cleanup job daily (`0 3 * * *`) so it works on
every Vercel plan, including Hobby (which only allows daily crons). If this
project is on Pro or higher, tightening it to e.g. every 15 minutes
(`*/15 * * * *`) shrinks the window a crashed/closed session holds its
device slot before being reaped.
