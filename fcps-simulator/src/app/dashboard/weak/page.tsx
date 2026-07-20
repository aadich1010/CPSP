import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function WeakSubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all attempts to calculate subject-wise performance
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('score, total_questions, subject')
    .eq('user_id', user.id)

  const subjectMap: Record<string, { total: number; correct: number }> = {}
  attempts?.forEach((a) => {
    if (!subjectMap[a.subject]) subjectMap[a.subject] = { total: 0, correct: 0 }
    subjectMap[a.subject].total   += a.total_questions
    subjectMap[a.subject].correct += a.score
  })

  const performance = Object.entries(subjectMap)
    .map(([subject, data]) => ({
      subject,
      pct: Math.round((data.correct / data.total) * 100),
      totalQuestions: data.total
    }))
    .sort((a, b) => a.pct - b.pct)

  const weakSubjects = performance.filter(p => p.pct < 60)
  const strongSubjects = performance.filter(p => p.pct >= 60)

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          Weak Subjects Analysis
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1, overflow: 'hidden' }}>
        {/* Left: Weak Subjects List */}
        <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Areas Needing Improvement
          </h2>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {weakSubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎯</div>
                <p style={{ color: '#64748b' }}>No weak subjects found! Keep up the great work.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {weakSubjects.map((s) => (
                  <div key={s.subject}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 700 }}>{s.subject}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: s.pct < 40 ? '#dc2626' : '#d97706' }}>{s.pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${s.pct}%`, 
                          background: s.pct < 40 
                            ? 'linear-gradient(90deg, #ef4444, #f87171)' 
                            : 'linear-gradient(90deg, #f59e0b, #fcd34d)',
                          borderRadius: 4
                        }} 
                      />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
                      Based on {s.totalQuestions} questions attempted
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Strong Subjects List */}
        <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#059669', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            ✅ Mastered Subjects
          </h2>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {strongSubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: '#64748b' }}>Complete more exams to identify your strengths.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {strongSubjects.map((s) => (
                  <div key={s.subject}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 700 }}>{s.subject}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669' }}>{s.pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${s.pct}%`, 
                          background: 'linear-gradient(90deg, #10b981, #34d399)',
                          borderRadius: 4
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
