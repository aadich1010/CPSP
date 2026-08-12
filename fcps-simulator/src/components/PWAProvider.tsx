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
          {/* Same caduceus mark as public/icon-*.png, redrawn inline (in the
              brand gradient, since it sits on a dark badge here rather than
              one of the bright green boxes BrandMark.tsx is styled for) so
              this banner matches the app icon exactly. */}
          <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient id="pwaLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <path d="M50 32.0 C58.7 22.5, 68.6 24.5, 74.8 30.6 C67.4 33.6, 58.7 34.4, 50 35.8 Z" fill="url(#pwaLogoGrad)" />
            <path d="M50 32.0 C41.3 22.5, 31.4 24.5, 25.2 30.6 C32.6 33.6, 41.3 34.4, 50 35.8 Z" fill="url(#pwaLogoGrad)" />
            <line x1="50" y1="29.0" x2="50" y2="83.2" stroke="url(#pwaLogoGrad)" strokeWidth="3.6" strokeLinecap="round" />
            <path
              d="M50.0 40.8 L51.2 41.7 L53.0 42.6 L54.9 43.5 L56.7 44.4 L58.2 45.3 L59.1 46.2 L59.4 47.1 L59.0 48.0 L57.9 48.9 L56.2 49.8 L54.0 50.7 L51.4 51.6 L48.6 52.5 L45.8 53.4 L43.1 54.3 L40.9 55.2 L39.2 56.1 L38.3 57.0 L38.0 57.9 L38.6 58.8 L39.9 59.7 L41.8 60.6 L44.3 61.5 L47.1 62.4 L50.0 63.3 L52.9 64.2 L55.5 65.1 L57.6 66.0 L59.2 66.9 L60.1 67.8 L60.3 68.7 L59.8 69.6 L58.7 70.5 L57.0 71.4 L55.0 72.3 L52.9 73.2 L50.9 74.1 L49.2 75.0 L48.2 75.9 L50.0 76.8"
              fill="none" stroke="url(#pwaLogoGrad)" strokeWidth="2.5" strokeLinecap="round"
            />
            <path
              d="M50.0 40.8 L48.8 41.7 L47.0 42.6 L45.1 43.5 L43.3 44.4 L41.8 45.3 L40.9 46.2 L40.6 47.1 L41.0 48.0 L42.1 48.9 L43.8 49.8 L46.0 50.7 L48.6 51.6 L51.4 52.5 L54.2 53.4 L56.9 54.3 L59.1 55.2 L60.8 56.1 L61.7 57.0 L62.0 57.9 L61.4 58.8 L60.1 59.7 L58.2 60.6 L55.7 61.5 L52.9 62.4 L50.0 63.3 L47.1 64.2 L44.5 65.1 L42.4 66.0 L40.8 66.9 L39.9 67.8 L39.7 68.7 L40.2 69.6 L41.3 70.5 L43.0 71.4 L45.0 72.3 L47.1 73.2 L49.1 74.1 L50.8 75.0 L51.8 75.9 L50.0 76.8"
              fill="none" stroke="url(#pwaLogoGrad)" strokeWidth="2.5" strokeLinecap="round"
            />
            <circle cx="50.6" cy="40.8" r="2.4" fill="url(#pwaLogoGrad)" />
            <circle cx="49.4" cy="40.8" r="2.4" fill="url(#pwaLogoGrad)" />
            <circle cx="50" cy="23.2" r="3.6" fill="url(#pwaLogoGrad)" />
          </svg>
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
