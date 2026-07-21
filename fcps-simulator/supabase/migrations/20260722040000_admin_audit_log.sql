-- ═══════════════════════════════════════════════════════════
--  ADMIN AUDIT LOG
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor)
--
--  Right now there is no record of who activated or revoked a student's
--  subscription, or when. For a manual-payment business (WhatsApp proof
--  → admin clicks activate) this matters a lot in practice: "I paid on
--  Tuesday, why isn't my account active" disputes, multiple admins
--  stepping on each other, or catching a mistaken revoke.
-- ═══════════════════════════════════════════════════════════

create table if not exists public.admin_audit_log (
  id             uuid        primary key default gen_random_uuid(),
  actor_id       uuid        not null references auth.users(id),
  action         text        not null check (action in ('activate', 'revoke')),
  target_user_id uuid        not null references auth.users(id),
  details        jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log (target_user_id, created_at desc);

create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log (actor_id, created_at desc);

alter table public.admin_audit_log enable row level security;

-- Only admins can read the log (via their own client, checking their own
-- profile role — same pattern as every other admin-only policy here).
create policy "Admin can view audit log"
  on public.admin_audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Writes only ever happen from the server action via service_role
-- (see activateSubscription/revokeSubscription in user-actions.ts),
-- never directly from the client — so no INSERT policy for
-- `authenticated` is added on purpose.
create policy "Service role full access to audit log"
  on public.admin_audit_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
