-- ═══════════════════════════════════════════════════════════
-- CRITICAL: "Users can update own profile" (see 20260514000000_initial_schema.sql)
-- has a `using` clause but no `with check` clause:
--
--   create policy "Users can update own profile"
--     on public.profiles for update
--     using (auth.uid() = id);
--
-- `using` only gates WHICH ROW can be touched (your own row). Without a
-- `with check`, Postgres falls back to re-using the `using` expression as
-- the check on the NEW row too -- which still only asserts `id` didn't
-- change. It does NOT restrict which columns can change.
--
-- The anon key and a logged-in user's own session JWT are both inherently
-- client-visible (that's how every Supabase app's browser client works),
-- so any authenticated student can open devtools and run:
--
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', myId)
--   supabase.from('profiles').update({
--     subscription_status: 'active',
--     subscription_expires_at: '2099-01-01'
--   }).eq('id', myId)
--
-- ...and this policy allows it. This is a direct DB-level privilege
-- escalation / free-subscription bypass. It has nothing to do with any
-- server action or requireAdmin() guard -- those never run for a request
-- that goes straight from the browser to Supabase's REST API.
--
-- The app's own UI never actually uses this policy (no client-side
-- `.from('profiles').update(...)` call exists anywhere in src/ -- verified
-- by grep). It's a dead, unused, wide-open door. This migration locks
-- `role`, `subscription_status`, and `subscription_expires_at` to their
-- current values on any self-update, while still letting a user update
-- other columns (e.g. full_name) if that's ever added as a feature.
--
-- The self-referential subquery below sees the pre-statement snapshot of
-- the row (standard Postgres RLS pattern for "diff old vs new"), so it
-- correctly compares against the value before this update, not the
-- attempted new value.
-- ═══════════════════════════════════════════════════════════

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and subscription_status = (select p.subscription_status from public.profiles p where p.id = auth.uid())
    and subscription_expires_at is not distinct from
      (select p.subscription_expires_at from public.profiles p where p.id = auth.uid())
  );

-- "Admin can update all profiles" is intentionally left as-is: admins are
-- already a trusted role (gated by is_admin(), which checks the caller's
-- OWN role, not the row they're touching), and changing another user's
-- role/subscription IS the intended admin capability. In practice all
-- admin writes go through the service-role server actions in
-- admin/user-actions.ts anyway, not this policy directly.
