'use client'

import { useEffect } from 'react'

/**
 * Best-effort deterrents only. A website cannot actually block the OS-level
 * screenshot/screen-recording pipeline (PrintScreen, Snipping Tool, phone
 * camera, OBS, etc.) -- none of that traffic ever reaches the browser's JS.
 * What this CAN do:
 *   - make copy/right-click/devtools mildly harder (existing behaviour),
 *   - blank the content the instant the tab/window loses focus or becomes
 *     hidden, which blocks most screen-recording and screen-share tools
 *     (they capture whatever is actually painted on screen, and this swaps
 *     it for a blank overlay before they get a frame),
 *   - hide content entirely from print/PDF export.
 * Combined with ForensicWatermark (renders the logged-in user's name/email
 * across the screen), any capture that DOES get through is traceable back
 * to the account that took it -- deterrence, not prevention.
 */
export default function AntiTheft() {
  useEffect(() => {
    // Block right-click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()

    // Block copy
    const handleCopy = (e: ClipboardEvent) => e.preventDefault()

    // Block common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      // Ctrl+C, Ctrl+U (view source), Ctrl+Shift+I (devtools), F12, PrtScr,
      // Win+Shift+S / Cmd+Shift+3/4/5 (OS snip tools) -- these mostly won't
      // actually be interceptable since the OS handles them before the
      // browser sees them, but block what we can.
      if (
        (ctrl && e.key === 'c') ||
        (ctrl && e.key === 'u') ||
        (ctrl && e.key === 'p') ||
        (ctrl && e.shiftKey && e.key === 'I') ||
        (ctrl && e.shiftKey && e.key === 'J') ||
        (ctrl && e.shiftKey && e.key === 'C') ||
        (e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5') && (e.metaKey || e.getModifierState?.('Meta'))) ||
        (e.shiftKey && e.key.toLowerCase() === 's' && e.metaKey) ||
        e.key === 'F12' ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault()
        return false
      }
    }

    // Block drag
    const handleDragStart = (e: DragEvent) => e.preventDefault()

    // Blank the screen the moment the window loses focus or the tab is
    // hidden -- catches most screen-recording / screen-share software,
    // which keeps capturing even when the exam window isn't focused.
    const shield = document.createElement('div')
    shield.id = 'anti-theft-shield'
    Object.assign(shield.style, {
      position: 'fixed', inset: '0', background: '#0f172a', zIndex: '999999',
      display: 'none', alignItems: 'center', justifyContent: 'center',
      color: '#94a3b8', fontSize: '0.9rem', fontWeight: 700,
    })
    shield.textContent = 'Content hidden while this window is not focused.'
    document.body.appendChild(shield)

    const showShield = () => { shield.style.display = 'flex' }
    const hideShield = () => { shield.style.display = 'none' }

    const handleVisibility = () => { if (document.hidden) showShield(); else hideShield() }

    window.addEventListener('blur',   showShield)
    window.addEventListener('focus',  hideShield)
    document.addEventListener('visibilitychange', handleVisibility)

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy',        handleCopy)
    document.addEventListener('keydown',     handleKeyDown)
    document.addEventListener('dragstart',   handleDragStart)

    // Disable text selection on question area
    document.documentElement.style.webkitUserSelect = 'none'

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy',        handleCopy)
      document.removeEventListener('keydown',     handleKeyDown)
      document.removeEventListener('dragstart',   handleDragStart)
      window.removeEventListener('blur',  showShield)
      window.removeEventListener('focus', hideShield)
      document.removeEventListener('visibilitychange', handleVisibility)
      document.documentElement.style.webkitUserSelect = ''
      shield.remove()
    }
  }, [])

  return (
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
      }
    `}</style>
  )
}
