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
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Set New Password</h1>
          <p className="text-slate-500 font-medium">Choose a new password for your account</p>
        </div>

        <div className="glass p-8 md:p-10">
          {success ? (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-teal-700 text-sm text-center">
              {success} Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group mb-0">
                <label className="label uppercase text-[10px] tracking-widest font-bold text-slate-500 mb-2" htmlFor="password">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input focus:border-teal-500"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="form-group mb-0">
                <label className="label uppercase text-[10px] tracking-widest font-bold text-slate-500 mb-2" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input focus:border-teal-500"
                  placeholder="Re-enter your new password"
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
