-- ═══════════════════════════════════════════════════════════
-- FEATURE: demo accounts get a real 3-day trial with every subject
-- unlocked, but the same fixed set of questions every attempt
-- (not reshuffled), so the trial is predictable and easy to demo
-- to a prospective student.
--
-- Rebuilt against the ACTUAL live get_exam_questions() shape from
-- 20260803010000_add_difficulty_breakdown_rpc.sql (the Easy/Medium/
-- Hard 40/40/20 stratified draw) and handle_new_user() from
-- 20260724000000_demo_account_signup.sql. Only what's described
-- below changes -- everything else (rate limiting, practice-mode
-- answer masking, the demo 10-question hard cap, admin bypass) is
-- preserved as-is.
--
--   1. New signups: subscription_expires_at is now set to
--      now() + 3 days at signup time (previously null = never
--      expired). Existing demo accounts with no expiry on file are
--      backfilled to 3 days from *this migration's* run time.
--   2. get_exam_questions(): now also checks subscription_expires_at,
--      same predicate as submit_exam_attempt() and the exam_sessions
--      insert policy -- a demo account past its 3 days gets
--      SUBSCRIPTION_INACTIVE here too, not just at the page-routing
--      layer. (middleware.ts already redirects expired accounts to
--      /subscription-expired; this closes the same gap at the RPC
--      layer so a direct RPC call can't bypass it.)
--   3. get_exam_questions(): for demo/non-active accounts, the
--      question draw is now DETERMINISTIC -- ordered by q.id instead
--      of random() at every stage -- so the same subject+count always
--      returns the same fixed set of questions in the same order.
--      Active/admin accounts are unchanged: still a fresh random draw
--      (with the difficulty stratification) on every attempt, which is
--      what makes repeated full mocks useful for real practice.
-- ═══════════════════════════════════════════════════════════

-- ── 1. New demo signups start with a 3-day expiry ───────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, subscription_status, subscription_expires_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student',
    'demo',
    now() + interval '3 days'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── 2. Backfill: existing demo accounts with no expiry on file get
--       3 days from right now, so nobody's demo runs forever just
--       because they signed up before this migration.
update public.profiles
set subscription_expires_at = now() + interval '3 days'
where subscription_status = 'demo'
  and subscription_expires_at is null;

-- ── 3. get_exam_questions(): expiry check + fixed draw for demo ──
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
  v_status  text;
  v_role    text;
  v_expires timestamptz;
  v_count   integer;
  v_easy    integer;
  v_medium  integer;
  v_hard    integer;
  v_fixed   boolean;
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
