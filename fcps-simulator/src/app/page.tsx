'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  BarChart3, ShieldCheck, Building2, Sparkles, RefreshCw, Crown,
  ArrowRight, Check, MessageCircle, GraduationCap, FileText, Award,
  BookOpen, Menu, X, ChevronDown, Zap, Activity, Lock, Cpu,
} from 'lucide-react';
import { FEATURES } from '../lib/featuresData';
import FaqAccordion from '../components/FaqAccordion';
import MobileNav from '../components/MobileNav';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  cyan:     '#06B6D4',
  emerald:  '#10B981',
  blue:     '#3B82F6',
  bg:       '#030712',
  surface:  '#0B0F1A',
  glass:    'rgba(255,255,255,0.04)',
  border:   'rgba(255,255,255,0.08)',
  borderHi: 'rgba(6,182,212,0.4)',
} as const;

/* ─── DATA ───────────────────────────────────────────────────── */
const NAV_LINKS = [
  { href: '#features',     label: 'Features'      },
  { href: '#hiw',          label: 'How it works'  },
  { href: '#testimonials', label: 'Testimonials'  },
  { href: '#pricing',      label: 'Pricing'       },
];

const GATEWAY = [
  { icon: GraduationCap, title: 'FCPS-I Mock Exams', desc: 'Timed CBT simulations',   href: '/register'           },
  { icon: FileText,       title: 'Question Bank',     desc: 'Real-pattern MCQs',        href: '/register'           },
  { icon: Award,          title: 'Latest Results',    desc: 'Track your progress',      href: '/dashboard'          },
  { icon: BarChart3,      title: 'Analytics',         desc: 'Subject-wise heatmaps',    href: '/dashboard/analysis' },
];

const STATS = [
  { value: 10000, suffix: '+', label: 'Medical professionals', icon: Activity },
  { value: 4.9,   suffix: '/5', label: 'Average rating',       icon: Sparkles },
  { value: 99.9,  suffix: '%',  label: 'Platform uptime',      icon: Zap      },
  { value: 24,    suffix: '/7', label: 'VIP support',          icon: Lock     },
];

const STEPS = [
  { num: 'I',   title: 'Register',  desc: 'Create your secure profile — no credit card required to start.',                  color: C.cyan    },
  { num: 'II',  title: 'Subscribe', desc: 'Choose a plan that fits your residency timeline.',                                color: C.emerald },
  { num: 'III', title: 'Simulate',  desc: 'Take timed mock exams, analyze weak areas, and track every gain.',               color: C.blue    },
];

const PLANS = [
  { name: 'Standard', price: 'Rs. 1,999', period: '/ 1 month',  features: ['1 month access', 'Basic analytics', 'Mock exams'],                               cta: 'Get started',   featured: false },
  { name: 'Elite Pro', badge: 'Best value', price: 'Rs. 4,999', period: '/ 3 months', features: ['3 months access', 'Smart heatmaps', 'Forensic security', 'VIP support'], cta: 'Instant access', featured: true  },
  { name: 'Advanced', price: 'Rs. 8,999', period: '/ 6 months', features: ['6 months access', 'Premium analytics', 'Priority sync', 'Extended bank'],         cta: 'Go advanced',   featured: false },
  { name: 'Platinum', price: 'Rs. 14,999', period: '/ 1 year',  features: ['1 year access', 'Ultimate prep kit', 'Direct support', 'Full analytics'],          cta: 'Go platinum',   featured: false },
];

const TESTIMONIALS = [
  { quote: 'The analytics helped me identify my weak areas in Anatomy within days. A game-changer for Part 1.', name: 'Dr. Ahmed', role: 'Resident'        },
  { quote: 'The interface is identical to the actual exam. It removed all my fear of the CBT environment.',      name: 'Dr. Sara',  role: 'FCPS Candidate'  },
  { quote: "Most secure and updated question bank I've used. The watermark feature shows how serious they are.", name: 'Dr. Zohaib',role: 'Medical Officer'  },
];

const FAQS = [
  { q: 'Is the interface same as the real exam?',  a: 'Yes — we have replicated the official CBT environment for 100% familiarity.'                                           },
  { q: 'How do I activate my account?',            a: 'Simply share your payment proof via WhatsApp for instant premium activation.'                                          },
  { q: 'Can I track my progress?',                 a: 'Absolutely. Our Smart Analytics provide detailed heatmaps of your performance across all subjects.'                    },
];

const ICON_MAP: Record<string, typeof BarChart3> = {
  'smart-analytics':         BarChart3,
  'forensic-security':       ShieldCheck,
  'hospital-grade-ui':       Building2,
  'ai-powered-organization': Sparkles,
  'real-time-synchronization': RefreshCw,
  'vvip-support':            Crown,
};

/* ─── ANIMATION VARIANTS ──────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: (i = 0) => ({ opacity: 1, transition: { duration: 0.5, delay: i * 0.06 } }),
};

/* ─── REUSABLE: scroll-triggered section wrapper ─────────────── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={delay} variants={fadeUp}>
      {children}
    </motion.div>
  );
}

/* ─── ANIMATED COUNTER ───────────────────────────────────────── */
function Counter({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) motionVal.set(target);
  }, [inView, target, motionVal]);

  useEffect(() => {
    return spring.on('change', (v) => {
      setDisplay(target < 10 ? v.toFixed(1) : Math.round(v).toLocaleString());
    });
  }, [spring, target]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── GRID BACKGROUND (CSS-only, no canvas dep) ──────────────── */
function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* radial glow orbs */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(ellipse, #06B6D4, transparent 70%)' }} />
      <div className="absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(ellipse, #10B981, transparent 70%)' }} />
      <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(ellipse, #3B82F6, transparent 70%)' }} />
    </div>
  );
}

/* ─── GLOW CARD (hover tilt + border glow) ────────────────────── */
function GlowCard({ children, className = '', glowColor = C.cyan, featured = false }: {
  children: React.ReactNode; className?: string; glowColor?: string; featured?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useTransform(y, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotY = useTransform(x, [-0.5, 0.5], ['-8deg', '8deg']);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top)  / rect.height - 0.5);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: 'preserve-3d',
        perspective: 800,
        background: featured
          ? `linear-gradient(135deg, rgba(6,182,212,0.08), rgba(16,185,129,0.06))`
          : C.glass,
        borderColor: featured ? glowColor : C.border,
        boxShadow: featured ? `0 0 0 1px ${glowColor}40, 0 0 40px ${glowColor}20` : 'none',
      } as React.CSSProperties}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${className}`}
    >
      {featured && (
        /* animated border beam */
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: `conic-gradient(from 0deg at 50% 50%, transparent 270deg, ${glowColor}, transparent)` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ─── EYEBROW ─────────────────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
      style={{ color: C.cyan, borderColor: `${C.cyan}30`, background: `${C.cyan}08` }}>
      {children}
    </span>
  );
}

/* ─── SECTION HEADING ─────────────────────────────────────────── */
function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>
      <Reveal delay={1} className="mt-4">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h2>
      </Reveal>
      <Reveal delay={2}>
        <div className="mx-auto mt-4 h-px w-20 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }} />
        {sub && <p className="mt-4 text-slate-400 leading-relaxed">{sub}</p>}
      </Reveal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div className="w-full min-h-screen overflow-x-clip font-sans text-white" style={{ backgroundColor: C.bg }}>

      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="relative w-full flex justify-center overflow-hidden" style={{ background: `linear-gradient(90deg, ${C.bg}, ${C.surface}, ${C.bg})` }}>
        <div className="w-full max-w-7xl mx-auto px-4 py-2 text-center text-xs font-medium tracking-wide"
          style={{ color: C.cyan }}>
          Admissions open for Fall 2026 · FCPS Part 1 preparation now live
          <Link href="/register" className="ml-2 underline underline-offset-2 hover:opacity-80">Get started →</Link>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}40, transparent)` }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 w-full flex justify-center backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(3,7,18,0.85)', borderBottom: `1px solid ${C.border}` }}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between py-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, boxShadow: `0 0 20px ${C.cyan}50` }}>
                F
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ boxShadow: `0 0 30px ${C.cyan}80` }} />
              </div>
              <div>
                <span className="block text-lg font-bold tracking-tight text-white">FCPS Simulator</span>
                <span className="block text-[10px] uppercase tracking-[0.2em]" style={{ color: C.cyan }}>Physicians &amp; Surgeons Prep</span>
              </div>
            </Link>

            <div className="hidden items-center space-x-8 text-sm font-medium text-slate-400 md:flex">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="transition-colors hover:text-white relative group">
                  {l.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                    style={{ background: C.cyan }} />
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Link href="/login" className="text-sm font-semibold text-slate-300 transition hover:text-white">Log in</Link>
              <Link href="/register"
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, boxShadow: `0 0 20px ${C.cyan}40` }}>
                Register Online
              </Link>
            </div>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative w-full flex justify-center overflow-hidden py-24 lg:py-36">
        <GridBackground />

        {/* floating diagnostic pulse lines */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[20, 45, 70].map((top) => (
            <motion.div key={top} className="absolute w-full h-px opacity-[0.07]"
              style={{ top: `${top}%`, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }}
              animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.04, 0.12, 0.04] }}
              transition={{ duration: 5 + top * 0.05, repeat: Infinity, ease: 'easeInOut' }} />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12">

            {/* LEFT: headline */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm"
                  style={{ borderColor: `${C.cyan}30`, background: `${C.cyan}08`, color: C.cyan }}>
                  <BookOpen size={12} /> Premier CBT Exam Preparation Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                Shaping the Future of{' '}
                <span className="relative">
                  <span className="relative z-10 bg-clip-text text-transparent"
                    style={{ backgroundImage: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})` }}>
                    Medical Excellence
                  </span>
                  <motion.span className="absolute -inset-1 rounded-lg blur-2xl opacity-30 z-0"
                    style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})` }}
                    animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto max-w-xl text-lg leading-relaxed text-slate-400 lg:mx-0">
                Access comprehensive digital mock exams, analyze your performance, and track your specialist medical training progress with scholarly precision.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/register"
                  className="group relative inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, boxShadow: `0 0 30px ${C.cyan}50` }}>
                  <span>Start Free Demo</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ boxShadow: `0 0 50px ${C.cyan}60` }} />
                </Link>
                <a href="#hiw"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:scale-105"
                  style={{ borderColor: C.border, background: C.glass }}>
                  How to Apply <ChevronDown size={15} />
                </a>
              </motion.div>
            </div>

            {/* RIGHT: Quick Gateway card */}
            <motion.div className="lg:col-span-5 min-w-0"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <GlowCard featured glowColor={C.cyan} className="p-7">
                <div className="mb-6 flex items-center justify-between border-b pb-4"
                  style={{ borderColor: C.border }}>
                  <h3 className="text-lg font-bold text-white">Quick Gateway</h3>
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: C.emerald, background: `${C.emerald}15`, border: `1px solid ${C.emerald}30` }}>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: C.emerald }} />
                    Live
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GATEWAY.map((g, i) => {
                    const Icon = g.icon;
                    return (
                      <motion.div key={g.title} custom={i} variants={fadeIn} initial="hidden" animate="visible">
                        <Link href={g.href}
                          className="group flex flex-col rounded-xl border p-4 transition-all hover:scale-[1.03]"
                          style={{ borderColor: C.border, background: C.glass }}>
                          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{ background: `${C.cyan}15`, color: C.cyan }}>
                            <Icon size={18} className="transition-transform group-hover:scale-110" />
                          </div>
                          <h4 className="text-sm font-semibold text-white">{g.title}</h4>
                          <p className="mt-0.5 text-xs text-slate-500">{g.desc}</p>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </GlowCard>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── STATS ── */}
      <section className="w-full flex justify-center relative">
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${C.bg}, ${C.surface})` }} />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 gap-px lg:grid-cols-4"
            style={{ background: C.border }}>
            {STATS.map(({ value, suffix, label, icon: Icon }, i) => (
              <Reveal key={label} delay={i} className="flex flex-col items-center gap-2 px-6 py-10 text-center"
                style={{ background: C.surface }}>
                <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${C.cyan}12`, color: C.cyan }}>
                  <Icon size={20} />
                </div>
                <div className="text-3xl font-black text-white lg:text-4xl"
                  style={{ textShadow: `0 0 20px ${C.cyan}60` }}>
                  <Counter target={value} suffix={suffix} />
                </div>
                <div className="text-sm text-slate-500">{label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative w-full flex justify-center py-28 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-[0.04]"
            style={{ background: `radial-gradient(circle, ${C.emerald}, transparent)` }} />
        </div>
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="Platform Features"
            title={<>Built for <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})` }}>medical excellence</span></>}
            sub="Every feature engineered to replicate the real exam environment and maximize your preparation."
          />
          {/* bento grid */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = ICON_MAP[f.id] ?? Sparkles;
              const accent = [C.cyan, C.emerald, C.blue, '#A78BFA', '#F472B6', '#FB923C'][i % 6];
              return (
                <Reveal key={f.id} delay={i % 3} className={i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}>
                  <Link href={`/feature/${f.id}`}>
                    <GlowCard glowColor={accent} className="h-full p-6 cursor-pointer">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-5 transition-transform duration-300"
                        style={{ background: `${accent}15`, color: accent }}>
                        <Icon size={22} />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-white">{f.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-400">{f.shortDesc}</p>
                      <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: accent }}>
                        Learn more <ArrowRight size={12} />
                      </div>
                    </GlowCard>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="hiw" className="relative w-full flex justify-center py-28 overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${C.bg} 0%, ${C.surface} 50%, ${C.bg} 100%)` }}>
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}30, transparent)` }} />
          <div className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}30, transparent)` }} />
        </div>
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="Process" title="Start in three simple steps" />
          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i}>
                <div className="relative text-center group">
                  {/* connector line */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:block absolute top-10 left-[60%] right-[-40%] h-px"
                      style={{ background: `linear-gradient(90deg, ${s.color}40, transparent)` }} />
                  )}
                  <div className="mx-auto mb-6 relative flex h-20 w-20 items-center justify-center rounded-full border-2 text-2xl font-black transition-all duration-300 group-hover:scale-110"
                    style={{
                      borderColor: s.color,
                      color: s.color,
                      background: `${s.color}10`,
                      boxShadow: `0 0 30px ${s.color}30`,
                    }}>
                    {s.num}
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ boxShadow: `0 0 40px ${s.color}60` }} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">{s.title}</h3>
                  <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-slate-400">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative w-full flex justify-center py-28 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full opacity-[0.05]"
            style={{ background: `radial-gradient(circle, ${C.blue}, transparent)` }} />
        </div>
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="Pricing"
            title="Choose your plan"
            sub="Transparent pricing. No hidden fees. Instant access after payment."
          />
          <div className="mt-16 pt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i}>
                <GlowCard featured={plan.featured} glowColor={C.emerald} className="h-full flex flex-col p-6">
                  {plan.featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                      <span className="whitespace-nowrap rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, boxShadow: `0 0 20px ${C.emerald}60` }}>
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <div className="mb-2 text-sm font-semibold text-slate-400">{plan.name}</div>
                  <div className="mb-0.5 text-2xl font-black text-white"
                    style={plan.featured ? { background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}}>
                    {plan.price}
                  </div>
                  <div className="mb-6 text-xs text-slate-500">{plan.period}</div>
                  <ul className="mb-6 flex flex-1 flex-col gap-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                          style={{ background: plan.featured ? `${C.emerald}20` : `${C.cyan}15` }}>
                          <Check size={10} style={{ color: plan.featured ? C.emerald : C.cyan }} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/subscription-expired"
                    className="mt-auto block rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white transition-all hover:scale-105"
                    style={plan.featured
                      ? { background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, boxShadow: `0 0 20px ${C.emerald}40` }
                      : { background: C.glass, border: `1px solid ${C.border}` }}>
                    {plan.cta}
                  </Link>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="relative w-full flex justify-center py-28 overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${C.bg}, ${C.surface} 50%, ${C.bg})` }}>
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="Testimonials" title={<>Trusted by <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})` }}>medical professionals</span></>} />
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i}>
                <GlowCard className="flex h-full flex-col p-7" glowColor={C.cyan}>
                  <div className="mb-4 text-5xl leading-none font-black"
                    style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    &ldquo;
                  </div>
                  <p className="mb-6 flex-1 text-[15px] italic leading-relaxed text-slate-300">{t.quote}</p>
                  <div className="flex items-center gap-3 border-t pt-5" style={{ borderColor: C.border }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.cyan}80, ${C.emerald}80)` }}>
                      {t.name.replace('Dr. ', '')[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative w-full flex justify-center py-28">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="FAQ" title="Common questions" />
          <div className="mt-14 mx-auto max-w-2xl">
            <FaqAccordion faqs={FAQS} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative w-full flex justify-center py-28 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${C.cyan}08 0%, transparent 70%)` }} />
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}50, transparent)` }} />
          <div className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.emerald}50, transparent)` }} />
        </div>
        <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Ready to secure your{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})` }}>
                residency?
              </span>
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="mx-auto mt-5 max-w-md text-slate-400">
              Join thousands of medical professionals already preparing smarter with the FCPS Part 1 Simulator.
            </p>
          </Reveal>
          <Reveal delay={2}>
            <Link href="/register"
              className="mt-10 inline-flex items-center gap-3 rounded-2xl px-10 py-4 text-base font-bold text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, boxShadow: `0 0 40px ${C.cyan}50` }}>
              Get instant access <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative w-full flex justify-center" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="w-full max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-10">
            <div className="min-w-0 max-w-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, boxShadow: `0 0 15px ${C.cyan}40` }}>
                  F
                </div>
                <span className="text-lg font-bold text-white">FCPS Simulator</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                The scholarly CBT platform for medical professionals preparing for FCPS Part 1.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-14 gap-y-8">
              <div className="min-w-0">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-wider" style={{ color: C.cyan }}>Platform</h4>
                <div className="flex flex-col gap-2.5 text-sm text-slate-400">
                  {NAV_LINKS.map((l) => (
                    <a key={l.href} href={l.href} className="transition-colors hover:text-white">{l.label}</a>
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-wider" style={{ color: C.cyan }}>Account</h4>
                <div className="flex flex-col gap-2.5 text-sm text-slate-400">
                  <Link href="/login" className="transition-colors hover:text-white">Log in</Link>
                  <Link href="/register" className="transition-colors hover:text-white">Register</Link>
                  <a href="https://wa.me/923324737436" className="flex items-center gap-2 transition-colors hover:text-white">
                    <MessageCircle size={13} style={{ color: C.emerald }} /> WhatsApp support
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t pt-6 text-center text-xs text-slate-600" style={{ borderColor: C.border }}>
            © {new Date().getFullYear()} FCPS Part 1 Simulator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
