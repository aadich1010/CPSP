-- The dashboard's "Practice by Subject" grid wants to show each subject's
-- total question-bank size, e.g. "Anatomy (1360)". Students can't just
-- `select subject from questions` for this -- the questions table has no
-- SELECT policy for the authenticated/anon roles at all (only admin
-- INSERT/UPDATE/DELETE and a service_role ALL policy), by design: exam
-- questions are only ever served through get_exam_questions(), never a
-- raw table read, so students can't browse the bank or see answers
-- outside an actual attempt. A SECURITY DEFINER counting function keeps
-- that boundary intact -- it exposes only subject + a count, never
-- question_text/correct_answer/explanation.
create or replace function public.get_subject_question_counts()
returns table (
  subject text,
  question_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select subject, count(*) as question_count
  from public.questions
  group by subject;
$$;

revoke all on function public.get_subject_question_counts() from public;
grant execute on function public.get_subject_question_counts() to authenticated, anon;
