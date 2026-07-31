'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

// Lightweight scroll-into-view reveal. Kept as its own tiny client island
// (like FaqAccordion) so the landing page itself stays a Server Component —
// only the handful of things that actually need the browser (motion,
// interactivity) ship JS.
export default function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      className={`w-full ${className ?? ''}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
