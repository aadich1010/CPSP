-- 20260822040000_get_exam_questions_for_exam_optional_subject.sql
-- -----------------------------------------------------------------------------
-- Adds an optional p_subject filter to get_exam_questions_for_exam so the
-- MS/MD (JCAT) dashboard's per-category subject pills (Basic Sciences /
-- Medicine & Allied / Surgery & Allied) can draw a subject-scoped practice
-- set from question_exam_tags instead of only ever pulling the full mixed
-- pool. Backward compatible: p_subject defaults to null, and every
-- existing 3-arg call site (the full-exam "Begin Exam" flow) is completely
-- unaffected -- null just means "no subject filter", exactly today's
-- behaviour. CREATE OR REPLACE is safe here since the return row shape is
-- unchanged, only a new trailing default parameter is added.

create or replace function public.get_exam_questions_for_exam(
  p_exam_slug text,
  p_count integer,
  p_mode text,
  p_subject text default null
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
    and (p_subject is null or q.subject = p_subject)
  order by random()
  limit v_count;
end;
$function$;
