'use client'

import { useEffect, useState } from 'react'

/**
 * Turns the site into an installable, standalone app.
 *
 * Two jobs:
 *   1. Register /sw.js  -> makes the app installable and gives it an
 *      offline fallback. The worker itself never caches authenticated
 *      HTML or API data (see public/sw.js for the reasoning).
 *   2. Own the "Add to Home Screen" flow. Chrome/Edge on Android fire
 *      `beforeinstallprompt`, which we capture and re-fire from our own
 *      button. iOS Safari has no such event, so installing there is a
 *      manual Share -> Add to Home Screen, and we show that instruction
 *      instead.
 *
 * The banner never appears once the app is already running standalone.
 *
 * Dismissal is per-session (sessionStorage), not permanent: closing the
 * banner quiets it for the rest of that browser session/tab, but it comes
 * back the next time the site is opened fresh (new tab, restart, etc.) so
 * users who haven't installed yet keep getting offered the option instead
 * of it disappearing forever after one accidental/curious dismiss.
 */

const DISMISS_KEY = 'fcps-install-dismissed'

// Non-standard event; typed locally rather than polluting global scope.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes this instead of display-mode.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  if (typeof navigator === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !/crios|fxios/i.test(navigator.userAgent)
  )
}

export default function PWAProvider() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [visible, setVisible] = useState(false)

  // ── 1. Service worker registration ──────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failing (private mode, blocked SW, etc.) must never
        // take the app down -- it just means no offline support.
      })
    }

    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  // ── 2. Install prompt capture ───────────────────────────────────
  useEffect(() => {
    if (isStandalone()) return

    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      // Storage can throw in locked-down browsers; treat as "not dismissed".
    }
    if (dismissed) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as InstallPromptEvent)
      setVisible(true)
    }

    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    // iOS never fires beforeinstallprompt -- surface manual instructions
    // after a short delay so it does not fight the first paint.
    let timer: ReturnType<typeof setTimeout> | undefined
    if (isIos()) {
      timer = setTimeout(() => {
        setShowIosHint(true)
        setVisible(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (timer) clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setVisible(false)
    setDeferred(null)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Install FCPS Simulator app"
      className="fixed inset-x-0 bottom-0 z-[9999] px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_8px_32px_rgba(15,23,42,0.16)] backdrop-blur-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#030712]">
          <span
            className="bg-gradient-to-b from-emerald-500 to-cyan-500 bg-clip-text font-serif text-2xl font-bold text-transparent"
            aria-hidden="true"
          >
            F
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            Install FCPS Simulator
          </p>
          <p className="text-xs leading-snug text-slate-500">
            {showIosHint
              ? 'Tap Share, then "Add to Home Screen".'
              : 'Full-screen app experience, works offline.'}
          </p>
        </div>

        {!showIosHint && (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md active:translate-y-px"
          >
            Install
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
