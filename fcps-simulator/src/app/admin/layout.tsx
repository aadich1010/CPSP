import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#ffffff', flexWrap: 'wrap' }}>
      {/* Admin Sidebar */}
      <aside
        className="admin-sidebar"
        style={{
          width: 220,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '22px 18px 18px',
            borderBottom: '1px solid rgba(139,92,246,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: 'linear-gradient(135deg, var(--teal-600), var(--teal-400))',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(13, 148, 136, 0.2)'
              }}
            >
              <span style={{ fontSize: '1rem' }}>⚙️</span>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                Admin Panel
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--teal-600)', fontWeight: 700 }}>
                FCPS Simulator
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 0' }}>
          {[
            { href: '/admin',          label: 'Dashboard',  icon: '📊' },
            { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
            { href: '/admin/users',    label: 'Users',      icon: '👥' },
            { href: '/admin/questions',label: 'Questions',  icon: '📝' },
            { href: '/admin/settings/payment', label: 'Payment Settings', icon: '💳' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                color: '#64748b',
                textDecoration: 'none',
                fontSize: '0.87rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                margin: '2px 8px',
                borderRadius: 8,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 10, paddingLeft: 6 }}>
            👑 {profile?.full_name || 'Admin'}
          </div>
          <Link
            href="/dashboard"
            style={{
              display: 'block',
              padding: '8px 12px',
              color: '#64748b',
              fontSize: '0.8rem',
              textDecoration: 'none',
              borderRadius: 8,
              textAlign: 'center',
              border: '1px solid rgba(51,65,85,0.5)',
            }}
          >
            ← Student View
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main" style={{ marginLeft: 220, flex: 1, padding: '16px 20px', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}
