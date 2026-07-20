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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          ← Back to Dashboard
        </Link>
      </div>
      
      {/* The main Analytics Dashboard component */}
      <AnalyticsClient attempts={attempts || []} />
    </div>
  )
}

