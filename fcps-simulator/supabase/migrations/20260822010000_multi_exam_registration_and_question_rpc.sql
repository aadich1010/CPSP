-- 20260822010000_multi_exam_registration_and_question_rpc.sql
-- -----------------------------------------------------------------------------
-- Phase 2, database half: capture the candidate's target exam at signup
-- (via the existing handle_new_user() trigger, same pattern already used for
-- phone/pmdc_number/medical_college) and add the multi-exam equivalent of
-- get_exam_questions() for exams that draw from question_exam_tags instead
-- of the subject/subject_list system FCPS uses.
--
-- Purely additive: registrations that don't send target_exam_slug (old
-- cached client bundle, direct API call, etc.) behave exactly as before --
-- target_exam_type_id stays null, exam_metadata stays '{}'.

-- ============================================================
-- 1. handle_new_user() -- same return type (trigger), so CREATE OR
--    REPLACE is safe here (unlike submit_exam_attempt in the previous
--    migration, which changed its RETURNS TABLE shape).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_exam_slug     text := nullif(new.raw_user_meta_data->>'target_exam_slug', '');
  v_exam_type_id  uuid;
  v_exam_metadata jsonb := '{}'::jsonb;
begin
  if v_exam_slug is not null then
    select id into v_exam_type_id
    from public.exam_types
    where slug = v_exam_slug and is_active = true;
  end if;

  if nullif(new.raw_user_meta_data->>'specialty', '') is not null then
    v_exam_metadata := v_exam_metadata || jsonb_build_object('specialty', new.raw_user_meta_data->>'specialty');
  end if;
  if nullif(new.raw_user_meta_data->>'university', '') is not null then
    v_exam_metadata := v_exam_metadata || jsonb_build_object('university', new.raw_user_meta_data->>'university');
  end if;
  if nullif(new.raw_user_meta_data->>'target_country', '') is not null then
    v_exam_metadata := v_exam_metadata || jsonb_build_object('target_country', new.raw_user_meta_data->>'target_country');
  end if;

  insert into public.profiles (
    id, email, full_name, phone, pmdc_number, medical_college,
    role, subscription_status, subscription_expires_at,
    target_exam_type_id, exam_metadata
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
    now() + interval '7 days',
    v_exam_type_id,
    v_exam_metadata
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- ============================================================
-- 2. get_exam_questions_for_exam -- the multi-exam-tag equivalent of
--    get_exam_questions(). Deliberately simpler than the FCPS RPC: no
--    subject/subject_list system, no Paper II allow-list gate, no
--    easy/medium/hard fixed-vs-random split -- those are FCPS-specific
--    concepts that don't apply to a generic "draw N questions tagged
--    for this exam" pool. Demo-account gating (10-question cap, 3
--    lifetime attempts) IS preserved since it's a platform-wide rule,
--    not an FCPS-specific one.
-- ============================================================
create function public.get_exam_questions_for_exam(
  p_exam_slug text,
  p_count integer,
  p_mode text
)
returns table(id uuid, question_text text, option_a text, option_b text, option_c text, option_d text, option_e text, correct_answer text, explanation text, subject text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_role     text;
  v_status   text;
  v_expires  timestamptz;
  v_count    integer;
  v_attempts integer;
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
    perform public.enforce_rpc_rate_limit('get_exam_questions_for_exam', 20, interval '10 minutes');
  end if;

  v_count := least(greatest(coalesce(p_count, 50), 1), 200);
  if v_role <> 'admin' and v_status <> 'active' then
    v_count := least(v_count, 10);
  end if;

  return query
  select q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
         case when p_mode = 'practice' then q.correct_answer else null end,
         case when p_mode = 'practice' then q.explanation    else null end,
         q.subject
  from public.questions q
  join public.question_exam_tags qet on qet.question_id = q.id
  join public.exam_types et on et.id = qet.exam_type_id
  where et.slug = p_exam_slug
  order by random()
  limit v_count;
end;
$function$;
