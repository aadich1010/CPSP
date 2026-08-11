-- FEATURE: "Start Mixed Exam" scoped to a single paper (Paper I, Paper II,
-- or Clinical Practice) from the exam setup wizard's new weightage popup --
-- see src/lib/subjects.ts (SUBJECT_GROUPS) and src/app/exam/setup/page.tsx.
--
-- get_exam_questions() previously only understood two subject scopes:
-- a single exact subject, or p_subject = 'Mixed (All Subjects)' (every
-- subject, no filter). There was no way to mix questions from just the
-- subjects inside one paper without adding a third scope.
--
-- Adding p_subject_list text[] default null as a new trailing parameter
-- (backward compatible -- every existing 3-arg call site keeps working
-- unchanged, default null). When the caller passes a non-empty array, the
-- question pool is filtered to q.subject = any(p_subject_list) instead of
-- the p_subject exact-match/all-subjects logic. p_subject is still passed
-- through unchanged and is only used for the pretty display label stored
-- on exam_sessions.subject (e.g. 'Mixed (Paper I — Basic Sciences)') --
-- the actual filtering when p_subject_list is set ignores p_subject
-- entirely, so a mismatched label can never accidentally widen or narrow
-- the real filter.
create or replace function public.get_exam_questions(
  p_subject      text,
  p_count        integer,
  p_mode         text,
  p_subject_list text[] default null
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
  v_use_list boolean;
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

  v_use_list := p_subject_list is not null and cardinality(p_subject_list) > 0;

  if v_fixed then
    return query
    with pool as (
      select q.id as qid,
             coalesce(nullif(lower(trim(q.difficulty)), ''), 'medium') as diff
      from public.questions q
      where (
        case
          when v_use_list then q.subject = any(p_subject_list)
          else (p_subject is null or p_subject = 'Mixed (All Subjects)' or q.subject = p_subject)
        end
      )
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
      where (
        case
          when v_use_list then q.subject = any(p_subject_list)
          else (p_subject is null or p_subject = 'Mixed (All Subjects)' or q.subject = p_subject)
        end
      )
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

-- Old 3-arg signature is superseded by the 4-arg version above (default
-- param makes 3-arg calls still resolve to it) -- drop the now-orphaned
-- overload explicitly so there isn't a stale duplicate function sitting
-- around with the old permissions.
drop function if exists public.get_exam_questions(text, integer, text);

revoke all on function public.get_exam_questions(text, integer, text, text[]) from public;
grant execute on function public.get_exam_questions(text, integer, text, text[]) to authenticated;
