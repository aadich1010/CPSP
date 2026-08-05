-- ═══════════════════════════════════════════════════════════
-- Distinguishes a subscriber's TRUE first login from every login after
-- that, so dashboard/layout.tsx can show the big 30-second "Congratulations"
-- celebration exactly once, and a lighter 5-second "Welcome back" on every
-- subsequent login.
--
-- Not derivable from existing columns: subscription_expires_at gets reset
-- on renewal, and there's no reliable "first ever sign-in" timestamp
-- exposed on the profiles row (auth.users.last_sign_in_at updates on
-- every login, including the very first one it's already past by the
-- time a Server Component reads it). A dedicated flag is the simple,
-- correct answer.
--
-- Defaults to false for both new rows and the backfill below, so every
-- current subscriber's NEXT login is treated as their "first" welcome --
-- acceptable one-time reset, and simpler than trying to guess who has
-- already seen some version of a modal that, until this feature, was
-- never actually mounted anywhere in the app.
--
-- Self-update is already safe: "Users can update own profile" (see
-- 20260722050000_lock_down_profile_self_update.sql) only pins role,
-- subscription_status, and subscription_expires_at to their existing
-- values on a self-update -- it does not restrict this new column, so
-- dashboard/layout.tsx (running as the logged-in user via the normal
-- server client) can flip it to true after showing the first-login modal.
-- ═══════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists has_seen_welcome boolean not null default false;
