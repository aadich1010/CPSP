'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/app/auth/actions'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const form   = e.currentTarget
    const result = await updatePassword(new FormData(form))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    if (result?.success) {
      setSuccess(result.success)
      setLoading(false)
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F9FAFB] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Set New Password</h1>
          <p className="text-slate-500 font-medium">Choose a new password for your account</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg md:p-10">
          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 text-center">
              {success} Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group mb-0">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-400" htmlFor="password">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="form-group mb-0">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-400" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                  placeholder="Re-enter your new password"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  <span className="text-lg">⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.55)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100">
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
