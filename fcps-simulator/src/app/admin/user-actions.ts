'use server'

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function activateSubscription(userId: string, days: number = 30) {
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
  const { error: auditError } = await adminDb.from('admin_audit_log').insert({
    actor_id: admin.id,
    action: 'activate',
    target_user_id: userId,
    details: { days, expires_at: expiresAt.toISOString() },
  })
  if (auditError) console.error('Audit log write failed (activation still succeeded):', auditError)

  revalidatePath('/admin')
  revalidatePath('/admin/users')
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
