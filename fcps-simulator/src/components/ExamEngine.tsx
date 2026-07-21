'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PremiumResultScreen from './PremiumResultScreen'
import { logger } from '@/lib/logger'

interface Question {
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
}

interface ExamEngineProps {
  sessionId:        string
  questions:        Question[]
  subject:          string
  mode:             'exam' | 'practice'
  userId:           string
  timeLimitSeconds: number
}

type Answer = string | null
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']

function getOptionText(q: Question, label: string): string | null {
  const map: Record<string, string | null | undefined> = {
    A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d, E: q.option_e,
  }
  return map[label] ?? null
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ExamEngine({ sessionId, questions, subject, mode, userId, timeLimitSeconds }: ExamEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers,      setAnswers]      = useState<Answer[]>(Array(questions.length).fill(null))
  const [submitted,    setSubmitted]    = useState(false)
  const [timeLeft,     setTimeLeft]     = useState(timeLimitSeconds)
  const [showExplain,  setShowExplain]  = useState<boolean[]>(Array(questions.length).fill(false))
  const [saving,       setSaving]       = useState(false)
  const [submitError,  setSubmitError]  = useState<string | null>(null)
  // Filled in AFTER the server grades the attempt. Correct answers never
  // exist client-side before this point for exam mode.
  const [gradedQuestions, setGradedQuestions] = useState<Question[] | null>(
    mode === 'practice' ? questions : null
  )
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)
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
      const { data, error } = await supabase.rpc('submit_exam_attempt', {
        p_session_id: sessionId,
        p_answers: answers,
      })

      if (error) throw error

      const graded = data as { score: number; total_questions: number }
      setResult({ score: graded.score, total: graded.total_questions })

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
          setGradedQuestions(questions.map((q) => byId.get(q.id) ?? q))
        }
      }

      setSubmitted(true)
    } catch (err: any) {
      logger.error('exam_submit_failed', { sessionId, userId, error: err?.message })
      setSubmitError('We could not submit your exam. Please check your connection and try again.')
      submittingRef.current = false
    } finally {
      setSaving(false)
    }
  }, [answers, sessionId, userId, mode, questions, submitted])

  useEffect(() => {
    if (submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [submitted, handleSubmit])

  const currentQ   = questions[currentIndex]
  const answered   = answers.filter(Boolean).length
  const unanswered = questions.length - answered

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

  const handleAdvance = () => {
    for (let i = currentIndex + 1; i < questions.length; i++) {
      if (answers[i] === null) { setCurrentIndex(i); return }
    }
    for (let i = 0; i < currentIndex; i++) {
      if (answers[i] === null) { setCurrentIndex(i); return }
    }
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1)
    else setCurrentIndex(0)
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
      />
    )
  }

  const pctTime   = (timeLeft / timeLimitSeconds) * 100
  const timeColor = timeLeft < 300 ? '#ef4444' : timeLeft < 600 ? '#f59e0b' : '#0d9488'

  return (
    <div className="h-screen w-screen overflow-hidden no-select" style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <header style={{ flexShrink: 0, background: '#ffffff', borderBottom: '2px solid #0d9488', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(13,148,136,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', boxShadow: '0 0 0 3px rgba(13,148,136,0.15)' }} />
          <div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {subject} · {mode === 'practice' ? 'Practice Mode' : 'Exam Mode'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 800, lineHeight: 1 }}>
              Q{currentIndex + 1} <span style={{ color: '#94a3b8', fontWeight: 500 }}>of {questions.length}</span>
              &nbsp;·&nbsp;<span style={{ color: '#0d9488' }}>{answered}</span> answered
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
        <button onClick={handleSubmit} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? <span className="spinner" style={{ width: 13, height: 13 }} /> : 'Submit'}
        </button>
      </header>

      {submitError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 20px', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
          {submitError} <button onClick={handleSubmit} style={{ textDecoration: 'underline', marginLeft: 8 }}>Retry</button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '10px 18px', overflow: 'hidden', maxWidth: 'calc(100% - 240px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="animate-fade-in" key={currentIndex} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 6 }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderLeft: '4px solid #0d9488', borderRadius: 12, padding: '12px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', flexShrink: 0, maxHeight: '34vh', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#0d9488', display: 'inline-block' }} />
                Question {currentIndex + 1}
              </div>
              <p style={{ fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.55, fontWeight: 600, margin: 0 }}>
                {currentQ.question_text}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, overflow: 'hidden' }}>
              {OPTION_LABELS.filter((l) => {
                const txt = getOptionText(currentQ, l)
                return txt && txt.trim() !== ''
              }).map((label) => (
                <button key={label} className={getOptionClass(label)} onClick={() => selectAnswer(label)} disabled={submitted}
                  style={{ padding: '8px 14px', fontSize: '0.83rem', minHeight: 'unset', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ minWidth: 26, height: 26, background: 'rgba(13,148,136,0.12)', border: '1.5px solid rgba(13,148,136,0.25)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#0d9488', flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ lineHeight: 1.4 }}>{getOptionText(currentQ, label)}</span>
                </button>
              ))}
            </div>

            {(mode === 'practice' && showExplain[currentIndex] && answers[currentIndex]) && (
              <div style={{ padding: '8px 12px', background: 'rgba(13,148,136,0.07)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 10, flexShrink: 0 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0d9488', marginBottom: 3 }}>💡 Explanation</div>
                <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {currentQ.explanation || 'No explanation provided.'}
                </p>
                <div style={{ marginTop: 4, fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>✓ Correct Answer: {currentQ.correct_answer}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexShrink: 0, marginTop: '10px' }}>
              <button className="btn btn-primary btn-sm" onClick={handleAdvance} style={{ minWidth: '80px' }}>Skip</button>
              <button className="btn btn-primary btn-sm" onClick={handleAdvance} style={{ minWidth: '80px' }}>Next →</button>
            </div>
          </div>
        </div>

        <aside style={{ width: 200, background: '#ffffff', borderLeft: '1px solid #e2e8f0', padding: '10px 8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            📅 Question Palette
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2, alignContent: 'start', overflow: 'hidden' }}>
            {questions.map((_, i) => (
              <button key={i}
                className={i === currentIndex ? 'palette-btn current' : answers[i] ? 'palette-btn answered-v2' : 'palette-btn'}
                onClick={() => { if (mode !== 'exam') setCurrentIndex(i) }}
                style={{ width: '100%', aspectRatio: '1', borderRadius: 5, fontSize: questions.length > 75 ? '0.42rem' : questions.length > 50 ? '0.5rem' : '0.58rem', fontWeight: 700, padding: 0, minWidth: 0, cursor: mode === 'exam' ? 'not-allowed' : 'pointer', opacity: mode === 'exam' ? 0.9 : 1 }}>
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary btn-full" style={{ fontSize: '0.68rem', padding: '7px', marginTop: 8 }}>
            {saving ? 'Submitting...' : `Submit (${unanswered} left)`}
          </button>
        </aside>
      </div>
    </div>
  )
}
