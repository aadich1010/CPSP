'use server'

import { createAdminClient, requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type PaymentProvider = 'jazzcash' | 'easypaisa' | 'bank'

export async function updatePaymentSetting(
  provider: PaymentProvider,
  account_number: string,
  account_name: string,
  extra_info: string | null
) {
  await requireAdmin()

  if (!account_number?.trim() || !account_name?.trim()) {
    return { error: 'Account number and account name are required.' }
  }

  const adminDb = await createAdminClient()
  const { error } = await adminDb
    .from('payment_settings')
    .upsert(
      {
        provider,
        account_number: account_number.trim(),
        account_name: account_name.trim(),
        extra_info: extra_info?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider' }
    )

  if (error) return { error: error.message }

  // This page + the public subscription-expired page both read from
  // payment_settings, so revalidate both.
  revalidatePath('/admin/settings/payment')
  revalidatePath('/subscription-expired')

  return { success: true }
}
