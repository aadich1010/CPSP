import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ForensicWatermark from '@/components/ForensicWatermark'
import AntiTheft from '@/components/AntiTheft'
import VvipWelcomeGate from '@/components/vvip'
import Icon from '@/design-system/Icon';

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

  // Server Component: computed once per request on the server, not during
  // a client re-render, so a fresh "now" here is intentional and safe.
  const now = new Date()
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AntiTheft />
      <ForensicWatermark
        userEmail={profile.email || user.email || ''}
        userName={profile.full_name || ''}
      />
      {/* Fires once per LOGIN (see useVvipWelcome's session-key comment --
          a page refresh does not re-show it, but a fresh login does), only
          when subscription_status is genuinely 'active' and not expired
          (see isPaidMember() in lib/subscription.ts). Confetti + balloons,
          stays up 30s, and cannot be dismissed early -- no button, scrim
          click, or Escape closes it before the timer does. Demo accounts
          never see this, only real subscribers. */}
      <VvipWelcomeGate
        user={{
          id: profile.id,
          email: profile.email || user.email,
          full_name: profile.full_name,
          subscription_status: profile.subscription_status,
          subscription_expires_at: profile.subscription_expires_at,
        }}
        title="Congratulations!"
        message="Your subscription is now active — the full question bank, timed mock exams, and performance analytics are all unlocked. Have a good day, and best of luck for your exam!"
        holdMs={30000}
        dismissible={false}
      />

      {/* Sidebar */}
      <Sidebar profile={profile} daysLeft={daysLeft} />

      {/* Main Content */}
      <main
        className="dashboard-main"
        style={{
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
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span>
              <Icon name="warning" /> Your subscription expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
            </span>
            <a
              href="/subscription-expired"
              style={{
                color: '#92400e',
                fontWeight: 800,
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
              }}
            >
              Renew now →
            </a>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
