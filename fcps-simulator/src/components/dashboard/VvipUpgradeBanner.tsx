'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Infinity as InfinityIcon, BarChart3, Sparkles } from 'lucide-react'

export interface VvipUpgradeBannerProps {
  pricingHref?: string
  /** Real count of currently-active subscribers (see dashboard/page.tsx --
   *  a plain `count: 'exact', head: true` query against profiles where
   *  subscription_status = 'active'). Never hardcode a guessed number here:
   *  a trust badge that overstates adoption is exactly the kind of
   *  manufactured social proof that erodes trust once a student notices. */
  joinedCount: number
  /** Optional real deadline for an actual time-limited offer (e.g.
   *  AZADI_OFFER_DEADLINE from src/lib/azadiOffer.ts). Omit or pass a past
   *  date to hide the countdown entirely -- a countdown with no real
   *  expiring offer behind it is a dark pattern, not urgency. */
  offerDeadline?: Date
  /** Defaults to 'FCPS Part 1' so every pre-existing/FCPS candidate sees
   *  exactly the same banner copy as before. Pass the candidate's own
   *  target exam name (dashboard/page.tsx) for anyone registered for a
   *  different exam (e.g. MS/MD (JCAT)). */
  examLabel?: string
}

const FEATURES = [
  { icon: InfinityIcon, label: 'Unlimited Mocks' },
  { icon: BarChart3, label: 'AI Analytics' },
  { icon: Sparkles, label: 'High-Yield MCQs' },
]

function useCountdown(deadline: Date | undefined) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!deadline) return
    const tick = () => setRemaining(Math.max(0, deadline.getTime() - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (!deadline || remaining === null || remaining <= 0) return null

  const totalSeconds = Math.floor(remaining / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { hours, minutes, seconds }
}

export default function VvipUpgradeBanner({
  pricingHref = '/#pricing',
  joinedCount,
  offerDeadline,
  examLabel = 'FCPS Part 1',
}: VvipUpgradeBannerProps) {
  const countdown = useCountdown(offerDeadline)

  return (
    // No overflow-hidden here on purpose: .border-beam (globals.css) draws
    // its shimmering ring via a ::before at inset: -1px, and clipping the
    // container would cut that ring off right at the edge instead of
    // letting it show around the card. The gradient background itself
    // still respects the rounded corners without needing clipping.
    <div className="border-beam relative w-full max-w-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-xl sm:p-7">
      <div className="flex w-full max-w-full flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex min-h-[24px] items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
              VVIP
            </span>
            {joinedCount > 0 && (
              <span className="truncate text-[11px] font-semibold text-emerald-300">
                Joined by {joinedCount.toLocaleString('en-PK')}+ candidates
              </span>
            )}
          </div>

          <h2 className="mt-2 break-words text-lg font-extrabold text-white sm:text-xl">
            Unlock the full {examLabel} question bank
          </h2>
          <p className="mt-1 max-w-full break-words text-xs text-slate-300 sm:text-sm">
            Timed mock exams, performance analytics, and every subject — no limits.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white sm:text-xs"
              >
                <f.icon size={13} className="shrink-0 text-emerald-300" />
                {f.label}
              </span>
            ))}
          </div>

          {countdown && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
              <span>Offer ends in</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 tabular-nums">
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        <motion.div
          animate={{ boxShadow: ['0 0 0px rgba(16,185,129,0.0)', '0 0 28px rgba(16,185,129,0.55)', '0 0 0px rgba(16,185,129,0.0)'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full shrink-0 rounded-2xl md:w-auto"
        >
          <Link
            href={pricingHref}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:scale-[1.02] md:w-auto"
          >
            Unlock Full Access
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
