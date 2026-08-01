import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

// Simplified: render content immediately, always full-width and visible.
// (The previous framer-motion whileInView version could leave sections
// stuck at opacity:0 / translateY when the in-view trigger didn't fire,
// which made the page look scattered and left-shifted. Plain block is
// robust and needs no client JS.)
export default function Reveal({ children, className }: RevealProps) {
  return <div className={`w-full ${className ?? ''}`}>{children}</div>
}
