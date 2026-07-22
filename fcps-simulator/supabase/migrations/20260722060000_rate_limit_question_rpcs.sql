-- ═══════════════════════════════════════════════════════════
-- GAP: get_exam_questions() and reveal_exam_answers() correctly check
-- subscription status and scope access, but neither has any per-user
-- throttle. Both are called via a Next.js server component today, but
-- they are plain Supabase RPCs -- any authenticated student (a real
-- paying one, or anyone holding a leaked/shared JWT) can call the
-- Supabase REST endpoint directly with a script and bypass the app
-- entirely:
--
--   for i in 1..500:
--     POST {SUPABASE_URL}/rest/v1/rpc/get_exam_questions
--       {"p_subject": "Anatomy", "p_count": 200, "p_mode": "practice"}
--
-- get_exam_questions in practice mode returns correct_answer +
-- explanation for every row, so this is a direct path to exfiltrating
-- the entire paid question bank -- the exact thing the product's
-- "Forensic Security" / "100% secure platform" marketing promises
-- protects against, and previous migrations (locking down the raw
-- questions table) were meant to close.
--
-- Fix: a small generic rate-limit helper backed by one table, applied
-- to both RPCs. Limits are deliberately generous for a real student
-- doing real practice (nobody legitimately calls this dozens of times
-- a minute), tight enough to make scripted bulk scraping impractical.
-- ═══════════════════════════════════════════════════════════

create table if not exists public.rpc_rate_limit_events (
  id         bigint      generated always as identity primary key,
  user_id    uuid        not null,
  bucket     text        not null,
  created_at timestamptz not null default now()
);

-- Supports the "count events for this user+bucket in the last N minutes"
-- query the helper below runs on every call.
create index if not exists rpc_rate_limit_events_lookup_idx
  on public.rpc_rate_limit_events (user_id, bucket, created_at);

alter table public.rpc_rate_limit_events enable row level security;

-- No client access at all -- only SECURITY DEFINER functions (via the
-- helper below) read or write this table.
create policy "Service role full access to rate limit events"
  on public.rpc_rate_limit_events
  using (auth.role() = 'service_role');

-- Best-effort cleanup so this table doesn't grow forever. Cheap enough
-- to run inline on the (comparatively rare) write path rather than
-- needing a cron job for a table this size.
create or replace function public.enforce_rpc_rate_limit(
  p_bucket      text,
  p_max_calls   integer,
  p_window      interval
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  delete from public.rpc_rate_limit_events
  where created_at < now() - interval '1 day';

  select count(*) into v_count
  from public.rpc_rate_limit_events
  where user_id = v_uid
    and bucket = p_bucket
    and created_at > now() - p_window;

  if v_count >= p_max_calls then
    raise exception 'RATE_LIMITED'
      using detail = format('Max %s calls per %s for %s', p_max_calls, p_window, p_bucket);
  end if;

  insert into public.rpc_rate_limit_events (user_id, bucket) values (v_uid, p_bucket);
end;
$$;

revoke all on function public.enforce_rpc_rate_limit(text, integer, interval) from public;
-- Intentionally not granted to `authenticated` -- only called internally
-- by the two functions below, which are themselves SECURITY DEFINER.

-- ── Apply to get_exam_questions(): 20 calls / 10 minutes ───────────
-- At p_count<=200 that's up to 4,000 question-rows/10min per user --
-- generous for someone genuinely practicing across several subjects
-- back-to-back, well below what a real study session needs, but low
-- enough that scripting past it to dump the whole bank takes hours
-- instead of minutes and is easy to spot in the audit/log trail.
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

  if v_role <> 'admin' then
    perform public.enforce_rpc_rate_limit('get_exam_questions', 20, interval '10 minutes');
  end if;

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

-- ── Apply to reveal_exam_answers(): 30 calls / 10 minutes ──────────
-- Scoped to sessions the caller owns and already submitted, so this is
-- lower-risk than get_exam_questions, but a student could still script
-- creating many sessions and revealing them just to farm answers
-- without actually sitting exams. Slightly higher limit since the
-- legitimate use case (reviewing an exam right after finishing it,
-- possibly re-opening the review screen) is more frequent per session.
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
  perform public.enforce_rpc_rate_limit('reveal_exam_answers', 30, interval '10 minutes');

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
