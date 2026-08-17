'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Play, ArrowLeft, ArrowRight, Check, Shuffle, X } from 'lucide-react'
import Icon from '@/design-system/Icon';
import { SUBJECT_GROUPS } from '@/lib/subjects'

const MIXED_ALL = 'Mixed (All Subjects)'

// Step 3 choice-cards (replaces the old native <select> dropdowns, which
// looked out of place next to the tactile card pickers used everywhere
// else in this wizard).
const COUNT_CHOICES = [
  { value: '25',  sub: '~30 min' },
  { value: '50',  sub: '~60 min' },
  { value: '100', sub: 'Full Mock' },
  { value: '200', sub: 'Grand Mock' },
]
const MODE_CHOICES = [
  { value: 'exam',     label: 'Exam Mode',     sub: 'No instant feedback' },
  { value: 'practice', label: 'Practice Mode', sub: 'Instant feedback' },
]

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
  // Set only when "Start Mixed Exam" was chosen from a paper's weightage
  // popup -- carries the paper name through to submit so /exam/session can
  // resolve it back to a subject list server-side (see ?group= handling in
  // src/app/exam/session/page.tsx). null for a single-subject pick or the
  // global "Mixed (All Subjects)" pick.
  const [mixedGroupName, setMixedGroupName] = useState<string | null>(null)
  // Which paper's weightage popup is open, if any (step 1 only).
  const [weightagePopup, setWeightagePopup] = useState<string | null>(null)

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

  const activeGroup = SUBJECT_GROUPS.find((g) => g.name === groupName) ?? null
  const popupGroup  = SUBJECT_GROUPS.find((g) => g.name === weightagePopup) ?? null

  // Weightage breakdown for the open popup -- estimated from how many
  // questions each subject actually contributes to this paper's bank,
  // NOT an official CPSP-published percentage (CPSP's syllabus lists
  // topics per paper but no numeric weightage table -- see commit
  // message on 20260811250000_mixed_paper_exam_subject_list.sql).
  const popupBreakdown = useMemo(() => {
    if (!popupGroup) return []
    const total = popupGroup.subjects.reduce((sum, s) => sum + (subjectCounts[s] ?? 0), 0)
    return popupGroup.subjects
      .map((s) => {
        const n = subjectCounts[s] ?? 0
        return { subject: s, n, pct: total > 0 ? Math.round((n / total) * 100) : 0 }
      })
      .sort((a, b) => b.n - a.n)
  }, [popupGroup, subjectCounts])

  function pickMixedAll() {
    setGroupName(null)
    setMixedGroupName(null)
    setSubject(MIXED_ALL)
    setStep(3)
  }

  function pickGroup(name: string) {
    setWeightagePopup(null)
    setGroupName(name)
    setMixedGroupName(null)
    setStep(2)
  }

  function pickSubject(s: string) {
    setMixedGroupName(null)
    setSubject(s)
    setStep(3)
  }

  function startMixedForGroup(name: string) {
    setWeightagePopup(null)
    setGroupName(null)
    setMixedGroupName(name)
    setSubject(`Mixed (${name})`)
    setStep(3)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qs = new URLSearchParams({ subject, count, mode })
    if (mixedGroupName) qs.set('group', mixedGroupName)
    router.push(`/exam/session?${qs.toString()}`)
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

        {/* Weightage popup -- opens when a paper is picked at step 1 */}
        {popupGroup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
            onClick={() => setWeightagePopup(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{popupGroup.name}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Estimated weightage from the current question bank
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWeightagePopup(null)}
                  className="text-slate-300 transition hover:text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 max-h-64 space-y-2.5 overflow-y-auto pr-1">
                {popupBreakdown.map((row) => (
                  <div key={row.subject}>
                    <div className="mb-0.5 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600">{row.subject}</span>
                      <span className="font-bold text-slate-400">{row.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => pickGroup(popupGroup.name)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                  Practice a specific subject
                </button>
                <button
                  type="button"
                  onClick={() => startMixedForGroup(popupGroup.name)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-bold text-white shadow-[0_0_16px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02]"
                >
                  <Shuffle size={13} /> Start Mixed Exam — All of {popupGroup.name.split(' — ')[0]}
                </button>
              </div>
            </div>
          </div>
        )}

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
                {SUBJECT_GROUPS.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => setWeightagePopup(g.name)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{g.name}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{g.description}</div>
                      </div>
                      <ArrowRight size={14} className="shrink-0 text-slate-300" />
                    </div>
                  </button>
                ))}
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
                    <ArrowRight size={14} className="shrink-0 text-emerald-400" />
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
                  const empty = (subjectCounts[s] ?? 0) === 0
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => pickSubject(s)}
                      title={`${subjectCounts[s] ?? 0} questions`}
                      className={`truncate rounded-lg px-3 py-2.5 text-center text-xs font-bold text-white transition-all ${
                        empty
                          ? 'cursor-not-allowed bg-slate-300'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_2px_8px_rgba(16,185,129,0.25)] hover:scale-[1.03] hover:shadow-[0_4px_14px_rgba(16,185,129,0.4)]'
                      }`}
                      disabled={empty}
                    >
                      {s}
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
                {/* Questions -- tactile choice-cards instead of a native
                    <select>, matching the card-picker feel of Steps 1/2/4. */}
                <div>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Questions
                  </span>
                  {!isPremium ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 text-center text-sm font-bold text-emerald-700">
                      10 Questions <span className="font-semibold text-emerald-600/70">(Demo Limit)</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {COUNT_CHOICES.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCount(opt.value)}
                          aria-pressed={count === opt.value}
                          className={`rounded-xl border px-3 py-2 text-center transition-all ${
                            count === opt.value
                              ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.35)]'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                          }`}
                        >
                          <div className="text-sm font-black">{opt.value}</div>
                          <div className={`text-[10px] font-semibold ${count === opt.value ? 'text-white/80' : 'text-slate-400'}`}>
                            {opt.sub}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mode */}
                <div>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Exam Mode
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {MODE_CHOICES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMode(opt.value)}
                        aria-pressed={mode === opt.value}
                        className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-all ${
                          mode === opt.value
                            ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.35)]'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        <span className="text-sm font-bold">{opt.label}</span>
                        <span className={`text-[10px] font-semibold ${mode === opt.value ? 'text-white/80' : 'text-slate-400'}`}>
                          {opt.sub}
                        </span>
                      </button>
                    ))}
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
