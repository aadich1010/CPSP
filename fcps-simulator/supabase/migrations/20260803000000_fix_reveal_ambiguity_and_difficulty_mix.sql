-- ============================================================================
-- 1. FIX: reveal_exam_answers() was ALWAYS failing with
--    "42702: column reference \"id\" is ambiguous".
--
--    The function declares `returns table (id uuid, ...)`, which puts a
--    plpgsql variable named `id` in scope for the whole body. The lookup
--    `... from public.exam_sessions where id = p_session_id` then can't
--    tell that variable apart from exam_sessions.id, so the function
--    raised before returning a single row -- every single call, always.
--
--    Consequence: ExamEngine's post-submit reveal always hit its
--    "degrade gracefully" branch, so in EXAM mode `correct_answer` stayed
--    null on every question. That made the result screen count every
--    answer as wrong and never paint the correct option green. Practice
--    mode was unaffected because it gets correct_answer inline from
--    get_exam_questions() and never calls reveal.
--
--    submit_exam_attempt() has the same `where id = ...` shape but its
--    RETURNS TABLE has no `id` column, so it was never ambiguous --
--    which is why server-side grading/scores were always correct and
--    only the on-screen review was wrong.
--
--    Fix: alias the table and qualify every column reference.
-- ============================================================================

create or replace function public.reveal_exam_answers(
  p_session_id uuid
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
  v_session record;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  perform public.enforce_rpc_rate_limit('reveal_exam_answers', 30, interval '10 minutes');

  -- `s.` alias is load-bearing: bare `id` here collides with the
  -- RETURNS TABLE `id` column and raises 42702.
  select s.* into v_session
  from public.exam_sessions s
  where s.id = p_session_id;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if v_session.user_id is distinct from auth.uid() then
    raise exception 'FORBIDDEN';
  end if;

  if not v_session.submitted then
    raise exception 'NOT_SUBMITTED';
  end if;

  return query
    select q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
           q.correct_answer, q.explanation, q.subject
    from public.questions q
    where q.id = any(v_session.question_ids);
end;
$$;

revoke all on function public.reveal_exam_answers(uuid) from public;
grant execute on function public.reveal_exam_answers(uuid) to authenticated;


-- ============================================================================
-- 2. get_exam_questions(): deal every paper as a deliberate
--    Easy / Medium / Hard mix instead of a flat `order by random()`.
--
--    A flat random draw over the bank (Easy 1376 / Medium 812 / Hard 330)
--    skews roughly 55/32/13, so a 50-question mock could easily come back
--    with only a handful of Hard questions -- or none. This stratifies the
--    draw to a 40 / 40 / 20 target, then tops up from the rest of the pool
--    if a tier is too thin (e.g. a narrow subject with few Hard items), so
--    the student still always gets the full requested count.
--
--    Every tier is drawn with `order by random()` and the final result is
--    randomised again, so question ORDER is freshly shuffled for every
--    student on every attempt. Option order is shuffled client-side in
--    ExamEngine (and mapped back to the real letters before grading).
--
--    NOTE: every column reference below is table-qualified and no CTE
--    exposes a bare `id`, for exactly the 42702 reason fixed above.
-- ============================================================================

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
  v_easy   integer;
  v_medium integer;
  v_hard   integer;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select p.role, p.subscription_status into v_role, v_status
  from public.profiles p
  where p.id = auth.uid();

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

  -- Demo accounts stay hard-capped at 10 regardless of requested count.
  if v_role <> 'admin' and v_status <> 'active' then
    v_count := least(v_count, 10);
  end if;

  v_easy   := floor(v_count * 0.4)::integer;
  v_medium := floor(v_count * 0.4)::integer;
  v_hard   := v_count - v_easy - v_medium;

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
end;
$$;

revoke all on function public.get_exam_questions(text, integer, text) from public;
grant execute on function public.get_exam_questions(text, integer, text) to authenticated;
