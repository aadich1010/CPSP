'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/auth/actions'
import { ArrowRight, Loader2, UserPlus, Mail, Lock, User, ShieldCheck, CheckCircle2 } from 'lucide-react'
import Icon from '@/design-system/Icon';

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
    if (result?.error)   { setError(result.error);    setLoading(false) }
    if (result?.success) { setSuccess(result.success); setLoading(false) }
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[#f8fafc] flex items-center justify-center px-4 py-4">

      {/* background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[320px] w-[520px] rounded-full blur-3xl opacity-[0.18]"
        aria-hidden
        style={{ background: 'radial-gradient(circle, #10B981, transparent)' }}
      />

      <div className="relative z-10 w-full max-w-[440px]">

        {/* ── LOGO ── */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_6px_20px_rgba(16,185,129,0.35)]">
            <UserPlus size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Create Account</h1>
          <p className="mt-1 text-sm text-slate-500">Join the professional FCPS simulator</p>
        </div>

        {/* ── CARD ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:p-6">

          {success ? (
            /* ── SUCCESS STATE ── */
            <div className="text-center py-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Account Ready</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">{success}</p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_8px_26px_rgba(16,185,129,0.45)]"
              >
                Go to Login <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* ── FULL NAME ── */}
              <div>
                <label htmlFor="fullName" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <User size={11} className="text-emerald-400" /> Full Name
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Dr. Muhammad Ali"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)] focus:ring-0"
                  />
                </div>
              </div>

              {/* ── EMAIL ── */}
              <div>
                <label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <Mail size={11} className="text-emerald-400" /> Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="doctor@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                />
              </div>

              {/* ── PASSWORD ── */}
              <div>
                <label htmlFor="password" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <Lock size={11} className="text-emerald-400" /> Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                />
              </div>

              {/* ── ERROR ── */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                  <span className="mt-px shrink-0 text-sm"><Icon name="warning" /></span>
                  {error}
                </div>
              )}

              {/* ── NOTE BOX ── */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                <p className="text-[11px] leading-snug text-slate-600">
                  <span className="font-bold text-emerald-700">Note: </span>
                  Instant free demo access (10 questions per exam). For the full bank and longer mocks, send payment proof via WhatsApp from your dashboard.
                </p>
              </div>

              {/* ── SUBMIT ── */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_8px_26px_rgba(16,185,129,0.45)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* ── DIVIDER ── */}
              <div className="relative py-0.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="flex items-center gap-1.5 bg-white px-3 text-[9px] uppercase tracking-widest font-bold text-slate-400">
                    <ShieldCheck size={9} className="text-emerald-500" /> Secure Portal
                  </span>
                </div>
              </div>

              {/* ── LOGIN LINK ── */}
              <p className="text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-emerald-600 transition-colors hover:text-emerald-700">
                  Sign In
                </Link>
              </p>
            </form>
          )}
        </div>

        {/* bottom trust note */}
        <p className="mt-3 text-center text-[10px] text-slate-400">
          Protected by end-to-end encryption · FCPS Part 1 Simulator © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
