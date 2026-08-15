-- ═══════════════════════════════════════════════════════════
-- FEATURE: turn the demo trial into what the marketing site now
-- promises -- "7 DAYS FREE, FULL ACCESS, no card required" -- instead
-- of the old 3-day / 10-questions-per-exam / 3-attempts-lifetime / fixed
-- (non-random) question set trial.
--
-- Two real bugs found while wiring this up, both fixed here:
--
--   1. handle_new_user() was silently reset to NOT set
--      subscription_expires_at back in
--      20260812260000_add_registration_fields_and_blocking.sql (that
--      migration rebuilt the function to add phone/pmdc_number/
--      medical_college and dropped the expiry assignment in the
--      process). subscription_expires_at has no column default, so
--      every signup since then got expires_at = NULL, which
--      get_exam_questions() and the exam_sessions policy both treat as
--      "never expires". The 3-day trial documented in
--      subscription-expired/page.tsx's copy hasn't actually been
--      enforced by time since that migration landed -- only the
--      3-attempts cap was doing anything. Rebuilding handle_new_user()
--      here from that same later version, this time setting expiry to
--      7 days.
--
--   2. Two separate demo-only restrictions boxed the trial in well
--      below "full access": get_exam_questions() hard-capped demo at
--      10 questions per exam regardless of what was requested, and
--      forced a fixed/non-random (same set, same order, every time)
--      draw instead of the real shuffled experience active subscribers
--      get. Both removed below -- demo now draws exactly like an
--      active subscription for the 7 days it's valid.
--
-- The 3-completed-attempts lifetime cap is also removed (both here in
-- get_exam_questions() and in the exam_sessions insert policy, the real
-- trust boundary for it) -- the trial is now bounded by TIME only (7
-- days), matching "full access" rather than being additionally
-- rationed by attempt count. A demo account can take as many mock exams
-- as it wants during its 7 days.
--
-- Rebuilt against the actual latest live shape of both objects:
-- get_exam_questions() from 20260811250000_mixed_paper_exam_subject_
-- list.sql (the 4-arg version with p_subject_list) and the
-- exam_sessions insert policy from 20260805010000_demo_3_attempts_and_
-- no_option_shuffle.sql. Everything not called out above (rate
-- limiting, practice-mode answer/explanation masking in exam mode,
-- difficulty stratification, admin bypass, subject-list scoping) is
-- preserved unchanged.
-- ═══════════════════════════════════════════════════════════

-- ── 1. New signups get a real 7-day expiry again ──────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, email, full_name, phone, pmdc_number, medical_college,
    role, subscription_status, subscription_expires_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'pmdc_number', ''),
    nullif(new.raw_user_meta_data->>'medical_college', ''),
    'student',
    'demo',
    now() + interval '7 days'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── 2. Backfill: demo accounts currently sitting at expires_at = NULL
--       (i.e. every demo signup since 20260812260000 landed, which is
--       currently ALL of them, per bug #1 above) get a fresh 7 days
--       from right now instead of inheriting a 3-day window that was
--       never actually enforced. Accounts that already have a real
--       expiry on file (set before that bug, or manually by an admin)
--       are left untouched.
update public.profiles
set subscription_expires_at = now() + interval '7 days'
where subscription_status = 'demo'
  and subscription_expires_at is null;

-- ── 3. get_exam_questions(): drop the 3-attempts cap, the 10-question
--       cap, and the fixed/non-random draw for demo -- it now behaves
--       exactly like an active subscription for the 7 days it's valid.
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

  -- Demo now gets the same requested count (up to the normal 1-200
  -- clamp) as an active subscription -- "full access" during the 7
  -- days, not a 10-question teaser.
  v_count := least(greatest(coalesce(p_count, 50), 1), 200);

  v_easy   := floor(v_count * 0.4)::integer;
  v_medium := floor(v_count * 0.4)::integer;
  v_hard   := v_count - v_easy - v_medium;

  v_use_list := p_subject_list is not null and cardinality(p_subject_list) > 0;

  -- Real shuffled draw for everyone (demo included) -- no more fixed/
  -- deterministic ordering carve-out.
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
end;
$$;

revoke all on function public.get_exam_questions(text, integer, text, text[]) from public;
grant execute on function public.get_exam_questions(text, integer, text, text[]) to authenticated;

-- ── 4. exam_sessions insert policy: drop the attempt-count check for
--       demo -- expiry (7 days) is now the only gate, same predicate
--       shape as an active subscription.
drop policy if exists "Users can create own sessions" on public.exam_sessions;
create policy "Users can create own sessions"
  on public.exam_sessions for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and (
          p.role = 'admin'
          or (
            p.subscription_status in ('active', 'demo')
            and (p.subscription_expires_at is null or p.subscription_expires_at > now())
          )
        )
    )
  );
