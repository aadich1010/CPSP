import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ForensicWatermark from '@/components/ForensicWatermark'
import AntiTheft from '@/components/AntiTheft'
import DeviceSessionGuard from '@/components/DeviceSessionGuard'
import VvipWelcomeGate from '@/components/vvip'
import { isPaidMember } from '@/lib/subscription'
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

  // True exactly once per subscriber: the very first dashboard load after
  // has_seen_welcome was still false. Every login after that -- including
  // this same one on a refresh, since we flip the flag below before
  // rendering -- gets the shorter "Welcome back" treatment instead.
  const isFirstWelcome = isPaidMember(profile) && profile.has_seen_welcome !== true
  if (isFirstWelcome) {
    // Fire this now so a second tab or a fast refresh immediately after
    // sees has_seen_welcome=true and gets "Welcome back", not another
    // "Congratulations". The per-login-session gate in useVvipWelcome
    // still controls whether THIS render actually shows the modal.
    //
    // The error IS checked (unlike before): an RLS policy on this table
    // previously caused this exact update to fail with 42P17 ("infinite
    // recursion detected in policy for relation profiles") on every single
    // login, silently, because the result was never inspected -- so
    // has_seen_welcome never actually flipped and every login showed the
    // 30s Congratulations modal instead of just the first. See the
    // 20260806000000_fix_profiles_update_rls_recursion migration for the
    // policy fix. Logging here (rather than throwing) keeps a DB hiccup
    // from breaking the whole dashboard load for a subscriber.
    const { error: welcomeFlagError } = await supabase
      .from('profiles')
      .update({ has_seen_welcome: true })
      .eq('id', user.id)
    if (welcomeFlagError) {
      console.error('[dashboard/layout] failed to set has_seen_welcome:', welcomeFlagError)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AntiTheft />
      {/* Admins are exempt from the 1-device rule, so they never hold an
          active_sessions row. Mounting the guard for them (they reach this
          layout via the admin panel's "Student View" link) would have it
          find no session, treat that as a mismatch, and sign them out
          within 60 seconds. Students are unaffected. */}
      {profile.role !== 'admin' && <DeviceSessionGuard />}
      <ForensicWatermark
        userEmail={profile.email || user.email || ''}
        userName={profile.full_name || ''}
      />
      {/* Fires once per LOGIN (see useVvipWelcome's session-key comment --
          a page refresh does not re-show it, but a fresh login does), only
          when subscription_status is genuinely 'active' and not expired
          (see isPaidMember() in lib/subscription.ts). Demo accounts never
          see this, only real subscribers. Confetti + balloons either way
          (CelebrationFx is unconditional inside VvipWelcomeModal).
          - TRUE first login ever (has_seen_welcome was false): the big
            30s "Congratulations" version, cannot be dismissed early.
          - Every login after that: a lighter 5s "Welcome back", closeable
            as normal. */}
      <VvipWelcomeGate
        user={{
          id: profile.id,
          email: profile.email || user.email,
          full_name: profile.full_name,
          subscription_status: profile.subscription_status,
          subscription_expires_at: profile.subscription_expires_at,
        }}
        title={isFirstWelcome ? 'Congratulations!' : 'Welcome back!'}
        message={
          isFirstWelcome
            ? 'Your subscription is now active — the full question bank, timed mock exams, and performance analytics are all unlocked. Have a good day, and best of luck for your exam!'
            : 'Have a good day, and best of luck for your exam!'
        }
        holdMs={isFirstWelcome ? 30000 : 5000}
        dismissible={!isFirstWelcome}
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
