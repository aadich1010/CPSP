'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/auth/actions'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const form   = e.currentTarget
    const result = await requestPasswordReset(new FormData(form))
    if (result?.error)   setError(result.error)
    if (result?.success) setSuccess(result.success)
    setLoading(false)
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Reset Password</h1>
          <p className="text-slate-500 font-medium">We&apos;ll email you a secure reset link</p>
        </div>

        <div className="glass p-8 md:p-10">
          {success ? (
            <div className="text-center">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-teal-700 text-sm mb-6">
                {success}
              </div>
              <Link href="/login" className="text-teal-600 font-bold hover:text-teal-500 transition-colors text-sm">
                ← Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group mb-0">
                <label className="label uppercase text-[10px] tracking-widest font-bold text-slate-500 mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input focus:border-teal-500"
                  placeholder="doctor@example.com"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center gap-3">
                  <span className="text-lg">⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg group">
                {loading ? (
                  <>
                    <span className="spinner !w-4 !h-4" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                Remembered your password?{' '}
                <Link href="/login" className="text-teal-600 font-bold hover:text-teal-500 transition-colors">
                  Back to Login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
