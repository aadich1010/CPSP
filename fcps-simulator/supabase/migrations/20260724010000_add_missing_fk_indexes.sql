-- ═══════════════════════════════════════════════════════════
-- Supabase's performance advisor flags two foreign keys with no
-- covering index. Without one, Postgres has to sequential-scan the
-- referencing table for every check/join/cascade-delete on that FK --
-- fine at today's tiny row counts, but it gets slower linearly as
-- exam_attempts and questions grow with more users, which is exactly
-- the "how do we handle it once we have lots of users" concern.
-- Cheap, safe, purely additive (CREATE INDEX, no data/behavior change).
-- ═══════════════════════════════════════════════════════════

create index if not exists exam_attempts_session_id_idx
  on public.exam_attempts (session_id);

create index if not exists questions_created_by_idx
  on public.questions (created_by);
