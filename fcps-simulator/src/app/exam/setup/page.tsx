'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Play, ChevronDown, ArrowLeft, ArrowRight, Check, Shuffle } from 'lucide-react'
import Icon from '@/design-system/Icon';
import { SUBJECT_GROUPS } from '@/lib/subjects'

const MIXED_ALL = 'Mixed (All Subjects)'

// Demo accounts now get every subject (see 20260805000000 migration) --
// only the 10-question cap and the fixed (non-shuffled) question set
// still distinguish demo from a paid account.

type Step = 1 | 2 | 3 | 4

export default function ExamSetupPage() {
  const router = useRouter()
  const [isPremium, setIsPremium] = useState(false)
  const [loading,   setLoading]   = useState(true)

  const [step, setStep] = useState<Step>(1)
  // groupName is null once "Mixed (All Subjects)" is picked at step 1 --
  // there's no group to drill into, so step 2 is skipped entirely.
  const [groupName, setGroupName] = useState<string | null>(null)
  const [subject,   setSubject]   = useState(MIXED_ALL)
  const [count,     setCount]     = useState('50')
  const [mode,      setMode]      = useState('exam')

  // Live per-subject question-bank size, so a subject with no content yet
  // (e.g. a newly-added card the admin hasn't populated) is visibly "0
  // questions" here instead of only failing after "Begin Exam" is clicked.
  // Same RPC the dashboard's "Practice by Subject" grid already uses --
  // see get_subject_question_counts() in
  // supabase/migrations/20260806010000_add_subject_question_counts_rpc.sql.
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      const premium = profile?.subscription_status === 'active'
      setIsPremium(premium)
      setCount(premium ? '50' : '10')
      setLoading(false)
    })

    supabase.rpc('get_subject_question_counts').then(({ data }) => {
      const counts: Record<string, number> = {}
      ;(data as { subject: string; question_count: number }[] | null)?.forEach((s) => {
        counts[s.subject] = s.question_count
      })
      setSubjectCounts(counts)
    })

    // pre-select from URL ?subject= (e.g. clicked a card on the dashboard)
    // -- jump straight to the count/mode step since the subject's already
    // decided, same shortcut the old single-screen picker offered.
    const sp = new URLSearchParams(window.location.search)
    const pre = sp.get('subject')
    if (pre) {
      setSubject(pre)
      const owningGroup = SUBJECT_GROUPS.find((g) => (g.subjects as string[]).includes(pre))
      setGroupName(owningGroup?.name ?? null)
      setStep(3)
    }
  }, [router])

  const totalQuestions = useMemo(
    () => Object.values(subjectCounts).reduce((sum, n) => sum + n, 0),
    [subjectCounts]
  )

  const activeGroup = SUBJECT_GROUPS.find((g) => g.name === groupName) ?? null

  function pickMixedAll() {
    setGroupName(null)
    setSubject(MIXED_ALL)
    setStep(3)
  }

  function pickGroup(name: string) {
    setGroupName(name)
    setStep(2)
  }

  function pickSubject(s: string) {
    setSubject(s)
    setStep(3)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/exam/session?subject=${encodeURIComponent(subject)}&count=${count}&mode=${mode}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Paper' },
    { n: 2, label: 'Subject' },
    { n: 3, label: 'Format' },
    { n: 4, label: 'Review' },
  ]

  return (
    <div className="h-screen bg-[#F9FAFB] flex items-center justify-center px-4 py-4 overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}>
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Configure Your Exam</h1>
          <p className="mt-1 text-sm text-slate-500">A few quick steps and you&apos;re in</p>
        </div>

        {/* Stepper */}
        <div className="mb-4 flex items-center justify-center gap-2">
          {steps.map((s, i) => {
            // Step 2 doesn't apply once Mixed (All Subjects) was picked at
            // step 1 -- show it as skipped rather than pending so the
            // stepper doesn't look stuck.
            const skipped = s.n === 2 && groupName === null && step > 1
            const done = step > s.n || skipped
            const current = step === s.n
            return (
              <div key={s.n} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    current
                      ? 'bg-emerald-500 text-white shadow-[0_0_0_3px_rgba(16,185,129,0.2)]'
                      : done
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  title={s.label}
                >
                  {done && !current ? <Check size={13} /> : s.n}
                </div>
                <span className={`text-xs font-semibold ${current ? 'text-slate-700' : 'text-slate-400'}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <div className="h-px w-5 bg-slate-200" />}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-lg">

          {/* Demo banner */}
          {!isPremium && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 leading-relaxed">
              <Icon name="unlocked" /> Demo Access — all subjects unlocked, 10 fixed questions per exam (same questions, same order, every time), up to 3 attempts within 3 days. Subscribe to unlock the full question bank and longer mocks.
            </div>
          )}

          {/* ── STEP 1: PAPER ── */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-bold text-slate-700">Which paper are you practicing?</h2>
                <p className="mt-0.5 text-xs text-slate-400">Pick a section, or mix everything together.</p>
              </div>
              <div className="space-y-2">
                {SUBJECT_GROUPS.map((g) => {
                  const groupCount = g.subjects.reduce((sum, s) => sum + (subjectCounts[s] ?? 0), 0)
                  return (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => pickGroup(g.name)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-800">{g.name}</div>
                          <div className="mt-0.5 text-xs text-slate-400">{g.description}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pl-3">
                          <span className="text-[10px] font-bold text-slate-400">{groupCount} questions</span>
                          <ArrowRight size={14} className="text-slate-300" />
                        </div>
                      </div>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={pickMixedAll}
                  className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shuffle size={15} className="text-emerald-600" />
                      <div>
                        <div className="text-sm font-bold text-emerald-700">Mixed (All Subjects)</div>
                        <div className="mt-0.5 text-xs text-emerald-600/70">One exam drawing from every subject in the bank.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pl-3">
                      <span className="text-[10px] font-bold text-emerald-600">{totalQuestions} questions</span>
                      <ArrowRight size={14} className="text-emerald-400" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: SUBJECT (within chosen paper) ── */}
          {step === 2 && activeGroup && (
            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-bold text-slate-700">{activeGroup.name}</h2>
                <p className="mt-0.5 text-xs text-slate-400">Choose one subject to focus on.</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {activeGroup.subjects.map((s) => {
                  const available = subjectCounts[s] ?? 0
                  const empty = available === 0
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => pickSubject(s)}
                      title={empty ? 'No questions in this subject yet' : undefined}
                      className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                        empty
                          ? 'border-slate-200 bg-slate-50 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50/50'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div>{s}</div>
                      <div className={`mt-0.5 text-[10px] font-bold ${empty ? 'text-amber-500' : 'text-slate-400'}`}>
                        {empty ? 'No questions yet' : `${available} questions`}
                      </div>
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-600"
              >
                <ArrowLeft size={13} /> Back to papers
              </button>
            </div>
          )}

          {/* ── STEP 3: FORMAT (count & mode) ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-700">Exam format</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Practicing <span className="font-bold text-slate-600">{subject}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Questions */}
                <div>
                  <label htmlFor="count" className="mb-2 block text-sm font-bold text-slate-700">
                    Questions
                  </label>
                  <div className="relative">
                    <select
                      id="count"
                      value={count}
                      onChange={e => setCount(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] cursor-pointer"
                    >
                      {!isPremium ? (
                        <option value="10">10 Questions (Demo Limit)</option>
                      ) : (
                        <>
                          <option value="25">25 Questions (~30 min)</option>
                          <option value="50">50 Questions (~60 min)</option>
                          <option value="100">100 Questions (Full Mock)</option>
                          <option value="200">200 Questions (Grand Mock)</option>
                        </>
                      )}
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Mode */}
                <div>
                  <label htmlFor="mode" className="mb-2 block text-sm font-bold text-slate-700">
                    Exam Mode
                  </label>
                  <div className="relative">
                    <select
                      id="mode"
                      value={mode}
                      onChange={e => setMode(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] cursor-pointer"
                    >
                      <option value="exam">Exam Mode (no instant feedback)</option>
                      <option value="practice">Practice Mode (instant feedback)</option>
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(groupName ? 2 : 1)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-600"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
                >
                  Review <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: REVIEW & START ── */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-700">Review your exam</h2>
                <p className="mt-0.5 text-xs text-slate-400">Confirm the details, then begin.</p>
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50">
                {[
                  { label: 'Subject', value: subject },
                  { label: 'Questions', value: `${count} questions` },
                  { label: 'Mode', value: mode === 'exam' ? 'Exam Mode (no instant feedback)' : 'Practice Mode (instant feedback)' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="font-semibold text-slate-500">{row.label}</span>
                    <span className="font-bold text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-600"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.55)]"
                >
                  <Play size={16} fill="white" />
                  Begin Exam
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-3 text-center">
          <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-slate-600">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
