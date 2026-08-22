-- 20260822030000_msmd_jcat_no_negative_marking.sql
-- -----------------------------------------------------------------------------
-- Corrects the MS/MD (JCAT) exam_configuration seeded in
-- 20260822000000_multi_exam_platform_foundation.sql: it was seeded with
-- evaluation_logic = 'negative_marking' (-0.5 per wrong answer), but the
-- confirmed real MDMDCAT/JCAT rule is 1 mark per correct answer with NO
-- negative marking for wrong or unanswered questions.
--
-- Config rows are versioned and never mutated in place (see that migration's
-- own comment on this) -- so this INSERTs a new version 2 row and flips
-- is_live instead of UPDATEing version 1. Any attempt already scored under
-- version 1 keeps its historical exam_configuration_id and is unaffected;
-- only NEW sessions from this point on pick up the corrected rules.
-- total_blocks/questions_per_block/minutes_per_block (1 / 100 / 150) are
-- already correct and are carried over unchanged.

update public.exam_configurations
set is_live = false
where exam_type_id = (select id from public.exam_types where slug = 'ms-md')
  and is_live = true;

insert into public.exam_configurations
  (exam_type_id, version, is_live, total_blocks, questions_per_block, minutes_per_block,
   evaluation_logic, negative_marking_weight, global_break_minutes, break_trigger_mode, metadata)
select id, 2, true, 1, 100, 150, 'sba', 0, 0, 'none', '{}'::jsonb
from public.exam_types where slug = 'ms-md';
