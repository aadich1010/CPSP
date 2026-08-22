-- FEATURE: Per-student Paper II subject access.
--
-- Until now, activating a subscription (activateSubscription() in
-- src/app/admin/user-actions.ts) always unlocked every subject in the bank --
-- there was no way to hand a student access to only a subset of Paper II
-- (Applied & Specialty) subjects. Requested behaviour: activating a
-- subscription still shows every subject to the student (nothing changes
-- there -- see dashboard/page.tsx and exam/setup/page.tsx, both of which
-- always render the full SUBJECT_GROUPS list), but the admin can now
-- separately restrict which Paper II subjects a given student may actually
-- *enter an exam in*. Paper I -- Basic Sciences and Clinical Practice are
-- deliberately NOT gated by this -- only Paper II, per the feature request.
--
-- profiles.allowed_subjects text[] DEFAULT NULL:
--   NULL            -- unrestricted (default). Every Paper II subject is
--                       accessible, identical to today's behaviour. This is
--                       what a freshly-activated subscription has -- see
--                       activateSubscription(), which never touches this
--                       column, so "turn on a subscription" and "grant every
--                       subject" stay the same action unless the admin
--                       separately narrows it down.
--   '{}'::text[]    -- explicitly zero Paper II subjects allowed.
--   '{X,Y}'::text[] -- only subjects X and Y (must be Paper II members;
--                       anything outside that group is simply ignored by the
--                       gate below, since Paper I / Clinical Practice were
--                       never restricted in the first place).
--
-- Enforced the same way subscription status already is: server-side inside
-- get_exam_questions() (SECURITY DEFINER, the only path that ever returns
-- real question rows -- see 20260722010000_lock_down_questions_table.sql
-- and 20260811250000_mixed_paper_exam_subject_list.sql). The admin UI /
-- exam setup wizard also hide/disable locked subjects for a clean UX, but
-- that's a courtesy layer, not the security boundary -- same "deny by
-- default, enforce at the trust boundary" rule as everywhere else in this
-- schema (see lib/subscription.ts's header comment on the client side).

alter table public.profiles
  add column if not exists allowed_subjects text[] default null;

comment on column public.profiles.allowed_subjects is
  'NULL = every Paper II subject accessible (default). Non-null = only these Paper II subjects may be practiced/examined; Paper I and Clinical Practice are never restricted by this column.';

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
  v_status          text;
  v_role            text;
  v_expires         timestamptz;
  v_allowed_subjects text[];
  v_count           integer;
  v_easy            integer;
  v_medium          integer;
  v_hard            integer;
  v_fixed           boolean;
  v_attempts        integer;
  v_use_list        boolean;
  -- Kept in sync by hand with the "Paper II — Applied & Specialty" group in
  -- src/lib/subjects.ts (SUBJECT_GROUPS[1].subjects). Only subjects in this
  -- list are ever gated by allowed_subjects -- see column comment above.
  v_paper2_subjects constant text[] := array[
    'Surgery & Allied', 'Anesthesia', 'Applied Physiology', 'Applied Pathology',
    'Applied Pharmacology', 'Applied Biochemistry', 'Clinical Anatomy',
    'Obstetrics & Gynecology', 'Pediatrics', 'ENT', 'Ophthalmology', 'Immunology',
    'Radiology (Imaging Basics)', 'Dermatology (Basic Sciences)',
    'Emergency Medicine / Critical Care Basics', 'Cardiology', 'Neurology',
    'Pulmonology', 'Gastroenterology', 'Nephrology', 'Endocrinology', 'Urology',
    'Orthopedics', 'Oncology / Medical Oncology'
  ];
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select p.role, p.subscription_status, p.subscription_expires_at, p.allowed_subjects
    into v_role, v_status, v_expires, v_allowed_subjects
  from public.profiles p
  where p.id = auth.uid();

  if v_role is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if v_role <> 'admin'
     and (v_status not in ('active', 'demo') or (v_expires is not null and v_expires <= now())) then
    raise exception 'SUBSCRIPTION_INACTIVE';
  end if;

  -- Admins and demo accounts are never subject-gated -- admins always have
  -- full access, and demo already gets every subject (see 20260805000000
  -- migration) with its own 10-question/3-attempt limits doing the real
  -- restricting there.
  if v_role = 'admin' or v_status = 'demo' then
    v_allowed_subjects := null;
  end if;

  -- Demo accounts get exactly 3 completed attempts, lifetime.
  if v_role <> 'admin' and v_status = 'demo' then
    select count(*) into v_attempts
    from public.exam_attempts a
    where a.user_id = auth.uid();

    if v_attempts >= 3 then
      raise exception 'DEMO_ATTEMPTS_EXHAUSTED';
    end if;
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

  -- Fixed (non-random) draw for everyone except active subscribers
  -- and admins -- keeps the demo trial's question set identical on
  -- every attempt instead of reshuffling.
  v_fixed := v_role <> 'admin' and v_status <> 'active';

  v_easy   := floor(v_count * 0.4)::integer;
  v_medium := floor(v_count * 0.4)::integer;
  v_hard   := v_count - v_easy - v_medium;

  v_use_list := p_subject_list is not null and cardinality(p_subject_list) > 0;

  if v_fixed then
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
      -- Paper II gate: a Paper II subject not on the student's allow-list is
      -- excluded from the pool entirely, whichever of the two branches above
      -- selected it. Non-Paper-II subjects (Paper I, Clinical Practice) are
      -- untouched, and an unrestricted student (v_allowed_subjects is null)
      -- is untouched too.
      and (
        v_allowed_subjects is null
        or not (q.subject = any(v_paper2_subjects))
        or q.subject = any(v_allowed_subjects)
      )
    ),
    picked as (
      (select pl.qid from pool pl where pl.diff = 'easy'   order by pl.qid limit v_easy)
      union all
      (select pl.qid from pool pl where pl.diff = 'medium' order by pl.qid limit v_medium)
      union all
      (select pl.qid from pool pl where pl.diff = 'hard'   order by pl.qid limit v_hard)
    ),
    filled as (
      select pk.qid from picked pk
      union
      (select pl.qid
       from pool pl
       where pl.qid not in (select pk2.qid from picked pk2)
       order by pl.qid
       limit greatest(v_count - (select count(*) from picked), 0))
    )
    select q2.id, q2.question_text, q2.option_a, q2.option_b, q2.option_c, q2.option_d, q2.option_e,
           case when p_mode = 'practice' then q2.correct_answer else null end,
           case when p_mode = 'practice' then q2.explanation    else null end,
           q2.subject
    from public.questions q2
    join filled f on f.qid = q2.id
    order by q2.id
    limit v_count;
  else
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
      and (
        v_allowed_subjects is null
        or not (q.subject = any(v_paper2_subjects))
        or q.subject = any(v_allowed_subjects)
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
  end if;
end;
$$;

revoke all on function public.get_exam_questions(text, integer, text, text[]) from public;
grant execute on function public.get_exam_questions(text, integer, text, text[]) to authenticated;

-- Admin-only write access to allowed_subjects.
--
-- "Users can update own profile" (see 20260722050000_lock_down_profile_
-- self_update.sql) freezes role/subscription_status/subscription_expires_at
-- on a self-update via its `with check`, but is a DENY-LIST -- any column
-- not named there (including this brand-new one) is left writable by the
-- row's own owner through the general `using (auth.uid() = id)` clause.
-- That migration's own comment already walks through why this matters: the
-- anon key + a logged-in student's session JWT are client-visible, so an
-- unlisted privileged column is a straight self-escalation path via
-- `supabase.from('profiles').update({ allowed_subjects: [...] }).eq('id', myId)`
-- from devtools, no server code involved. Extending the same `with check`
-- to cover allowed_subjects closes that off, exactly like role/status/expires.
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and subscription_status = (select p.subscription_status from public.profiles p where p.id = auth.uid())
    and subscription_expires_at is not distinct from
      (select p.subscription_expires_at from public.profiles p where p.id = auth.uid())
    and allowed_subjects is not distinct from
      (select p.allowed_subjects from public.profiles p where p.id = auth.uid())
  );

-- In practice the admin-side write (setAllowedSubjects() in
-- src/app/admin/user-actions.ts) goes through createAdminClient()
-- (service_role, bypasses RLS entirely) anyway, same as every other admin
-- mutation in that file -- the policy above is defense-in-depth, not the
-- only thing standing between a student and this column.
