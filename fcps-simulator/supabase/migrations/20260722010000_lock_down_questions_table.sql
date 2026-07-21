-- ═══════════════════════════════════════════════════════════
-- FIX: "questions" table currently has:
--
--   create policy "Authenticated users can read questions"
--     on public.questions for select
--     using (auth.role() = 'authenticated');
--
-- This lets ANY signed-up user (including unpaid / subscription_status =
-- 'pending' accounts) hit the Supabase REST API directly --
-- GET {SUPABASE_URL}/rest/v1/questions?select=*  -- and pull the entire
-- question bank INCLUDING correct_answer and explanation, completely
-- bypassing the app, the middleware subscription gate, and the
-- submit_exam_attempt() grading RPC. It doesn't matter that
-- exam/session/page.tsx is careful to only request non-answer columns --
-- RLS operates at the database layer, not the app layer, so a direct
-- API call (curl, Postman, browser devtools) with any authenticated
-- user's JWT gets everything.
--
-- This migration:
--   1. Removes direct client SELECT access to public.questions entirely.
--   2. Adds a SECURITY DEFINER RPC that is the ONLY way an authenticated
--      user can fetch questions. It checks subscription_status = 'active'
--      (or admin), validates inputs, and picks a random subset
--      server-side -- so a single call can never dump the whole bank,
--      and an unpaid account gets nothing.
-- ═══════════════════════════════════════════════════════════

-- ── 1. Remove the policy that exposes the raw table ────────────
drop policy if exists "Authenticated users can read questions" on public.questions;
-- Admin insert/update/delete policies and the service_role policy are
-- untouched -- admin panel already uses createAdminClient() (service role)
-- for all question-bank management, so this does not affect /admin/questions.

-- Belt-and-braces: explicitly revoke table-level SELECT grants too, so
-- there is no path back to raw access even if a future policy is added
-- carelessly. Access must go through the RPC below.
revoke select on public.questions from authenticated;
revoke select on public.questions from anon;


-- ── 2. Gated, server-side question fetch ────────────────────────
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

  if v_role <> 'admin' and v_status <> 'active' then
    raise exception 'SUBSCRIPTION_INACTIVE';
  end if;

  if p_mode not in ('exam', 'practice') then
    raise exception 'INVALID_MODE';
  end if;

  -- Same clamp the app already applies client-side (1-200); enforced
  -- again here so the RPC can't be called directly with an unbounded count.
  v_count := least(greatest(coalesce(p_count, 50), 1), 200);

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


-- ── 3. Post-grading answer reveal ────────────────────────────────
-- ExamEngine.tsx re-fetches full question rows (with correct_answer +
-- explanation) right after submit_exam_attempt() succeeds, to show the
-- review screen. That query also hit the raw table directly, so it
-- needs the same treatment -- but scoped to ONE session the caller
-- owns and that is already marked submitted, not "any ids you ask for".
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
  select * into v_session
  from public.exam_sessions
  where id = p_session_id;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if v_session.user_id <> auth.uid() then
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
