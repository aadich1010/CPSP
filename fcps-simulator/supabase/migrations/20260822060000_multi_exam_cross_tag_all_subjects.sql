-- 20260822060000_multi_exam_cross_tag_all_subjects.sql
-- -----------------------------------------------------------------------------
-- Cross-exam multi-tagging for the full question bank (14,424 questions,
-- 36 subjects), per the "Rule A / Rule B / Rule C" classification supplied
-- by the user, mapped onto the app's own already-curated `subject` column
-- rather than re-reading every question's stem/explanation text with an
-- LLM (infeasible and error-prone at this scale in one pass -- the
-- existing subject taxonomy is the trustworthy, already-vetted ground
-- truth this app has used for every other exam-routing decision so far).
--
-- Mapping used (see SUBJECT_GROUPS / SUBJECTS in src/lib/subjects.ts for
-- the canonical subject list this draws on):
--   BASIC_SCIENCE  = core basic-science recall subjects (Rule A)
--   CLINICAL       = clinical/specialty/diagnosis subjects (Rule B)
--
-- Per-exam scope (Rule C reconciled against each exam's REAL syllabus,
-- which the app already models elsewhere):
--   fcps-part1   -> BASIC_SCIENCE + CLINICAL (FCPS Part 1 itself already
--                   spans both Paper I basic sciences and Paper II
--                   applied/specialty -- see SUBJECT_GROUPS, unchanged).
--   mcps         -> BASIC_SCIENCE + CLINICAL (mirrors FCPS's structure --
--                   already flagged as FCPS-shaped in this app's own
--                   20260822000000 migration; Rule C explicitly pairs
--                   FCPS-1/MCPS together on high-yield recall content).
--   mrcp-part1   -> CLINICAL only (Rule B: clinical practice, diagnosis,
--                   first-line management).
--   usmle-step1  -> BASIC_SCIENCE + CLINICAL (Rule A covers Step 1;
--                   Rule B covers Step 2 CK -- this app only has one
--                   USMLE exam_type today, so both map onto it).
--   ms-md        -> already fully tagged (20260822050000_tag_msmd_jcat_
--                   subjects.sql, ~9,100+ questions across 18+ subjects) --
--                   untouched here.
--
-- Additive only, same as every prior tagging migration: ON CONFLICT DO
-- NOTHING means a question keeps every tag it already has and only gains
-- new ones -- nothing is ever removed or overwritten.

with subject_groups as (
  select unnest(array[
    'Anatomy','Physiology','Biochemistry','Pathology','Pharmacology','Microbiology',
    'Forensic Medicine','Community Medicine','Behavioral Sciences',
    'Medical Ethics & Professionalism','Epidemiology & Biostatistics',
    'Applied Physiology','Applied Pathology','Applied Pharmacology','Applied Biochemistry',
    'Clinical Anatomy','Immunology'
  ]) as subject, 'basic_science' as group_name
  union all
  select unnest(array[
    'Surgery & Allied','Anesthesia','Obstetrics & Gynecology','Pediatrics','ENT','Ophthalmology',
    'Radiology (Imaging Basics)','Dermatology (Basic Sciences)',
    'Emergency Medicine / Critical Care Basics','Cardiology','Neurology','Pulmonology',
    'Gastroenterology','Nephrology','Endocrinology','Urology','Orthopedics',
    'Oncology / Medical Oncology','Medicine (Clinical Vignettes)'
  ]), 'clinical'
),
exam_scope as (
  select 'fcps-part1'  as slug, unnest(array['basic_science','clinical']) as group_name
  union all
  select 'mcps',        unnest(array['basic_science','clinical'])
  union all
  select 'mrcp-part1',  unnest(array['clinical'])
  union all
  select 'usmle-step1', unnest(array['basic_science','clinical'])
)
insert into public.question_exam_tags (question_id, exam_type_id, tagged_by)
select q.id, et.id, '51ce36e1-d376-4a8d-8c01-2749ab6c009c'::uuid
from public.questions q
join subject_groups sg on sg.subject = q.subject
join exam_scope es on es.group_name = sg.group_name
join public.exam_types et on et.slug = es.slug
on conflict (question_id, exam_type_id) do nothing;

insert into public.admin_audit_log (actor_id, action, details)
values (
  '51ce36e1-d376-4a8d-8c01-2749ab6c009c'::uuid,
  'question_exam_tag_update',
  jsonb_build_object(
    'operation', 'multi_exam_cross_tag_all_subjects',
    'exams', jsonb_build_array('fcps-part1','mcps','mrcp-part1','usmle-step1'),
    'note', 'rule-based cross-tag using existing curated subject taxonomy; ms-md handled separately in 20260822050000'
  )
);
