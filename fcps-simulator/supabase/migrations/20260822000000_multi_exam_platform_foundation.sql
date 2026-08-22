-- 20260822000000_multi_exam_platform_foundation.sql
-- -----------------------------------------------------------------------------
-- Phase 1 of the multi-exam scale-out (FCPS -> FCPS + MCPS + MS/MD + MRCP-1 +
-- USMLE-1). Purely additive: no existing column is renamed or dropped, and
-- every new FK on exam_sessions/exam_attempts is nullable, so the live FCPS
-- flow (exam/setup -> exam/session -> submit_exam_attempt) keeps working
-- byte-for-byte unchanged until a session explicitly sets
-- exam_configuration_id. That wiring is a separate, later phase.
--
-- Config rows are versioned and never mutated in place (see the "Live Exam
-- Rules Overrider" note below) so a rule change never silently reinterprets
-- an attempt that was already scored under the old rules.

-- ============================================================
-- 1. exam_types -- master list of supported exams.
-- ============================================================
create table public.exam_types (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  display_name text not null,
  short_name   text not null,
  region       text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.exam_types enable row level security;

create policy "Anyone can read active exam types"
  on public.exam_types for select
  using (is_active = true);

create policy "Admins manage exam types"
  on public.exam_types for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.exam_types (slug, display_name, short_name, region) values
  ('fcps-part1',  'FCPS Part 1',    'FCPS-1',  'Pakistan'),
  ('mcps',        'MCPS',           'MCPS',    'Pakistan'),
  ('ms-md',       'MS / MD (JCAT)', 'JCAT',    'Pakistan'),
  ('mrcp-part1',  'MRCP Part 1',    'MRCP-1',  'UK'),
  ('usmle-step1', 'USMLE Step 1',   'USMLE-1', 'USA');

-- ============================================================
-- 2. exam_configurations -- versioned, admin-editable rule sets.
--    Exactly one is_live row per exam_type at any moment.
-- ============================================================
create table public.exam_configurations (
  id                      uuid primary key default gen_random_uuid(),
  exam_type_id            uuid not null references public.exam_types(id) on delete cascade,
  version                 int not null,
  is_live                 boolean not null default true,

  total_blocks            int not null check (total_blocks > 0),
  questions_per_block     int not null check (questions_per_block > 0),
  minutes_per_block       int not null check (minutes_per_block > 0),

  evaluation_logic        text not null check (evaluation_logic in ('sba', 'best_of_five', 'negative_marking')),
  negative_marking_weight numeric(4,2) not null default 0 check (negative_marking_weight >= 0),

  global_break_minutes    int not null default 0 check (global_break_minutes >= 0),
  break_trigger_mode      text not null default 'none'
                            check (break_trigger_mode in ('none', 'between_blocks_manual', 'fixed')),

  metadata                jsonb not null default '{}'::jsonb,
  created_by              uuid references public.profiles(id),
  created_at              timestamptz not null default now()
);

create unique index exam_configurations_one_live_per_exam
  on public.exam_configurations (exam_type_id)
  where is_live;

alter table public.exam_configurations enable row level security;

create policy "Anyone can read live exam configurations"
  on public.exam_configurations for select
  using (is_live = true);

create policy "Admins manage exam configurations"
  on public.exam_configurations for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed configs. MCPS is NOT part of any confirmed rule matrix at time of
-- writing -- seeded FCPS-shaped as a clearly-flagged placeholder (see
-- metadata below) and must be verified against the real CPSP MCPS format
-- before it is offered to real candidates.
insert into public.exam_configurations
  (exam_type_id, version, total_blocks, questions_per_block, minutes_per_block, evaluation_logic, negative_marking_weight, global_break_minutes, break_trigger_mode, metadata)
select id, 1, 2, 100, 120, 'sba', 0, 0, 'none', '{}'::jsonb
from public.exam_types where slug = 'fcps-part1';

insert into public.exam_configurations
  (exam_type_id, version, total_blocks, questions_per_block, minutes_per_block, evaluation_logic, negative_marking_weight, global_break_minutes, break_trigger_mode, metadata)
select id, 1, 2, 100, 120, 'sba', 0, 0, 'none', '{"unverified_placeholder": true, "note": "Confirm real CPSP MCPS block/timing rules before enabling for candidates."}'::jsonb
from public.exam_types where slug = 'mcps';

insert into public.exam_configurations
  (exam_type_id, version, total_blocks, questions_per_block, minutes_per_block, evaluation_logic, negative_marking_weight, global_break_minutes, break_trigger_mode, metadata)
select id, 1, 1, 100, 150, 'negative_marking', 0.5, 0, 'none', '{}'::jsonb
from public.exam_types where slug = 'ms-md';

insert into public.exam_configurations
  (exam_type_id, version, total_blocks, questions_per_block, minutes_per_block, evaluation_logic, negative_marking_weight, global_break_minutes, break_trigger_mode, metadata)
select id, 1, 2, 100, 180, 'best_of_five', 0, 0, 'none', '{}'::jsonb
from public.exam_types where slug = 'mrcp-part1';

insert into public.exam_configurations
  (exam_type_id, version, total_blocks, questions_per_block, minutes_per_block, evaluation_logic, negative_marking_weight, global_break_minutes, break_trigger_mode, metadata)
select id, 1, 14, 20, 30, 'sba', 0, 55, 'between_blocks_manual', '{}'::jsonb
from public.exam_types where slug = 'usmle-step1';

-- ============================================================
-- 3. profiles extension -- target exam + exam-specific metadata.
--    Shape of exam_metadata depends on target_exam_type_id:
--      fcps-part1 / mcps  -> {"specialty": "Surgery"}
--      ms-md              -> {"university": "UHS"}
--      mrcp-part1 / usmle -> {"target_country": "United Kingdom"}
-- ============================================================
alter table public.profiles
  add column target_exam_type_id uuid references public.exam_types(id),
  add column exam_metadata jsonb not null default '{}'::jsonb;

-- ============================================================
-- 4. question_exam_tags -- multi-exam tagging (one question can
--    belong to FCPS, MRCP, and USMLE simultaneously). Admin-only
--    at the RLS layer; candidates never query this table directly
--    -- a future get_exam_questions_for_exam() RPC (SECURITY
--    DEFINER, same pattern as get_exam_questions) is the only
--    intended read path once question tagging actually begins.
-- ============================================================
create table public.question_exam_tags (
  question_id  uuid not null references public.questions(id) on delete cascade,
  exam_type_id uuid not null references public.exam_types(id) on delete cascade,
  tagged_by    uuid references public.profiles(id),
  tagged_at    timestamptz not null default now(),
  primary key (question_id, exam_type_id)
);

create index question_exam_tags_exam_idx on public.question_exam_tags (exam_type_id);

alter table public.question_exam_tags enable row level security;

create policy "Admins manage question exam tags"
  on public.question_exam_tags for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 5. exam_sessions / exam_attempts extension.
--    Nullable on purpose: a NULL exam_configuration_id means "legacy
--    FCPS session, pre-multi-exam" and submit_exam_attempt() below
--    treats that exactly as it always has (raw score, no negative
--    marking) -- zero behavior change for any attempt already in
--    flight or already scored.
-- ============================================================
alter table public.exam_sessions
  add column exam_configuration_id uuid references public.exam_configurations(id);

alter table public.exam_attempts
  add column exam_configuration_id uuid references public.exam_configurations(id),
  add column final_score numeric(6,2);

comment on column public.exam_attempts.final_score is
  'Only set when the linked exam_configuration used negative marking (e.g. MS/MD, -0.5/wrong). NULL means "read score instead" -- exactly the pre-multi-exam behavior for every FCPS attempt.';

-- ============================================================
-- 6. admin_audit_log -- widen the allowed action set for the two
--    new admin actions introduced by this phase (question tagging,
--    exam rules overrides). Existing actions untouched.
-- ============================================================
alter table public.admin_audit_log drop constraint admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check
  check (action = any (array[
    'activate', 'revoke', 'delete_user', 'block', 'unblock', 'password_reset',
    'exam_rules_override', 'question_exam_tag_update'
  ]));

-- ============================================================
-- 7. submit_exam_attempt -- extended to apply negative marking when
--    the session carries a negative_marking exam_configuration.
--    Return type changes (final_score added), so this must be
--    DROP + CREATE, not CREATE OR REPLACE (see the 42P13 gotcha
--    from earlier migrations in this project -- Postgres refuses to
--    change an existing function's return row type in place).
--    The scoring loop and every existing code path for a session
--    with exam_configuration_id IS NULL is byte-for-byte identical
--    to the previous version of this function.
-- ============================================================
drop function if exists public.submit_exam_attempt(uuid, jsonb);

create function public.submit_exam_attempt(p_session_id uuid, p_answers jsonb)
returns table(score integer, total_questions integer, late_submission boolean, final_score numeric)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_session       record;
  v_role          text;
  v_status        text;
  v_expires       timestamptz;
  v_elapsed       integer;
  v_grace_seconds constant integer := 15;
  v_score         integer := 0;
  v_incorrect     integer := 0;
  v_total         integer := 0;
  v_late          boolean := false;
  v_answer        text;
  v_qid           uuid;
  v_correct       text;
  v_idx           integer := 0;
  v_eval_logic    text;
  v_neg_weight    numeric;
  v_final_score   numeric;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  perform public.enforce_rpc_rate_limit('submit_exam_attempt', 10, interval '10 minutes');

  select * into v_session
  from public.exam_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if v_session.user_id is distinct from auth.uid() then
    raise exception 'FORBIDDEN';
  end if;

  if v_session.submitted then
    raise exception 'ALREADY_SUBMITTED';
  end if;

  select role, subscription_status, subscription_expires_at
    into v_role, v_status, v_expires
  from public.profiles
  where id = auth.uid();

  if v_role is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if v_role <> 'admin'
     and (v_status not in ('active', 'demo') or (v_expires is not null and v_expires <= now())) then
    raise exception 'SUBSCRIPTION_INACTIVE';
  end if;

  v_elapsed := extract(epoch from (now() - v_session.started_at))::integer;
  if v_elapsed > v_session.time_limit_seconds + v_grace_seconds then
    v_late := true;
  end if;

  v_total := array_length(v_session.question_ids, 1);

  for v_idx in 0 .. v_total - 1 loop
    v_qid := v_session.question_ids[v_idx + 1];

    v_answer := coalesce(p_answers ->> v_qid::text, p_answers ->> v_idx);

    select q.correct_answer into v_correct
    from public.questions q
    where q.id = v_qid;

    if v_answer is not null and v_answer = v_correct then
      v_score := v_score + 1;
    elsif v_answer is not null then
      -- Answered but wrong -- only matters for negative-marking exams
      -- (MS/MD today); harmless to count unconditionally for every
      -- other exam since v_neg_weight is 0 for them below.
      v_incorrect := v_incorrect + 1;
    end if;
  end loop;

  -- Negative marking only applies when this session is explicitly linked
  -- to a negative_marking config. A legacy/FCPS session with no
  -- exam_configuration_id gets v_final_score = NULL, exactly as before
  -- this migration -- dashboards/history keep reading `score` untouched.
  if v_session.exam_configuration_id is not null then
    select ec.evaluation_logic, ec.negative_marking_weight
      into v_eval_logic, v_neg_weight
    from public.exam_configurations ec
    where ec.id = v_session.exam_configuration_id;

    if v_eval_logic = 'negative_marking' then
      v_final_score := greatest(0, v_score - (v_incorrect * v_neg_weight));
    end if;
  end if;

  insert into public.exam_attempts (
    user_id, subject, mode, score, total_questions, answers, session_id, late_submission,
    exam_configuration_id, final_score
  ) values (
    v_session.user_id, v_session.subject, v_session.mode, v_score, v_total,
    p_answers, v_session.id, v_late,
    v_session.exam_configuration_id, v_final_score
  );

  update public.exam_sessions set submitted = true where id = v_session.id;

  return query select v_score, v_total, v_late, v_final_score;
end;
$function$;
