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
  const count   = Math.min(parseInt(params.count || '50'), 200)
  const mode    = params.mode === 'practice' ? 'practice' : 'exam'

  // Fetch questions in pages to bypass Supabase 1000-row limit
  let allQuestions: any[] = []
  let from = 0
  const limit = 1000
  let fetchError = null

  while (true) {
    let query = supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, subject')
      .range(from, from + limit - 1)

    if (subject !== 'Mixed (All Subjects)') {
      query = query.eq('subject', subject)
    }

    const { data, error } = await query
    if (error) {
      fetchError = error
      break
    }
    if (!data || data.length === 0) break

    allQuestions = allQuestions.concat(data)
    if (data.length < limit) break
    from += limit
  }

  if (fetchError || !allQuestions?.length) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          gap: 16,
        }}
      >
        <div style={{ fontSize: '3rem' }}>📭</div>
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>
          No questions found for <strong style={{ color: '#0d9488' }}>{subject}</strong>.
        </p>
        <a href="/exam/setup" className="btn btn-ghost">
          ← Back to Setup
        </a>
      </div>
    )
  }

  // Shuffle and slice
  const shuffled  = [...allQuestions].sort(() => Math.random() - 0.5)
  const questions = shuffled.slice(0, count)

  const timeLimitSeconds = count <= 10 ? 300 : count <= 25 ? 1800 : count <= 50 ? 3600 : count <= 100 ? 7200 : 10800

  return (
    <ExamEngine
      questions={questions}
      subject={subject}
      mode={mode}
      userId={user.id}
      timeLimitSeconds={timeLimitSeconds}
    />
  )
}
