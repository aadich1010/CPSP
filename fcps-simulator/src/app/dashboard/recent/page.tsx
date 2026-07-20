import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RecentExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('score, total_questions, subject, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          Recent Exams History
        </h1>
      </div>

      <div className="glass" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {!attempts || attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📝</div>
            <p style={{ color: '#64748b' }}>No exams taken yet. Start your first mock to see history here!</p>
            <Link href="/exam/setup" className="btn btn-primary" style={{ marginTop: 16 }}>
              Start Mock Exam
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {attempts.map((a, i) => {
              const pct = Math.round((a.score / a.total_questions) * 100)
              const date = new Date(a.created_at).toLocaleDateString('en-PK', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: '#ffffff',
                    border: '1px solid rgba(13,148,136,0.1)',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 700, marginBottom: 4 }}>
                      {a.subject}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {date}
                    </div>
                  </div>
                  <div 
                    style={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: '50%', 
                      background: pct < 50 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      border: `2px solid ${pct < 50 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: pct < 50 ? '#dc2626' : '#059669'
                    }}
                  >
                    {pct}%
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
