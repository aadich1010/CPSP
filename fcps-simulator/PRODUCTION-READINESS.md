# Production Readiness Notes

Scoped to what a single-tenant, hundreds-to-low-thousands-of-users SaaS on
Supabase + Vercel actually needs — not generic enterprise DR/observability.

## Backups (Supabase Postgres)

This app has no application-level database backup — it relies on Supabase's
built-in backups, which is the right call at this scale, but the **backup
tier depends on the Supabase project plan** and is not automatic on the free
tier:

- **Free plan:** no automated backups at all. If the project is still on
  Free, this is the single biggest data-loss risk in the whole stack —
  more urgent than any code-level finding in this audit.
- **Pro plan ($25/mo):** 7 days of daily backups included.
- **Pro plan + Point-in-Time Recovery add-on:** continuous backups, restore
  to any point within the retention window (7–28 days depending on tier).

**Action for the business owner (manual dashboard step, not something
Claude can do without dashboard access):** confirm the project is at least
on the Pro plan, and check Dashboard → Database → Backups to see what's
actually enabled. If it's still Free, upgrading is the highest-leverage
five-minute fix available for this product.

The one thing that *is* covered at the application level: the question
bank (the highest-effort-to-recreate data) can be manually exported any
time via **Admin → Questions → Backup** (`BackupRestoreExport.tsx`), which
downloads all questions as JSON and can restore from that file. Treat this
as a supplementary export, not a substitute for platform-level backups —
it doesn't cover `profiles`, `exam_attempts`, `exam_sessions`, or
`admin_audit_log`.

## What happens on a Supabase outage

- Middleware (`updateSession()`) calls `supabase.auth.getUser()` on every
  request to a protected route. If Supabase Auth is unreachable, that call
  will reject/timeout — worth confirming in Supabase's status history
  whether this fails open or closed; as written, an unhandled rejection
  here would surface as a Next.js 500, not a graceful "try again" page.
  Low-risk-but-cheap follow-up: wrap that call in try/catch and redirect to
  a static "we're experiencing issues" page instead of a raw 500 during a
  Supabase incident.
- The exam-taking flow depends on `submit_exam_attempt()` (an RPC). If the
  DB is unreachable mid-exam, the student's answers are already being
  tracked client-side in `ExamEngine.tsx` state, so a transient blip is
  recoverable by retrying submission; a sustained outage during an active
  exam session is a genuine gap with no queued-retry/offline handling
  today. Given this is a mock-exam product (not the real CPSP exam), the
  acceptable mitigation is communication (a status banner / WhatsApp
  broadcast) rather than engineering an offline-first exam engine.

## What happens on a Vercel outage

Static/serverless hosting outage — no in-app mitigation possible or
warranted at this scale. Standard practice: monitor https://vercel-status.com,
communicate to users via WhatsApp (the existing support channel) if an
outage is prolonged.

## Environment variable hygiene

See `.env.example` (added alongside this doc) for the full list of
variables the app reads. Summary of what matters most:

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely. It must only ever be
  read server-side (it already is — see `createAdminClient()` in
  `src/lib/supabase/server.ts`) and must never be prefixed
  `NEXT_PUBLIC_*`. Worth a one-time check in Vercel → Settings →
  Environment Variables that no `NEXT_PUBLIC_`-prefixed variable
  accidentally holds this value.
- No `.env*` file is tracked in git (verified — `.gitignore` covers this),
  and `create-admin.js` no longer hardcodes a password (already fixed per
  audit history).

## Error monitoring

`src/lib/logger.ts` emits structured JSON to stdout/stderr, which Vercel's
log drain picks up and makes greppable/filterable by `event`/`level` — this
is proportionate for the current scale. It is **not** alerting: nobody gets
paged when an `error` line is emitted, someone has to go look. At hundreds
of users this is an acceptable tradeoff; the concrete, cheap upgrade path
if/when it stops being acceptable is a free-tier Sentry project (few lines
of integration, no infra to run) rather than building a custom alerting
pipeline.
