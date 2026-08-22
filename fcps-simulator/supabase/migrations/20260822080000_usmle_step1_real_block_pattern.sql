-- 20260822080000_usmle_step1_real_block_pattern.sql
-- -----------------------------------------------------------------------------
-- The USMLE exam_configuration seeded in 20260822000000_multi_exam_platform_
-- foundation.sql (20 questions/block, 30 min/block, 14 blocks) never
-- matched the real USMLE pattern, and nothing in the app actually read
-- global_break_minutes/break_trigger_mode yet -- this is the first
-- migration to wire the USMLE exam-taking engine up end to end (see
-- exam/setup, exam/session, exam/break in the app repo).
--
-- New live values match the real USMLE Step 1/Step 2 CK block pattern:
--   40 questions per block, 60 minutes per block, 7 blocks, 45 minutes of
--   pooled break time shared across all inter-block breaks. Versioned the
--   same way every other exam_configurations change in this app has been
--   (insert new row, retire the old one) rather than mutating in place.

update public.exam_configurations
set is_live = false
where exam_type_id = (select id from public.exam_types where slug = 'usmle-step1')
  and is_live = true;

insert into public.exam_configurations (
  exam_type_id, version, is_live, total_blocks, questions_per_block,
  minutes_per_block, evaluation_logic, negative_marking_weight,
  global_break_minutes, break_trigger_mode
)
select id, 2, true, 7, 40, 60, 'sba', 0, 45, 'between_blocks_manual'
from public.exam_types where slug = 'usmle-step1';
