import { createAdminClient } from '@/lib/supabase/server'
import PaymentSettingsClient from './PaymentSettingsClient'

export const dynamic = 'force-dynamic'

const PLACEHOLDER_DEFAULTS = [
  { provider: 'jazzcash' as const, account_number: '', account_name: '', extra_info: null },
  { provider: 'easypaisa' as const, account_number: '', account_name: '', extra_info: null },
  { provider: 'bank' as const, account_number: '', account_name: '', extra_info: null },
]

export default async function PaymentSettingsPage() {
  const adminDb = await createAdminClient()

  const { data } = await adminDb
    .from('payment_settings')
    .select('provider, account_number, account_name, extra_info')
    .order('provider')

  // Guarantee all three providers always have a row to render, even if
  // the table is empty or a provider was never seeded.
  const byProvider = new Map((data || []).map((d) => [d.provider, d]))
  const settings = PLACEHOLDER_DEFAULTS.map((d) => byProvider.get(d.provider) || d)

  const stillPlaceholder = settings.some(
    (s) => !s.account_number || s.account_number.includes('XXXX') || s.account_name === '[Your Name]'
  )

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
          Payment Settings
        </h1>
        <p style={{ color: '#475569', fontSize: '0.8rem' }}>
          These account details are shown to every student on the subscription-expired /
          payment page. Keep them accurate.
        </p>
      </div>

      {stillPlaceholder && (
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            color: '#991b1b',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          ⚠️ One or more providers still have placeholder details. Students currently see fake
          account numbers until you fill these in below.
        </div>
      )}

      <PaymentSettingsClient initialSettings={settings} />
    </div>
  )
}
