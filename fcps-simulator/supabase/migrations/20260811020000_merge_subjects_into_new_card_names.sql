-- ═══════════════════════════════════════════════════════════════════════════
-- Two of the seven newly-added subject cards ("Epidemiology & Biostatistics",
-- "Emergency Medicine / Critical Care Basics") are broader versions of
-- subjects that already had real questions tagged under a shorter name
-- ("Biostatistics": 29 questions, "Emergency Medicine": 22 questions). A
-- plain text rename merges that existing content into the new card names
-- immediately, instead of leaving it orphaned under a subject string that no
-- longer appears in any picker/filter in the app.
--
-- This is NOT the "split Medicine into Applied Physiology/Pathology/etc."
-- restructure discussed and explicitly deferred -- that would require
-- reclassifying ~1700 questions with no existing signal for which sub-bucket
-- each belongs to. This is a straight 1:1 rename of an existing, compatible
-- subject string; no question is reassigned to a different topic.
-- ═══════════════════════════════════════════════════════════════════════════

update public.questions
set subject = 'Epidemiology & Biostatistics'
where subject = 'Biostatistics';

update public.questions
set subject = 'Emergency Medicine / Critical Care Basics'
where subject = 'Emergency Medicine';
