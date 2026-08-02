import Link from 'next/link';
import {
  BarChart3, ShieldCheck, Building2, Sparkles, RefreshCw, Crown,
  ArrowRight, Check, MessageCircle, GraduationCap, FileText, Award, BookOpen,
} from 'lucide-react';
import { FEATURES } from '../lib/featuresData';
import FaqAccordion from '../components/FaqAccordion';
import MobileNav from '../components/MobileNav';

const MAROON = '#7b1e2b';
const MAROON_DARK = '#5c1620';
const NAVY = '#1a2b4a';
const CREAM = '#faf7f2';

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
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#pricing', label: 'Pricing' },
];

const GATEWAY = [
  { icon: GraduationCap, title: 'FCPS-I Mock Exams', desc: 'Timed CBT simulations', href: '/register' },
  { icon: FileText, title: 'Question Bank', desc: 'Real-pattern MCQs', href: '/register' },
  { icon: Award, title: 'Latest Results', desc: 'Track your progress', href: '/dashboard' },
  { icon: BarChart3, title: 'Analytics', desc: 'Subject-wise heatmaps', href: '/dashboard/analysis' },
];

const STATS = [
  { value: '10,000+', label: 'Medical professionals' },
  { value: '4.9 / 5', label: 'Average rating' },
  { value: '99.9%', label: 'Platform uptime' },
  { value: '24/7', label: 'VIP support' },
];

const STEPS = [
  { num: 'I', title: 'Register', desc: 'Create your secure profile — no credit card required to start.' },
  { num: 'II', title: 'Subscribe', desc: 'Choose a plan that fits your residency timeline.' },
  { num: 'III', title: 'Simulate', desc: 'Take timed mock exams, analyze weak areas, and track every gain.' },
];

const PLANS = [
  { name: 'Standard', price: 'Rs. 1,999', period: '/ 1 month', features: ['1 month access', 'Basic analytics', 'Mock exams'], cta: 'Get started', featured: false },
  { name: 'Elite Pro', badge: 'Best value', price: 'Rs. 4,999', period: '/ 3 months', features: ['3 months access', 'Smart heatmaps', 'Forensic security', 'VIP support'], cta: 'Instant access', featured: true },
  { name: 'Advanced', price: 'Rs. 8,999', period: '/ 6 months', features: ['6 months access', 'Premium analytics', 'Priority sync', 'Extended bank'], cta: 'Go advanced', featured: false },
  { name: 'Platinum', price: 'Rs. 14,999', period: '/ 1 year', features: ['1 year access', 'Ultimate prep kit', 'Direct support', 'Full analytics'], cta: 'Go platinum', featured: false },
];

const TESTIMONIALS = [
  { quote: 'The analytics helped me identify my weak areas in Anatomy within days. A game-changer for Part 1.', name: 'Dr. Ahmed', role: 'Resident' },
  { quote: 'The interface is identical to the actual exam. It removed all my fear of the CBT environment.', name: 'Dr. Sara', role: 'FCPS Candidate' },
  { quote: "Most secure and updated question bank I've used. The watermark feature shows how serious they are.", name: 'Dr. Zohaib', role: 'Medical Officer' },
];

const FAQS = [
  { q: 'Is the interface same as the real exam?', a: 'Yes — we have replicated the official CBT environment for 100% familiarity.' },
  { q: 'How do I activate my account?', a: 'Simply share your payment proof via WhatsApp for instant premium activation.' },
  { q: 'Can I track my progress?', a: 'Absolutely. Our Smart Analytics provide detailed heatmaps of your performance across all subjects.' },
];

const serif = { fontFamily: 'var(--font-playfair), Georgia, serif' };

export default function Home() {
  return (
    <div className="w-full min-h-screen font-sans text-[#2a2320]" style={{ backgroundColor: CREAM }}>
      {/* TOP RULE BAR */}
      <div className="px-4 py-2 text-center text-xs font-medium tracking-wide text-white" style={{ backgroundColor: NAVY }}>
        Admissions open for Fall 2026 · FCPS Part 1 preparation now live
        <Link href="/register" className="ml-2 underline decoration-1 underline-offset-2 hover:opacity-80">Get started →</Link>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b-2 bg-white/95 backdrop-blur" style={{ borderColor: MAROON }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white shadow-sm" style={{ backgroundColor: MAROON, ...serif }}>
                F
              </div>
              <div>
                <span className="block text-xl font-bold tracking-tight" style={{ color: MAROON, ...serif }}>FCPS Simulator</span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500">Physicians &amp; Surgeons Prep</span>
              </div>
            </Link>

            <div className="hidden items-center space-x-8 text-sm font-medium text-gray-600 md:flex">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="transition hover:text-[#7b1e2b]">{l.label}</a>
              ))}
            </div>

            <div className="hidden items-center space-x-4 md:flex">
              <Link href="/login" className="text-sm font-semibold transition hover:opacity-70" style={{ color: NAVY }}>
                Log in
              </Link>
              <Link href="/register" className="rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: MAROON }}>
                Register Online
              </Link>
            </div>

            <MobileNav />
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden py-20 text-white lg:py-28" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${MAROON_DARK} 100%)` }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm">
              <BookOpen size={13} /> Premier CBT Exam Preparation Platform
            </span>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]" style={serif}>
              Shaping the Future of <span className="italic" style={{ color: '#e8c07d' }}>Medical Excellence</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-gray-300 lg:mx-0">
              Access comprehensive digital mock exams, analyze your performance, and track your specialist medical training progress with scholarly precision.
            </p>
            <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row lg:justify-start">
              <Link href="/register" className="rounded-md px-8 py-3.5 text-center font-semibold text-white shadow-lg transition hover:opacity-90" style={{ backgroundColor: MAROON }}>
                Start Free Demo
              </Link>
              <a href="#hiw" className="rounded-md border border-white/25 bg-white/5 px-8 py-3.5 text-center font-medium text-white backdrop-blur-sm transition hover:bg-white/10">
                How to Apply
              </a>
            </div>
          </div>

          {/* Quick Gateway card */}
          <div className="rounded-lg border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-md sm:p-8 lg:col-span-5">
            <h3 className="mb-5 flex items-center justify-between border-b border-white/15 pb-3 text-lg font-bold text-white" style={serif}>
              <span>Quick Gateway</span>
              <span className="rounded px-2 py-0.5 text-[10px] font-sans uppercase tracking-wider" style={{ backgroundColor: 'rgba(232,192,125,0.15)', color: '#e8c07d' }}>Live</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {GATEWAY.map((g) => {
                const Icon = g.icon;
                return (
                  <Link key={g.title} href={g.href} className="group rounded-md border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/25 hover:bg-white/10">
                    <Icon className="mb-2 h-6 w-6 transition-transform group-hover:scale-110" style={{ color: '#e8c07d' }} />
                    <h4 className="text-sm font-semibold text-white">{g.title}</h4>
                    <p className="mt-1 text-xs text-gray-400">{g.desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* STATS */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center">
              <div className="text-3xl font-bold" style={{ color: MAROON, ...serif }}>{s.value}</div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: MAROON }}>Platform Features</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: NAVY, ...serif }}>Built for medical excellence</h2>
          <div className="mx-auto mt-3 h-px w-16" style={{ backgroundColor: MAROON }} />
          <p className="mt-4 text-gray-600">Every feature engineered to replicate the real exam environment and maximize your preparation.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = ICONS[f.id] ?? Sparkles;
            return (
              <Link key={f.id} href={`/feature/${f.id}`} className="group block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ borderLeftWidth: 3, borderLeftColor: MAROON }}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${MAROON}0d`, color: MAROON }}>
                  <Icon size={22} />
                </div>
                <h3 className="mb-1.5 text-lg font-bold" style={{ color: NAVY, ...serif }}>{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.shortDesc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="hiw" className="border-y border-gray-200 py-24" style={{ backgroundColor: '#f4efe8' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: MAROON }}>Process</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: NAVY, ...serif }}>Start in three simple steps</h2>
            <div className="mx-auto mt-3 h-px w-16" style={{ backgroundColor: MAROON }} />
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white text-2xl font-bold shadow-sm" style={{ borderColor: MAROON, color: MAROON, ...serif }}>
                  {s.num}
                </div>
                <h3 className="mb-2 text-xl font-bold" style={{ color: NAVY, ...serif }}>{s.title}</h3>
                <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: MAROON }}>Pricing</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: NAVY, ...serif }}>Choose your plan</h2>
          <div className="mx-auto mt-3 h-px w-16" style={{ backgroundColor: MAROON }} />
          <p className="mt-4 text-gray-600">Transparent pricing. No hidden fees. Instant access after payment.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative flex flex-col rounded-lg border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${plan.featured ? 'lg:scale-[1.04]' : ''}`} style={plan.featured ? { borderColor: MAROON, borderWidth: 2 } : { borderColor: '#e5e7eb' }}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: MAROON }}>
                  {plan.badge}
                </span>
              )}
              <div className="mb-1 text-sm font-semibold text-gray-500">{plan.name}</div>
              <div className="mb-0.5 text-2xl font-bold" style={{ color: NAVY, ...serif }}>{plan.price}</div>
              <div className="mb-5 text-xs text-gray-400">{plan.period}</div>
              <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={15} className="mt-0.5 shrink-0" style={{ color: MAROON }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/subscription-expired" className="rounded-md px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: plan.featured ? MAROON : NAVY }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="border-y border-gray-200 py-24" style={{ backgroundColor: '#f4efe8' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: MAROON }}>Testimonials</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: NAVY, ...serif }}>Trusted by medical professionals</h2>
            <div className="mx-auto mt-3 h-px w-16" style={{ backgroundColor: MAROON }} />
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-3 text-5xl leading-none" style={{ color: `${MAROON}44`, ...serif }}>&ldquo;</div>
                <p className="mb-5 flex-1 text-[15px] italic leading-relaxed text-gray-700" style={serif}>{t.quote}</p>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: NAVY, ...serif }}>
                    {t.name.replace('Dr. ', '')[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: NAVY }}>{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: MAROON }}>FAQ</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: NAVY, ...serif }}>Common questions</h2>
          <div className="mx-auto mt-3 h-px w-16" style={{ backgroundColor: MAROON }} />
        </div>
        <div className="mt-14">
          <FaqAccordion faqs={FAQS} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 text-white" style={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${NAVY} 100%)` }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl" style={serif}>
            Ready to secure your <span className="italic" style={{ color: '#e8c07d' }}>residency?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-gray-300">
            Join thousands of medical professionals already preparing smarter with the FCPS Part 1 Simulator.
          </p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-md px-8 py-3.5 font-semibold text-white shadow-lg transition hover:opacity-90" style={{ backgroundColor: MAROON }}>
            Get instant access <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-white" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: MAROON, ...serif }}>F</div>
                <span className="text-lg font-bold" style={serif}>FCPS Simulator</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">The scholarly CBT platform for medical professionals preparing for FCPS Part 1.</p>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#e8c07d' }}>Platform</h4>
                <div className="flex flex-col gap-2 text-sm text-gray-300">
                  {NAV_LINKS.map((l) => (
                    <a key={l.href} href={l.href} className="transition hover:text-white">{l.label}</a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#e8c07d' }}>Account</h4>
                <div className="flex flex-col gap-2 text-sm text-gray-300">
                  <Link href="/login" className="transition hover:text-white">Log in</Link>
                  <Link href="/register" className="transition hover:text-white">Register</Link>
                  <a href="https://wa.me/923324737436" className="flex items-center gap-1.5 transition hover:text-white">
                    <MessageCircle size={13} /> WhatsApp support
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} FCPS Part 1 Simulator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
