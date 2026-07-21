import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamEngine from '@/components/ExamEngine'

export default async function ExamSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; count?: string; mode?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params  = await searchParams
  const subject = params.subject || 'Mixed (All Subjects)'
  const count   = Math.min(Math.max(parseInt(params.count || '50') || 50, 1), 200)
  const mode    = params.mode === 'practice' ? 'practice' : 'exam'

  // Questions now come only through get_exam_questions(), a SECURITY DEFINER
  // RPC that checks subscription_status = 'active' server-side, picks a
  // random subset itself, and only returns correct_answer/explanation for
  // practice mode. The raw questions table has no client-readable policy
  // anymore -- see supabase/migrations/20260722010000_lock_down_questions_table.sql.
  const { data: allQuestions, error: fetchError } = await supabase.rpc('get_exam_questions', {
    p_subject: subject,
    p_count: count,
    p_mode: mode,
  })

  if (fetchError || !allQuestions?.length) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: 16 }}>
        <div style={{ fontSize: '3rem' }}>📭</div>
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>
          No questions found for <strong style={{ color: '#0d9488' }}>{subject}</strong>.
        </p>
        <a href="/exam/setup" className="btn btn-ghost">← Back to Setup</a>
      </div>
    )
  }

  // get_exam_questions() already picks a random subset limited to `count`
  // server-side, so no further client-side shuffle/slice is needed.
  const questions = allQuestions
  const questionIds = questions.map((q: { id: string }) => q.id)

  const timeLimitSeconds =
    count <= 10 ? 300 : count <= 25 ? 1800 : count <= 50 ? 3600 : count <= 100 ? 7200 : 10800

  // Server records the START TIME. The RPC that grades the exam re-derives
  // elapsed time from THIS row, never from anything the client claims.
  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: user.id,
      subject,
      mode,
      question_ids: questionIds,
      time_limit_seconds: timeLimitSeconds,
    })
    .select('id, started_at')
    .single()

  if (sessionError || !session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
        Could not start exam session. Please try again.
      </div>
    )
  }

  return (
    <ExamEngine
      sessionId={session.id}
      questions={questions}
      subject={subject}
      mode={mode}
      userId={user.id}
      timeLimitSeconds={timeLimitSeconds}
    />
  )
}
