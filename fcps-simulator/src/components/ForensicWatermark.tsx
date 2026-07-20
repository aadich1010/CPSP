'use client'

import { useEffect } from 'react'

interface ForensicWatermarkProps {
  userEmail: string
  userName: string
}

export default function ForensicWatermark({ userEmail, userName }: ForensicWatermarkProps) {
  const text = `${userName} · ${userEmail}`

  useEffect(() => {
    // Detect DevTools open (basic)
    const devToolsCheck = setInterval(() => {
      const threshold = 160
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        document.body.style.filter = 'blur(10px)'
      } else {
        document.body.style.filter = 'none'
      }
    }, 1000)

    return () => clearInterval(devToolsCheck)
  }, [])

  // Generate a grid of watermark text
  const rows  = 8
  const cols  = 4
  const items = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push(
        <div
          key={`${r}-${c}`}
          className="watermark-text"
          style={{
            top:  `${(r * 100) / rows}%`,
            left: `${(c * 100) / cols}%`,
          }}
        >
          {text}
        </div>
      )
    }
  }

  return (
    <div className="forensic-watermark" aria-hidden="true">
      {items}
    </div>
  )
}
