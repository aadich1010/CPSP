'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/auth/actions'
import { generateDeviceFingerprint } from '@/lib/deviceSession/clientFingerprint'
import { ArrowRight, Loader2, Mail, Lock, ShieldCheck } from 'lucide-react'
import Icon from '@/design-system/Icon';

// Exact copy required by the single-device-session spec -- matches the
// message the server returns in claimDeviceSession()'s rejection (see
// src/lib/deviceSession/actions.ts, DEVICE_LIMIT_MESSAGE) and the
// middleware/DeviceSessionGuard mismatch redirect below.
const SESSION_ERROR_MESSAGES: Record<string, string> = {
  device_mismatch: 'Session invalidated due to a device mismatch. Please log in again.',
  session_ended: 'Your session has ended. Please log in again.',
  missing_profile: 'Account not found. Contact admin.',
  blocked: 'Your account has been temporarily blocked by the admin. Please try again later.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const type = searchParams?.get('type')
  const isAdmin = type === 'admin'

  const [loading, setLoading] = useState(false)
  // Surfaces the exact toast-style message when middleware.ts or
  // DeviceSessionGuard redirected here after force-signing this browser
  // out (?error=device_mismatch | session_ended), reusing the existing
  // error banner below rather than adding a separate toast component.
  // Computed as a lazy initial state (not an effect) since searchParams is
  // already available synchronously on first render.
  const [error, setError] = useState(() => {
    const reason = searchParams?.get('error')
    return reason && SESSION_ERROR_MESSAGES[reason] ? SESSION_ERROR_MESSAGES[reason] : ''
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form     = e.currentTarget
    const formData = new FormData(form)
    // Raw fingerprint (User-Agent + screen res + per-login random id),
    // hashed server-side in claimDeviceSession() -- see
    // src/lib/deviceSession/fingerprint.ts and clientFingerprint.ts.
    formData.set('fingerprint', await generateDeviceFingerprint())
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[440px]">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            {isAdmin ? (
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3zm0 2c-2.67 0-8 1.335-8 4v2h16v-2c0-2.665-5.33-4-8-4z" />
            ) : (
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          {isAdmin ? 'Member Portal' : 'Welcome Back'}
        </h1>
        <p className="mt-2 text-slate-500">
          {isAdmin ? 'Sign in to access admin controls' : 'Sign in to your portal'}
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg md:p-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="type" value={type || 'student'} />

          {/* Email */}
          <div>
            <label htmlFor="email"
              className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <Mail size={11} className="text-emerald-500" /> Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={isAdmin ? 'admin@example.com' : 'doctor@example.com'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
            />
          </div>

          {/* Password */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <Lock size={11} className="text-emerald-500" /> Password
              </label>
              <Link href="/forgot-password"
                className="text-[11px] font-bold text-emerald-600 transition-colors hover:text-emerald-500">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <span className="mt-0.5 shrink-0"><Icon name="warning" /></span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.55)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Signing in...</>
            ) : (
              <>{isAdmin ? 'Access Member Portal' : 'Access Portal'} <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {!isAdmin && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="flex items-center gap-1.5 bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <ShieldCheck size={10} className="text-emerald-400" /> Secure Login
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-bold text-emerald-600 transition-colors hover:text-emerald-500">
                Register Here
              </Link>
            </p>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        <Icon name="locked" size="xs" /> {isAdmin ? 'Admin authentication required' : 'Subscription-based access · Admin-verified'}
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F9FAFB] flex items-center justify-center px-4 py-16">
      {/* background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[350px] w-[500px] rounded-full blur-3xl opacity-[0.06]"
        aria-hidden
        style={{ background: 'radial-gradient(circle, #10B981, transparent)' }}
      />
      <Suspense fallback={<div className="font-bold text-emerald-600">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
