'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PremiumResultScreen from './PremiumResultScreen'
import AntiTheft from './AntiTheft'
import ForensicWatermark from './ForensicWatermark'
import { logger } from '@/lib/logger'
import Icon from '@/design-system/Icon';

export interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e?: string | null
  correct_answer?: string   // absent for exam mode until after grading
  explanation?: string | null
  subject: string
  // Optional Roman Urdu (Urdu language, English/Latin letters) versions --
  // supplied by the admin via Bulk Import (see admin/questions/import),
  // never auto-translated. Null/empty for any question that hasn't been
  // translated yet -- the UI falls back to the English field whenever so.
  roman_urdu_question_text?: string | null
  roman_urdu_option_a?:      string | null
  roman_urdu_option_b?:      string | null
  roman_urdu_option_c?:      string | null
  roman_urdu_option_d?:      string | null
  roman_urdu_option_e?:      string | null
  roman_urdu_explanation?:   string | null
}

interface ExamEngineProps {
  sessionId:        string
  questions:        Question[]
  subject:          string
  mode:             'exam' | 'practice'
  userId:           string
  timeLimitSeconds: number
  /** Shown on the result screen's header and included on the printed
   *  report so a printout is identifiable as this candidate's. */
  candidateName?:   string
  /** Printed on the assessment report so a physical copy is traceable. */
  candidateEmail?:  string
  /** Default true (paid exam behaviour: options shuffled once per attempt,
   *  same as question order being randomised server-side). Pass false for
   *  demo accounts so the fixed question set also keeps a fixed, unshuffled
   *  option order -- the whole demo attempt looks identical every time. */
  shuffleAnswers?:  boolean
  /** Passed straight through to PremiumResultScreen's header/printed
   *  report. Defaults to 'FCPS Part 1' -- see that component's Props for
   *  the full explanation. */
  examLabel?:       string
  /** Used only to word the entry modal's marking line correctly (e.g. MS/MD
   *  JCAT has none, so it says so explicitly). Does not affect scoring --
   *  submit_exam_attempt() decides that server-side from the session's own
   *  exam_configuration. Default false matches every exam except MS/MD's
   *  now-corrected config (see 20260822030000_msmd_jcat_no_negative_
   *  marking.sql) and any other exam still shipped with weight 0. */
  hasNegativeMarking?: boolean
  /** Shows a mandatory pre-exam rules popup (question count, time limit,
   *  marking scheme, examLabel) with a "Start Exam" button before the
   *  question view and countdown timer appear at all. Default false --
   *  FCPS keeps its existing "drop straight into the exam" behaviour;
   *  opt in per exam type from exam/session/page.tsx. */
  entryModal?:       boolean
  /** Lets the candidate move to ANY question at any time via Next,
   *  Previous, or the palette -- no "must answer before advancing" gate
   *  and no one-time Skip limit. Default false keeps FCPS's existing
   *  forced-linear-progress flow completely unchanged. */
  freeNavigation?:   boolean
  /** Adds a "Mark for Review" toggle per question, highlighted distinctly
   *  in the side palette. Default false -- palette keeps its current/
   *  answered-only colouring for every exam that doesn't opt in. */
  allowMarkForReview?: boolean
  /** Total marks for the paper when it's NOT simply "1 mark per question"
   *  (e.g. MS/MD JCAT: 100 MCQs but 250 total marks, 2.5 marks per correct
   *  answer -- see the exam pattern spec in exam/session/page.tsx). Only
   *  changes the entry-modal wording and the result screen's score
   *  display; the underlying percentage is identical either way since the
   *  marks-per-question multiplier is constant, so nothing about grading
   *  or pass/fail changes. Undefined (default) keeps every exam's existing
   *  "1 mark per correct answer, out of {questionCount}" wording exactly
   *  as before. */
  totalMarks?: number
}

type Answer = string | null
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']

function getOptionText(q: Question, label: string): string | null {
  const map: Record<string, string | null | undefined> = {
    A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d, E: q.option_e,
  }
  return map[label] ?? null
}

// Roman Urdu counterpart of getOptionText() -- same original-letter lookup,
// just against the roman_urdu_option_* fields instead. Used so shuffling
// can move the roman text alongside its English pair without the two ever
// drifting apart (see shuffleOptions() below).
function getRomanOptionText(q: Question, label: string): string | null {
  const map: Record<string, string | null | undefined> = {
    A: q.roman_urdu_option_a, B: q.roman_urdu_option_b, C: q.roman_urdu_option_c,
    D: q.roman_urdu_option_d, E: q.roman_urdu_option_e,
  }
  return map[label] ?? null
}

const OPTION_FIELDS = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e'] as const
const ROMAN_OPTION_FIELDS = [
  'roman_urdu_option_a', 'roman_urdu_option_b', 'roman_urdu_option_c',
  'roman_urdu_option_d', 'roman_urdu_option_e',
] as const

function shuffle<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** A question whose options have been re-ordered for display, plus the two
 *  lookup tables needed to move between what the student SEES and what the
 *  database actually stores.
 *
 *  The answer key in `questions.correct_answer` is a letter (A-E) tied to the
 *  original column order, and grading happens server-side against that letter.
 *  So shuffling has to be purely presentational: the student picks display
 *  letter "B", we translate it back to whatever original letter that text came
 *  from before submitting, and translate the revealed key forward again so the
 *  review screen highlights the right row. Reordering without this mapping is
 *  exactly how a shuffle silently marks every answer wrong. */
export interface ShuffledQuestion {
  display:    Question
  toOriginal: Record<string, string>
  toDisplay:  Record<string, string>
}

export function shuffleOptions(q: Question): ShuffledQuestion {
  const present = OPTION_LABELS.filter((l) => {
    const t = getOptionText(q, l)
    return t !== null && t.trim() !== ''
  })
  const order = shuffle(present)

  const display: Question = { ...q }
  OPTION_FIELDS.forEach((field, i) => {
    const src = order[i]
    ;(display as unknown as Record<string, string | null>)[field] =
      src ? getOptionText(q, src) : null
  })
  // Roman Urdu options must land on the SAME shuffled positions as their
  // English counterparts, or toggling the language mid-attempt would show
  // option B's English text next to option D's Roman Urdu text.
  ROMAN_OPTION_FIELDS.forEach((field, i) => {
    const src = order[i]
    ;(display as unknown as Record<string, string | null>)[field] =
      src ? getRomanOptionText(q, src) : null
  })

  const toOriginal: Record<string, string> = {}
  const toDisplay:  Record<string, string> = {}
  order.forEach((originalLabel, i) => {
    toOriginal[OPTION_LABELS[i]] = originalLabel
    toDisplay[originalLabel] = OPTION_LABELS[i]
  })

  // Practice mode ships the key inline, so translate it up front.
  if (q.correct_answer && toDisplay[q.correct_answer]) {
    display.correct_answer = toDisplay[q.correct_answer]
  }

  return { display, toOriginal, toDisplay }
}

/** Same shape as shuffleOptions(), but the identity mapping -- options
 *  stay in their original A/B/C/D/E order. Used for demo accounts so the
 *  fixed question set also has a fixed, unshuffled option order every
 *  attempt (see get_exam_questions() in 20260805000000_demo_3day_fixed_
 *  questions_all_subjects.sql for the matching "don't shuffle the
 *  questions either" half of this). */
export function identityOptions(q: Question): ShuffledQuestion {
  const present = OPTION_LABELS.filter((l) => {
    const t = getOptionText(q, l)
    return t !== null && t.trim() !== ''
  })

  const toOriginal: Record<string, string> = {}
  const toDisplay:  Record<string, string> = {}
  present.forEach((label) => {
    toOriginal[label] = label
    toDisplay[label] = label
  })

  return { display: { ...q }, toOriginal, toDisplay }
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ExamEngine({ sessionId, questions: rawQuestions, subject, mode, userId, timeLimitSeconds, candidateName, candidateEmail, shuffleAnswers = true, examLabel = 'FCPS Part 1', hasNegativeMarking = false, entryModal = false, freeNavigation = false, allowMarkForReview = false, totalMarks }: ExamEngineProps) {
  // Shuffled ONCE per mount (lazy initialiser), never on re-render -- otherwise
  // the options would jump around under the student's cursor every tick of the
  // timer. Question ORDER is already randomised per attempt server-side by
  // get_exam_questions(); this adds per-attempt option order on top.
  // Demo accounts pass shuffleAnswers={false} -- identityOptions() keeps
  // A/B/C/D/E in their original order so the fixed demo question set looks
  // exactly the same on every attempt, by anyone.
  const [shuffled] = useState<ShuffledQuestion[]>(() =>
    rawQuestions.map(shuffleAnswers ? shuffleOptions : identityOptions)
  )
  // Memoised: `shuffled` is stable from useState, so `questions` keeps a
  // stable identity. Rebuilding it each render would re-fire the timer
  // effect (handleSubmit depends on it) on every single tick.
  const questions  = useMemo(() => shuffled.map((s) => s.display), [shuffled])

  // When entryModal is on, the exam (and its countdown) doesn't begin until
  // the candidate dismisses the rules popup via "Start Exam". Exams that
  // don't opt in (entryModal=false) start immediately, exactly as before.
  const [started,      setStarted]      = useState(!entryModal)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers,      setAnswers]      = useState<Answer[]>(Array(questions.length).fill(null))
  const [markedForReview, setMarkedForReview] = useState<boolean[]>(Array(questions.length).fill(false))
  // A question can be skipped without answering exactly ONCE. Once true,
  // the Skip button is disabled for that question -- the only way past it
  // on a second visit is to actually answer it.
  const [skippedOnce,  setSkippedOnce]  = useState<boolean[]>(Array(questions.length).fill(false))
  const [submitted,    setSubmitted]    = useState(false)
  const [timeLeft,     setTimeLeft]     = useState(timeLimitSeconds)
  const [showExplain,  setShowExplain]  = useState<boolean[]>(Array(questions.length).fill(false))
  // Roman Urdu toggle -- persists across questions/navigation within one
  // attempt (global, not per-question), available in both Practice Mode
  // and Exam Mode. Falls back to English automatically per-field wherever
  // a question has no roman_urdu_* text yet (see romanOr() below).
  const [showRoman,    setShowRoman]    = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [submitError,  setSubmitError]  = useState<string | null>(null)
  // Filled in AFTER the server grades the attempt. Correct answers never
  // exist client-side before this point for exam mode.
  const [gradedQuestions, setGradedQuestions] = useState<Question[] | null>(
    mode === 'practice' ? questions : null
  )
  const [result, setResult] = useState<{ score: number; total: number; finalScore: number | null } | null>(null)
  // Stamped when the server accepts the submission, so the printed report
  // shows when the attempt was actually sat rather than when it was printed.
  const [submittedAt, setSubmittedAt] = useState<Date | undefined>(undefined)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittingRef = useRef(false) // hard guard against double-submit races

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current || submitted) return
    submittingRef.current = true
    setSaving(true)
    setSubmitError(null)
    if (timerRef.current) clearInterval(timerRef.current)

    const supabase = createClient()
    try {
      // Server re-derives elapsed time from exam_sessions.started_at and
      // grades against questions.correct_answer itself. Client-sent answers
      // are the ONLY thing trusted from the browser; score is never trusted.
      // Translate the student's DISPLAY letters back to the original
      // column letters the answer key is stored against. Without this the
      // server would grade shuffled picks against unshuffled keys.
      const originalAnswers = answers.map((a, i) =>
        a ? (shuffled[i]?.toOriginal[a] ?? a) : null
      )

      const { data, error } = await supabase.rpc('submit_exam_attempt', {
        p_session_id: sessionId,
        p_answers: originalAnswers,
      })

      if (error) throw error

      // submit_exam_attempt() is `returns table (...)`, so PostgREST hands
      // back an ARRAY of rows -- reading .score straight off `data` yielded
      // undefined and silently dropped the authoritative server score,
      // making the result screen fall back to its local recount.
      // final_score is only non-null for exams with negative marking (see
      // supabase/migrations/20260822000000_multi_exam_platform_foundation.sql)
      // -- every FCPS attempt still gets null here and PremiumResultScreen
      // falls back to plain `score`, exactly as before this existed.
      const graded = (Array.isArray(data) ? data[0] : data) as
        { score: number; total_questions: number; final_score: number | null } | undefined
      if (graded) setResult({ score: graded.score, total: graded.total_questions, finalScore: graded.final_score })

      if (mode === 'exam') {
        // Safe to reveal correct answers now that grading already happened
        // server-side. reveal_exam_answers() checks the session belongs to
        // this user and is already submitted before returning answers --
        // see supabase/migrations/20260722010000_lock_down_questions_table.sql.
        const { data: revealed, error: revealError } = await supabase.rpc('reveal_exam_answers', {
          p_session_id: sessionId,
        }) as { data: Question[] | null; error: { message?: string } | null }

        if (revealError || !revealed) {
          logger.error('post_submit_reveal_failed', { sessionId, error: revealError?.message })
          setGradedQuestions(questions) // degrade gracefully: show without answer key
        } else {
          const byId = new Map(revealed.map((q: Question) => [q.id, q]))
          // Keep OUR shuffled option text, but take the key/explanation from
          // the reveal -- remapping the key from its original letter to the
          // display letter the student actually saw.
          setGradedQuestions(
            shuffled.map(({ display, toDisplay }) => {
              const rev = byId.get(display.id)
              if (!rev) return display
              return {
                ...display,
                correct_answer: rev.correct_answer
                  ? (toDisplay[rev.correct_answer] ?? rev.correct_answer)
                  : undefined,
                explanation: rev.explanation,
                roman_urdu_explanation: rev.roman_urdu_explanation,
              }
            })
          )
        }
      }

      setSubmittedAt(new Date())
      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error('exam_submit_failed', { sessionId, userId, error: message })
      setSubmitError('We could not submit your exam. Please check your connection and try again.')
      submittingRef.current = false
    } finally {
      setSaving(false)
    }
  }, [answers, sessionId, userId, mode, questions, shuffled, submitted])

  useEffect(() => {
    if (submitted || !started) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [submitted, started, handleSubmit])

  const currentQ     = questions[currentIndex]

  // Roman Urdu field with graceful English fallback -- a question that
  // hasn't been translated yet (roman field null/empty) just keeps
  // showing English even with the toggle on, rather than showing blank.
  function romanOr(english: string | null | undefined, roman: string | null | undefined): string {
    if (showRoman && roman && roman.trim() !== '') return roman
    return english ?? ''
  }
  const answered     = answers.filter(Boolean).length
  const unanswered   = questions.length - answered
  const allAnswered  = unanswered === 0

  function selectAnswer(label: string) {
    if (submitted) return
    const next = [...answers]; next[currentIndex] = label; setAnswers(next)
    if (mode === 'practice') {
      const ne = [...showExplain]; ne[currentIndex] = true; setShowExplain(ne)
    }
  }

  function getOptionClass(label: string) {
    const selected = answers[currentIndex] === label
    if (!submitted && !showExplain[currentIndex]) return selected ? 'option-btn selected' : 'option-btn'
    if (!currentQ.correct_answer) return selected ? 'option-btn selected' : 'option-btn'
    const isCorrect = label === currentQ.correct_answer
    if (isCorrect) return 'option-btn correct'
    if (selected && !isCorrect) return 'option-btn wrong'
    return 'option-btn'
  }

  // Forward scan first (currentIndex+1 .. end), THEN wrap to the start
  // (0 .. currentIndex-1). This is what makes skipped questions come back
  // in their original sequence order once the first pass reaches the end,
  // rather than jumping around.
  const advanceToNextUnanswered = () => {
    for (let i = currentIndex + 1; i < questions.length; i++) {
      if (answers[i] === null) { setCurrentIndex(i); return }
    }
    for (let i = 0; i < currentIndex; i++) {
      if (answers[i] === null) { setCurrentIndex(i); return }
    }
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1)
    else setCurrentIndex(0)
  }

  // Skip is only allowed the FIRST time a question is visited. On a second
  // visit (it comes back around unanswered), skippedOnce is already true,
  // the button is disabled, and answering is the only way forward.
  const handleSkip = () => {
    if (submitted || answers[currentIndex] !== null || skippedOnce[currentIndex]) return
    const next = [...skippedOnce]; next[currentIndex] = true; setSkippedOnce(next)
    advanceToNextUnanswered()
  }

  // Next only moves forward once the current question has actually been
  // answered -- answering is what "attempting" a question means here.
  const handleNext = () => {
    if (submitted || answers[currentIndex] === null) return
    advanceToNextUnanswered()
  }

  // Free-navigation variants (used only when freeNavigation=true, e.g.
  // MS/MD JCAT): no "must answer first" gate, no forward-scan-then-wrap --
  // just move one question at a time, in either direction.
  const handleNextFree = () => {
    if (submitted || currentIndex >= questions.length - 1) return
    setCurrentIndex(currentIndex + 1)
  }
  const handlePrevious = () => {
    if (submitted || currentIndex <= 0) return
    setCurrentIndex(currentIndex - 1)
  }
  const toggleMarkForReview = () => {
    if (submitted) return
    const next = [...markedForReview]
    next[currentIndex] = !next[currentIndex]
    setMarkedForReview(next)
  }

  if (entryModal && !started) {
    const timeLimitMinutes = Math.round(timeLimitSeconds / 60)
    // When a paper's total marks aren't simply "1 per question" (e.g.
    // MS/MD JCAT: 100 MCQs, 250 total marks -> 2.5 marks per correct
    // answer), show that real marks-per-question figure instead of the
    // generic "1 Mark per correct answer" line. Purely informational --
    // see the totalMarks prop doc comment above for why this never
    // touches actual grading.
    const marksPerQuestion = totalMarks ? totalMarks / questions.length : 1
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '28px 28px 24px', maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>
            Welcome to the {examLabel} Practice Examination.
          </h1>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: '#334155' }}>
              <Icon name="questionBank" />
              <span><strong>Total Number of Questions:</strong> {questions.length} MCQs (Single Best Answer)</span>
            </li>
            {totalMarks ? (
              <li style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: '#334155' }}>
                <Icon name="info" />
                <span><strong>Total Marks:</strong> {totalMarks} Marks (Each correct answer = {marksPerQuestion} marks)</span>
              </li>
            ) : null}
            <li style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: '#334155' }}>
              <Icon name="schedule" />
              <span><strong>Total Time Allowed:</strong> {timeLimitMinutes} Minutes ({Math.round((timeLimitMinutes / 60) * 100) / 100} Hours)</span>
            </li>
            <li style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: '#334155' }}>
              <Icon name="info" />
              <span>
                <strong>Marking System:</strong> {marksPerQuestion} Mark{marksPerQuestion !== 1 ? 's' : ''} per correct answer.{' '}
                {hasNegativeMarking
                  ? 'Negative marking applies for incorrect answers.'
                  : <>There is <strong>NO negative marking</strong> — a wrong answer costs no marks.</>}
              </span>
            </li>
          </ul>
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 22, fontWeight: 800 }}
            onClick={() => setStarted(true)}
          >
            Start Exam
          </button>
        </div>
      </div>
    )
  }

  if (submitted && gradedQuestions && result) {
    return (
      <PremiumResultScreen
        questions={gradedQuestions}
        answers={answers}
        subject={subject}
        mode={mode}
        score={result.score}
        total={result.total}
        finalScore={result.finalScore}
        userId={userId}
        candidateName={candidateName}
        candidateEmail={candidateEmail}
        sessionId={sessionId}
        submittedAt={submittedAt}
        examLabel={examLabel}
        totalMarks={totalMarks}
      />
    )
  }

  const pctTime   = (timeLeft / timeLimitSeconds) * 100
  const timeColor = timeLeft < 300 ? '#ef4444' : timeLeft < 600 ? '#f59e0b' : '#10B981'

  return (
    <div className="h-screen w-screen overflow-hidden no-select" style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Mounted here for the ACTIVE exam; unmounts automatically once
          `submitted` flips and this branch stops rendering. The review
          screen isn't left unprotected after that -- PremiumResultScreen
          mounts its own <AntiTheft allowPrint /> so its "Print Result"
          button keeps working. */}
      <AntiTheft />
      <ForensicWatermark userEmail={candidateEmail || ''} userName={candidateName || ''} />
      <header className="exam-header" style={{ flexShrink: 0, background: '#ffffff', borderBottom: '2px solid #10B981', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(13,148,136,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(13,148,136,0.15)' }} />
          <div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {subject} · {mode === 'practice' ? 'Practice Mode' : 'Exam Mode'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 800, lineHeight: 1 }}>
              Q{currentIndex + 1} <span style={{ color: '#94a3b8', fontWeight: 500 }}>of {questions.length}</span>
              &nbsp;·&nbsp;<span style={{ color: '#10B981' }}>{answered}</span> answered
              &nbsp;·&nbsp;<span style={{ color: '#f59e0b' }}>{unanswered}</span> remaining
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
          <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 900, color: timeColor, letterSpacing: '0.05em', lineHeight: 1 }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{ width: '100%', height: 3, background: '#e2e8f0', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctTime}%`, background: timeColor, borderRadius: 2, transition: 'width 1s linear' }} />
          </div>
        </div>
        <button
          onClick={() => setShowRoman((v) => !v)}
          className="btn btn-ghost btn-sm"
          title="Switch question language between English and Roman Urdu"
          style={{
            border: showRoman ? '1.5px solid #10B981' : '1.5px solid #e2e8f0',
            color: showRoman ? '#10B981' : '#64748b',
            fontWeight: 700,
          }}
        >
          {showRoman ? 'اردو (Roman) ✓' : 'Roman Urdu'}
        </button>
        <button onClick={handleSubmit} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? <span className="spinner" style={{ width: 13, height: 13 }} /> : 'Submit'}
        </button>
      </header>

      {submitError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 20px', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
          {submitError} <button onClick={handleSubmit} style={{ textDecoration: 'underline', marginLeft: 8 }}>Retry</button>
        </div>
      )}

      <div className="exam-layout">
        <div className="exam-main">
          <div className="animate-fade-in" key={currentIndex} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 6 }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderLeft: '4px solid #10B981', borderRadius: 12, padding: '12px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', flexShrink: 0, maxHeight: '34vh', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                Question {currentIndex + 1}
              </div>
              <p style={{ fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.55, fontWeight: 600, margin: 0 }}>
                {romanOr(currentQ.question_text, currentQ.roman_urdu_question_text)}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, overflow: 'hidden' }}>
              {OPTION_LABELS.filter((l) => {
                const txt = getOptionText(currentQ, l)
                return txt && txt.trim() !== ''
              }).map((label) => (
                <button key={label} className={getOptionClass(label)} onClick={() => selectAnswer(label)} disabled={submitted}
                  style={{ padding: '8px 14px', fontSize: '0.83rem', minHeight: 'unset', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ minWidth: 26, height: 26, background: 'rgba(13,148,136,0.12)', border: '1.5px solid rgba(13,148,136,0.25)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#10B981', flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ lineHeight: 1.4 }}>{romanOr(getOptionText(currentQ, label), getRomanOptionText(currentQ, label))}</span>
                </button>
              ))}
            </div>

            {(mode === 'practice' && showExplain[currentIndex] && answers[currentIndex]) && (
              <div style={{ padding: '8px 12px', background: 'rgba(13,148,136,0.07)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 10, flexShrink: 0 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10B981', marginBottom: 3 }}><Icon name="info" /> Explanation</div>
                <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {romanOr(currentQ.explanation, currentQ.roman_urdu_explanation) || 'No explanation provided.'}
                </p>
                <div style={{ marginTop: 4, fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>✓ Correct Answer: {currentQ.correct_answer}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexShrink: 0, marginTop: '10px', flexWrap: 'wrap' }}>
              {freeNavigation ? (
                <>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handlePrevious}
                    disabled={submitted || currentIndex === 0}
                    style={{ minWidth: '80px', opacity: currentIndex === 0 ? 0.4 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    ← Previous
                  </button>
                  {allowMarkForReview && (
                    <button
                      className="btn btn-sm"
                      onClick={toggleMarkForReview}
                      disabled={submitted}
                      style={{
                        minWidth: '140px',
                        background: markedForReview[currentIndex] ? '#7c3aed' : 'transparent',
                        color: markedForReview[currentIndex] ? '#ffffff' : '#7c3aed',
                        border: '1.5px solid #7c3aed',
                        fontWeight: 700,
                      }}
                    >
                      {markedForReview[currentIndex] ? '★ Marked for Review' : '☆ Mark for Review'}
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleNextFree}
                    disabled={submitted || currentIndex === questions.length - 1}
                    style={{ minWidth: '80px', opacity: currentIndex === questions.length - 1 ? 0.4 : 1, cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Next →
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSkip}
                    disabled={submitted || answers[currentIndex] !== null || skippedOnce[currentIndex]}
                    style={{
                      minWidth: '80px',
                      opacity: (answers[currentIndex] !== null || skippedOnce[currentIndex]) ? 0.4 : 1,
                      cursor: (answers[currentIndex] !== null || skippedOnce[currentIndex]) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {skippedOnce[currentIndex] && answers[currentIndex] === null ? 'Already Skipped' : 'Skip'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleNext}
                    disabled={submitted || answers[currentIndex] === null || allAnswered}
                    style={{
                      minWidth: '80px',
                      opacity: (answers[currentIndex] === null || allAnswered) ? 0.4 : 1,
                      cursor: (answers[currentIndex] === null || allAnswered) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {allAnswered ? 'All Answered' : 'Next →'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <aside className="exam-palette">
          <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            <Icon name="schedule" /> Question Palette
          </div>
          <div className="exam-palette-grid">
            {questions.map((_, i) => {
              const canJump = freeNavigation || mode !== 'exam'
              let cls = 'palette-btn'
              if (i === currentIndex) cls = 'palette-btn current'
              else if (allowMarkForReview && markedForReview[i]) cls = answers[i] ? 'palette-btn marked-answered' : 'palette-btn marked'
              else if (answers[i]) cls = 'palette-btn answered-v2'
              return (
                <button key={i}
                  className={cls}
                  onClick={() => { if (canJump) setCurrentIndex(i) }}
                  style={{ width: '100%', aspectRatio: '1', borderRadius: 5, fontSize: questions.length > 75 ? '0.42rem' : questions.length > 50 ? '0.5rem' : '0.58rem', fontWeight: 700, padding: 0, minWidth: 0, cursor: canJump ? 'pointer' : 'not-allowed', opacity: canJump ? 1 : 0.9 }}>
                  {i + 1}
                </button>
              )
            })}
          </div>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary btn-full" style={{ fontSize: '0.68rem', padding: '7px', marginTop: 8 }}>
            {saving ? 'Submitting...' : `Submit (${unanswered} left)`}
          </button>
        </aside>
      </div>
    </div>
  )
}
