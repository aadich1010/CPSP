-- ═══════════════════════════════════════════════════════════
-- FEATURE: cap demo accounts at 3 total exam attempts, on top of
-- the existing 3-day expiry (20260805000000_demo_3day_fixed_
-- questions_all_subjects.sql). Whichever limit is hit first blocks
-- the account and points it at /subscription-expired.
--
-- Rebuilt against the ACTUAL live shapes from that migration --
-- get_exam_questions() (expiry-aware, fixed/non-random draw for
-- demo) and the "Users can create own sessions" policy on
-- exam_sessions (from 20260724000000_demo_account_signup.sql,
-- still the latest version of that policy). Only the attempt-count
-- check is new; the rest is preserved unchanged.
--
-- Enforced in TWO places, matching this codebase's existing
-- pattern of never trusting a single layer:
--   1. get_exam_questions() -- raises DEMO_ATTEMPTS_EXHAUSTED so the
--      client can show a clear message instead of a generic
--      "could not start exam" failure.
--   2. exam_sessions INSERT policy -- the real trust boundary. Even
--      if get_exam_questions() were bypassed, a 4th session for a
--      demo account is rejected at the database level.
--
-- Both count public.exam_attempts rows for the user -- i.e.
-- COMPLETED/submitted attempts, not just started-but-abandoned
-- sessions, so a demo student who opens an exam and never submits
-- doesn't burn one of their 3 tries.
-- ═══════════════════════════════════════════════════════════

-- ── 1. get_exam_questions(): block a demo account's 4th attempt ──
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
  v_status   text;
  v_role     text;
  v_expires  timestamptz;
  v_count    integer;
  v_easy     integer;
  v_medium   integer;
  v_hard     integer;
  v_fixed    boolean;
  v_attempts integer;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select p.role, p.subscription_status, p.subscription_expires_at
    into v_role, v_status, v_expires
  from public.profiles p
  where p.id = auth.uid();

  if v_role is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if v_role <> 'admin'
     and (v_status not in ('active', 'demo') or (v_expires is not null and v_expires <= now())) then
    raise exception 'SUBSCRIPTION_INACTIVE';
  end if;

  -- Demo accounts get exactly 3 completed attempts, lifetime.
  if v_role <> 'admin' and v_status = 'demo' then
    select count(*) into v_attempts
    from public.exam_attempts a
    where a.user_id = auth.uid();

    if v_attempts >= 3 then
      raise exception 'DEMO_ATTEMPTS_EXHAUSTED';
    end if;
  end if;

  if p_mode not in ('exam', 'practice') then
    raise exception 'INVALID_MODE';
  end if;

  if v_role <> 'admin' then
    perform public.enforce_rpc_rate_limit('get_exam_questions', 20, interval '10 minutes');
  end if;

  v_count := least(greatest(coalesce(p_count, 50), 1), 200);

  -- Demo accounts stay hard-capped at 10 regardless of requested count.
  if v_role <> 'admin' and v_status <> 'active' then
    v_count := least(v_count, 10);
  end if;

  -- Fixed (non-random) draw for everyone except active subscribers
  -- and admins -- keeps the demo trial's question set identical on
  -- every attempt instead of reshuffling.
  v_fixed := v_role <> 'admin' and v_status <> 'active';

  v_easy   := floor(v_count * 0.4)::integer;
  v_medium := floor(v_count * 0.4)::integer;
  v_hard   := v_count - v_easy - v_medium;

  if v_fixed then
    return query
    with pool as (
      select q.id as qid,
             coalesce(nullif(lower(trim(q.difficulty)), ''), 'medium') as diff
      from public.questions q
      where (p_subject is null or p_subject = 'Mixed (All Subjects)' or q.subject = p_subject)
    ),
    picked as (
      (select pl.qid from pool pl where pl.diff = 'easy'   order by pl.qid limit v_easy)
      union all
      (select pl.qid from pool pl where pl.diff = 'medium' order by pl.qid limit v_medium)
      union all
      (select pl.qid from pool pl where pl.diff = 'hard'   order by pl.qid limit v_hard)
    ),
    filled as (
      select pk.qid from picked pk
      union
      (select pl.qid
       from pool pl
       where pl.qid not in (select pk2.qid from picked pk2)
       order by pl.qid
       limit greatest(v_count - (select count(*) from picked), 0))
    )
    select q2.id, q2.question_text, q2.option_a, q2.option_b, q2.option_c, q2.option_d, q2.option_e,
           case when p_mode = 'practice' then q2.correct_answer else null end,
           case when p_mode = 'practice' then q2.explanation    else null end,
           q2.subject
    from public.questions q2
    join filled f on f.qid = q2.id
    order by q2.id
    limit v_count;
  else
    return query
    with pool as (
      select q.id as qid,
             coalesce(nullif(lower(trim(q.difficulty)), ''), 'medium') as diff
      from public.questions q
      where (p_subject is null or p_subject = 'Mixed (All Subjects)' or q.subject = p_subject)
    ),
    picked as (
      (select pl.qid from pool pl where pl.diff = 'easy'   order by random() limit v_easy)
      union all
      (select pl.qid from pool pl where pl.diff = 'medium' order by random() limit v_medium)
      union all
      (select pl.qid from pool pl where pl.diff = 'hard'   order by random() limit v_hard)
    ),
    filled as (
      select pk.qid from picked pk
      union
      (select pl.qid
       from pool pl
       where pl.qid not in (select pk2.qid from picked pk2)
       order by random()
       limit greatest(v_count - (select count(*) from picked), 0))
    )
    select q2.id, q2.question_text, q2.option_a, q2.option_b, q2.option_c, q2.option_d, q2.option_e,
           case when p_mode = 'practice' then q2.correct_answer else null end,
           case when p_mode = 'practice' then q2.explanation    else null end,
           q2.subject
    from public.questions q2
    join filled f on f.qid = q2.id
    order by random()
    limit v_count;
  end if;
end;
$$;

revoke all on function public.get_exam_questions(text, integer, text) from public;
grant execute on function public.get_exam_questions(text, integer, text) to authenticated;

-- ── 2. exam_sessions insert policy: the real trust boundary ──────
drop policy if exists "Users can create own sessions" on public.exam_sessions;
create policy "Users can create own sessions"
  on public.exam_sessions for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and (
          p.role = 'admin'
          or (
            p.subscription_status = 'active'
            and (p.subscription_expires_at is null or p.subscription_expires_at > now())
          )
          or (
            p.subscription_status = 'demo'
            and (p.subscription_expires_at is null or p.subscription_expires_at > now())
            and (
              select count(*) from public.exam_attempts a where a.user_id = (select auth.uid())
            ) < 3
          )
        )
    )
  );
