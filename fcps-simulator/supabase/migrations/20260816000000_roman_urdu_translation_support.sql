-- FEATURE: student-facing "Roman Urdu" toggle for question text/options/
-- explanation, in both Practice Mode and Exam Mode.
--
-- Translation is NOT done by an AI API call at runtime -- the admin supplies
-- the Roman Urdu text directly via the existing Bulk Import JSON flow
-- (matched onto the same question_text via the existing upsert-by-
-- question_text behaviour), so this migration only needs to: (1) add
-- storage columns for the translated text, and (2) thread those columns
-- through the two RPCs that already gate question access
-- (get_exam_questions for the live exam/practice screen, reveal_exam_answers
-- for the post-submission review screen) so client code can read them.
-- Nothing here changes who can read what -- same subscription/expiry/role
-- gates as before, same practice-vs-exam masking for the explanation field
-- (roman_urdu_explanation is masked in exam mode exactly like explanation
-- is, since it's still "the answer explanation", just in a different
-- language). Question/option roman text is never masked -- it's a display
-- language choice, not an integrity-sensitive field.

-- 1. Storage columns. Nullable -- most questions won't have a Roman Urdu
--    version yet, and the UI falls back to English whenever these are
--    null/empty.
alter table public.questions
  add column if not exists roman_urdu_question_text text,
  add column if not exists roman_urdu_option_a       text,
  add column if not exists roman_urdu_option_b        text,
  add column if not exists roman_urdu_option_c        text,
  add column if not exists roman_urdu_option_d        text,
  add column if not exists roman_urdu_option_e        text,
  add column if not exists roman_urdu_explanation      text;

-- 2. get_exam_questions(): add the roman_urdu_* columns to the output.
--    Return shape changes (new trailing columns), so this has to be a
--    drop + recreate rather than a plain CREATE OR REPLACE.
drop function if exists public.get_exam_questions(text, integer, text, text[]);

create function public.get_exam_questions(
  p_subject      text,
  p_count        integer,
  p_mode         text,
  p_subject_list text[] default null
)
returns table (
  id                      uuid,
  question_text           text,
  option_a                text,
  option_b                text,
  option_c                text,
  option_d                text,
  option_e                text,
  correct_answer          text,
  explanation             text,
  subject                 text,
  roman_urdu_question_text text,
  roman_urdu_option_a      text,
  roman_urdu_option_b      text,
  roman_urdu_option_c      text,
  roman_urdu_option_d      text,
  roman_urdu_option_e      text,
  roman_urdu_explanation   text
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

  if p_mode not in ('exam', 'practice') then
    raise exception 'INVALID_MODE';
  end if;

  if v_role <> 'admin' then
    perform public.enforce_rpc_rate_limit('get_exam_questions', 20, interval '10 minutes');
  end if;

  v_count := least(greatest(coalesce(p_count, 50), 1), 200);

  v_easy   := floor(v_count * 0.4)::integer;
  v_medium := floor(v_count * 0.4)::integer;
  v_hard   := v_count - v_easy - v_medium;

  v_use_list := p_subject_list is not null and cardinality(p_subject_list) > 0;

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
         q2.subject,
         q2.roman_urdu_question_text, q2.roman_urdu_option_a, q2.roman_urdu_option_b,
         q2.roman_urdu_option_c, q2.roman_urdu_option_d, q2.roman_urdu_option_e,
         case when p_mode = 'practice' then q2.roman_urdu_explanation else null end
  from public.questions q2
  join filled f on f.qid = q2.id
  order by random()
  limit v_count;
end;
$$;

revoke all on function public.get_exam_questions(text, integer, text, text[]) from public;
grant execute on function public.get_exam_questions(text, integer, text, text[]) to authenticated;

-- 3. reveal_exam_answers(): add the same roman_urdu_* columns so the
--    post-submission review screen can also show translated explanations
--    (question/option roman text was already present on the client from
--    the initial get_exam_questions() fetch, but roman_urdu_explanation
--    was masked during the live exam and only becomes available here,
--    exactly like explanation itself).
drop function if exists public.reveal_exam_answers(uuid);

create function public.reveal_exam_answers(p_session_id uuid)
returns table (
  id                      uuid,
  question_text           text,
  option_a                text,
  option_b                text,
  option_c                text,
  option_d                text,
  option_e                text,
  correct_answer          text,
  explanation             text,
  subject                 text,
  roman_urdu_question_text text,
  roman_urdu_option_a      text,
  roman_urdu_option_b      text,
  roman_urdu_option_c      text,
  roman_urdu_option_d      text,
  roman_urdu_option_e      text,
  roman_urdu_explanation   text
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
           q.correct_answer, q.explanation, q.subject,
           q.roman_urdu_question_text, q.roman_urdu_option_a, q.roman_urdu_option_b,
           q.roman_urdu_option_c, q.roman_urdu_option_d, q.roman_urdu_option_e,
           q.roman_urdu_explanation
    from public.questions q
    where q.id = any(v_session.question_ids);
end;
$$;

revoke all on function public.reveal_exam_answers(uuid) from public;
grant execute on function public.reveal_exam_answers(uuid) to authenticated;
