'use server'

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function activateSubscription(userId: string, days: number = 30, amountPkr?: number | null) {
  const admin = await requireAdmin()
  const adminDb = await createAdminClient()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)

  const { error } = await adminDb
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Activation error:', error)
    return { success: false, error: error.message }
  }

  // Best-effort audit log write. If this fails we don't want to tell the
  // admin the activation itself failed — the subscription update above
  // already succeeded and the student's access is already live.
  // amount_pkr is optional (admin may skip entering it) — it's what
  // powers the revenue analytics on /admin/analytics, but it should
  // never block activation itself.
  const { error: auditError } = await adminDb.from('admin_audit_log').insert({
    actor_id: admin.id,
    action: 'activate',
    target_user_id: userId,
    details: {
      days,
      expires_at: expiresAt.toISOString(),
      amount_pkr: typeof amountPkr === 'number' && amountPkr > 0 ? amountPkr : null,
    },
  })
  if (auditError) console.error('Audit log write failed (activation still succeeded):', auditError)

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/analytics')
  return { success: true }
}

export async function revokeSubscription(userId: string) {
  const admin = await requireAdmin()
  const adminDb = await createAdminClient()

  const { error } = await adminDb
    .from('profiles')
    .update({ subscription_status: 'expired' })
    .eq('id', userId)

  if (error) {
    console.error('Revoke error:', error)
    return { success: false, error: error.message }
  }

  const { error: auditError } = await adminDb.from('admin_audit_log').insert({
    actor_id: admin.id,
    action: 'revoke',
    target_user_id: userId,
    details: {},
  })
  if (auditError) console.error('Audit log write failed (revoke still succeeded):', auditError)

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  return { success: true }
}

// Kept as an alias so any existing callers of the old name (e.g. a
// dashboard "quick activate" button) keep working without a separate
// migration of call sites.
export const quickActivateUser = activateSubscription

/**
 * Temporarily blocks a user for the given number of minutes, by setting
 * profiles.blocked_until = now() + minutes. Deliberately separate from
 * subscription_status (see supabase/migrations/20260812260000_add_
 * registration_fields_and_blocking.sql) -- blocking and later unblocking a
 * user never touches or loses track of their actual subscription tier.
 * Enforced in both auth/actions.ts login() (rejects the login outright)
 * and middleware.ts (cuts off an already-open session too). Auto-lifts
 * itself once blocked_until passes -- no unblock action required, though
 * unblockUser() below exists for lifting it early.
 */
export async function blockUser(userId: string, minutes: number) {
  const admin = await requireAdmin()
  const adminDb = await createAdminClient()

  const blockedUntil = new Date(Date.now() + minutes * 60_000)

  const { error } = await adminDb
    .from('profiles')
    .update({ blocked_until: blockedUntil.toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Block error:', error)
    return { success: false, error: error.message }
  }

  const { error: auditError } = await adminDb.from('admin_audit_log').insert({
    actor_id: admin.id,
    action: 'block',
    target_user_id: userId,
    details: { minutes, blocked_until: blockedUntil.toISOString() },
  })
  if (auditError) console.error('Audit log write failed (block still succeeded):', auditError)

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  return { success: true, blockedUntil: blockedUntil.toISOString() }
}

/** Lifts a block early (or is a no-op if the user wasn't blocked). */
export async function unblockUser(userId: string) {
  const admin = await requireAdmin()
  const adminDb = await createAdminClient()

  const { error } = await adminDb
    .from('profiles')
    .update({ blocked_until: null })
    .eq('id', userId)

  if (error) {
    console.error('Unblock error:', error)
    return { success: false, error: error.message }
  }

  const { error: auditError } = await adminDb.from('admin_audit_log').insert({
    actor_id: admin.id,
    action: 'unblock',
    target_user_id: userId,
    details: {},
  })
  if (auditError) console.error('Audit log write failed (unblock still succeeded):', auditError)

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Admin-forced password reset -- sets the user's password directly via the
 * Supabase Admin API (service_role, bypasses the normal "email yourself a
 * reset link" flow entirely). Intended for a student who's locked out and
 * can't receive/act on a reset email themselves. The new password is never
 * logged -- only the fact that a reset happened is recorded in the audit
 * log, same privacy treatment as everywhere else in this file.
 */
export async function changeUserPassword(userId: string, newPassword: string) {
  const admin = await requireAdmin()
  const adminDb = await createAdminClient()

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }

  const { error } = await adminDb.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) {
    console.error('Password change error:', error)
    return { success: false, error: error.message }
  }

  const { error: auditError } = await adminDb.from('admin_audit_log').insert({
    actor_id: admin.id,
    action: 'password_reset',
    target_user_id: userId,
    details: {},
  })
  if (auditError) console.error('Audit log write failed (password change still succeeded):', auditError)

  return { success: true }
}

/**
 * Permanently deletes a student's account: auth.users row (via the admin
 * API) plus everything that cascades from it -- profiles, active_sessions,
 * exam_attempts, exam_sessions -- per the `on delete cascade` foreign keys
 * already in place. Irreversible; the client is expected to confirm with
 * the admin before calling this.
 */
export async function deleteUserAccount(userId: string) {
  const admin = await requireAdmin()
  const adminDb = await createAdminClient()

  // Audit log first, while the row (and the FK it points at) still exists --
  // once the user is gone the log entry would otherwise be the only record
  // this account ever existed. Best-effort: a logging failure shouldn't
  // block a deletion the admin explicitly asked for.
  const { error: auditError } = await adminDb.from('admin_audit_log').insert({
    actor_id: admin.id,
    action: 'delete_user',
    target_user_id: userId,
    details: {},
  })
  if (auditError) console.error('Audit log write failed (deletion still proceeding):', auditError)

  const { error } = await adminDb.auth.admin.deleteUser(userId)
  if (error) {
    console.error('Delete user error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  revalidatePath('/admin/analytics')
  revalidatePath('/admin/income')
  return { success: true }
}

export type UserDetails = {
  profile: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    pmdc_number: string | null
    medical_college: string | null
    blocked_until: string | null
    role: string | null
    subscription_status: string | null
    subscription_expires_at: string | null
    created_at: string
  } | null
  examStats: { attempts: number; avgScore: number | null }
  payments: Array<{
    id: string
    action: string
    created_at: string
    days: number | null
    amount_pkr: number | null
  }>
}

/** Full profile + subscription + payment-history lookup for the Users-page
 *  "Details" panel. Deliberately NOT exposed on the dashboard's demo-users
 *  table -- that one only deep-links here. */
export async function getUserDetails(userId: string): Promise<UserDetails> {
  await requireAdmin()
  const adminDb = await createAdminClient()

  const [{ data: profile }, { data: attempts }, { data: auditRows }] = await Promise.all([
    adminDb
      .from('profiles')
      .select('id, full_name, email, phone, pmdc_number, medical_college, blocked_until, role, subscription_status, subscription_expires_at, created_at')
      .eq('id', userId)
      .maybeSingle(),
    adminDb.from('exam_attempts').select('score, total_questions').eq('user_id', userId),
    adminDb
      .from('admin_audit_log')
      .select('id, action, created_at, details')
      .eq('target_user_id', userId)
      .in('action', ['activate', 'revoke'])
      .order('created_at', { ascending: false }),
  ])

  const scored = (attempts ?? []).filter((a) => typeof a.total_questions === 'number' && a.total_questions > 0)
  const avgScore =
    scored.length > 0
      ? Math.round(
          (scored.reduce((sum, a) => sum + (a.score ?? 0) / (a.total_questions as number), 0) / scored.length) * 1000
        ) / 10
      : null

  const payments = (auditRows ?? []).map((r) => {
    const details = (r.details ?? {}) as { days?: number; amount_pkr?: number | null }
    return {
      id: r.id as string,
      action: r.action as string,
      created_at: r.created_at as string,
      days: typeof details.days === 'number' ? details.days : null,
      amount_pkr: typeof details.amount_pkr === 'number' ? details.amount_pkr : null,
    }
  })

  return {
    profile: profile ?? null,
    examStats: { attempts: attempts?.length ?? 0, avgScore },
    payments,
  }
}
