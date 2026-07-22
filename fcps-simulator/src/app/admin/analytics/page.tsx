import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type AuditRow = {
  action: string
  details: { days?: number; amount_pkr?: number | null } | null
  created_at: string
}

const PLAN_LABELS: Record<number, string> = {
  30: '1 Month',
  90: '3 Months',
  180: '6 Months',
  365: '1 Year',
}

export default async function AnalyticsPage() {
  const adminDb = await createAdminClient()

  const [{ count: totalUsers }, { count: paidEver }, { count: activeNow }, { data: auditRows }] =
    await Promise.all([
      adminDb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      adminDb
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .not('subscription_expires_at', 'is', null),
      adminDb
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('subscription_status', 'active'),
      adminDb
        .from('admin_audit_log')
        .select('action, details, created_at')
        .eq('action', 'activate')
        .order('created_at', { ascending: false }) as unknown as Promise<{ data: AuditRow[] }>,
    ])

  const rows = auditRows || []
  const withAmount = rows.filter((r) => typeof r.details?.amount_pkr === 'number' && r.details.amount_pkr! > 0)

  const totalRevenue = withAmount.reduce((sum, r) => sum + (r.details!.amount_pkr as number), 0)

  const revenueByPlan = new Map<number, { count: number; revenue: number }>()
  withAmount.forEach((r) => {
    const days = r.details?.days ?? 0
    const entry = revenueByPlan.get(days) || { count: 0, revenue: 0 }
    entry.count += 1
    entry.revenue += r.details!.amount_pkr as number
    revenueByPlan.set(days, entry)
  })

  const now = new Date()
  const thisMonthRevenue = withAmount
    .filter((r) => {
      const d = new Date(r.created_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, r) => sum + (r.details!.amount_pkr as number), 0)

  const conversionRate = totalUsers && totalUsers > 0 ? Math.round(((paidEver ?? 0) / totalUsers) * 1000) / 10 : 0

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
          Analytics
        </h1>
        <p style={{ color: '#475569', fontSize: '0.8rem' }}>
          Revenue and conversion, built from the admin activation log.
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
          ℹ️ No activations logged yet. This page only has data from activations made after the
          audit log was added — past activity from before that couldn&apos;t be reconstructed
          since it was never recorded anywhere.
        </div>
      )}

      {withAmount.length < rows.length && rows.length > 0 && (
        <div
          style={{
            background: 'rgba(217,119,6,0.08)',
            border: '1px solid rgba(217,119,6,0.2)',
            color: '#92400e',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          ⚠️ {rows.length - withAmount.length} of {rows.length} activation(s) were logged without an
          amount (skipped at activation time), so revenue below is a floor, not the full total.
        </div>
      )}

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <StatCard label="Total Revenue (logged)" value={`Rs. ${totalRevenue.toLocaleString('en-PK')}`} color="#0d9488" />
        <StatCard label="This Month" value={`Rs. ${thisMonthRevenue.toLocaleString('en-PK')}`} color="#2563eb" />
        <StatCard label="Registered → Paid" value={`${conversionRate}%`} sub={`${paidEver ?? 0} of ${totalUsers ?? 0} students`} color="#7c3aed" />
        <StatCard label="Currently Active" value={String(activeNow ?? 0)} color="#16a34a" />
      </div>

      {/* Revenue by plan */}
      <div className="glass-card" style={{ padding: 20, background: 'white' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
          Revenue by Plan
        </h3>
        {revenueByPlan.size === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No amounts logged yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 6px', color: '#64748b', fontWeight: 700 }}>Plan</th>
                <th style={{ padding: '8px 6px', color: '#64748b', fontWeight: 700 }}>Activations</th>
                <th style={{ padding: '8px 6px', color: '#64748b', fontWeight: 700 }}>Revenue</th>
                <th style={{ padding: '8px 6px', color: '#64748b', fontWeight: 700 }}>Avg / activation</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(revenueByPlan.entries())
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([days, entry]) => (
                  <tr key={days} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 700, color: '#1e293b' }}>
                      {PLAN_LABELS[days] || `${days} days`}
                    </td>
                    <td style={{ padding: '8px 6px', color: '#475569' }}>{entry.count}</td>
                    <td style={{ padding: '8px 6px', fontWeight: 700, color: '#0d9488' }}>
                      Rs. {entry.revenue.toLocaleString('en-PK')}
                    </td>
                    <td style={{ padding: '8px 6px', color: '#475569' }}>
                      Rs. {Math.round(entry.revenue / entry.count).toLocaleString('en-PK')}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="glass-card" style={{ padding: 16, background: 'white', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
