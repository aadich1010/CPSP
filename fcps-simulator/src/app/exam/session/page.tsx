import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamEngine from '@/components/ExamEngine'
import Icon from '@/design-system/Icon';
import { SUBJECT_GROUPS } from '@/lib/subjects'

export default async function ExamSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; count?: string; mode?: string; group?: string; examSlug?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_status, full_name')
    .eq('id', user.id)
    .single()
  const isPremium = profile?.role === 'admin' || profile?.subscription_status === 'active'
  const candidateName = profile?.full_name || user.email || 'Candidate'
  // Printed on the assessment report; comes from the auth record rather
  // than the profile row so it always matches the account actually signed in.
  const candidateEmail = user.email ?? undefined

  const params  = await searchParams
  const subject = params.subject || 'Mixed (All Subjects)'
  let   count   = Math.min(Math.max(parseInt(params.count || '50') || 50, 1), 200)
  const mode    = params.mode === 'practice' ? 'practice' : 'exam'

  // ── MULTI-EXAM PATH (non-FCPS) ────────────────────────────────────────
  // A completely separate branch, not a modification of the FCPS logic
  // below it -- get_exam_questions_for_exam() draws from question_exam_tags
  // instead of the subject/subject_list system, and the session this
  // creates carries exam_configuration_id so submit_exam_attempt() (see
  // supabase/migrations/20260822000000_multi_exam_platform_foundation.sql)
  // applies negative marking when the exam calls for it.
  if (params.examSlug && params.examSlug !== 'fcps-part1') {
    const { data: examType } = await supabase
      .from('exam_types')
      .select('id, display_name')
      .eq('slug', params.examSlug)
      .eq('is_active', true)
      .single()

    if (!examType) redirect('/exam/setup')

    const { data: config } = await supabase
      .from('exam_configurations')
      .select('id, questions_per_block, minutes_per_block')
      .eq('exam_type_id', examType.id)
      .eq('is_live', true)
      .single()

    if (!config) redirect('/exam/setup')

    let examCount = config.questions_per_block
    if (!isPremium) examCount = Math.min(examCount, 10)

    const { data: examQuestions, error: examFetchError } = await supabase.rpc('get_exam_questions_for_exam', {
      p_exam_slug: params.examSlug,
      p_count: examCount,
      p_mode: mode,
    })

    if (examFetchError?.message?.includes('DEMO_ATTEMPTS_EXHAUSTED')) {
      redirect('/subscription-expired')
    }

    if (examFetchError || !examQuestions?.length) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: 16, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}><Icon name="empty" /></div>
          <p style={{ fontSize: '1rem', fontWeight: 500, maxWidth: 380 }}>
            No {examType.display_name} questions are tagged yet — check back soon, or contact support.
          </p>
          <a href="/dashboard" className="btn btn-ghost">← Back to Dashboard</a>
        </div>
      )
    }

    const examQuestionIds = examQuestions.map((q: { id: string }) => q.id)
    const examTimeLimitSeconds = config.minutes_per_block * 60

    const { data: examSession, error: examSessionError } = await supabase
      .from('exam_sessions')
      .insert({
        user_id: user.id,
        subject: examType.display_name,
        mode,
        question_ids: examQuestionIds,
        time_limit_seconds: examTimeLimitSeconds,
        exam_configuration_id: config.id,
      })
      .select('id, started_at')
      .single()

    if (examSessionError || !examSession) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
          Could not start exam session. Please try again.
        </div>
      )
    }

    return (
      <ExamEngine
        sessionId={examSession.id}
        questions={examQuestions}
        subject={examType.display_name}
        mode={mode}
        userId={user.id}
        timeLimitSeconds={examTimeLimitSeconds}
        candidateName={candidateName}
        candidateEmail={candidateEmail}
        shuffleAnswers={isPremium}
        examLabel={examType.display_name}
      />
    )
  }

  // A "Start Mixed Exam" pick scoped to one paper (from the exam setup
  // wizard's weightage popup) arrives as ?group=<paper name> alongside a
  // human-readable ?subject= label like 'Mixed (Paper I — Basic
  // Sciences)'. Resolve that paper name back to its member subjects here
  // (SUBJECT_GROUPS is the single source of truth -- see src/lib/subjects.ts)
  // and pass them to get_exam_questions() as p_subject_list so the actual
  // filter is driven by real subject membership, not by re-parsing the
  // display label.
  const group = params.group
    ? SUBJECT_GROUPS.find((g) => g.name === params.group)
    : undefined
  const subjectList = group ? group.subjects : undefined

  // Demo accounts are hard-capped to 10 questions / 5 minutes. This is
  // just for a correct timer -- get_exam_questions() enforces the same
  // cap server-side regardless of what count is requested here, so this
  // isn't the real security boundary, just keeping the UI honest.
  if (!isPremium) count = Math.min(count, 10)

  // Questions now come only through get_exam_questions(), a SECURITY DEFINER
  // RPC that checks subscription_status = 'active' server-side, picks a
  // random subset itself, and only returns correct_answer/explanation for
  // practice mode. The raw questions table has no client-readable policy
  // anymore -- see supabase/migrations/20260722010000_lock_down_questions_table.sql.
  const { data: allQuestions, error: fetchError } = await supabase.rpc('get_exam_questions', {
    p_subject: subject,
    p_count: count,
    p_mode: mode,
    p_subject_list: subjectList,
  })

  // Demo accounts get exactly 3 completed attempts (see 20260805010000
  // migration) -- get_exam_questions() raises this specific error once
  // they're used up, so send them to the same "subscribe now" screen the
  // 3-day expiry uses, instead of a confusing generic failure.
  if (fetchError?.message?.includes('DEMO_ATTEMPTS_EXHAUSTED')) {
    redirect('/subscription-expired')
  }

  if (fetchError || !allQuestions?.length) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: 16 }}>
        <div style={{ fontSize: '3rem' }}><Icon name="empty" /></div>
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
      candidateName={candidateName}
      candidateEmail={candidateEmail}
      shuffleAnswers={isPremium}
      examLabel="FCPS Part 1"
    />
  )
}
