-- ═══════════════════════════════════════════════════════════════════════════
-- Two changes needed to support the new admin "Delete user" action:
--
-- 1. admin_audit_log.action had a CHECK limited to ('activate', 'revoke').
--    Add 'delete_user' so the delete flow can log who deleted whom.
--
-- 2. admin_audit_log.target_user_id / actor_id were NOT NULL foreign keys to
--    auth.users with the default ON DELETE NO ACTION. That means deleting a
--    student who had ever been activated/revoked (i.e. has any audit log
--    row) would fail outright with a foreign-key violation the moment
--    auth.admin.deleteUser() ran -- the delete button would never work for
--    the accounts admins most want to delete (paying/former-paying users).
--    Switch both to ON DELETE SET NULL and drop NOT NULL so the audit trail
--    (and the amounts in `details`, which is what the Income page sums)
--    survives account deletion instead of blocking it.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.admin_audit_log
  drop constraint admin_audit_log_action_check;

alter table public.admin_audit_log
  add constraint admin_audit_log_action_check
  check (action = any (array['activate', 'revoke', 'delete_user']));

alter table public.admin_audit_log
  alter column target_user_id drop not null;

alter table public.admin_audit_log
  alter column actor_id drop not null;

alter table public.admin_audit_log
  drop constraint admin_audit_log_target_user_id_fkey;

alter table public.admin_audit_log
  add constraint admin_audit_log_target_user_id_fkey
  foreign key (target_user_id) references auth.users(id) on delete set null;

alter table public.admin_audit_log
  drop constraint admin_audit_log_actor_id_fkey;

alter table public.admin_audit_log
  add constraint admin_audit_log_actor_id_fkey
  foreign key (actor_id) references auth.users(id) on delete set null;
