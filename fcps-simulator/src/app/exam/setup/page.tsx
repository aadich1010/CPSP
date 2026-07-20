import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ALL_SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology',
  'Pharmacology', 'Microbiology', 'Forensic Medicine',
  'Community Medicine', 'Surgery', 'Medicine',
  'Obstetrics & Gynecology', 'Pediatrics', 'ENT', 'Ophthalmology',
  'Mixed (All Subjects)',
]

const DEMO_SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology'
]

export default async function ExamSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const isPremium = profile?.subscription_status === 'active'
  const SUBJECTS = isPremium ? ALL_SUBJECTS : DEMO_SUBJECTS

  const params = await searchParams
  const preSelected = params.subject || ''

  return (
    <div
      className="min-h-screen gradient-bg flex items-center justify-center px-4"
      style={{ padding: '32px 16px' }}
    >
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            Configure Your Exam
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Choose subject and number of questions
          </p>
        </div>

        <div className="glass" style={{ padding: '28px 24px' }}>
          <form method="GET" action="/exam/session">
            <div className="form-group">
              <label className="label" htmlFor="subject">Subject</label>
              <select
                id="subject"
                name="subject"
                className="input"
                defaultValue={preSelected}
                style={{ cursor: 'pointer' }}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="count">Number of Questions</label>
              <select id="count" name="count" className="input" defaultValue={isPremium ? "50" : "10"} style={{ cursor: 'pointer' }}>
                {!isPremium ? (
                  <option value="10">10 Questions (Demo Limit)</option>
                ) : (
                  <>
                    <option value="25">25 Questions (~30 min)</option>
                    <option value="50">50 Questions (~60 min)</option>
                    <option value="100">100 Questions (Full Mock)</option>
                    <option value="200">200 Questions (Grand Mock)</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="mode">Exam Mode</label>
              <select id="mode" name="mode" className="input" style={{ cursor: 'pointer' }}>
                <option value="exam">Exam Mode (no instant feedback)</option>
                <option value="practice">Practice Mode (instant feedback)</option>
              </select>
            </div>

            <div className="divider" />

            <button type="submit" className="btn btn-primary btn-full btn-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Begin Exam
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/dashboard" style={{ color: '#475569', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
