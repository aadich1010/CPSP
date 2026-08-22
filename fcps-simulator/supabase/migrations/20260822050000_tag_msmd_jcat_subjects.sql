-- 20260822050000_tag_msmd_jcat_subjects.sql
-- -----------------------------------------------------------------------------
-- Bulk-tags every existing question whose `subject` matches one of the
-- MS/MD (JCAT) dashboard's category subjects (Basic Sciences / Medicine &
-- Allied / Surgery & Allied -- see JCAT_CATEGORIES in
-- src/app/dashboard/page.tsx) to the 'ms-md' exam type via
-- question_exam_tags. Purely additive: a question already tagged to
-- FCPS/MRCP/USMLE keeps that tag AND gains this one -- question_exam_tags
-- has always supported one question belonging to multiple exams at once
-- (see its own doc comment in 20260822000000_multi_exam_platform_
-- foundation.sql), so the same shared question bank now serves both FCPS
-- and MS/MD candidates simultaneously with zero content duplication.
-- ON CONFLICT DO NOTHING makes this idempotent -- re-running it (or
-- re-including Pathology, already tagged earlier) never double-inserts.

insert into public.question_exam_tags (question_id, exam_type_id, tagged_by)
select q.id, et.id, '51ce36e1-d376-4a8d-8c01-2749ab6c009c'::uuid
from public.questions q
cross join public.exam_types et
where et.slug = 'ms-md'
  and q.subject in (
    -- Basic Sciences (~50%)
    'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology',
    -- Medicine & Allied (~25%)
    'Medicine (Clinical Vignettes)', 'Pediatrics', 'Behavioral Sciences',
    'Dermatology (Basic Sciences)', 'Radiology (Imaging Basics)', 'Cardiology',
    -- Surgery & Allied (~25%)
    'Surgery & Allied', 'Obstetrics & Gynecology', 'Ophthalmology', 'ENT', 'Orthopedics', 'Anesthesia'
  )
on conflict (question_id, exam_type_id) do nothing;

-- Audit trail, same pattern as the admin question-tagging UI's own
-- bulkTagBySubject() action (src/app/admin/questions/actions.ts).
insert into public.admin_audit_log (actor_id, action, details)
select '51ce36e1-d376-4a8d-8c01-2749ab6c009c'::uuid, 'question_exam_tag_update',
  jsonb_build_object(
    'exam_slug', 'ms-md',
    'exam_name', 'MS / MD (JCAT)',
    'operation', 'bulk_tag_all_jcat_subjects',
    'subjects', jsonb_build_array(
      'Anatomy','Physiology','Biochemistry','Pathology','Pharmacology','Microbiology',
      'Medicine (Clinical Vignettes)','Pediatrics','Behavioral Sciences','Dermatology (Basic Sciences)','Radiology (Imaging Basics)','Cardiology',
      'Surgery & Allied','Obstetrics & Gynecology','Ophthalmology','ENT','Orthopedics','Anesthesia'
    )
  );
