import Link from 'next/link';
import {
  BarChart3,
  ShieldCheck,
  Building2,
  Sparkles,
  RefreshCw,
  Crown,
  ArrowRight,
  Check,
  MessageCircle,
} from 'lucide-react';
import { FEATURES } from '../lib/featuresData';
import FaqAccordion from '../components/FaqAccordion';
import MobileNav from '../components/MobileNav';
import Reveal from '../components/Reveal';

// Fonts (Inter + Outfit) are already loaded once, self-hosted, in
// layout.tsx via next/font — this page intentionally loads no fonts of
// its own so there's exactly one font fetch for the whole app.

const ICONS: Record<string, typeof BarChart3> = {
  'smart-analytics': BarChart3,
  'forensic-security': ShieldCheck,
  'hospital-grade-ui': Building2,
  'ai-powered-organization': Sparkles,
  'real-time-synchronization': RefreshCw,
  'vvip-support': Crown,
};

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#hiw', label: 'How it works' },
  { href: '#testimonials', label: 'Success stories' },
  { href: '#pricing', label: 'Pricing' },
];

const STATS = [
  { value: '10,000+', label: 'Medical professionals' },
  { value: '4.9 / 5', label: 'Average rating' },
  { value: '99.9%', label: 'Platform uptime' },
];

const STEPS = [
  { num: '01', title: 'Register', desc: 'Create your secure profile — no credit card required to start.' },
  { num: '02', title: 'Subscribe', desc: 'Choose a plan that fits your residency timeline.' },
  { num: '03', title: 'Simulate', desc: 'Take timed mock exams, analyze weak areas, and track every gain.' },
];

const PLANS = [
  {
    name: 'Standard',
    price: 'Rs. 1,999',
    period: '/ 1 month',
    features: ['1 month access', 'Basic analytics', 'Mock exams'],
    cta: 'Get started',
    featured: false,
  },
  {
    name: 'Elite Pro',
    badge: 'Best value',
    price: 'Rs. 4,999',
    period: '/ 3 months',
    features: ['3 months access', 'Smart heatmaps', 'Forensic security', 'VIP support'],
    cta: 'Instant access',
    featured: true,
  },
  {
    name: 'Advanced',
    price: 'Rs. 8,999',
    period: '/ 6 months',
    features: ['6 months access', 'Premium analytics', 'Priority sync', 'Extended bank'],
    cta: 'Go advanced',
    featured: false,
  },
  {
    name: 'Platinum',
    price: 'Rs. 14,999',
    period: '/ 1 year',
    features: ['1 year access', 'Ultimate prep kit', 'Direct support', 'Full analytics'],
    cta: 'Go platinum',
    featured: false,
  },
];

const TESTIMONIALS = [
  {
    quote: 'The analytics helped me identify my weak areas in Anatomy within days. A game-changer for Part 1.',
    name: 'Dr. Ahmed',
    role: 'Resident',
  },
  {
    quote: 'The interface is identical to the actual exam. It removed all my fear of the CBT environment.',
    name: 'Dr. Sara',
    role: 'FCPS Candidate',
  },
  {
    quote: "Most secure and updated question bank I've used. The watermark feature shows how serious they are.",
    name: 'Dr. Zohaib',
    role: 'Medical Officer',
  },
];

const FAQS = [
  { q: 'Is the interface same as the real exam?', a: 'Yes — we have replicated the official CBT environment for 100% familiarity.' },
  { q: 'How do I activate my account?', a: 'Simply share your payment proof via WhatsApp for instant premium activation.' },
  { q: 'Can I track my progress?', a: 'Absolutely. Our Smart Analytics provide detailed heatmaps of your performance across all subjects.' },
];

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_2px_rgba(45,212,191,0.6)]" />
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-teal-400/20 selection:text-teal-200">
      {/* Ambient background glows, fixed so they don't repaint on scroll */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-[-10%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[420px] w-[420px] rounded-full bg-pink-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* ── HEADER ── */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/70 backdrop-blur-xl">
          <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 text-[13px] font-black text-zinc-950">
                F
              </span>
              FCPS <span className="text-teal-400">Simulator</span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-[13.5px] font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/login"
                className="text-[13.5px] font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-2 text-[13px] font-bold text-zinc-950 transition-transform duration-200 hover:-translate-y-0.5"
              >
                Start free demo
              </Link>
            </div>

            <MobileNav />
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pt-28">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 100%)',
            }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
            <div>
              <Tag>Elite CBT infrastructure</Tag>
              <h1 className="mt-6 text-[40px] font-bold leading-[1.05] tracking-tight text-white sm:text-[52px]">
                Master the FCPS Part 1 with{' '}
                <span className="bg-gradient-to-r from-teal-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                  elite CBT simulation
                </span>
              </h1>
              <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-zinc-400">
                Engineered for perfection, secured for integrity. Practice on the most advanced medical exam
                platform built to guarantee your residency success.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-6 py-3 text-[14px] font-bold text-zinc-950 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-8px_rgba(45,212,191,0.5)]"
                >
                  Start free demo
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#pricing"
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[14px] font-semibold text-zinc-200 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                >
                  View elite plans
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-zinc-500">
                <span className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> Instant activation</span>
                <span className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> 100% secure platform</span>
              </div>
            </div>

            {/* Product mockup — the signature element: a live-styled preview
                of the actual exam interface, tied to the "hospital-grade UI"
                feature below rather than a generic illustration. */}
            <Reveal delay={0.1} className="relative">
              <div className="absolute inset-0 -z-10 rounded-[28px] bg-gradient-to-br from-teal-500/20 via-violet-500/10 to-transparent blur-2xl" />
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl transition-colors duration-300 hover:border-white/20">
                <div className="mb-4 flex items-center gap-1.5 border-b border-white/10 pb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-auto text-[11px] text-zinc-500">FCPS Part 1 — Mock Exam #14</span>
                </div>

                <div className="mb-3.5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-teal-400">
                    Question 23 / 100 · Anatomy
                  </div>
                  <p className="mb-3.5 text-[13px] leading-relaxed text-zinc-200">
                    Which nerve passes through the carpal tunnel alongside the flexor tendons?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-400">A. Ulnar Nerve</div>
                    <div className="rounded-lg border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-[11px] font-semibold text-teal-300">B. Median Nerve ✓</div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-400">C. Radial Nerve</div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-400">D. Axillary Nerve</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { v: '78%', l: 'Accuracy' },
                    { v: '2:14', l: 'Time left' },
                    { v: '#12', l: 'Global rank' },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2.5 text-center">
                      <div className="text-[14px] font-bold text-teal-300">{s.v}</div>
                      <div className="text-[9.5px] uppercase tracking-wide text-zinc-500">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── STATS ── */}
        <Reveal>
          <section className="border-y border-white/[0.06] bg-white/[0.02]">
            <div className="mx-auto grid max-w-5xl divide-y divide-white/[0.06] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
              {STATS.map((s) => (
                <div key={s.label} className="px-2 py-8 text-center">
                  <div className="text-[28px] font-bold text-white">{s.value}</div>
                  <div className="mt-1 text-[13px] text-zinc-500">{s.label}</div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── FEATURES ── */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-xl text-center">
            <Tag>Platform features</Tag>
            <h2 className="mt-5 text-[32px] font-bold tracking-tight text-white sm:text-[38px]">
              Built for medical excellence
            </h2>
            <p className="mt-3 text-[15px] text-zinc-400">
              Every feature engineered to replicate the real exam environment and maximize your preparation.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = ICONS[f.id] ?? Sparkles;
              return (
                <Reveal key={f.id} delay={i * 0.06}>
                  <Link
                    href={`/feature/${f.id}`}
                    className="group block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border"
                      style={{ color: f.color, backgroundColor: `${f.color}1a`, borderColor: `${f.color}33` }}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className="mb-1.5 text-[15px] font-semibold text-white">{f.title}</h3>
                    <p className="text-[13.5px] leading-relaxed text-zinc-400">{f.shortDesc}</p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="hiw" className="border-y border-white/[0.06] bg-white/[0.02] py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <Reveal className="mx-auto max-w-xl text-center">
              <Tag>Process</Tag>
              <h2 className="mt-5 text-[32px] font-bold tracking-tight text-white sm:text-[38px]">
                Start in 3 simple steps
              </h2>
              <p className="mt-3 text-[15px] text-zinc-400">From registration to full simulation in minutes.</p>
            </Reveal>

            <div className="relative mt-14 grid gap-8 sm:grid-cols-3">
              <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent sm:block" />
              {STEPS.map((s, i) => (
                <Reveal key={s.num} delay={i * 0.1} className="relative text-center">
                  <div className="relative mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#09090b] text-[13px] font-bold text-teal-300">
                    {s.num}
                  </div>
                  <h3 className="mb-2 text-[16px] font-semibold text-white">{s.title}</h3>
                  <p className="mx-auto max-w-[240px] text-[13.5px] leading-relaxed text-zinc-400">{s.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-xl text-center">
            <Tag>Pricing</Tag>
            <h2 className="mt-5 text-[32px] font-bold tracking-tight text-white sm:text-[38px]">
              Choose your elite plan
            </h2>
            <p className="mt-3 text-[15px] text-zinc-400">Transparent pricing. No hidden fees. Instant access after payment.</p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.07}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                    plan.featured
                      ? 'border-teal-400/40 bg-gradient-to-b from-teal-400/[0.08] to-transparent shadow-[0_0_40px_-12px_rgba(45,212,191,0.35)]'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-teal-400 to-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-950">
                      {plan.badge}
                    </span>
                  )}
                  <div className="mb-1 text-[13px] font-semibold text-zinc-300">{plan.name}</div>
                  <div className="mb-0.5 text-[26px] font-bold text-white">{plan.price}</div>
                  <div className="mb-5 text-[12px] text-zinc-500">{plan.period}</div>
                  <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-zinc-400">
                        <Check size={14} className="mt-0.5 shrink-0 text-teal-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/subscription-expired"
                    className={`rounded-xl px-4 py-2.5 text-center text-[13.5px] font-bold transition-all duration-300 ${
                      plan.featured
                        ? 'bg-gradient-to-r from-teal-400 to-blue-500 text-zinc-950 hover:shadow-[0_8px_24px_-8px_rgba(45,212,191,0.5)]'
                        : 'border border-white/10 bg-white/5 text-zinc-200 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonials" className="border-y border-white/[0.06] bg-white/[0.02] py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal className="mx-auto max-w-xl text-center">
              <Tag>Success stories</Tag>
              <h2 className="mt-5 text-[32px] font-bold tracking-tight text-white sm:text-[38px]">
                Trusted by medical professionals
              </h2>
              <p className="mt-3 text-[15px] text-zinc-400">Real results from real FCPS candidates across Pakistan.</p>
            </Reveal>

            <div className="mt-14 grid gap-5 sm:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.08}>
                  <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="mb-3 font-serif text-3xl leading-none text-teal-400/60">&ldquo;</div>
                    <p className="mb-5 flex-1 text-[13.5px] leading-relaxed text-zinc-300">{t.quote}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/30 to-blue-500/30 text-[13px] font-bold text-teal-300">
                        {t.name.replace('Dr. ', '')[0]}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-white">{t.name}</div>
                        <div className="text-[11.5px] text-zinc-500">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-xl text-center">
            <Tag>FAQ</Tag>
            <h2 className="mt-5 text-[32px] font-bold tracking-tight text-white sm:text-[38px]">Common questions</h2>
            <p className="mt-3 text-[15px] text-zinc-400">Everything you need to know before getting started.</p>
          </Reveal>
          <div className="mt-14">
            <FaqAccordion faqs={FAQS} />
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <Reveal>
          <section className="relative mx-auto max-w-5xl px-5 py-24 text-center sm:px-8">
            <div className="pointer-events-none absolute inset-0 -z-10 mx-auto h-72 w-72 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[100px]" style={{ left: '50%', transform: 'translateX(-50%)' }} />
            <Tag>Get started today</Tag>
            <h2 className="mx-auto mt-6 max-w-lg text-[32px] font-bold leading-tight tracking-tight text-white sm:text-[42px]">
              Ready to secure your{' '}
              <span className="bg-gradient-to-r from-teal-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                residency?
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
              Join thousands of medical professionals already preparing smarter with the FCPS Part 1 Simulator.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-8 py-3.5 text-[15px] font-bold text-zinc-950 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-8px_rgba(45,212,191,0.5)]"
            >
              Get instant access
              <ArrowRight size={17} />
            </Link>
          </section>
        </Reveal>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
            <Link href="/" className="text-[14px] font-bold text-white">
              FCPS <span className="text-teal-400">Simulator</span>
            </Link>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="text-[12.5px] font-medium text-zinc-500 transition-colors hover:text-zinc-200">
                  {l.label}
                </a>
              ))}
              <a
                href="https://wa.me/923324737436"
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-500 transition-colors hover:text-zinc-200"
              >
                <MessageCircle size={13} /> WhatsApp support
              </a>
            </div>
          </div>
          <div className="mx-auto mt-8 max-w-6xl border-t border-white/[0.06] pt-6 text-center text-[11.5px] text-zinc-600">
            © {new Date().getFullYear()} FCPS Part 1 Simulator — the elite CBT infrastructure for medical professionals. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
