'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Share2 } from 'lucide-react'

export interface ReferralWidgetProps {
  /** Shareable link. Defaults to the site root with a `?ref=` tag built
   *  from the student's own id -- the tag is currently INERT (nothing on
   *  the backend reads or credits it yet). Wire up a `referrals` table +
   *  a check in activateSubscription() (src/app/admin/user-actions.ts)
   *  before advertising this as an actual reward to students, so "Invite &
   *  Earn" doesn't promise something the app can't yet deliver. */
  referralLink: string
  /** Renders at roughly half the normal footprint so it can sit side-by-
   *  side with HeroBanner in a single row below the dashboard's
   *  SocialProofTicker. */
  compact?: boolean
}

export default function ReferralWidget({ referralLink, compact = false }: ReferralWidgetProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can be unavailable (older WebViews, permission
      // denial) -- fail silently rather than throwing in the UI; the link
      // is still visible in the input for a manual copy.
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'FCPS Simulator', text: 'Practice for FCPS Part 1 with me:', url: referralLink })
      } catch {
        // User cancelled the native share sheet -- not an error.
      }
    } else {
      handleCopy()
    }
  }

  if (compact) {
    return (
      <div className="w-full max-w-full rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 p-[1.5px]">
        <div className="flex w-full max-w-full flex-col gap-1.5 rounded-xl bg-white p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <div className="min-w-0">
            <h3 className="text-[11px] font-extrabold text-slate-900">Invite &amp; Earn</h3>
          </div>

          <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
            <input
              readOnly
              value={referralLink}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-[26px] min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] text-slate-600 sm:w-32 sm:flex-none"
            />

            <motion.button
              type="button"
              onClick={handleCopy}
              whileTap={{ scale: 0.95 }}
              className="flex min-h-[26px] items-center gap-1 rounded-md bg-emerald-600 px-2 text-[10px] font-bold text-white transition hover:bg-emerald-700"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied!' : 'Copy'}
            </motion.button>

            <motion.button
              type="button"
              onClick={handleShare}
              whileTap={{ scale: 0.95 }}
              className="flex min-h-[26px] items-center gap-1 rounded-md border border-slate-200 px-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <Share2 size={11} />
              Share
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 p-[1.5px]">
      <div className="flex w-full max-w-full flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">Invite &amp; Earn</h3>
          <p className="mt-0.5 break-words text-xs text-slate-500 sm:text-sm">
            Share your link with classmates preparing for FCPS Part 1.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <input
            readOnly
            value={referralLink}
            onFocus={(e) => e.currentTarget.select()}
            className="min-h-[44px] min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-600 sm:w-56 sm:flex-none sm:text-sm"
          />

          <motion.button
            type="button"
            onClick={handleCopy}
            whileTap={{ scale: 0.95 }}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 sm:text-sm"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>

          <motion.button
            type="button"
            onClick={handleShare}
            whileTap={{ scale: 0.95 }}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 sm:text-sm"
          >
            <Share2 size={15} />
            Share
          </motion.button>
        </div>
      </div>
    </div>
  )
}
