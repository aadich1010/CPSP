import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ForensicWatermark from '@/components/ForensicWatermark'
import AntiTheft from '@/components/AntiTheft'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const expiresAt = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null

  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AntiTheft />
      <ForensicWatermark
        userEmail={profile.email || user.email || ''}
        userName={profile.full_name || ''}
      />

      {/* Sidebar */}
      <Sidebar profile={profile} daysLeft={daysLeft} />

      {/* Main Content */}
      <main
        style={{
          marginLeft: 260,
          flex: 1,
          padding: '16px 20px',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Subscription warning banner */}
        {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
          <div
            style={{
              background: 'rgba(217,119,6,0.08)',
              border: '1px solid rgba(217,119,6,0.2)',
              borderRadius: 10,
              padding: '10px 16px',
              marginBottom: 16,
              color: '#92400e',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            ⚠️ Your subscription expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>. Contact admin to renew.
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
