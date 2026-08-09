// ═══════════════════════════════════════════════════════════════════════════
// Client-side raw fingerprint generation. Imported only from Client
// Components (login form, DeviceSessionGuard) -- never from server code.
//
// The random component (`tabId`) lives in sessionStorage, which the browser
// natively scopes per-tab. Note: because this app's auth session itself is
// an httpOnly cookie (shared by ALL tabs of the browser, by platform
// design -- see docs/DEVICE_SESSION_CONTROL.md), this tabId does NOT give
// two different accounts independent logins in two tabs of the same
// browser. What it DOES do: add entropy so the fingerprint captured at
// login is harder to reproduce blind, and so re-logging-in in a fresh tab
// naturally produces a fresh fingerprint.
// ═══════════════════════════════════════════════════════════════════════════

const TAB_ID_KEY = 'fcps_tab_id'

function getOrCreateTabId(): string {
  let tabId = sessionStorage.getItem(TAB_ID_KEY)
  if (!tabId) {
    tabId = crypto.randomUUID()
    sessionStorage.setItem(TAB_ID_KEY, tabId)
  }
  return tabId
}

/**
 * Raw fingerprint string. Sent to a Server Action (never a plain page
 * navigation), which HMACs it server-side before storing/comparing -- see
 * src/lib/deviceSession/fingerprint.ts.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const tabId = getOrCreateTabId()
  return [
    navigator.userAgent,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    tabId,
  ].join('::')
}
