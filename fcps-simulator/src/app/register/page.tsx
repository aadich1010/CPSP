'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/auth/actions'
import { ArrowRight, Loader2, UserPlus, Mail, Lock, User, ShieldCheck, CheckCircle2, Phone, BadgeCheck, GraduationCap, ClipboardList, Stethoscope, Landmark, Globe2 } from 'lucide-react'
import Icon from '@/design-system/Icon';
import { MEDICAL_COLLEGE_GROUPS } from '@/lib/medicalColleges'

// Target exam picker -- see supabase/migrations/20260822000000_multi_exam_
// platform_foundation.sql for the exam_types this must stay in sync with.
// Kept as a plain client-side list (not fetched from the DB) since this is
// a fixed, rarely-changing set of 5 exams and a registration form shouldn't
// have an extra network round-trip just to render its own dropdown.
const EXAM_OPTIONS = [
  { slug: 'fcps-part1',  label: 'FCPS Part 1' },
  { slug: 'mcps',        label: 'MCPS' },
  { slug: 'ms-md',       label: 'MS / MD (JCAT)' },
  { slug: 'mrcp-part1',  label: 'MRCP Part 1' },
  { slug: 'usmle-step1', label: 'USMLE Step 1' },
]
const SPECIALTIES = ['Medicine', 'Surgery', 'Gynae & Obs', 'Paediatrics', 'Anaesthesia', 'Radiology', 'Pathology', 'Other']
const UNIVERSITIES = ['UHS', 'SZABMU', 'KEMU', 'DUHS', 'Aga Khan University', 'Other']

/** Which conditional field this exam needs, if any -- mirrors the
 *  handle_new_user() trigger's exam_metadata shape. Adding exam #6 to the
 *  registration flow is a one-line addition here, not a new branch
 *  scattered through the JSX below. */
function fieldGroupFor(slug: string): 'specialty' | 'university' | 'international' | null {
  if (slug === 'fcps-part1' || slug === 'mcps') return 'specialty'
  if (slug === 'ms-md') return 'university'
  if (slug === 'mrcp-part1' || slug === 'usmle-step1') return 'international'
  return null
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [targetExam, setTargetExam] = useState('')
  const fieldGroup = fieldGroupFor(targetExam)

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
    <div className="relative min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-8">

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

      <div className="relative z-10 w-full max-w-[440px] sm:max-w-[640px]">

        {/* ── LOGO ── */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_6px_20px_rgba(16,185,129,0.35)]">
            <UserPlus size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Create Account</h1>
          <p className="mt-1 text-sm text-slate-500">Join the professional FCPS simulator</p>
        </div>

        {/* ── CARD ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:p-7">

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

              {/* ── FULL NAME + CELL NUMBER ── */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <User size={11} className="text-emerald-400" /> Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Dr. Muhammad Ali"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)] focus:ring-0"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <Phone size={11} className="text-emerald-400" /> Cell Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="03XX-XXXXXXX"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                  />
                </div>
              </div>

              {/* ── PMDC NUMBER + MEDICAL COLLEGE ── */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="pmdcNumber" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <BadgeCheck size={11} className="text-emerald-400" /> PMDC Number
                  </label>
                  <input
                    id="pmdcNumber"
                    name="pmdcNumber"
                    type="text"
                    required
                    placeholder="e.g. 123456-P"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                  />
                </div>

                <div>
                  <label htmlFor="medicalCollege" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <GraduationCap size={11} className="text-emerald-400" /> Medical College
                  </label>
                  <input
                    id="medicalCollege"
                    name="medicalCollege"
                    type="text"
                    required
                    list="medical-college-options"
                    autoComplete="off"
                    placeholder="Type to search..."
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                  />
                  <datalist id="medical-college-options">
                    {MEDICAL_COLLEGE_GROUPS.map((group) =>
                      group.colleges.map((college) => (
                        <option key={college} value={college} label={group.province} />
                      ))
                    )}
                  </datalist>
                </div>
              </div>

              {/* ── TARGET EXAM ── */}
              <div>
                <label htmlFor="targetExamSlug" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <ClipboardList size={11} className="text-emerald-400" /> Select Your Target Exam
                </label>
                <select
                  id="targetExamSlug"
                  name="targetExamSlug"
                  required
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                >
                  <option value="" disabled>Choose an exam…</option>
                  {EXAM_OPTIONS.map((opt) => (
                    <option key={opt.slug} value={opt.slug}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {fieldGroup === 'specialty' && (
                <div>
                  <label htmlFor="specialty" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <Stethoscope size={11} className="text-emerald-400" /> Select Specialty
                  </label>
                  <select
                    id="specialty"
                    name="specialty"
                    required
                    defaultValue=""
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                  >
                    <option value="" disabled>Choose your specialty…</option>
                    {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {fieldGroup === 'university' && (
                <div>
                  <label htmlFor="university" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <Landmark size={11} className="text-emerald-400" /> Select Target University
                  </label>
                  <select
                    id="university"
                    name="university"
                    required
                    defaultValue=""
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                  >
                    <option value="" disabled>Choose your university…</option>
                    {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              )}

              {fieldGroup === 'international' && (
                <div>
                  <label htmlFor="targetCountry" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <Globe2 size={11} className="text-emerald-400" /> Target Country / Board
                  </label>
                  <input
                    id="targetCountry"
                    name="targetCountry"
                    type="text"
                    required
                    placeholder="e.g. United Kingdom, United States"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                  />
                </div>
              )}

              {/* ── EMAIL + PASSWORD ── */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
