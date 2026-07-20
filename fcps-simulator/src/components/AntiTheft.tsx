'use client'

import { useEffect } from 'react'

export default function AntiTheft() {
  useEffect(() => {
    // Block right-click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()

    // Block copy
    const handleCopy = (e: ClipboardEvent) => e.preventDefault()

    // Block common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      // Ctrl+C, Ctrl+U (view source), Ctrl+Shift+I (devtools), F12, PrtScr
      if (
        (ctrl && e.key === 'c') ||
        (ctrl && e.key === 'u') ||
        (ctrl && e.shiftKey && e.key === 'I') ||
        (ctrl && e.shiftKey && e.key === 'J') ||
        (ctrl && e.shiftKey && e.key === 'C') ||
        e.key === 'F12' ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault()
        return false
      }
    }

    // Block drag
    const handleDragStart = (e: DragEvent) => e.preventDefault()

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
      document.documentElement.style.webkitUserSelect = ''
    }
  }, [])

  return null
}
