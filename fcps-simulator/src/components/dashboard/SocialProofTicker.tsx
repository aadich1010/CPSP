'use client'

import { motion } from 'framer-motion'

export interface SocialProofTickerProps {
  /** Defaults to generic app-usage tips. Deliberately NOT fabricated
   *  per-student activity ("Dr. X just scored 92%...") -- this app has no
   *  real live-activity feed to draw that from, and inventing specific
   *  named claims would be misleading. Pass real aggregate figures here
   *  (e.g. from get_subject_question_counts()) once/if a live feed exists. */
  items?: string[]
}

const DEFAULT_ITEMS = [
  '🎯 Practice Mode shows the correct answer instantly after every question',
  '🔥 A daily streak compounds — even 10 questions a day adds up over a month',
  '📊 Check Performance → Weak Subjects to see exactly where to focus next',
  '🧠 Mixed exams draw from every subject in the bank for realistic exam pressure',
  '⏱️ Exam Mode times you like the real Part 1 CBT — use it for full mocks',
]

/**
 * SocialProofTicker
 * -----------------------------------------------------------------------------
 * Horizontal auto-scrolling marquee. The item list is duplicated once and
 * animated from 0 to -50% on a linear infinite loop, so the seam between
 * the end of the list and its repeat is invisible -- a standard seamless-
 * marquee trick. `overflow-hidden` on the outer track means the strip can
 * scale to any width without ever pushing the container's boundaries or
 * introducing a horizontal scrollbar on the page itself.
 */
export default function SocialProofTicker({ items = DEFAULT_ITEMS }: SocialProofTickerProps) {
  const track = [...items, ...items]

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white/70 py-2 backdrop-blur-sm">
      <motion.div
        className="flex w-max items-center gap-8 whitespace-nowrap px-4"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        {track.map((item, i) => (
          <span key={i} className="text-xs font-semibold text-slate-600 sm:text-sm">
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
