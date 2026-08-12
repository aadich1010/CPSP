import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HistoryPageContent from '@/components/HistoryPageComponent'

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          Complete Exam History
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <HistoryPageContent initialAttempts={attempts ?? []} />
      </div>
    </div>
  )
}
