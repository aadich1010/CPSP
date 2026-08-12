'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
  BarChart3, ShieldCheck, Building2, Sparkles, RefreshCw, Crown,
  ArrowRight, Check, MessageCircle, GraduationCap, FileText, Award,
  BookOpen, ChevronDown, Zap, Activity, Lock, Star,
  TrendingUp, Clock, Users, Cpu, Shield, Wifi,
} from 'lucide-react'
import { FEATURES } from '../lib/featuresData'
import { AZADI_PLANS, isAzadiOfferActive } from '../lib/azadiOffer'
import FaqAccordion from '../components/FaqAccordion'
import MobileNav from '../components/MobileNav'
import BrandMark from '../components/BrandMark'
import AzadiOfferModal from '../components/vvip/AzadiOfferModal'

/* ─── DATA ───────────────────────────────────────────────────── */
const NAV_LINKS = [
  { href: '#features',     label: 'Features'     },
  { href: '#hiw',          label: 'How it works' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#pricing',      label: 'Pricing'      },
]

const GATEWAY = [
  { icon: GraduationCap, title: 'FCPS-I Mock Exams', desc: 'Timed CBT simulations',   href: '/register',           color: 'emerald' },
  { icon: FileText,       title: 'Question Bank',     desc: 'Real-pattern MCQs',        href: '/register',           color: 'cyan'    },
  { icon: Award,          title: 'Latest Results',    desc: 'Track your progress',      href: '/dashboard',          color: 'blue'    },
  { icon: BarChart3,      title: 'Analytics',         desc: 'Subject-wise heatmaps',    href: '/dashboard/analysis', color: 'emerald' },
]

const STATS = [
  { value: 10000, display: '10,000+', label: 'Medical professionals', icon: Users     },
  { value: 4.9,   display: '4.9/5',   label: 'Average rating',        icon: Star      },
  { value: 99.9,  display: '99.9%',   label: 'Platform uptime',       icon: Zap       },
  { value: 24,    display: '24/7',    label: 'VIP support',           icon: Clock     },
]

const STEPS = [
  { num: 'I',   title: 'Register',  desc: 'Create your secure profile — no credit card required to start.', icon: Users,     color: '#10B981' },
  { num: 'II',  title: 'Subscribe', desc: 'Choose a plan that fits your residency timeline.',               icon: Shield,    color: '#06B6D4' },
  { num: 'III', title: 'Simulate',  desc: 'Take timed mock exams, analyze weak areas, and track every gain.', icon: Cpu,    color: '#3B82F6' },
]

// "Azadi Offer" (Independence Day discount) -- 40% off Advanced & Platinum
// only, valid until 14 Aug 2026 midnight. Standard and Elite Pro are
// untouched. Deadline + plan data now live in ../lib/azadiOffer.ts, shared
// with the AzadiOfferModal popup so both stay in sync.
const PLANS = [
  {
    name: 'Standard',
    price: 'Rs. 1,999',
    period: '/ 1 month',
    features: ['1 month access', 'Basic analytics', 'Mock exams'],
    cta: 'Get started',
    featured: false,
    badge: null,
  },
  {
    name: 'Elite Pro',
    price: 'Rs. 4,999',
    period: '/ 3 months',
    features: ['3 months access', 'Smart heatmaps', 'Forensic security', 'VIP support'],
    cta: 'Instant access',
    featured: false,
    badge: null,
  },
  ...AZADI_PLANS.map((p) => ({ ...p, azadiOffer: true })),
]

const TESTIMONIALS = [
  { quote: 'The analytics helped me identify my weak areas in Anatomy within days. A game-changer for Part 1.', name: 'Dr. Ahmed', role: 'Resident'       },
  { quote: 'The interface is identical to the actual exam. It removed all my fear of the CBT environment.',      name: 'Dr. Sara',  role: 'FCPS Candidate' },
  { quote: "Most secure and updated question bank I've used. The watermark feature shows how serious they are.", name: 'Dr. Zohaib',role: 'Medical Officer' },
]

const FAQS = [
  { q: 'Is the interface same as the real exam?',  a: 'Yes — we have replicated the official CBT environment for 100% familiarity.'                                        },
  { q: 'How do I activate my account?',            a: 'Simply share your payment proof via WhatsApp for instant premium activation.'                                       },
  { q: 'Can I track my progress?',                 a: 'Absolutely. Our Smart Analytics provide detailed heatmaps of your performance across all subjects.'                 },
]

const FEATURE_ICONS: Record<string, React.ElementType> = {
  'smart-analytics':           BarChart3,
  'forensic-security':         ShieldCheck,
  'hospital-grade-ui':         Building2,
  'ai-powered-organization':   Sparkles,
  'real-time-synchronization': RefreshCw,
  'vvip-support':              Crown,
}

const FEATURE_COLORS = ['#10B981', '#06B6D4', '#3B82F6', '#A78BFA', '#F472B6', '#FB923C']

/* ─── ANIMATION VARIANTS ──────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.09,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
}

/* ─── PRIMITIVES ──────────────────────────────────────────────── */

/** Scroll-triggered reveal wrapper */
function Reveal({
  children,
  className = '',
  style,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-72px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={delay}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  )
}

/** Animated counting number */
function Counter({ target, display }: { target: number; display: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 55, damping: 16 })
  const [shown, setShown] = useState('0')

  useEffect(() => {
    if (inView) motionVal.set(target)
  }, [inView, target, motionVal])

  useEffect(() => {
    return spring.on('change', (v) => {
      if (target < 10) setShown(v.toFixed(1))
      else setShown(Math.round(v).toLocaleString())
    })
  }, [spring, target])

  // Once spring settles, lock to the display string (handles "+" / "%" suffixes)
  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => setShown(display), 2200)
      return () => clearTimeout(t)
    }
  }, [inView, display])

  return <span ref={ref}>{shown}</span>
}

/** Glowing CTA button */
function GlowBtn({
  href,
  children,
  size = 'md',
  variant = 'primary',
  className = '',
}: {
  href: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'ghost'
  className?: string
}) {
  const pad = size === 'lg' ? 'px-7 py-2.5 text-sm' : size === 'sm' ? 'px-3.5 py-1.5 text-[12.5px]' : 'px-5 py-2 text-[13px]'
  if (variant === 'ghost')
    return (
      <Link href={href}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 backdrop-blur-sm transition-all hover:border-emerald-500 hover:text-slate-900 shadow-sm ${pad} ${className}`}>
        {children}
      </Link>
    )
  return (
    <Link href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(16,185,129,0.65)] ${pad} ${className}`}>
      {children}
    </Link>
  )
}

/** Glass card with hover glow */
function GlassCard({
  children,
  className = '',
  style,
  glow = '#10B981',
  featured = false,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  glow?: string
  featured?: boolean
}) {
  return (
    <div
      className={`group relative rounded-2xl border bg-white backdrop-blur-xl transition-all duration-300 shadow-sm ${
        featured
          ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
          : 'border-slate-200 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]'
      } ${className}`}
      style={style}
    >
      {featured && (
        <div className="border-beam pointer-events-none absolute inset-0 rounded-2xl" style={{ zIndex: 0 }} aria-hidden />
      )}
      <div className="relative" style={{ zIndex: 1 }}>{children}</div>
    </div>
  )
}

/** Section heading: eyebrow + h2 + rule */
function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string
  title: React.ReactNode
  sub?: string
}) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <Reveal>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={1} className="mt-3">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl lg:text-[1.75rem]">
          {title}
        </h2>
      </Reveal>
      <Reveal delay={2}>
        <div className="mx-auto mt-2.5 h-px w-16 rounded-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        {sub && <p className="mx-auto mt-3 max-w-lg text-[13px] leading-relaxed text-slate-500">{sub}</p>}
      </Reveal>
    </div>
  )
}

/** Hero: CBT terminal preview card */
function CbtTerminal() {
  const bars = [82, 55, 91, 68, 77, 43, 88]
  return (
    <div className="relative h-full min-h-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      {/* terminal top bar */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500/70" />
          <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
        </div>
        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-500">
          CBT LIVE
        </span>
        <span className="text-[9px] text-slate-400">Session #4821</span>
      </div>

      {/* score row */}
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {[
          { label: 'Score', val: '74%',  color: 'text-emerald-400' },
          { label: 'Q Left', val: '36',  color: 'text-cyan-400'    },
          { label: 'Time',   val: '18m', color: 'text-blue-400'    },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center">
            <div className={`text-base font-black ${s.color}`}>{s.val}</div>
            <div className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* mini bar chart */}
      <div className="mb-3">
        <div className="mb-1 text-[9px] uppercase tracking-wider text-slate-400">Subject accuracy</div>
        <div className="flex items-end gap-1 h-10">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.4 + i * 0.07, duration: 0.5, ease: 'backOut' }}
              style={{
                transformOrigin: 'bottom',
                height: `${h}%`,
                background: h > 75
                  ? 'linear-gradient(to top, #10B981, #34d399)'
                  : h > 55
                  ? 'linear-gradient(to top, #06B6D4, #67e8f9)'
                  : 'linear-gradient(to top, #3B82F6, #93c5fd)',
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* ECG pulse line */}
      <div className="mb-3">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">Exam vitals</div>
        <svg viewBox="0 0 200 36" className="h-9 w-full" fill="none">
          <polyline
            className="ecg-line"
            points="0,18 20,18 30,5 40,30 50,18 65,18 75,2 85,34 95,18 115,18 125,8 135,28 145,18 200,18"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* diagnostic tags */}
      <div className="flex flex-wrap gap-1.5">
        {['Anatomy 82%', 'Physiology 68%', 'Pharmacology 91%', 'Pathology 55%'].map((tag) => (
          <span key={tag}
            className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  // Offer auto-expires after the deadline instead of needing a manual code
  // change/redeploy on 15 Aug -- cards just silently fall back to their
  // normal (non-discounted) price/badge state once this flips false.
  const azadiOfferActive = isAzadiOfferActive()

  return (
    <main className="w-full min-h-screen flex flex-col items-center overflow-x-clip bg-white text-slate-900 selection:bg-emerald-500 selection:text-white">

      {/* ── AZADI OFFER POPUP (shows once per browser session on load) ── */}
      <AzadiOfferModal />

      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="w-full flex justify-center border-b border-emerald-100 bg-emerald-50/60">
        <div className="w-full max-w-7xl px-4 py-2 text-center text-xs font-medium tracking-wide text-slate-600 sm:px-6 lg:px-8">
          Admissions open for Fall 2026 · FCPS Part 1 preparation now live
          <Link href="/register" className="ml-2 text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
            Get started →
          </Link>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 w-full flex justify-center border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="group flex items-center gap-3 shrink-0">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_0_18px_rgba(16,185,129,0.45)] transition-all group-hover:shadow-[0_0_28px_rgba(16,185,129,0.7)]">
                <BrandMark size={22} />
              </div>
              <div>
                <span className="block text-base font-bold tracking-tight text-slate-900">FCPS Simulator</span>
                <span className="block text-[9px] uppercase tracking-[0.2em] text-emerald-600">Physicians &amp; Surgeons Prep</span>
              </div>
            </Link>

            <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="relative transition-colors hover:text-slate-900 group">
                  {l.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Link href="/login" className="text-sm font-semibold text-slate-500 transition hover:text-slate-900">
                Log in
              </Link>
              <GlowBtn href="/register" size="sm">Register Online</GlowBtn>
            </div>

            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative w-full flex justify-center overflow-hidden py-6 lg:py-8">
        {/* background grid */}
        <div className="cyber-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        {/* glow orbs */}
        <div className="float-orb pointer-events-none absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full" aria-hidden
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)' }} />
        <div className="float-orb float-orb-delay pointer-events-none absolute -bottom-24 right-1/4 h-[400px] w-[400px] rounded-full" aria-hidden
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07), transparent 70%)' }} />

        <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-6">

            {/* LEFT */}
            <div className="min-w-0 space-y-4 text-center lg:col-span-5 lg:text-left">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1 text-[11px] font-medium tracking-wide backdrop-blur-sm text-emerald-500">
                  <BookOpen size={12} /> Premier CBT Exam Preparation Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1 }}
                className="text-3xl font-black leading-[1.06] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.6rem]">
                Shaping the Future of{' '}
                <span className="relative inline-block">
                  <span className="glow-text">Medical Excellence</span>
                  <motion.span
                    className="pointer-events-none absolute -inset-1 -z-10 rounded-lg blur-2xl"
                    style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.2))' }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    aria-hidden
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto max-w-md text-sm leading-relaxed text-slate-600 lg:mx-0">
                Access comprehensive digital mock exams, analyze your performance, and track your specialist medical training progress with scholarly precision.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <GlowBtn href="/register" size="md">
                  Start Free Demo <ArrowRight size={15} />
                </GlowBtn>
                <GlowBtn href="#hiw" size="md" variant="ghost">
                  How to Apply <ChevronDown size={14} />
                </GlowBtn>
              </motion.div>

              {/* trust chips */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {['10,000+ Doctors', '99.9% Uptime', 'No card required'].map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] text-slate-500 shadow-sm">
                    <Check size={10} className="text-emerald-400" /> {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* MIDDLE: Quick Gateway -- its own column now, so the hero copy,
                the gateway and the CBT terminal all share one row. */}
            <motion.div
              className="min-w-0 lg:col-span-3 flex flex-col"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}>
              <GlassCard className="flex-1 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Quick Gateway</h3>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Live
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  {GATEWAY.map((g) => {
                    const Icon = g.icon
                    const accent = g.color === 'cyan' ? '#06B6D4' : g.color === 'blue' ? '#3B82F6' : '#10B981'
                    return (
                      <Link key={g.title} href={g.href}
                        className="group flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-2.5 transition-all hover:border-emerald-400 hover:bg-emerald-50/50 lg:flex-row lg:items-center lg:gap-2.5">
                        <div className="mb-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md lg:mb-0"
                          style={{ background: `${accent}18`, color: accent }}>
                          <Icon size={14} className="transition-transform group-hover:scale-110" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[11px] font-semibold leading-tight text-slate-800">{g.title}</h4>
                          <p className="mt-0.5 text-[9px] leading-tight text-slate-500">{g.desc}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </GlassCard>
            </motion.div>

            {/* RIGHT: CBT terminal */}
            <motion.div
              className="min-w-0 lg:col-span-4 flex flex-col"
              initial={{ opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, delay: 0.2 }}>
              <div className="flex-1 min-h-0"><CbtTerminal /></div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── STATS ── */}
      <section className="w-full flex justify-center border-y border-slate-100 bg-slate-50">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 lg:grid-cols-4 lg:divide-y-0">
            {STATS.map(({ value, display, label, icon: Icon }, i) => (
              <Reveal key={label} delay={i}
                className="flex flex-col items-center gap-1.5 px-6 py-6 text-center">
                <div className="mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm">
                  <Icon size={17} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-slate-900 lg:text-[1.6rem]"
                  style={{ textShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
                  <Counter target={value} display={display} />
                </div>
                <div className="text-[11px] text-slate-500">{label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="w-full flex justify-center py-6 bg-white">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="Platform Features"
            title={<>Built for <span className="glow-text">medical excellence</span></>}
            sub="Every feature engineered to replicate the real exam environment and maximize your preparation."
          />
          <div className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = FEATURE_ICONS[f.id] ?? Sparkles
              const accent = FEATURE_COLORS[i % FEATURE_COLORS.length]
              return (
                <Reveal key={f.id} delay={i % 3}>
                  <Link href={`/feature/${f.id}`}>
                    <GlassCard glow={accent} className="h-full p-4 cursor-pointer">
                      <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                        style={{ background: `${accent}15`, color: accent }}>
                        <Icon size={17} />
                      </div>
                      <h3 className="mb-1.5 text-[15px] font-bold text-slate-900">{f.title}</h3>
                      <p className="text-[12.5px] leading-relaxed text-slate-500">{f.shortDesc}</p>
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold" style={{ color: accent }}>
                        Learn more <ArrowRight size={12} />
                      </div>
                    </GlassCard>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="hiw" className="relative w-full flex justify-center overflow-hidden py-6 bg-slate-50">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 to-transparent" aria-hidden />

        <div className="relative w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="Process" title="Start in three simple steps" />

          <div className="mt-6 grid w-full gap-5 sm:grid-cols-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <Reveal key={s.num} delay={i}>
                  <div className="group relative text-center">
                    {i < STEPS.length - 1 && (
                      <div className="absolute left-[60%] right-[-40%] top-10 hidden h-px sm:block"
                        style={{ background: `linear-gradient(90deg, ${s.color}40, transparent)` }} />
                    )}
                    <div className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-2 text-base font-black transition-all duration-300 group-hover:scale-110"
                      style={{
                        borderColor: s.color,
                        color: s.color,
                        background: `${s.color}10`,
                        boxShadow: `0 0 30px ${s.color}25`,
                      }}>
                      {s.num}
                      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ boxShadow: `0 0 40px ${s.color}50` }} />
                    </div>
                    <h3 className="mb-1.5 text-[15px] font-bold text-slate-900">{s.title}</h3>
                    <p className="mx-auto max-w-[210px] text-[12.5px] leading-relaxed text-slate-500">{s.desc}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative w-full flex justify-center overflow-hidden py-6 bg-white">
        <div className="float-orb pointer-events-none absolute top-0 right-1/4 h-[450px] w-[450px] rounded-full" aria-hidden
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)' }} />

        <div className="relative w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="Pricing"
            title="Choose your plan"
            sub="Transparent pricing. No hidden fees. Instant access after payment."
          />

          <div className="mt-6 grid w-full grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i}>
                <GlassCard featured={plan.featured} className="flex h-full flex-col p-6">
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2">
                      <span className="whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.6)]">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-0.5 text-[12px] font-semibold text-slate-500">{plan.name}</div>

                  {plan.azadiOffer && azadiOfferActive ? (
                    <>
                      <div
                        className="text-sm font-semibold text-red-500"
                        style={{ textDecoration: 'line-through', textDecorationColor: '#ef4444', textDecorationThickness: '2px' }}
                      >
                        {plan.originalPrice}
                      </div>
                      <div
                        className={`mb-0.5 text-2xl font-black ${plan.featured ? 'glow-text' : 'text-orange-600'}`}
                      >
                        {plan.price}
                      </div>
                      <div className="mb-2 text-xs text-slate-400">{plan.period} &middot; 40% off</div>
                      <div className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-emerald-600 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-white shadow-[0_2px_10px_rgba(234,88,12,0.35)]">
                        🇵🇰 Azadi Offer &bull; Valid till 14 Aug 2026
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`mb-0.5 text-xl font-black ${plan.featured ? 'glow-text' : 'text-slate-900'}`}>
                        {plan.price}
                      </div>
                      <div className="mb-6 text-xs text-slate-400">{plan.period}</div>
                    </>
                  )}

                  <ul className="mb-6 flex flex-1 flex-col gap-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${plan.featured ? 'bg-emerald-500/15' : 'bg-slate-100'}`}>
                          <Check size={9} className={plan.featured ? 'text-emerald-600' : 'text-slate-400'} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.featured ? (
                    <GlowBtn href="/subscription-expired">
                      {plan.cta} <ArrowRight size={14} />
                    </GlowBtn>
                  ) : (
                    <Link href="/subscription-expired"
                      className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-[12.5px] font-semibold text-slate-700 transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700">
                      {plan.cta}
                    </Link>
                  )}
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="relative w-full flex justify-center py-6 bg-slate-50">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden />
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="Testimonials"
            title={<>Trusted by <span className="glow-text">medical professionals</span></>}
          />
          <div className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i}>
                <GlassCard className="flex h-full flex-col p-5">
                  <div className="mb-2 text-3xl font-black leading-none glow-text">&ldquo;</div>
                  <p className="mb-4 flex-1 text-[13px] italic leading-relaxed text-slate-600">{t.quote}</p>
                  <div className="flex items-center gap-2.5 border-t border-slate-100 pt-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/60 to-cyan-500/60 text-xs font-black text-white">
                      {t.name.replace('Dr. ', '')[0]}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-900">{t.name}</div>
                      <div className="text-[11px] text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="w-full flex justify-center py-6 bg-white">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="FAQ" title="Common questions" />
          <div className="mt-6 w-full flex justify-center">
            <FaqAccordion faqs={FAQS} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative w-full flex justify-center overflow-hidden py-8 md:py-9">
        <div className="cyber-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="float-orb pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="h-[600px] w-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07), transparent 70%)' }} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" aria-hidden />

        <div className="relative z-10 w-full max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-[2rem]">
              Ready to secure your{' '}
              <span className="glow-text">residency?</span>
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="mx-auto mt-3 max-w-sm text-[13px] text-slate-600">
              Join thousands of medical professionals already preparing smarter with the FCPS Part 1 Simulator.
            </p>
          </Reveal>
          <Reveal delay={2} className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <GlowBtn href="/register" size="lg">
              Get instant access <ArrowRight size={17} />
            </GlowBtn>
            <GlowBtn href="/register" size="lg" variant="ghost">
              Start Free Demo
            </GlowBtn>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full flex justify-center border-t border-slate-200 bg-slate-50">
        <div className="w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-7">
            <div className="min-w-0 max-w-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  <BrandMark size={18} />
                </div>
                <span className="text-[15px] font-bold text-slate-900">FCPS Simulator</span>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-600">
                The scholarly CBT platform for medical professionals preparing for FCPS Part 1.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-6">
              <div className="min-w-0">
                <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Platform</h4>
                <div className="flex flex-col gap-2 text-[12.5px] text-slate-600">
                  {NAV_LINKS.map((l) => (
                    <a key={l.href} href={l.href} className="transition-colors hover:text-emerald-700">{l.label}</a>
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Account</h4>
                <div className="flex flex-col gap-2 text-[12.5px] text-slate-600">
                  <Link href="/login" className="transition-colors hover:text-slate-900">Log in</Link>
                  <Link href="/register" className="transition-colors hover:text-slate-900">Register</Link>
                  <a href="https://wa.me/923324737436" className="flex items-center gap-1.5 transition-colors hover:text-emerald-700">
                    <MessageCircle size={13} className="text-emerald-500" /> WhatsApp support
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} FCPS Part 1 Simulator. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
