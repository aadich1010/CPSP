import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          Complete Exam History
        </h1>
      </div>

      <div className="glass" style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Subject</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Score</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {attempts?.map((a) => {
              const pct = Math.round((a.score / a.total_questions) * 100)
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{a.subject}</td>
                  <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: '#64748b' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 20px', fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{a.score} / {a.total_questions} ({pct}%)</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${pct >= 60 ? 'badge-active' : 'badge-expired'}`}>
                      {pct >= 60 ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
