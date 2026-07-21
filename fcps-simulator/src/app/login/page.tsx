'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/auth/actions'

function LoginForm() {
  const searchParams = useSearchParams()
  const type = searchParams?.get('type')
  const isAdmin = type === 'admin'

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form   = e.currentTarget
    const result = await login(new FormData(form))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[420px] animate-fade-in relative z-10">
      {/* Logo Section */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            {isAdmin ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3zm0 2c-2.67 0-8 1.335-8 4v2h16v-2c0-2.665-5.33-4-8-4z" />
            ) : (
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          {isAdmin ? 'Member Portal' : 'Welcome Back'}
        </h1>
        <p className="text-slate-500 font-medium">
          {isAdmin ? 'Sign in to access admin controls' : 'Sign in to your portal'}
        </p>
      </div>

      {/* Card */}
      <div className="glass p-8 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="type" value={type || 'student'} />
          
          <div className="form-group mb-0">
            <label className="label uppercase text-[10px] tracking-widest font-bold text-slate-500 mb-2" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input focus:border-teal-500"
              placeholder={isAdmin ? "admin@example.com" : "doctor@example.com"}
            />
          </div>

          <div className="form-group mb-0">
            <div className="flex items-center justify-between mb-2">
              <label className="label uppercase text-[10px] tracking-widest font-bold text-slate-500" htmlFor="password">Password</label>
              <Link href="/forgot-password" className="text-[11px] font-bold text-teal-600 hover:text-teal-500 transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input focus:border-teal-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full btn-lg group"
          >
            {loading ? (
              <>
                <span className="spinner !w-4 !h-4" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
                <span>{isAdmin ? 'Access Member Portal' : 'Access Portal'}</span>
              </>
            )}
          </button>
        </form>

        {!isAdmin && (
          <>
            <div className="relative py-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-slate-400"><span className="bg-white px-4">Secure Login</span></div>
            </div>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-teal-600 font-bold hover:text-teal-500 transition-colors">
                Register Here
              </Link>
            </p>
          </>
        )}
      </div>

      <p className="text-center mt-8 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
        {isAdmin ? '🔒 Admin authentication required' : '🔒 Subscription-based access · Admin-verified'}
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12 relative">
      <Suspense fallback={<div className="text-teal-600 font-bold">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
