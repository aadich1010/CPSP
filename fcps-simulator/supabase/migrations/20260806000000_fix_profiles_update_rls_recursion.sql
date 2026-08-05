-- The "Users can update own profile" policy (added alongside has_seen_welcome)
-- guards role/subscription_status/subscription_expires_at from being changed
-- by the user themselves, using inline correlated subqueries against
-- `profiles` inside its WITH CHECK clause:
--
--   role = (select p.role from profiles p where p.id = auth.uid())
--
-- Postgres evaluates RLS on that inner SELECT too, which re-enters the
-- policies on `profiles` while the outer UPDATE's policy check for the same
-- relation is still active -> "infinite recursion detected in policy for
-- relation profiles" (42P17). This is the exact same class of bug the
-- 2026-07-20 fix_profiles_rls_infinite_recursion migration fixed elsewhere.
--
-- Net effect in production: every `UPDATE profiles SET has_seen_welcome ...`
-- issued by a signed-in user has been failing with 42P17 since the VVIP
-- welcome feature shipped. The app code didn't check the error, so it failed
-- silently -- has_seen_welcome never actually flipped to true, so every
-- login has been treated as "first login" and shown the 30s Congratulations
-- modal instead of the 5s Welcome back one.
--
-- Fix: move the "what are this row's current protected values" lookup into
-- a SECURITY DEFINER helper, same pattern as is_admin(). Owned by postgres
-- (table owner, not subject to RLS since profiles has no FORCE ROW LEVEL
-- SECURITY), so the lookup bypasses RLS entirely instead of re-triggering it.

create or replace function public.own_profile_protected_fields(uid uuid)
returns table (
  role text,
  subscription_status text,
  subscription_expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.role, p.subscription_status, p.subscription_expires_at
  from public.profiles p
  where p.id = uid;
$$;

revoke all on function public.own_profile_protected_fields(uuid) from public;
grant execute on function public.own_profile_protected_fields(uuid) to authenticated, anon;

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
on public.profiles
for update
to public
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select f.role from public.own_profile_protected_fields(auth.uid()) f)
  and subscription_status = (select f.subscription_status from public.own_profile_protected_fields(auth.uid()) f)
  and subscription_expires_at is not distinct from (select f.subscription_expires_at from public.own_profile_protected_fields(auth.uid()) f)
);

-- Backfill: every currently-active subscriber who has already signed in at
-- least once (auth.users.last_sign_in_at is set) has already been shown the
-- Congratulations popup -- repeatedly, thanks to the bug above. Without this
-- backfill, their very next login post-fix would show it one more time
-- before finally settling into "Welcome back". Mark them seen now so the
-- fix is immediately visible as fixed. Anyone who is active but has never
-- signed in yet is left as false on purpose -- their next login is a true
-- first login and should still get the full Congratulations treatment.
update public.profiles p
set has_seen_welcome = true
where p.subscription_status = 'active'
  and p.has_seen_welcome is distinct from true
  and exists (
    select 1 from auth.users u
    where u.id = p.id and u.last_sign_in_at is not null
  );
