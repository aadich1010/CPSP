'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

export interface HeroBannerProps {
  name: string
  /** 0-100. Real average score from the student's own exam_attempts (see
   *  dashboard/page.tsx) -- never a placeholder number. */
  avgScore: number
  totalAttempts: number
  /** Consecutive days with at least one exam attempt, computed server-side
   *  from real exam_attempts.created_at rows (see dashboard/page.tsx). 0 if
   *  the student hasn't practiced today or yesterday, so the streak doesn't
   *  falsely claim to still be "alive". */
  streakDays: number
  isPremium: boolean
  /** Renders at roughly half the normal footprint (smaller padding, text,
   *  and progress ring) so it can sit side-by-side with ReferralWidget in
   *  a single row below the dashboard's SocialProofTicker. */
  compact?: boolean
}

/** Score-tier label, derived purely from the student's own real avgScore --
 *  never a fabricated leaderboard position, since this app has no actual
 *  cross-student ranking system to draw a real one from. */
function tierFor(avgScore: number, attempts: number): { label: string; color: string } {
  if (attempts === 0) return { label: 'Getting Started', color: '#64748b' }
  if (avgScore >= 85) return { label: 'Elite Performer', color: '#7c3aed' }
  if (avgScore >= 70) return { label: 'Strong Performer', color: '#0d9488' }
  if (avgScore >= 50) return { label: 'Building Momentum', color: '#d97706' }
  return { label: 'Needs Practice', color: '#dc2626' }
}

export default function HeroBanner({ name, avgScore, totalAttempts, streakDays, isPremium, compact = false }: HeroBannerProps) {
  const tier = tierFor(avgScore, totalAttempts)
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, avgScore))
  const dashOffset = circumference - (pct / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`relative w-full max-w-full overflow-hidden border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/80 shadow-sm ${
        compact ? 'rounded-2xl p-2.5' : 'rounded-3xl p-4 sm:p-6'
      }`}
    >
      <div className={`flex w-full items-center justify-between ${compact ? 'gap-2' : 'flex-col items-stretch gap-4 sm:flex-row sm:justify-between'}`}>
        {/* Greeting + streak + tier badge */}
        <div className="min-w-0 flex-1">
          <h1 className={`truncate font-extrabold text-slate-900 ${compact ? 'text-xs' : 'text-lg sm:text-xl'}`}>
            {compact ? <>Dr. {name}</> : <>Good day, Dr. {name}</>}
          </h1>

          <div className={`flex flex-wrap items-center ${compact ? 'mt-1 gap-1' : 'mt-2 gap-2'}`}>
            {streakDays > 0 && (
              <motion.span
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className={`inline-flex items-center gap-1 rounded-full bg-orange-100 font-bold text-orange-700 ${
                  compact ? 'min-h-[18px] px-1.5 py-0.5 text-[9px]' : 'min-h-[28px] px-3 py-1 text-xs'
                }`}
              >
                <Flame size={compact ? 10 : 14} className="shrink-0" />
                {streakDays}{compact ? 'd' : ` day${streakDays === 1 ? '' : 's'}`} streak
              </motion.span>
            )}

            <span
              className={`inline-flex items-center rounded-full font-bold text-white ${
                compact ? 'min-h-[18px] px-1.5 py-0.5 text-[9px]' : 'min-h-[28px] px-3 py-1 text-xs'
              }`}
              style={{ background: tier.color }}
            >
              {tier.label}
            </span>

            {!isPremium && !compact && (
              <span className="inline-flex min-h-[28px] items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                Demo Access
              </span>
            )}
          </div>
        </div>

        {/* Progress ring -- real average score, not decorative */}
        <div className={`flex shrink-0 items-center justify-center self-center ${compact ? 'gap-1.5' : 'gap-3'}`}>
          <div className={`relative shrink-0 ${compact ? 'h-10 w-10' : 'h-20 w-20 sm:h-24 sm:w-24'}`}>
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
              <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <motion.circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="url(#heroRingGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="heroRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-extrabold text-slate-800 ${compact ? 'text-[9px]' : 'text-base sm:text-lg'}`}>{Math.round(pct)}%</span>
              {!compact && (
                <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">avg score</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
