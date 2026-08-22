-- Fixes: a device/browser that closes (or goes offline) WITHOUT hitting the
-- explicit "Logout" button holds its one-device slot in active_sessions for
-- up to 24 hours (the cleanup_stale_device_sessions cron's window), blocking
-- every login attempt from any other device that whole time -- even though
-- the other device is genuinely offline.
--
-- The DeviceSessionGuard heartbeat (src/components/DeviceSessionGuard.tsx)
-- refreshes active_sessions.last_activity every 60 seconds while a session's
-- tab is open and calling validate_device_fingerprint(). If that stops
-- (tab closed, browser killed, device offline), last_activity goes stale.
--
-- This changes claim_device_session() so that when a login from a
-- DIFFERENT device/browser finds an existing active slot whose
-- last_activity is older than 3 minutes (3x the heartbeat interval -- well
-- past any normal blip, but far short of 24h), it auto-revokes that stale
-- slot and lets the new device claim it immediately, instead of waiting for
-- the cron. A slot that's still fresh (the other device is genuinely
-- online right now) still blocks the new login exactly as before -- this
-- does NOT weaken the one-device-at-a-time enforcement, it only stops a
-- closed/offline device from blocking logins after it's no longer there.
create or replace function public.claim_device_session(p_hashed_fingerprint text, p_user_agent text)
returns table(out_session_id uuid, out_status text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_existing public.active_sessions%rowtype;
  v_new_id uuid;
  v_stale_after interval := interval '3 minutes';
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select * into v_existing
  from public.active_sessions
  where user_id = v_user_id and is_active = true
  for update;

  if v_existing.id is not null then
    if v_existing.device_user_agent is not null and v_existing.device_user_agent = p_user_agent then
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

    if v_existing.last_activity < now() - v_stale_after then
      update public.active_sessions
      set is_active = false, revoked_at = now(), revoked_reason = 'stale_replaced_at_login'
      where id = v_existing.id;

      insert into public.active_sessions (user_id, hashed_device_fingerprint, device_user_agent)
      values (v_user_id, p_hashed_fingerprint, p_user_agent)
      returning id into v_new_id;

      return query select v_new_id, 'ok';
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
  when unique_violation then
    return query select null::uuid, 'device_limit_exceeded';
end;
$function$;
