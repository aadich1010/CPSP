-- Merge the two separate 'Surgery' and 'General Surgery' subject cards
-- into a single 'Surgery & Allied' subject, per explicit request -- the
-- two were confusing as separate dashboard cards. All questions from both
-- move under the merged name; nothing else about them changes (options,
-- explanations, roman_urdu_* translations, difficulty all untouched).
--
-- Matching code changes (same commit): src/lib/subjects.ts (SUBJECTS +
-- SUBJECT_GROUPS), src/lib/subjectColors.ts (SUBJECT_COLORS), and
-- src/app/admin/questions/import/page.tsx (SUBJECT_ALIASES +
-- detectSubjectFromText) so future imports tagged with either legacy name
-- still land under the merged subject.
update public.questions
set subject = 'Surgery & Allied'
where subject in ('Surgery', 'General Surgery');
