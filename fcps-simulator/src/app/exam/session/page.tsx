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

  // Only pull fields the client is allowed to see BEFORE grading.
  // correct_answer / explanation are NEVER sent to the browser for exam mode.
  const selectCols =
    mode === 'practice'
      ? 'id, question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, subject'
      : 'id, question_text, option_a, option_b, option_c, option_d, option_e, subject'

  let allQuestions: any[] = []
  let from = 0
  const pageSize = 1000
  let fetchError = null

  while (true) {
    let query = supabase.from('questions').select(selectCols).range(from, from + pageSize - 1)
    if (subject !== 'Mixed (All Subjects)') query = query.eq('subject', subject)

    const { data, error } = await query
    if (error) { fetchError = error; break }
    if (!data || data.length === 0) break

    allQuestions = allQuestions.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }

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

  const shuffled  = [...allQuestions].sort(() => Math.random() - 0.5)
  const questions = shuffled.slice(0, count)
  const questionIds = questions.map((q) => q.id)

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
