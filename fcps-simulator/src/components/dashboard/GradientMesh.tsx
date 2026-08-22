'use client'

import { motion } from 'framer-motion'

/**
 * GradientMesh
 * -----------------------------------------------------------------------------
 * Purely decorative, non-intrusive floating gradient-orb background for the
 * student dashboard. Reuses the existing `.float-orb` keyframe from
 * globals.css (already used elsewhere in the app) for the base motion so we
 * don't duplicate animation logic -- Framer Motion only adds the slow
 * horizontal drift on top, since CSS keyframes alone can't easily vary that
 * per-orb without writing N separate keyframe blocks.
 *
 * Zero scrollbar risk: the wrapper is `absolute inset-0 overflow-hidden
 * pointer-events-none`, so orbs can never expand page layout or intercept
 * clicks/taps, and `-z-10` keeps it behind every real UI element including
 * the (unchanged) Subject Cards grid.
 *
 * Usage: render once, as the first child of a `position: relative` ancestor
 * that already clips overflow (the dashboard's scrollable container does).
 */
export default function GradientMesh() {
  const orbs = [
    { size: 340, colorFrom: 'from-emerald-300/30', colorTo: 'to-teal-300/5', style: { top: '-8%', left: '-6%' }, duration: 20, drift: 24 },
    { size: 280, colorFrom: 'from-fuchsia-300/25', colorTo: 'to-purple-300/5', style: { top: '4%', right: '-8%' }, duration: 26, drift: -18 },
    { size: 300, colorFrom: 'from-amber-300/25', colorTo: 'to-orange-300/5', style: { bottom: '-10%', left: '18%' }, duration: 23, drift: 16 },
    { size: 220, colorFrom: 'from-sky-300/25', colorTo: 'to-cyan-300/5', style: { bottom: '6%', right: '10%' }, duration: 19, drift: -14 },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`float-orb ${i % 2 === 1 ? 'float-orb-delay' : ''} absolute rounded-full bg-gradient-to-br ${orb.colorFrom} ${orb.colorTo} blur-3xl`}
          style={{ width: orb.size, height: orb.size, ...orb.style }}
          animate={{ x: [0, orb.drift, 0] }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
