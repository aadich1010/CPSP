import { createAdminClient } from '@/lib/supabase/server'
import Icon from '@/design-system/Icon';

export const dynamic = 'force-dynamic'

type AuditRow = {
  target_user_id: string | null
  details: { days?: number; amount_pkr?: number | null } | null
  created_at: string
}

type ProfileRow = { id: string; full_name: string | null; email: string | null }

const PLAN_LABELS: Record<number, string> = {
  30: '1 Month',
  90: '3 Months',
  180: '6 Months',
  365: '1 Year',
}

type UserIncome = {
  userId: string
  name: string
  email: string
  total: number
  payments: number
  lastDays: number | null
  lastDate: string
}

export default async function IncomePage() {
  const adminDb = await createAdminClient()

  const [{ data: auditRows }, { data: profiles }] = await Promise.all([
    adminDb
      .from('admin_audit_log')
      .select('target_user_id, details, created_at')
      .eq('action', 'activate')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: AuditRow[] }>,
    adminDb.from('profiles').select('id, full_name, email') as unknown as Promise<{ data: ProfileRow[] }>,
  ])

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const rows = auditRows ?? []
  const withAmount = rows.filter((r) => typeof r.details?.amount_pkr === 'number' && (r.details!.amount_pkr as number) > 0)
  const grandTotal = withAmount.reduce((sum, r) => sum + (r.details!.amount_pkr as number), 0)

  // Rows are already ordered newest-first, so the first hit per user below
  // is naturally their most recent payment.
  const byUser = new Map<string, UserIncome>()
  let deletedAccountsTotal = 0

  for (const r of withAmount) {
    const amount = r.details!.amount_pkr as number
    if (!r.target_user_id) {
      // The paying account was later deleted -- the payment still counts
      // toward total income, it just can't be attributed to a row below.
      deletedAccountsTotal += amount
      continue
    }
    const profile = profileById.get(r.target_user_id)
    const existing = byUser.get(r.target_user_id)
    if (existing) {
      existing.total += amount
      existing.payments += 1
    } else {
      byUser.set(r.target_user_id, {
        userId: r.target_user_id,
        name: profile?.full_name || 'Unknown',
        email: profile?.email || '—',
        total: amount,
        payments: 1,
        lastDays: r.details?.days ?? null,
        lastDate: r.created_at,
      })
    }
  }

  const sorted = Array.from(byUser.values()).sort((a, b) => b.total - a.total)

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
          Income
        </h1>
        <p style={{ color: '#475569', fontSize: '0.8rem' }}>
          User-wise revenue, built from the admin activation log (only activations with an amount entered).
        </p>
      </div>

      {rows.length === 0 && (
        <div
          style={{
            background: 'rgba(37,99,235,0.06)',
            border: '1px solid rgba(37,99,235,0.2)',
            color: '#1e3a8a',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          <Icon name="info" /> No activations logged yet.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div className="glass-card" style={{ padding: 16, background: 'white', borderTop: '3px solid #0d9488' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
            Total Income (logged)
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0d9488' }}>
            Rs. {grandTotal.toLocaleString('en-PK')}
          </div>
        </div>
        <div className="glass-card" style={{ padding: 16, background: 'white', borderTop: '3px solid #7c3aed' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
            Paying Users
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{sorted.length}</div>
        </div>
        {deletedAccountsTotal > 0 && (
          <div className="glass-card" style={{ padding: 16, background: 'white', borderTop: '3px solid #94a3b8' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
              From Deleted Accounts
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#64748b' }}>
              Rs. {deletedAccountsTotal.toLocaleString('en-PK')}
            </div>
          </div>
        )}
      </div>

      <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Payments</th>
              <th>Total Paid</th>
              <th>Last Plan</th>
              <th>Last Payment</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '32px' }}>
                  No payments logged yet.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.userId}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{r.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569' }}>{r.email}</div>
                  </td>
                  <td style={{ color: '#475569' }}>{r.payments}</td>
                  <td style={{ fontWeight: 700, color: '#0d9488' }}>Rs. {r.total.toLocaleString('en-PK')}</td>
                  <td style={{ color: '#475569', fontSize: '0.82rem' }}>
                    {r.lastDays ? PLAN_LABELS[r.lastDays] || `${r.lastDays} days` : '—'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {new Date(r.lastDate).toLocaleDateString('en-PK')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
