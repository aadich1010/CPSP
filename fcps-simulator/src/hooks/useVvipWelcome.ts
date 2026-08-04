'use client';

/**
 * useVvipWelcome.ts
 * -----------------------------------------------------------------------------
 * Decides whether the VVIP welcome modal should appear for this render.
 *
 * "Once per login session" is defined as: once per (userId + loginSessionId).
 *   - A page refresh does NOT re-show it.
 *   - Opening a second tab does NOT re-show it.
 *   - Logging out and back in DOES re-show it.
 *
 * The login session id is taken from the server whenever possible (token `iat`,
 * `sessionId`, `loginAt`). If the backend exposes none of those, we mint a
 * per-tab id in sessionStorage and clear it on logout via clearVvipWelcome().
 */

import { useCallback, useEffect, useState } from 'react';
import { isPaidMember } from '../lib/subscription';
import type { SubscriptionProfile } from '../lib/subscription';

const SEEN_KEY = 'fcps:vvip-welcome:seen:v1';
const SID_KEY = 'fcps:vvip-welcome:sid:v1';

/** Storage that never throws (Safari private mode, disabled cookies, SSR). */
interface Storagelike {
  get: (k: string) => string | null;
  set: (k: string, v: string) => void;
  remove: (k: string) => void;
}

const memoryFallback = new Map<string, string>();
function safeStorage(kind: 'session' | 'local'): Storagelike {
  try {
    const store = kind === 'session' ? window.sessionStorage : window.localStorage;
    const probe = '__vvip_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return {
      get: (k: string) => store.getItem(k),
      set: (k: string, v: string) => store.setItem(k, v),
      remove: (k: string) => store.removeItem(k),
    };
  } catch {
    return {
      get: (k: string) => memoryFallback.get(k) ?? null,
      set: (k: string, v: string) => { memoryFallback.set(k, v); },
      remove: (k: string) => { memoryFallback.delete(k); },
    };
  }
}

function randomId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Builds a stable identifier for the current login session. */
export function getLoginSessionKey(user: VvipUser | null | undefined): string {
  const userId = user?.id ?? user?.email ?? 'anon';

  // Prefer a server-issued marker so all tabs agree and a refresh is a no-op.
  const serverMarker =
    user?.sessionId ??
    user?.loginAt ??
    user?.lastLoginAt ??
    user?.tokenIssuedAt ??
    user?.iat ??
    user?.session?.id ??
    user?.session?.createdAt;

  if (serverMarker) return `${userId}:${serverMarker}`;

  const session = safeStorage('session');
  let sid = session.get(SID_KEY);
  if (!sid) {
    sid = randomId();
    session.set(SID_KEY, sid);
  }
  return `${userId}:${sid}`;
}

/**
 * Call this in your logout handler so the next login shows the modal again.
 * Safe to call unconditionally.
 */
export function clearVvipWelcome(): void {
  safeStorage('local').remove(SEEN_KEY);
  safeStorage('session').remove(SID_KEY);
}

export interface VvipUser extends SubscriptionProfile {
  id?: string | null;
  /** Server-issued login markers, if your auth layer ever exposes one. */
  sessionId?: string | number | null;
  loginAt?: string | number | null;
  lastLoginAt?: string | number | null;
  tokenIssuedAt?: string | number | null;
  iat?: number | null;
  session?: { id?: string | number; createdAt?: string | number } | null;
}

export interface UseVvipWelcomeOptions {
  user?: VvipUser | null;
  isAuthenticated?: boolean;
  enabled?: boolean;
  isPaid?: boolean;
  force?: boolean;
  delayMs?: number;
}

export interface UseVvipWelcomeResult {
  shouldShow: boolean;
  dismiss: () => void;
  reset: () => void;
}

export function useVvipWelcome({
  user,
  isAuthenticated = true,
  enabled = true,
  isPaid,
  force = false,
  delayMs = 350,
}: UseVvipWelcomeOptions = {}): UseVvipWelcomeResult {
  const [shouldShow, setShouldShow] = useState(false);

  const paid = typeof isPaid === 'boolean' ? isPaid : isPaidMember(user);
  const eligible = Boolean(enabled && isAuthenticated && user && paid);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined; // SSR guard
    // Ineligibility is derived at return time rather than pushed into state.
    // Calling setShouldShow(false) here would trigger a cascading render, and
    // react-hooks/set-state-in-effect rejects it.
    if (!eligible) return undefined;

    const local = safeStorage('local');
    const sessionKey = getLoginSessionKey(user);

    if (!force && local.get(SEEN_KEY) === sessionKey) return undefined;

    // Mark as seen at schedule time, not at dismiss time. If the user hard-refreshes
    // one second in, they must not get a second welcome.
    if (!force) local.set(SEEN_KEY, sessionKey);

    const t = window.setTimeout(() => setShouldShow(true), Math.max(0, delayMs));
    return () => window.clearTimeout(t);
    // `user` is intentionally read through getLoginSessionKey rather than deep-compared.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, force, delayMs, user?.id, user?.email]);

  const dismiss = useCallback(() => setShouldShow(false), []);

  const reset = useCallback(() => {
    clearVvipWelcome();
    setShouldShow(false);
  }, []);

  // `eligible` gates the derived value so a mid-session downgrade hides the
  // modal on the very next render instead of one cycle later.
  return { shouldShow: shouldShow && eligible, dismiss, reset };
}

export default useVvipWelcome;
