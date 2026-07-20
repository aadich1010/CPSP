'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/auth/actions'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const form   = e.currentTarget
    const result = await register(new FormData(form))
    if (result?.error)   { setError(result.error);     setLoading(false) }
    if (result?.success) { setSuccess(result.success);  setLoading(false) }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-[460px] animate-fade-in relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create Account</h1>
          <p className="text-slate-500 font-medium">Join the professional FCPS simulator</p>
        </div>

        <div className="glass p-8 md:p-10">
          {success ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-6">✨</div>
              <h3 className="text-2xl font-bold text-teal-600 mb-3">Application Received</h3>
              <p className="text-slate-600 leading-relaxed mb-8">
                {success}
              </p>
              <Link href="/login" className="btn btn-primary btn-lg btn-full group">
                Return to Login
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="form-group mb-0">
                  <label className="label uppercase text-[10px] tracking-widest font-bold text-slate-500 mb-2" htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="input focus:border-teal-500"
                    placeholder="e.g. Dr. Muhammad Ali"
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="label uppercase text-[10px] tracking-widest font-bold text-slate-500 mb-2" htmlFor="email">Email Address</label>
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

                <div className="form-group mb-0">
                  <label className="label uppercase text-[10px] tracking-widest font-bold text-slate-500 mb-2" htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="input focus:border-teal-500"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center gap-3">
                  <span className="text-lg">⚠️</span>
                  {error}
                </div>
              )}

              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-teal-800 text-[11px] leading-relaxed">
                <strong>Note:</strong> Your account will require manual activation by the administration after registration. You will receive an email once activated.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-full btn-lg group"
              >
                {loading ? (
                  <>
                    <span className="spinner !w-4 !h-4" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-2 group-hover:translate-x-1 transition-transform">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-slate-400"><span className="bg-white px-4">Secure Portal</span></div>
              </div>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="text-teal-600 font-bold hover:text-teal-500 transition-colors">
                  Sign In
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
