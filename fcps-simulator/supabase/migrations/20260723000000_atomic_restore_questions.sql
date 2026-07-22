-- ═══════════════════════════════════════════════════════════
-- GAP: restoreQuestions() in src/app/admin/questions/actions.ts deletes
-- every row in `questions`, then re-inserts the restored rows in
-- batches of 100 over separate network round-trips. Those are two (or
-- more) independent statements from Postgres's point of view -- if any
-- insert batch fails partway through (a constraint violation, a
-- dropped connection, Supabase hiccuping), the delete has already
-- committed and only some batches landed. Result: the entire paid
-- question bank is gone with no way back, because there was never a
-- single transaction covering the whole operation.
--
-- The application layer already added row-level validation before the
-- delete (see validateQuestion() in validate-question.ts), which closes
-- the "garbage data gets restored" gap. This closes the other one: the
-- delete and every insert now happen inside one PL/pgSQL function body,
-- which Postgres runs as a single implicit transaction. If anything
-- raises partway through -- a bad row, a duplicate question_text
-- violating the unique constraint, whatever -- the whole function
-- rolls back and the original question bank is untouched.
-- ═══════════════════════════════════════════════════════════

create or replace function public.restore_questions_bulk(p_questions jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role       text;
  v_count      integer;
  v_row        jsonb;
  v_answer     text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  if p_questions is null or jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'EMPTY_PAYLOAD';
  end if;

  -- Mirror validateQuestion()'s rules at the DB layer too. The Next.js
  -- action already validates before calling this function, but this
  -- function is the one thing standing between "restore" and
  -- "irreversibly empty question bank," so it doesn't only trust a
  -- caller that might change later -- it checks again itself.
  for v_row in select * from jsonb_array_elements(p_questions)
  loop
    if coalesce(trim(v_row->>'question_text'), '') = '' then
      raise exception 'INVALID_ROW: question_text is required (row: %)', v_row->>'question_text';
    end if;
    if coalesce(trim(v_row->>'option_a'), '') = ''
       or coalesce(trim(v_row->>'option_b'), '') = ''
       or coalesce(trim(v_row->>'option_c'), '') = ''
       or coalesce(trim(v_row->>'option_d'), '') = '' then
      raise exception 'INVALID_ROW: options A-D are all required (question: %)', v_row->>'question_text';
    end if;
    if coalesce(trim(v_row->>'subject'), '') = '' then
      raise exception 'INVALID_ROW: subject is required (question: %)', v_row->>'question_text';
    end if;

    v_answer := upper(trim(v_row->>'correct_answer'));
    if v_answer is null or v_answer not in ('A','B','C','D','E') then
      raise exception 'INVALID_ROW: correct_answer must be A-E (question: %)', v_row->>'question_text';
    end if;
    if v_answer = 'E' and coalesce(trim(v_row->>'option_e'), '') = '' then
      raise exception 'INVALID_ROW: correct_answer is E but option_e is empty (question: %)', v_row->>'question_text';
    end if;
  end loop;

  delete from public.questions;

  insert into public.questions
    (question_text, option_a, option_b, option_c, option_d, option_e,
     correct_answer, explanation, subject, difficulty)
  select
    x.question_text,
    x.option_a,
    x.option_b,
    x.option_c,
    x.option_d,
    x.option_e,
    upper(trim(x.correct_answer)),
    x.explanation,
    x.subject,
    coalesce(x.difficulty, 'Medium')
  from jsonb_to_recordset(p_questions) as x(
    question_text  text,
    option_a       text,
    option_b       text,
    option_c       text,
    option_d       text,
    option_e       text,
    correct_answer text,
    explanation    text,
    subject        text,
    difficulty     text
  );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Admin-only, called via the service-role client from
-- restoreQuestions() (already gated by requireAdmin() in the calling
-- server action) -- never exposed to the `authenticated` role.
revoke all on function public.restore_questions_bulk(jsonb) from public;
revoke all on function public.restore_questions_bulk(jsonb) from authenticated;
