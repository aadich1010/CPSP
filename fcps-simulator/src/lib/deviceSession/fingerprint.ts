// ═══════════════════════════════════════════════════════════════════════════
// Server-side device fingerprint hashing. Uses the standard Web Crypto API
// (`crypto.subtle`) rather than Node's `crypto` module so this file works
// unmodified in BOTH runtimes it's imported into: Server Actions (Node
// runtime) and, if ever needed there too, Edge middleware -- both expose
// `globalThis.crypto.subtle`, Node's `crypto.createHmac` does not exist
// in the Edge runtime.
//
// We HMAC (not plain-hash) the raw fingerprint with a server-only pepper
// (FINGERPRINT_PEPPER) so a database leak alone can't be replayed -- an
// attacker would also need the pepper to forge a matching hash.
// ═══════════════════════════════════════════════════════════════════════════

const encoder = new TextEncoder()

async function getHmacKey(pepper: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

/**
 * Deterministically hashes a raw client fingerprint string. Deterministic
 * (unlike bcrypt) is required here -- we need to re-derive the SAME hash
 * for the SAME input on every validation call so it can be compared
 * directly, not "verified" one-way.
 */
export async function hashFingerprint(raw: string): Promise<string> {
  const pepper = process.env.FINGERPRINT_PEPPER
  if (!pepper) {
    throw new Error('FINGERPRINT_PEPPER environment variable is required.')
  }
  const key = await getHmacKey(pepper)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(raw))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Constant-time comparison of two hex-encoded hashes, so a timing side
 * channel can't leak how many leading characters matched.
 */
export function fingerprintsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
