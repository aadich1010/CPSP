-- The analytics screen's "By Difficulty" tab was rendering a hard-coded
-- array (Easy 88 / Medium 65 / Hard 41) to every student regardless of
-- their actual results -- leftover mock data that was never replaced with
-- a real computation. This aggregates the student's own answers against
-- the difficulty tag on each question they were served.
--
-- Every column reference is table-qualified and no bare `difficulty`,
-- `correct` or `total` appears in the body, since those names are in
-- scope as RETURNS TABLE columns and would otherwise raise 42702.

create or replace function public.get_difficulty_breakdown()
returns table (
  difficulty text,
  correct    integer,
  total      integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  return query
  with per_q as (
    select
      coalesce(nullif(initcap(trim(q.difficulty)), ''), 'Medium') as diff,
      case
        when (a.answers ->> (idx - 1)) is null then 0
        when (a.answers ->> (idx - 1)) = q.correct_answer then 1
        else 0
      end as is_correct
    from public.exam_attempts a
    join public.exam_sessions s on s.id = a.session_id
    cross join lateral generate_subscripts(s.question_ids, 1) as idx
    join public.questions q on q.id = s.question_ids[idx]
    where a.user_id = auth.uid()
  )
  select
    per_q.diff,
    sum(per_q.is_correct)::integer,
    count(*)::integer
  from per_q
  group by per_q.diff;
end;
$$;

revoke all on function public.get_difficulty_breakdown() from public;
grant execute on function public.get_difficulty_breakdown() to authenticated;
