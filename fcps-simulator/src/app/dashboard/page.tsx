import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/design-system/Icon';
import type { IconName } from '@/design-system/icon-registry';
import type { CSSProperties } from 'react'
import { SUBJECTS, SUBJECT_GROUPS, isSubjectAllowed } from '@/lib/subjects'
import { SUBJECT_COLORS, SUBJECT_COLOR_FALLBACK } from '@/lib/subjectColors'
import { isAzadiOfferActive, AZADI_OFFER_DEADLINE } from '@/lib/azadiOffer'
import GradientMesh from '@/components/dashboard/GradientMesh'
import HeroBanner from '@/components/dashboard/HeroBanner'
import ReferralWidget from '@/components/dashboard/ReferralWidget'
import VvipUpgradeBanner from '@/components/dashboard/VvipUpgradeBanner'

/** Consecutive days (ending today or yesterday) with at least one exam
 *  attempt -- computed from real exam_attempts.created_at rows, never a
 *  placeholder. Dates are compared as UTC calendar days for simplicity;
 *  this can misjudge the streak by one day right around PKT midnight, but
 *  never fabricates activity that didn't happen. */
function computeStreakDays(attemptDates: string[]): number {
  if (attemptDates.length === 0) return 0

  const days = new Set(attemptDates.map((d) => new Date(d).toISOString().slice(0, 10)))
  const oneDayMs = 86_400_000
  const todayMs = Math.floor(Date.now() / oneDayMs) * oneDayMs

  // Streak must include today or yesterday to still count as "alive" --
  // otherwise a student who practiced last week would see a stale streak
  // badge implying they're still on a roll.
  const todayKey = new Date(todayMs).toISOString().slice(0, 10)
  const yesterdayKey = new Date(todayMs - oneDayMs).toISOString().slice(0, 10)
  if (!days.has(todayKey) && !days.has(yesterdayKey)) return 0

  let streak = 0
  let cursor = days.has(todayKey) ? todayMs : todayMs - oneDayMs
  while (days.has(new Date(cursor).toISOString().slice(0, 10))) {
    streak += 1
    cursor -= oneDayMs
  }
  return streak
}

// Fixed "executive muted jewel-tone" palette (src/lib/subjectColors.ts) --
// replaces the earlier golden-angle-generated bright/neon HSL gradients,
// which tested as eye-straining. Every subject still gets its own unique,
// pre-verified-AAA-contrast color; it's just a lookup now instead of a
// formula, so the exact tones are art-directed rather than computed.
function subjectPillStyle(subject: string): CSSProperties {
  const { bg, bgDark } = SUBJECT_COLORS[subject] ?? SUBJECT_COLOR_FALLBACK
  return {
    background: `linear-gradient(135deg, ${bg}, ${bgDark})`,
    boxShadow: `0 2px 8px ${bg}55`,
    ['--pill-glow' as string]: `${bg}66`,
  } as CSSProperties
}

interface SubjectStat {
  subject: string
  total_questions: number
  total_correct: number
  attempt_count: number
}

/** MS/MD (JCAT) has its own paper structure -- one combined paper split
 *  across Basic Sciences / Medicine & Allied / Surgery & Allied, not
 *  FCPS's Paper I / Paper II / Clinical Practice split. Rendered instead
 *  of SUBJECT_GROUPS (src/lib/subjects.ts) only for candidates whose
 *  target exam is 'ms-md' -- every FCPS candidate (and every other exam)
 *  keeps seeing the existing SUBJECT_GROUPS grid untouched.
 *
 *  `href` uses the app's existing canonical subject strings (SUBJECTS in
 *  src/lib/subjects.ts) -- the same values already stored in
 *  questions.subject and the ones the admin's "Tag ALL <subject>" tool
 *  (src/app/admin/questions/actions.ts) tags against -- so a card here
 *  starts working the moment the admin tags that subject's questions for
 *  ms-md, with zero further code changes. `label` is the wording the
 *  candidate actually sees, which for a few cards differs slightly from
 *  the canonical string (British spelling, or a closer real-world JCAT
 *  name) purely for display.
 */
const JCAT_CATEGORIES: { name: string; weight: string; description: string; subjects: { label: string; href: string }[] }[] = [
  {
    name: 'Basic Sciences',
    weight: 'Approx. 50%',
    description: 'Anatomy, Physiology, Biochemistry, Pathology, Pharmacology, and Microbiology.',
    subjects: [
      { label: 'Anatomy', href: 'Anatomy' },
      { label: 'Physiology', href: 'Physiology' },
      { label: 'Biochemistry', href: 'Biochemistry' },
      { label: 'Pathology', href: 'Pathology' },
      { label: 'Pharmacology', href: 'Pharmacology' },
      { label: 'Microbiology', href: 'Microbiology' },
    ],
  },
  {
    name: 'Medicine & Allied',
    weight: 'Approx. 25%',
    description: 'Internal Medicine, Paediatrics, Psychiatry, Dermatology, Radiology, Cardiology, and allied specialties.',
    subjects: [
      { label: 'Internal Medicine', href: 'Medicine (Clinical Vignettes)' },
      { label: 'Paediatrics', href: 'Pediatrics' },
      { label: 'Psychiatry', href: 'Behavioral Sciences' },
      { label: 'Dermatology', href: 'Dermatology (Basic Sciences)' },
      { label: 'Radiology', href: 'Radiology (Imaging Basics)' },
      { label: 'Cardiology', href: 'Cardiology' },
    ],
  },
  {
    name: 'Surgery & Allied',
    weight: 'Approx. 25%',
    description: 'General Surgery, Obstetrics & Gynaecology, Ophthalmology, ENT, Orthopaedics, Anaesthesia, and allied specialties.',
    subjects: [
      { label: 'General Surgery', href: 'Surgery & Allied' },
      { label: 'Obstetrics & Gynaecology', href: 'Obstetrics & Gynecology' },
      { label: 'Ophthalmology', href: 'Ophthalmology' },
      { label: 'ENT', href: 'ENT' },
      { label: 'Orthopaedics', href: 'Orthopedics' },
      { label: 'Anaesthesia', href: 'Anesthesia' },
    ],
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, subscription_expires_at, subscription_status, role, allowed_subjects, exam_types!profiles_target_exam_type_id_fkey(slug, display_name)')
    .eq('id', user.id)
    .single()

  // Every pre-existing account (target_exam_type_id null) and anyone who
  // registered for FCPS falls back to fcps-part1/'FCPS Part 1' -- the
  // whole dashboard (referral copy, VVIP banner, subject grid below) is
  // unchanged for them. See dashboard/layout.tsx's Sidebar wiring for the
  // same pattern.
  const examTypeRow = profile?.exam_types as { slug: string; display_name: string } | { slug: string; display_name: string }[] | null
  const examTypeResolved = Array.isArray(examTypeRow) ? examTypeRow[0] : examTypeRow
  const examSlug  = examTypeResolved?.slug ?? 'fcps-part1'
  const examLabel = examTypeResolved?.display_name ?? 'FCPS Part 1'
  const isJcat = examSlug === 'ms-md'

  // Admins and demo accounts are never subject-gated -- mirrors the same
  // short-circuit inside get_exam_questions() (see supabase/migrations/
  // 20260821000000_add_allowed_subjects_paper2_gating.sql).
  const allowedSubjects: string[] | null =
    profile?.role === 'admin' || profile?.subscription_status === 'demo'
      ? null
      : ((profile?.allowed_subjects as string[] | null) ?? null)

  // Total attempt count — cheap, uses attempts_user_created_idx, no rows transferred.
  const { count: totalAttemptsCount } = await supabase
    .from('exam_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Real streak data -- last 60 attempt timestamps is plenty to compute a
  // "consecutive days" streak; never fabricate this number.
  const { data: recentAttempts } = await supabase
    .from('exam_attempts')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60)
  const streakDays = computeStreakDays((recentAttempts ?? []).map((a) => a.created_at as string))

  // Real count of active subscribers for the VVIP trust badge -- see
  // VvipUpgradeBanner.tsx doc comment on why this must never be hardcoded.
  const { count: joinedCountRaw } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')
  const joinedCount = joinedCountRaw ?? 0

  // Per-subject aggregation happens in Postgres now (see migration
  // 20260722000000_dashboard_stats_rpc.sql) instead of pulling every
  // attempt row down to the browser just to reduce() it client-side.
  const { data: subjectStats } = await supabase.rpc('get_user_dashboard_stats', {
    p_user_id: user.id,
  }) as { data: SubjectStat[] | null }

  // NOTE: this used to also fetch get_subject_question_counts() (total
  // size of the question bank per subject) to show a "N questions" badge
  // on each subject card. Removed deliberately -- students should not see
  // how many questions exist behind a subject (a low count can read as
  // "this app is incomplete"), and the RPC call served no other purpose.

  const totalAttempts = totalAttemptsCount ?? 0
  const totalCorrectAll = subjectStats?.reduce((acc, s) => acc + s.total_correct, 0) ?? 0
  const totalQuestionsAll = subjectStats?.reduce((acc, s) => acc + s.total_questions, 0) ?? 0
  const avgScore = totalQuestionsAll > 0 ? Math.round((totalCorrectAll / totalQuestionsAll) * 100) : 0

  // Subject performance breakdown
  const subjectMap: Record<string, { total: number; correct: number }> = {}
  subjectStats?.forEach((s) => {
    subjectMap[s.subject] = { total: s.total_questions, correct: s.total_correct }
  })

  const weakSubjects = Object.entries(subjectMap)
    .map(([subject, data]) => ({
      subject,
      pct: Math.round((data.correct / data.total) * 100),
    }))
    .filter((s) => s.pct < 60)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4)

  const name = profile?.full_name?.split(' ')[0] ?? 'Doctor'
  const isPremium = profile?.role === 'admin' || profile?.subscription_status === 'active'
  const expiresAt = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A'
  const statusLine = isPremium
    ? `Subscription active · Expires ${expiresAt}`
    : 'Demo access · 10 questions per exam — ask the admin to upgrade for full access'

  // Referral tag is inert today (see ReferralWidget.tsx doc comment) but the
  // link itself is real and stable per-student, built from their own id.
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myresidency.vercel.app'
  const referralLink = `${siteOrigin}/?ref=${user.id.slice(0, 8)}`

  return (
    <div className="animate-fade-in relative w-full max-w-full" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <GradientMesh />

      {/* Header / Hero + Referral -- both shown at ~50% size, side by side
          in one row (the SocialProofTicker itself now renders globally
          above the sidebar/main layout, in dashboard/layout.tsx). */}
      <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 10 }} className="w-full max-w-full">
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <HeroBanner
            name={name}
            avgScore={avgScore}
            totalAttempts={totalAttempts}
            streakDays={streakDays}
            isPremium={isPremium}
            compact
          />
        </div>
        <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <ReferralWidget referralLink={referralLink} compact examLabel={examLabel} />
        </div>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: -4, marginBottom: 12 }} className="break-words">
        {statusLine}
      </p>

      {/* Scrollable Container */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, paddingBottom: 8 }} className="w-full max-w-full">
      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {/* Same "executive muted jewel-tone" palette as the subject cards
            below (src/lib/subjectColors.ts) -- deep matte fill + white
            text, each pre-verified for AAA contrast (>=7:1) rather than
            the old white-card-with-colored-icon treatment. */}
        {[
          { label: 'Total Attempts', value: totalAttempts, icon: 'practice', bg: '#245F61', bgDark: '#154042' },
          { label: 'Average Score',  value: `${avgScore}%`, icon: 'analytics', bg: '#24613A', bgDark: '#154225' },
          { label: 'Subjects',       value: SUBJECTS.length, icon: 'questionBank', bg: '#422768', bgDark: '#2C174A' },
          { label: 'Weak Areas',     value: weakSubjects.length, icon: 'warning', bg: '#684D27', bgDark: '#4A3517' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flash-glow-border"
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: `linear-gradient(135deg, ${stat.bg}, ${stat.bgDark})`,
              boxShadow: `0 2px 8px ${stat.bg}55`,
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name={stat.icon as IconName} size="lg" />
              <div style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.82)', marginTop: 2, fontWeight: 600 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: 'rgba(13,148,136,0.06)',
          border: '1px solid rgba(13,148,136,0.2)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link href="/exam/setup" className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
            Start Mock Exam
          </Link>
          <Link href="/dashboard/analysis" className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>
            <Icon name="analytics" /> Analysis
          </Link>
          <Link href="/dashboard/history" className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>
            <Icon name="mockExam" /> History
          </Link>
          <Link href="/dashboard/recent" className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>
            <Icon name="practice" /> Recent Exams
          </Link>
          <Link href="/dashboard/weak" className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>
            <Icon name="warning" /> Weak Subjects
          </Link>
        </div>
      </div>

      {/* VVIP upgrade banner -- premium/admin users never see it */}
      {!isPremium && (
        <div style={{ marginBottom: 20 }} className="w-full max-w-full">
          <VvipUpgradeBanner
            pricingHref="/#pricing"
            joinedCount={joinedCount}
            offerDeadline={isAzadiOfferActive() ? AZADI_OFFER_DEADLINE : undefined}
            examLabel={examLabel}
          />
        </div>
      )}

      {/* Subject Grid -- MS/MD (JCAT) candidates get their own paper
          structure (Basic Sciences / Medicine & Allied / Surgery & Allied);
          every other exam (FCPS included) keeps the existing SUBJECT_GROUPS
          grid exactly as it was. */}
      <div style={{ marginTop: 20 }}>
        {isJcat ? (
          <>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
              MS/MD JCAT Exam Categories
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 14 }}>
              Comprehensive distribution covering Basic Sciences, Medicine, and Surgery as per JCAT layout.
            </p>
            {JCAT_CATEGORIES.map((cat) => (
              <div key={cat.name} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {cat.name}
                  </h3>
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#0d9488', background: 'rgba(13,148,136,0.1)', padding: '1px 8px', borderRadius: 999 }}>
                    {cat.weight}
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 10 }}>
                  {cat.description}
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                    gap: 8,
                  }}
                >
                  {cat.subjects.map((s) => (
                    <Link
                      key={s.label}
                      href={`/exam/session?examSlug=ms-md&subject=${encodeURIComponent(s.href)}&mode=practice`}
                      className="subject-pill"
                      style={subjectPillStyle(s.href)}
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          SUBJECT_GROUPS.map((group) => (
          <div key={group.name} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
              {group.name}
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 10 }}>
              {group.description}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                gap: 8,
              }}
            >
              {group.subjects.map((subject) => {
                const locked = !isSubjectAllowed(allowedSubjects, subject)
                if (locked) {
                  return (
                    <div
                      key={subject}
                      className="subject-pill"
                      title="Not unlocked for you yet — ask your admin for access"
                      style={{
                        background: '#e2e8f0',
                        color: '#94a3b8',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon name="locked" size="xs" /> {subject}
                    </div>
                  )
                }
                return (
                  <Link
                    key={subject}
                    href={`/exam/setup?subject=${encodeURIComponent(subject)}`}
                    className="subject-pill"
                    style={subjectPillStyle(subject)}
                  >
                    {subject}
                  </Link>
                )
              })}
            </div>
          </div>
          ))
        )}
      </div>
      </div>
    </div>
  )
}
