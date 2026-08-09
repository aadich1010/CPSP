'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateDeviceFingerprint } from '@/lib/deviceSession/clientFingerprint'
import { validateDeviceFingerprint } from '@/lib/deviceSession/actions'

// Every 60s -- frequent enough to catch a stolen-cookie replay or a
// logout-elsewhere within a minute, cheap enough (one indexed RPC call) to
// not matter for server load.
const CHECK_INTERVAL_MS = 60_000

/**
 * Mount once per protected layout (dashboard, admin). On mount and every
 * CHECK_INTERVAL_MS after, re-derives this tab's full device fingerprint
 * (User-Agent + screen resolution + per-login id) and asks the server
 * whether it still matches what's on file for this account's one active
 * device slot.
 *
 * This is the PRECISE anti-theft check -- it catches a copied/replayed
 * auth cookie used from a different device even when the coarse
 * User-Agent-only check in middleware.ts (which runs on every request, but
 * can only see the live User-Agent header) would not, e.g. an attacker
 * spoofing a matching User-Agent string but with a different screen setup.
 *
 * Renders nothing -- this is a background watcher, not UI.
 */
export default function DeviceSessionGuard() {
  const router = useRouter()
  const checking = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (checking.current) return
      checking.current = true
      try {
        const fingerprint = await generateDeviceFingerprint()
        const result = await validateDeviceFingerprint(fingerprint)

        if (!cancelled && !result.valid) {
          const supabase = createClient()
          await supabase.auth.signOut()
          const reasonParam = result.reason === 'fingerprint_mismatch' ? 'device_mismatch' : 'session_ended'
          router.replace(`/login?error=${reasonParam}`)
        }
      } catch (err) {
        // Fail open on a transient network/RPC error -- we don't want a
        // flaky connection to force-logout an otherwise legitimate user.
        // The next interval tick (or middleware, on the next navigation)
        // will catch a real problem.
        console.error('[DeviceSessionGuard] Validation check failed:', err)
      } finally {
        checking.current = false
      }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [router])

  return null
}
