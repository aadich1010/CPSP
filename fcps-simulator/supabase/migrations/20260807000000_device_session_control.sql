-- ═══════════════════════════════════════════════════════════════════════════
-- Single-active-session (1-device-per-account) control.
--
-- Business rule: every account (student, demo, or admin) may hold at most
-- ONE active session, globally, at any time. A second login attempt while
-- one is active must be rejected -- not silently kick the first session.
--
-- Design notes:
--
-- 1. The 1-active-session-per-user invariant is enforced by Postgres itself
--    via a PARTIAL UNIQUE INDEX (WHERE is_active), not just an application
--    check. An app-level "SELECT count(*)" check alone is race-able: two
--    concurrent login requests for the same user could both read 0 active
--    sessions before either has inserted a row. claim_device_session() below
--    additionally takes a row lock (SELECT ... FOR UPDATE) before deciding,
--    and the unique index is the final backstop if that lock is somehow
--    bypassed (e.g. a future refactor that calls INSERT directly).
--
-- 2. All mutations go through SECURITY DEFINER functions that key off
--    auth.uid() -- never a client-supplied user id -- so a user can only
--    ever claim/release/validate their OWN session, and RLS on the table
--    only grants SELECT (of one's own row) to authenticated clients. This
--    mirrors the existing handle_new_user() trigger pattern in this repo.
--
-- 3. Device fingerprints are stored pre-hashed (HMAC-SHA256 + a server-only
--    pepper, computed in src/lib/deviceSession/fingerprint.ts) -- the raw
--    fingerprint (User-Agent + screen resolution + a per-login random id)
--    never touches the database.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.active_sessions (
  id                          uuid        primary key default gen_random_uuid(),
  user_id                     uuid        not null references public.profiles(id) on delete cascade,

  -- HMAC-SHA256(raw_fingerprint, FINGERPRINT_PEPPER). Raw fingerprint =
  -- User-Agent + screen resolution + a random per-login id. Deterministic
  -- (not bcrypt-salted) on purpose: it must be re-derivable for comparison
  -- on every validation call.
  hashed_device_fingerprint  text        not null,

  -- Plain (unhashed) User-Agent string captured at login, used for the
  -- cheap per-request check in middleware.ts -- the User-Agent header is
  -- available on every single request (including plain page navigations),
  -- unlike the full fingerprint, which only travels on explicit Server
  -- Action calls (login, and the periodic client-side validation ping).
  device_user_agent          text,

  last_activity               timestamptz not null default now(),
  is_active                   boolean     not null default true,
  created_at                  timestamptz not null default now(),
  revoked_at                  timestamptz,
  -- 'logout' | 'logout_all' | 'fingerprint_mismatch' | 'device_mismatch' | 'expired_cleanup'
  revoked_reason               text
);

-- THE CORE BUSINESS RULE, enforced at the database level: at most one
-- is_active = true row per user_id. Partial index only covers active rows,
-- so historical (inactive) rows never collide.
create unique index if not exists uq_active_sessions_one_per_user
  on public.active_sessions (user_id)
  where is_active = true;

create index if not exists idx_active_sessions_user_active
  on public.active_sessions (user_id)
  where is_active = true;

create index if not exists idx_active_sessions_last_activity
  on public.active_sessions (last_activity)
  where is_active = true;

alter table public.active_sessions enable row level security;

-- Authenticated users may only ever read their OWN session row(s) -- purely
-- informational for the client; all writes happen through the functions
-- below, never direct table access.
create policy "Users can view their own active sessions"
  on public.active_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.active_sessions to authenticated;
-- No insert/update/delete grants for authenticated/anon: every mutation
-- must go through a SECURITY DEFINER function below.


-- ── claim_device_session ─────────────────────────────────────────────────
-- Called right after a successful supabase.auth.signInWithPassword(). Takes
-- the row lock, checks for an existing active session, and either rejects
-- (no insert -- caller must then sign the just-created Supabase Auth
-- session back out) or creates the new active session row.
create or replace function public.claim_device_session(
  p_hashed_fingerprint text,
  p_user_agent text
)
returns table(out_session_id uuid, out_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_id uuid;
  v_new_id uuid;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  -- Row lock closes the race window between two concurrent login attempts
  -- for the same user.
  select id into v_existing_id
  from public.active_sessions
  where user_id = v_user_id and is_active = true
  for update;

  if v_existing_id is not null then
    return query select null::uuid, 'device_limit_exceeded';
    return;
  end if;

  insert into public.active_sessions (user_id, hashed_device_fingerprint, device_user_agent)
  values (v_user_id, p_hashed_fingerprint, p_user_agent)
  returning id into v_new_id;

  return query select v_new_id, 'ok';
exception
  -- Safety net: unique_violation on the partial index, in case the row
  -- lock above was somehow bypassed.
  when unique_violation then
    return query select null::uuid, 'device_limit_exceeded';
end;
$$;

revoke all on function public.claim_device_session(text, text) from public, anon;
grant execute on function public.claim_device_session(text, text) to authenticated;


-- ── validate_device_fingerprint ──────────────────────────────────────────
-- Called by the client-side DeviceSessionGuard on mount and periodically.
-- Confirms the caller's active session still matches the full fingerprint
-- captured at login; on mismatch, immediately deactivates the session
-- (anti-theft: a copied/replayed auth cookie stops working the moment this
-- check runs from the wrong device).
create or replace function public.validate_device_fingerprint(
  p_hashed_fingerprint text
)
returns table(out_valid boolean, out_reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.active_sessions%rowtype;
begin
  if v_user_id is null then
    return query select false, 'unauthenticated';
    return;
  end if;

  select * into v_row
  from public.active_sessions
  where user_id = v_user_id and is_active = true
  limit 1;

  if not found then
    return query select false, 'session_inactive';
    return;
  end if;

  if v_row.hashed_device_fingerprint is distinct from p_hashed_fingerprint then
    update public.active_sessions
    set is_active = false, revoked_at = now(), revoked_reason = 'fingerprint_mismatch'
    where id = v_row.id;
    return query select false, 'fingerprint_mismatch';
    return;
  end if;

  update public.active_sessions set last_activity = now() where id = v_row.id;
  return query select true, 'ok';
end;
$$;

revoke all on function public.validate_device_fingerprint(text) from public, anon;
grant execute on function public.validate_device_fingerprint(text) to authenticated;


-- ── release_device_session ───────────────────────────────────────────────
-- Normal logout: deactivates the caller's own active session.
create or replace function public.release_device_session()
returns void
language sql
security definer
set search_path = public
as $$
  update public.active_sessions
  set is_active = false, revoked_at = now(), revoked_reason = 'logout'
  where user_id = auth.uid() and is_active = true;
$$;

revoke all on function public.release_device_session() from public, anon;
grant execute on function public.release_device_session() to authenticated;


-- ── release_all_device_sessions ──────────────────────────────────────────
-- "Logout from all devices" feature. Functionally overlaps with
-- release_device_session() today (the 1-device rule means at most one row
-- is ever active), but kept as its own explicit, auditable action -- e.g.
-- for a "this wasn't me, log me out everywhere" account-security flow, and
-- to stay correct if the 1-device rule is ever relaxed later.
create or replace function public.release_all_device_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.active_sessions
  set is_active = false, revoked_at = now(), revoked_reason = 'logout_all'
  where user_id = auth.uid() and is_active = true;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.release_all_device_sessions() from public, anon;
grant execute on function public.release_all_device_sessions() to authenticated;


-- ── cleanup_stale_device_sessions ────────────────────────────────────────
-- Background reaper: deactivates sessions idle for more than p_hours. A
-- user who closes their laptop lid without hitting "logout" would otherwise
-- hold their one device slot forever. Deliberately NOT auth.uid()-scoped
-- (it operates across all users), so it is NOT granted to authenticated/anon
-- -- only callable via the service_role key, from
-- src/app/api/cron/cleanup-device-sessions/route.ts (see vercel.json crons).
create or replace function public.cleanup_stale_device_sessions(
  p_hours integer default 24
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.active_sessions
  set is_active = false, revoked_at = now(), revoked_reason = 'expired_cleanup'
  where is_active = true
    and last_activity < now() - (p_hours || ' hours')::interval;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.cleanup_stale_device_sessions(integer) from public, anon, authenticated;
