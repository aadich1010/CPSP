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

export default function HeroBanner({ name, avgScore, totalAttempts, streakDays, isPremium }: HeroBannerProps) {
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
      className="relative w-full max-w-full overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/80 p-4 shadow-sm sm:p-6"
    >
      <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Greeting + streak + tier badge */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold text-slate-900 sm:text-xl">
            Good day, Dr. {name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {streakDays > 0 && (
              <motion.span
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex min-h-[28px] items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700"
              >
                <Flame size={14} className="shrink-0" />
                {streakDays} day{streakDays === 1 ? '' : 's'} streak
              </motion.span>
            )}

            <span
              className="inline-flex min-h-[28px] items-center rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ background: tier.color }}
            >
              {tier.label}
            </span>

            {!isPremium && (
              <span className="inline-flex min-h-[28px] items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                Demo Access
              </span>
            )}
          </div>
        </div>

        {/* Progress ring -- real average score, not decorative */}
        <div className="flex shrink-0 items-center justify-center gap-3 self-center">
          <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
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
              <span className="text-base font-extrabold text-slate-800 sm:text-lg">{Math.round(pct)}%</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">avg score</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
