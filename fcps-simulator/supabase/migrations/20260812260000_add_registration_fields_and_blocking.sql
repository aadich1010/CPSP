-- ═══════════════════════════════════════════════════════════
-- FEATURE: richer registration (cell number, PMDC number, medical college)
-- + admin-controlled temporary account blocking.
--
-- 1. Registration now collects three more fields alongside full name/email/
--    password: cell number (reuses the existing `phone` column -- it was
--    already on profiles but never populated from the signup form), PMDC
--    number, and medical college (free text on the DB side; the dropdown
--    of ~100 PMDC-recognized colleges lives client-side in
--    src/lib/medicalColleges.ts, same "canonical list" pattern as
--    src/lib/subjects.ts -- keeping the college column as plain text
--    rather than a foreign key/enum means a student whose college isn't in
--    the list yet can still type it in without a migration).
--
-- 2. `blocked_until` gives the admin a genuinely temporary block: set it to
--    a future timestamp and the user is locked out until that instant,
--    then automatically regains access -- no admin action needed to lift
--    it, and no cron job needed either, since every check below is just
--    "is blocked_until in the future". This is deliberately a SEPARATE
--    mechanism from subscription_status ('pending'/'active'/'demo'/
--    'expired') so blocking a user for a few hours never clobbers or loses
--    track of their actual subscription state -- unblocking just clears
--    the timestamp and whatever subscription tier they had is exactly as
--    it was.
-- ═══════════════════════════════════════════════════════════

-- ── 1. New profile columns ──────────────────────────────────────────
alter table public.profiles add column if not exists pmdc_number text;
alter table public.profiles add column if not exists medical_college text;
alter table public.profiles add column if not exists blocked_until timestamptz;

comment on column public.profiles.phone is 'Cell number, collected at registration.';
comment on column public.profiles.pmdc_number is 'PMDC registration number, collected at registration.';
comment on column public.profiles.medical_college is 'Medical college name, collected at registration (free text -- see src/lib/medicalColleges.ts for the client-side dropdown list).';
comment on column public.profiles.blocked_until is 'If set and in the future, the account is temporarily blocked until this instant (enforced in middleware.ts + auth/actions.ts login()). NULL = not blocked. Independent of subscription_status.';

-- ── 2. handle_new_user() -- also capture phone/pmdc/college from signup ─
-- Rebuilt from the live definition in 20260724000000_demo_account_signup.sql
-- (role='student', subscription_status='demo' default for new signups) --
-- only the three new fields are added, read from the same
-- raw_user_meta_data the client already passes via supabase.auth.signUp's
-- options.data (see register() in src/app/auth/actions.ts).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, pmdc_number, medical_college, role, subscription_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'pmdc_number', ''),
    nullif(new.raw_user_meta_data->>'medical_college', ''),
    'student',
    'demo'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── 3. Lock blocked_until from client-side self-update ─────────────
-- Same privilege-escalation concern as role/subscription_status in
-- 20260722050000_lock_down_profile_self_update.sql: the anon key + a
-- logged-in user's own JWT are client-visible, so without this a blocked
-- student could run
--   supabase.from('profiles').update({ blocked_until: null }).eq('id', myId)
-- directly against the REST API and unblock themselves. Rebuilt from that
-- migration's live policy, adding only the blocked_until check.
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
    and blocked_until is not distinct from
      (select p.blocked_until from public.profiles p where p.id = auth.uid())
  );

-- ── 4. Audit log: allow 'block' / 'unblock' / 'password_reset' actions ──
alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check
  check (action in ('activate', 'revoke', 'delete_user', 'block', 'unblock', 'password_reset'));
