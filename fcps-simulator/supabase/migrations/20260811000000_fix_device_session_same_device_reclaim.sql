-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: false "You are already logged in on another device" for a normal
-- single-device user.
--
-- Root cause: claim_device_session() unconditionally rejected a login
-- attempt whenever ANY active_sessions row already existed for the account,
-- with no check for whether that row actually belonged to a different
-- device. In practice most users never click "Logout" -- they close the
-- tab, close the laptop lid, lose wifi mid-session, or their browser cookie
-- simply expires/gets cleared. None of those release the device slot (see
-- release_device_session() / the 24h cleanup_stale_device_sessions() cron),
-- so the very next login from that SAME device found its own stale row
-- still marked active and was rejected as if it were a second device.
--
-- Fix: when an active row already exists, compare its device_user_agent
-- (the same coarse per-request signal middleware.ts already trusts for its
-- fast-path device check) to the User-Agent of this login attempt. A match
-- means this is the same browser/device reclaiming its own slot after an
-- unclean disconnect -- refresh the row in place instead of blocking the
-- user out of their own account. Only a genuinely different User-Agent is
-- still treated as a second device and rejected.
-- ═══════════════════════════════════════════════════════════════════════════

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
  v_existing public.active_sessions%rowtype;
  v_new_id uuid;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  -- Row lock closes the race window between two concurrent login attempts
  -- for the same user.
  select * into v_existing
  from public.active_sessions
  where user_id = v_user_id and is_active = true
  for update;

  if v_existing.id is not null then
    if v_existing.device_user_agent is not null and v_existing.device_user_agent = p_user_agent then
      -- Same device reclaiming its own stale slot -- not a second device.
      update public.active_sessions
      set hashed_device_fingerprint = p_hashed_fingerprint,
          device_user_agent = p_user_agent,
          last_activity = now(),
          revoked_at = null,
          revoked_reason = null
      where id = v_existing.id;

      return query select v_existing.id, 'ok';
      return;
    end if;

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
