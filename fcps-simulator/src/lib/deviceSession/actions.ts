'use server'

// ═══════════════════════════════════════════════════════════════════════════
// Server Action wrappers around the active_sessions RPC functions (see
// supabase/migrations/20260807000000_device_session_control.sql). Every
// function here uses the per-request Supabase client bound to the caller's
// own auth cookie, so every RPC call is scoped to auth.uid() on the DB side
// -- there is no user-id parameter to spoof.
// ═══════════════════════════════════════════════════════════════════════════

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { hashFingerprint } from './fingerprint'

const DEVICE_LIMIT_MESSAGE =
  'You are already logged in on another device. You can only be active on one device at a time. Please logout from the other device first.'

type ClaimResult = { ok: true } | { ok: false; error: string; code: 'DEVICE_LIMIT_EXCEEDED' | 'INTERNAL_ERROR' }

/**
 * Call immediately after a successful supabase.auth.signInWithPassword().
 * On rejection, the caller MUST sign the just-created Supabase Auth session
 * back out (this function does not do that itself, since callers may want
 * to log/branch differently around it) -- see login() in auth/actions.ts.
 */
export async function claimDeviceSession(rawFingerprint: string): Promise<ClaimResult> {
  const supabase = await createClient()
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''

  let hashed: string
  try {
    hashed = await hashFingerprint(rawFingerprint)
  } catch (err) {
    console.error('[claimDeviceSession] Failed to hash fingerprint:', err)
    return { ok: false, error: 'Could not verify this device. Please try again.', code: 'INTERNAL_ERROR' }
  }

  const { data, error } = await supabase.rpc('claim_device_session', {
    p_hashed_fingerprint: hashed,
    p_user_agent: userAgent,
  })

  if (error) {
    console.error('[claimDeviceSession] RPC error:', error)
    return { ok: false, error: 'Could not start your session. Please try again.', code: 'INTERNAL_ERROR' }
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || row.out_status !== 'ok') {
    return { ok: false, error: DEVICE_LIMIT_MESSAGE, code: 'DEVICE_LIMIT_EXCEEDED' }
  }

  return { ok: true }
}

/** Normal logout: releases this account's one device slot. */
export async function releaseDeviceSession(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('release_device_session')
  if (error) console.error('[releaseDeviceSession] RPC error:', error)
}

/** "Logout from all devices." Returns how many sessions were revoked. */
export async function releaseAllDeviceSessions(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('release_all_device_sessions')
  if (error) {
    console.error('[releaseAllDeviceSessions] RPC error:', error)
    return 0
  }
  return typeof data === 'number' ? data : 0
}

type ValidateResult = { valid: true } | { valid: false; reason: string }

/**
 * Full-fingerprint re-validation, called by DeviceSessionGuard on mount and
 * periodically. This is the precise anti-theft check (User-Agent + screen
 * resolution + per-login id) -- the coarse User-Agent-only check that runs
 * on every plain page navigation lives in middleware.ts, since middleware
 * cannot receive an explicit Server-Action-style argument.
 */
export async function validateDeviceFingerprint(rawFingerprint: string): Promise<ValidateResult> {
  const supabase = await createClient()

  let hashed: string
  try {
    hashed = await hashFingerprint(rawFingerprint)
  } catch (err) {
    console.error('[validateDeviceFingerprint] Failed to hash fingerprint:', err)
    return { valid: false, reason: 'internal_error' }
  }

  const { data, error } = await supabase.rpc('validate_device_fingerprint', {
    p_hashed_fingerprint: hashed,
  })

  if (error) {
    console.error('[validateDeviceFingerprint] RPC error:', error)
    return { valid: false, reason: 'internal_error' }
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return { valid: false, reason: 'session_inactive' }
  return row.out_valid ? { valid: true } : { valid: false, reason: row.out_reason }
}
