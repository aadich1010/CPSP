'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Play, ChevronDown } from 'lucide-react'

const ALL_SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology',
  'Pharmacology', 'Microbiology', 'Forensic Medicine',
  'Community Medicine', 'Surgery', 'Medicine',
  'Obstetrics & Gynecology', 'Pediatrics', 'ENT', 'Ophthalmology',
  'Mixed (All Subjects)',
]

const DEMO_SUBJECTS = ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology']

export default function ExamSetupPage() {
  const router = useRouter()
  const [isPremium, setIsPremium] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [subject,   setSubject]   = useState('Anatomy')
  const [count,     setCount]     = useState('50')
  const [mode,      setMode]      = useState('exam')

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
      setSubject('Anatomy')
      setCount(premium ? '50' : '10')
      setLoading(false)
    })

    // pre-select from URL ?subject=
    const sp = new URLSearchParams(window.location.search)
    const pre = sp.get('subject')
    if (pre) setSubject(pre)
  }, [router])

  const SUBJECTS = isPremium ? ALL_SUBJECTS : DEMO_SUBJECTS

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

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: 'radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}>
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Configure Your Exam</h1>
          <p className="mt-1 text-sm text-slate-500">Choose subject and number of questions</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-lg">

          {/* Demo banner */}
          {!isPremium && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 leading-relaxed">
              🔓 Demo Access — 4 subjects, 10 questions per exam. Ask the admin to upgrade your account for the full question bank and longer mocks.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── SUBJECT GRID ── */}
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-700">
                Subject
                <span className="ml-2 text-xs font-normal text-slate-400">— select one</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                      subject === s
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ── DIVIDER ── */}
            <div className="h-px bg-slate-100" />

            {/* ── COUNT & MODE side by side ── */}
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
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] cursor-pointer"
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
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] cursor-pointer"
                  >
                    <option value="exam">Exam Mode (no instant feedback)</option>
                    <option value="practice">Practice Mode (instant feedback)</option>
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* ── SUBMIT ── */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.55)]"
            >
              <Play size={16} fill="white" />
              Begin Exam
            </button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-slate-600">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
