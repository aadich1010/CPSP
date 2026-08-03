import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Real accuracy-by-difficulty. The tab used to render a hard-coded
  // array to every student; this aggregates their own answers against
  // each question's difficulty tag.
  const { data: difficultyRows } = await supabase.rpc('get_difficulty_breakdown')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 10, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          ← Back to Dashboard
        </Link>
      </div>
      
      {/* The main Analytics Dashboard component */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <AnalyticsClient attempts={attempts || []} difficultyRows={difficultyRows || []} />
      </div>
    </div>
  )
}

