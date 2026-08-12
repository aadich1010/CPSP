import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/design-system/Icon';
import type { IconName } from '@/design-system/icon-registry';
import type { CSSProperties } from 'react'
import { SUBJECTS, SUBJECT_GROUPS } from '@/lib/subjects'
import { SUBJECT_COLORS, SUBJECT_COLOR_FALLBACK } from '@/lib/subjectColors'

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, subscription_expires_at, subscription_status, role')
    .eq('id', user.id)
    .single()

  // Total attempt count — cheap, uses attempts_user_created_idx, no rows transferred.
  const { count: totalAttemptsCount } = await supabase
    .from('exam_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Per-subject aggregation happens in Postgres now (see migration
  // 20260722000000_dashboard_stats_rpc.sql) instead of pulling every
  // attempt row down to the browser just to reduce() it client-side.
  const { data: subjectStats } = await supabase.rpc('get_user_dashboard_stats', {
    p_user_id: user.id,
  }) as { data: SubjectStat[] | null }

  // Total size of the question bank per subject (not this user's attempt
  // history -- see get_subject_question_counts() migration). questions has
  // no SELECT policy for students at all, so this has to go through a
  // SECURITY DEFINER RPC that only ever returns subject + a count, never
  // question_text/correct_answer/explanation.
  const { data: subjectCountsRaw } = await supabase.rpc('get_subject_question_counts') as {
    data: { subject: string; question_count: number }[] | null
  }
  const subjectCountMap: Record<string, number> = {}
  subjectCountsRaw?.forEach((s) => {
    subjectCountMap[s.subject] = s.question_count
  })

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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 0 }}>
          Good day, Dr. {name}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
          {statusLine}
        </p>
      </div>
      
      {/* Scrollable Container */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, paddingBottom: 8 }}>
      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          { label: 'Total Attempts', value: totalAttempts, icon: 'practice', color: '#0f766e' },
          { label: 'Average Score',  value: `${avgScore}%`, icon: 'analytics', color: '#16a34a' },
          { label: 'Subjects',       value: SUBJECTS.length, icon: 'questionBank', color: '#7c3aed' },
          { label: 'Weak Areas',     value: weakSubjects.length, icon: 'warning', color: '#d97706' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card"
            style={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name={stat.icon as IconName} size="lg" />
              <div
                style={{ fontSize: '1.3rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}
              >
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

      {/* Subject Grid, grouped by paper */}
      <div style={{ marginTop: 20 }}>
        {SUBJECT_GROUPS.map((group) => (
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
              {group.subjects.map((subject) => (
                <Link
                  key={subject}
                  href={`/exam/setup?subject=${encodeURIComponent(subject)}`}
                  title={`${subjectCountMap[subject] ?? 0} questions`}
                  className="subject-pill"
                  style={subjectPillStyle(subject)}
                >
                  {subject}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
