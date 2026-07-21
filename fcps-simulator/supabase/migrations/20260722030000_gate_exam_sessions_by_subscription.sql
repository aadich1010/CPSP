-- ═══════════════════════════════════════════════════════════
-- GAP: middleware.ts blocks /exam and /dashboard for anyone whose
-- profiles.subscription_status isn't 'active' (or is expired) -- but
-- that check only runs for Next.js page routes. It never runs for
-- direct calls to the Supabase REST/RPC API, and neither
-- "Users can create own sessions" (exam_sessions insert policy) nor
-- submit_exam_attempt() re-check subscription status themselves.
--
-- Exploitability today is low (an attacker needs real question uuids,
-- which are 128-bit random and no longer readable by unpaid accounts
-- after the previous migration) but it's the same class of gap as the
-- questions-table issue: an authorization check that only exists in
-- the app layer isn't actually enforced at the trust boundary. Closing
-- it here for defense-in-depth, mirroring middleware.ts's own logic:
--   subscription_status = 'active' AND (expires_at is null OR expires_at > now())
-- ═══════════════════════════════════════════════════════════

-- ── 1. exam_sessions insert -- require an active subscription ──
drop policy if exists "Users can create own sessions" on public.exam_sessions;
create policy "Users can create own sessions"
  on public.exam_sessions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (
            p.subscription_status = 'active'
            and (p.subscription_expires_at is null or p.subscription_expires_at > now())
          )
        )
    )
  );

-- ── 2. submit_exam_attempt() -- SECURITY DEFINER bypasses RLS, so it
--    needs its own explicit check rather than relying on the policy above.
create or replace function public.submit_exam_attempt(
  p_session_id uuid,
  p_answers    jsonb
)
returns table (score integer, total_questions integer, late_submission boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session       record;
  v_role          text;
  v_status        text;
  v_expires       timestamptz;
  v_elapsed       integer;
  v_grace_seconds constant integer := 15;
  v_score         integer := 0;
  v_total         integer := 0;
  v_late          boolean := false;
  v_answer        text;
  v_qid           uuid;
  v_correct       text;
  v_idx           integer := 0;
begin
  select * into v_session
  from public.exam_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if v_session.user_id <> auth.uid() then
    raise exception 'FORBIDDEN';
  end if;

  if v_session.submitted then
    raise exception 'ALREADY_SUBMITTED';
  end if;

  -- Same active-subscription check as the exam_sessions insert policy --
  -- required here too since SECURITY DEFINER runs with elevated
  -- privileges and does not go through RLS.
  select role, subscription_status, subscription_expires_at
    into v_role, v_status, v_expires
  from public.profiles
  where id = auth.uid();

  if v_role <> 'admin'
     and (v_status <> 'active' or (v_expires is not null and v_expires <= now())) then
    raise exception 'SUBSCRIPTION_INACTIVE';
  end if;

  v_elapsed := extract(epoch from (now() - v_session.started_at))::integer;
  if v_elapsed > v_session.time_limit_seconds + v_grace_seconds then
    v_late := true;
  end if;

  v_total := array_length(v_session.question_ids, 1);

  for v_idx in 0 .. v_total - 1 loop
    v_qid := v_session.question_ids[v_idx + 1];
    v_answer := p_answers ->> v_idx;

    select q.correct_answer into v_correct
    from public.questions q
    where q.id = v_qid;

    if v_answer is not null and v_answer = v_correct then
      v_score := v_score + 1;
    end if;
  end loop;

  insert into public.exam_attempts (
    user_id, subject, mode, score, total_questions, answers, session_id, late_submission
  ) values (
    v_session.user_id, v_session.subject, v_session.mode, v_score, v_total,
    p_answers, v_session.id, v_late
  );

  update public.exam_sessions set submitted = true where id = v_session.id;

  return query select v_score, v_total, v_late;
end;
$$;

revoke all on function public.submit_exam_attempt(uuid, jsonb) from public;
grant execute on function public.submit_exam_attempt(uuid, jsonb) to authenticated;
