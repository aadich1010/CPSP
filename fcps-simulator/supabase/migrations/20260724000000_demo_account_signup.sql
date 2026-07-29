-- ═══════════════════════════════════════════════════════════
-- FEATURE: instant "demo" access on signup, no admin approval needed.
--
-- Previously every new signup landed in subscription_status = 'pending',
-- which middleware.ts and every subscription-gated RPC treat as fully
-- blocked (redirected to /subscription-expired) until an admin manually
-- ran activateSubscription(). That meant nobody could try the product
-- at all before paying.
--
-- This migration adds a new status, 'demo', that:
--   - is granted automatically to every new signup (no admin action),
--   - lets the student straight into /dashboard and /exam,
--   - is hard-capped server-side to 10 questions per exam (the RPC
--     enforces this -- it is NOT just a client-side dropdown limit),
--   - still requires an admin to upgrade the account to 'active' for
--     the full subject list / question counts (see /admin/users).
--
-- 'pending' is kept as a valid value for any admin who wants to
-- manually put an account on hold -- it still means "fully blocked",
-- same as before. Only the *default* changes.
-- ═══════════════════════════════════════════════════════════

-- ── 1. Allow 'demo' as a valid subscription_status ─────────────
alter table public.profiles drop constraint if exists profiles_subscription_status_check;
alter table public.profiles add constraint profiles_subscription_status_check
  check (subscription_status in ('pending', 'demo', 'active', 'expired'));

-- ── 2. New signups start in 'demo', not 'pending' ──────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, subscription_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student',
    'demo'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── 3. get_exam_questions() -- allow 'demo', hard-cap it to 10 ─────
-- Rebuilt from the latest version (20260722060000_rate_limit_question_rpcs.sql)
-- so the per-user rate limit introduced there is preserved.
create or replace function public.get_exam_questions(
  p_subject text,
  p_count   integer,
  p_mode    text
)
returns table (
  id             uuid,
  question_text  text,
  option_a       text,
  option_b       text,
  option_c       text,
  option_d       text,
  option_e       text,
  correct_answer text,
  explanation    text,
  subject        text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_role   text;
  v_count  integer;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select role, subscription_status into v_role, v_status
  from public.profiles
  where id = auth.uid();

  if v_role is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if v_role <> 'admin' and v_status not in ('active', 'demo') then
    raise exception 'SUBSCRIPTION_INACTIVE';
  end if;

  if p_mode not in ('exam', 'practice') then
    raise exception 'INVALID_MODE';
  end if;

  if v_role <> 'admin' then
    perform public.enforce_rpc_rate_limit('get_exam_questions', 20, interval '10 minutes');
  end if;

  v_count := least(greatest(coalesce(p_count, 50), 1), 200);

  -- Demo accounts (not admin, not 'active') are hard-capped to 10
  -- questions no matter what count the client asks for. This is the
  -- real trust boundary -- the exam/setup dropdown only offering a
  -- "10 Questions (Demo Limit)" option is just UX, not enforcement.
  if v_role <> 'admin' and v_status <> 'active' then
    v_count := least(v_count, 10);
  end if;

  return query
    select
      q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
      case when p_mode = 'practice' then q.correct_answer else null end,
      case when p_mode = 'practice' then q.explanation else null end,
      q.subject
    from public.questions q
    where (p_subject is null or p_subject = 'Mixed (All Subjects)' or q.subject = p_subject)
    order by random()
    limit v_count;
end;
$$;

revoke all on function public.get_exam_questions(text, integer, text) from public;
grant execute on function public.get_exam_questions(text, integer, text) to authenticated;

-- ── 4. exam_sessions insert -- allow 'demo' to start sessions too ──
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
            p.subscription_status in ('active', 'demo')
            and (p.subscription_expires_at is null or p.subscription_expires_at > now())
          )
        )
    )
  );

-- ── 5. submit_exam_attempt() -- same allowance, mirrors the policy ──
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

  select role, subscription_status, subscription_expires_at
    into v_role, v_status, v_expires
  from public.profiles
  where id = auth.uid();

  if v_role <> 'admin'
     and (v_status not in ('active', 'demo') or (v_expires is not null and v_expires <= now())) then
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

-- ── 6. Anyone currently stuck in 'pending' from before this migration
--       gets instant demo access too, so nobody has to ask the admin
--       just to get unblocked by this rollout.
update public.profiles set subscription_status = 'demo' where subscription_status = 'pending';
