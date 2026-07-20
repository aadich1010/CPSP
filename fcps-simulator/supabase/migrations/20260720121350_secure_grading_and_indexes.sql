
-- ═══════════════════════════════════════════════════════════
-- 1. exam_sessions: server-issued start time + question set.
--    This is what makes the timer trustworthy — the client never
--    tells the server how much time is left; the server always
--    recomputes it from started_at.
-- ═══════════════════════════════════════════════════════════
create table if not exists public.exam_sessions (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references public.profiles(id) on delete cascade,
  subject            text        not null,
  mode               text        not null check (mode in ('exam', 'practice')),
  question_ids       uuid[]      not null,
  time_limit_seconds integer     not null check (time_limit_seconds > 0),
  started_at         timestamptz not null default now(),
  submitted          boolean     not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists exam_sessions_user_idx on public.exam_sessions(user_id);

alter table public.exam_sessions enable row level security;

drop policy if exists "Users can view own sessions" on public.exam_sessions;
create policy "Users can view own sessions"
  on public.exam_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own sessions" on public.exam_sessions;
create policy "Users can create own sessions"
  on public.exam_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Service role full access to sessions" on public.exam_sessions;
create policy "Service role full access to sessions"
  on public.exam_sessions
  using (auth.role() = 'service_role');


-- ═══════════════════════════════════════════════════════════
-- 2. LOCK DOWN exam_attempts — remove the policy that let the
--    client insert an arbitrary score. All writes now happen only
--    through submit_exam_attempt() below (SECURITY DEFINER).
-- ═══════════════════════════════════════════════════════════
drop policy if exists "Users can insert own attempts" on public.exam_attempts;
-- Intentionally NOT recreated. Only the RPC function and service_role
-- may write to this table now.

-- Optional but recommended: audit trail linking an attempt to its session,
-- and a late-submission flag for admin visibility.
alter table public.exam_attempts
  add column if not exists session_id uuid references public.exam_sessions(id),
  add column if not exists late_submission boolean not null default false;


-- ═══════════════════════════════════════════════════════════
-- 3. THE GRADING FUNCTION — this is the transaction boundary.
--    - Row-locks the session (FOR UPDATE) so a double-click or a
--      retried network request can't insert two attempts.
--    - Derives elapsed time from started_at vs now() -> server time,
--      never trusts anything the client sends about the clock.
--    - Fetches correct_answer/explanation server-side only, computes
--      the score itself. The client only ever sends raw answers.
--    - SECURITY DEFINER lets it read questions.correct_answer and
--      write exam_attempts despite RLS blocking the client directly.
-- ═══════════════════════════════════════════════════════════
create or replace function public.submit_exam_attempt(
  p_session_id uuid,
  p_answers    jsonb
)
returns table (score integer, total_questions integer, late_submission boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session       record;
  v_elapsed       integer;
  v_grace_seconds constant integer := 15; -- network/latency tolerance
  v_score         integer := 0;
  v_total         integer := 0;
  v_late          boolean := false;
  v_answer        text;
  v_qid           uuid;
  v_correct       text;
  v_idx           integer := 0;
begin
  -- Lock the session row for the duration of this transaction.
  select * into v_session
  from public.exam_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if v_session.user_id <> auth.uid() then
    raise exception 'FORBIDDEN';
  end if;

  if v_session.submitted then
    raise exception 'ALREADY_SUBMITTED';
  end if;

  -- Server time is the ONLY clock that counts.
  v_elapsed := extract(epoch from (now() - v_session.started_at))::integer;
  if v_elapsed > v_session.time_limit_seconds + v_grace_seconds then
    v_late := true; -- grade anyway, but flag it for review instead of
                     -- silently discarding a student's work on jitter
  end if;

  v_total := array_length(v_session.question_ids, 1);

  -- Compare each submitted answer against the true correct_answer,
  -- fetched server-side — the client payload never carries this.
  for v_idx in 0 .. v_total - 1 loop
    v_qid := v_session.question_ids[v_idx + 1];
    v_answer := p_answers ->> v_idx;

    select q.correct_answer into v_correct
    from public.questions q
    where q.id = v_qid;

    if v_answer is not null and v_answer = v_correct then
      v_score := v_score + 1;
    end if;
  end loop;

  insert into public.exam_attempts (
    user_id, subject, mode, score, total_questions, answers, session_id, late_submission
  ) values (
    v_session.user_id, v_session.subject, v_session.mode, v_score, v_total,
    p_answers, v_session.id, v_late
  );

  update public.exam_sessions set submitted = true where id = v_session.id;

  return query select v_score, v_total, v_late;
end;
$$;

revoke all on function public.submit_exam_attempt(uuid, jsonb) from public;
grant execute on function public.submit_exam_attempt(uuid, jsonb) to authenticated;


-- ═══════════════════════════════════════════════════════════
-- 4. MISSING INDEXES — /dashboard/recent sorts by created_at DESC
--    filtered on user_id; the existing single-column index on
--    user_id alone forces a sort step on every page load.
-- ═══════════════════════════════════════════════════════════
create index if not exists attempts_user_created_idx
  on public.exam_attempts (user_id, created_at desc);

create index if not exists sessions_user_created_idx
  on public.exam_sessions (user_id, created_at desc);

-- questions_subject_idx already exists and is correct — no change needed.
