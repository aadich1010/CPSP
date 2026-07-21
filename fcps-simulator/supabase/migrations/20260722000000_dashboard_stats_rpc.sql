-- ═══════════════════════════════════════════════════════════
-- Dashboard was pulling a user's ENTIRE exam_attempts history on
-- every page load (no limit), then reducing it in JS just to get
-- an average score and a per-subject breakdown. Fine today, but it
-- scales linearly with how many exams a student has ever taken —
-- a heavy user months in gets a slower dashboard on every visit.
--
-- This RPC does the aggregation in Postgres (GROUP BY subject) and
-- returns only the small summarized result. SECURITY INVOKER (the
-- default) is correct here — it should run as the calling user so
-- the existing "Users can view own attempts" RLS policy still
-- applies; this is not a privilege-bypass function.
-- ═══════════════════════════════════════════════════════════
create or replace function public.get_user_dashboard_stats(p_user_id uuid)
returns table (
  subject          text,
  total_questions  bigint,
  total_correct    bigint,
  attempt_count    bigint
)
language sql
stable
as $$
  select
    subject,
    sum(total_questions) as total_questions,
    sum(score)            as total_correct,
    count(*)               as attempt_count
  from public.exam_attempts
  where user_id = p_user_id
  group by subject;
$$;

revoke all on function public.get_user_dashboard_stats(uuid) from public;
grant execute on function public.get_user_dashboard_stats(uuid) to authenticated;

-- Total attempt count is cheap via a plain count query already covered
-- by attempts_user_created_idx; the per-subject breakdown was the part
-- that meant fetching every row.
