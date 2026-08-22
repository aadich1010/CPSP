'use client'

// USMLE-only inter-block break interstitial. FCPS's Full Mock (Paper 1 -> 2)
// and MS/MD JCAT don't have a break concept at all -- this page only exists
// because USMLE's real exam gives candidates a single 45-minute break pool
// shared across every gap between its 7 blocks (see exam_configurations,
// migration 20260822080000, and exam/session's isUsmle branch which computes
// nextExamHref pointing here).
//
// The countdown here is purely a UX convenience -- it never re-derives or
// enforces anything server-side. Whatever breakPoolSeconds is left when the
// candidate presses Continue (or the pool hits 0 and it auto-continues) is
// just carried forward as the next block's starting ?breakPoolSeconds=, the
// same way every other USMLE param threads through the block chain.

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Coffee, ArrowRight } from 'lucide-react'
import Icon from '@/design-system/Icon'

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function BreakContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const examSlug = searchParams.get('examSlug') || 'usmle-step1'
  const nextBlock = parseInt(searchParams.get('nextBlock') || '2', 10) || 2
  const totalBlocks = parseInt(searchParams.get('totalBlocks') || '7', 10) || 7
  const track = searchParams.get('track') === 'step2ck' ? 'step2ck' : 'step1'
  const initialPoolSeconds = parseInt(searchParams.get('breakPoolSeconds') || '2700', 10) || 0

  const [remaining, setRemaining] = useState(initialPoolSeconds)
  const [continuing, setContinuing] = useState(false)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [remaining])

  function goToNextBlock(secondsLeft: number) {
    if (continuing) return
    setContinuing(true)
    const qs = new URLSearchParams({
      examSlug,
      mode: 'exam',
      block: String(nextBlock),
      totalBlocks: String(totalBlocks),
      breakPoolSeconds: String(Math.max(0, secondsLeft)),
      track,
    })
    router.push(`/exam/session?${qs.toString()}`)
  }

  // Auto-continue the instant the shared pool runs out -- exactly like the
  // real exam, which starts the next block automatically once break time
  // is exhausted rather than waiting on the candidate.
  useEffect(() => {
    if (remaining === 0) goToNextBlock(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  const blocksDone = nextBlock - 1
  const poolExhausted = remaining <= 0

  return (
    <div className="h-screen bg-[#F9FAFB] flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <Coffee size={26} />
        </div>
        <h1 className="mt-4 text-lg font-black text-slate-900">Block {blocksDone} of {totalBlocks} complete</h1>
        <p className="mt-1 text-sm text-slate-500">
          Take a break, or continue straight to Block {nextBlock}.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Shared Break Time Remaining</div>
          <div className={`mt-1 text-4xl font-black tabular-nums ${poolExhausted ? 'text-red-500' : 'text-slate-800'}`}>
            {formatClock(remaining)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            One pool of break time is shared across every gap between all {totalBlocks} blocks — exactly like the real exam.
          </div>
        </div>

        <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${(blocksDone / totalBlocks) * 100}%` }}
          />
        </div>

        <button
          type="button"
          disabled={continuing}
          onClick={() => goToNextBlock(remaining)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] disabled:opacity-60"
        >
          {continuing ? (
            <>Loading Block {nextBlock}…</>
          ) : (
            <>Skip Break & Continue to Block {nextBlock} <ArrowRight size={16} /></>
          )}
        </button>

        <p className="mt-3 text-[11px] text-slate-400">
          <Icon name="info" size="xs" /> The next block starts automatically once your break pool reaches 00:00.
        </p>
      </div>
    </div>
  )
}

export default function ExamBreakPage() {
  return (
    <Suspense fallback={null}>
      <BreakContent />
    </Suspense>
  )
}
