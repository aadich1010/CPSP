'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/auth/actions'
import { ArrowRight, Loader2, UserPlus, Mail, Lock, User, ShieldCheck, CheckCircle2 } from 'lucide-react'

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
    <div className="relative min-h-screen overflow-x-clip bg-[#030712] flex items-center justify-center px-4 py-16">

      {/* background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          backgroundImage: 'radial-gradient(rgba(30,41,59,0.8) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full blur-3xl opacity-[0.07]"
        aria-hidden
        style={{ background: 'radial-gradient(circle, #10B981, transparent)' }}
      />

      <div className="relative z-10 w-full max-w-[480px]">

        {/* ── LOGO ── */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_0_30px_rgba(16,185,129,0.45)]">
            <UserPlus size={28} className="text-slate-950" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Create Account</h1>
          <p className="mt-2 text-slate-400">Join the professional FCPS simulator</p>
        </div>

        {/* ── CARD ── */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-8 shadow-[0_0_60px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-10">

          {success ? (
            /* ── SUCCESS STATE ── */
            <div className="text-center py-4">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Account Ready</h3>
              <p className="text-slate-400 leading-relaxed mb-8">{success}</p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:shadow-[0_0_35px_rgba(16,185,129,0.65)] hover:scale-[1.02]"
              >
                Go to Login <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── FULL NAME ── */}
              <div>
                <label htmlFor="fullName" className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <User size={11} className="text-emerald-400" /> Full Name
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Dr. Muhammad Ali"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-emerald-500 focus:bg-slate-800 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)] focus:ring-0"
                  />
                </div>
              </div>

              {/* ── EMAIL ── */}
              <div>
                <label htmlFor="email" className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <Mail size={11} className="text-emerald-400" /> Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="doctor@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-emerald-500 focus:bg-slate-800 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                />
              </div>

              {/* ── PASSWORD ── */}
              <div>
                <label htmlFor="password" className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <Lock size={11} className="text-emerald-400" /> Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-emerald-500 focus:bg-slate-800 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                />
              </div>

              {/* ── ERROR ── */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                  <span className="mt-0.5 shrink-0 text-base">⚠️</span>
                  {error}
                </div>
              )}

              {/* ── NOTE BOX ── */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-[12px] leading-relaxed text-slate-400">
                  <span className="font-bold text-emerald-400">Note: </span>
                  Your account is activated instantly with a free demo (10 questions per exam, Anatomy / Physiology / Biochemistry / Pathology). For the full question bank and longer mocks, send payment proof via WhatsApp from your dashboard and the admin will upgrade your account.
                </p>
              </div>

              {/* ── SUBMIT ── */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(16,185,129,0.65)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="flex items-center gap-1.5 bg-slate-900/80 px-4 text-[10px] uppercase tracking-widest font-bold text-slate-600">
                    <ShieldCheck size={10} className="text-emerald-500/60" /> Secure Portal
                  </span>
                </div>
              </div>

              {/* ── LOGIN LINK ── */}
              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-emerald-400 transition-colors hover:text-emerald-300">
                  Sign In
                </Link>
              </p>
            </form>
          )}
        </div>

        {/* bottom trust note */}
        <p className="mt-6 text-center text-[11px] text-slate-600">
          Protected by end-to-end encryption · FCPS Part 1 Simulator © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
