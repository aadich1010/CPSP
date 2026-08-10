-- The Medicine reclassification pass (batches 1-22, see
-- 20260811030000_pilot_classify_medicine_subjects.sql through
-- 20260811230000_classify_medicine_batch_22.sql) is complete: 1611 of the
-- original 1705 'Medicine' questions were reclassified into their correct
-- basic-science/specialty subject. The 94 that remain are intentionally
-- NOT basic-science recall -- they're genuine clinical case-vignettes
-- (patient presentation -> diagnosis/management) plus a handful of
-- corrupted/garbled source rows flagged for admin review, none of which
-- belong under a Paper I/II basic-science card.
--
-- Renaming this residual bucket from the bare 'Medicine' to 'Medicine
-- (Clinical Vignettes)' so it reads clearly as its own "Clinical
-- Practice" category in the UI, distinct from the Paper I/II subject
-- cards. See src/lib/subjects.ts for the new grouped taxonomy.

update public.questions set subject = 'Medicine (Clinical Vignettes)' where subject = 'Medicine';
