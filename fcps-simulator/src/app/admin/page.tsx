import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import QuickActivateButton from './QuickActivateButton'
import Icon from '@/design-system/Icon';
import type { IconName } from '@/design-system/icon-registry';

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const adminDb  = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Aggregate stats
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: demoUsers },
    { count: totalQuestions },
    { count: totalAttempts },
  ] = await Promise.all([
    adminDb.from('profiles').select('*', { count: 'exact', head: true }),
    adminDb.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    adminDb.from('profiles').select('*', { count: 'exact', head: true }).in('subscription_status', ['demo', 'pending']),
    adminDb.from('questions').select('*', { count: 'exact', head: true }),
    adminDb.from('exam_attempts').select('*', { count: 'exact', head: true }),
  ])

  // Recent registrations still on the free demo tier, awaiting an
  // admin upgrade to 'active' for full access. ('pending' is kept in
  // here too for any account an admin manually put on hold pre-demo-tier.)
  const { data: demoProfiles } = await adminDb
    .from('profiles')
    .select('id, full_name, email, created_at, subscription_status')
    .in('subscription_status', ['demo', 'pending'])
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#475569', fontSize: '0.8rem' }}>
            Platform overview and quick actions
          </p>
        </div>
        <Link href="/admin/users" className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem' }}>
          View All Users →
        </Link>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: 'Total Users',    value: totalUsers    ?? 0, icon: 'community', color: '#7c3aed' },
          { label: 'Active Subs',    value: activeUsers   ?? 0, icon: 'correct', color: '#16a34a' },
          { label: 'Demo Users',     value: demoUsers     ?? 0, icon: 'timer', color: '#d97706' },
          { label: 'Questions',      value: totalQuestions ?? 0, icon: 'practice', color: '#0f766e' },
          { label: 'Exam Attempts',  value: totalAttempts ?? 0, icon: 'analytics', color: '#2563eb' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name={stat.icon as IconName} size="lg" />
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2, fontWeight: 600 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          padding: '12px 16px',
          background: 'rgba(13,148,136,0.06)',
          borderRadius: 10,
          border: '1px solid rgba(13,148,136,0.18)',
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginRight: 4 }}>
          Quick Actions:
        </span>
        <Link href="/admin/users" className="btn btn-primary btn-sm">
          <Icon name="community" /> Manage Users
        </Link>
        <Link href="/admin/questions" className="btn btn-ghost btn-sm">
          <Icon name="practice" /> Question Bank
        </Link>
        <Link href="/admin/questions/import" className="btn btn-ghost btn-sm">
          <Icon name="ai" /> AI Import
        </Link>
      </div>

      {/* Demo Users Table (awaiting upgrade to full access) */}
      {demoProfiles && demoProfiles.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#f59e0b',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="timer" size="md" /> Demo Users — Awaiting Upgrade ({demoProfiles.length})
          </h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {demoProfiles.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: '#0f172a', fontWeight: 600 }}>{p.full_name}</td>
                    <td style={{ color: '#475569' }}>{p.email}</td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <QuickActivateButton userId={p.id} />
                        {/* Deep-links straight to the Users page and opens
                            its Details modal there for this exact user --
                            this table itself never renders subscription
                            details inline, only the Users page does. */}
                        <Link
                          href={`/admin/users?details=${encodeURIComponent(p.id)}`}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
