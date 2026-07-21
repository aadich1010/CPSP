import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology',
  'Pharmacology', 'Microbiology', 'Forensic Medicine',
  'Community Medicine', 'Surgery', 'Medicine',
  'Obstetrics & Gynecology', 'Pediatrics', 'ENT', 'Ophthalmology',
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, subscription_expires_at, subscription_status')
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
  const expiresAt = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A'

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 0 }}>
          Good day, Dr. {name} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
          Subscription active · Expires {expiresAt}
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
          { label: 'Total Attempts', value: totalAttempts, icon: '📝', color: '#0f766e' },
          { label: 'Average Score',  value: `${avgScore}%`, icon: '📊', color: '#16a34a' },
          { label: 'Subjects',       value: SUBJECTS.length, icon: '📚', color: '#7c3aed' },
          { label: 'Weak Areas',     value: weakSubjects.length, icon: '⚠️', color: '#d97706' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card"
            style={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: '1.1rem' }}>{stat.icon}</div>
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
            📊 Analysis
          </Link>
          <Link href="/dashboard/history" className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>
            📋 History
          </Link>
          <Link href="/dashboard/recent" className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>
            📝 Recent Exams
          </Link>
          <Link href="/dashboard/weak" className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>
            ⚠️ Weak Subjects
          </Link>
        </div>
      </div>

      {/* Subject Grid */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Practice by Subject
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 8,
          }}
        >
          {SUBJECTS.map((subject) => {
            const data = subjectMap[subject]
            const pct  = data ? Math.round((data.correct / data.total) * 100) : null
            return (
              <Link
                key={subject}
                href={`/exam/setup?subject=${encodeURIComponent(subject)}`}
                className="glass-card"
                style={{ padding: '10px 12px', textDecoration: 'none' }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    marginBottom: pct !== null ? 4 : 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {subject}
                </div>
                {pct !== null && (
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: pct >= 60 ? '#16a34a' : '#d97706',
                      fontWeight: 700,
                    }}
                  >
                    {pct}% last attempt
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
      </div>
    </div>
  )
}
