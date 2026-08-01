import Link from 'next/link';
import {
  BarChart3, ShieldCheck, Building2, Sparkles, RefreshCw, Crown,
  ArrowRight, Check, MessageCircle, GraduationCap, FileText, Award, Bell,
} from 'lucide-react';
import { FEATURES } from '../lib/featuresData';
import FaqAccordion from '../components/FaqAccordion';
import MobileNav from '../components/MobileNav';

const NAVY = '#0f2942';
const NAVY_ACCENT = '#1e466d';
const GOLD = '#b89244';

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
  { num: '01', title: 'Register', desc: 'Create your secure profile — no credit card required to start.' },
  { num: '02', title: 'Subscribe', desc: 'Choose a plan that fits your residency timeline.' },
  { num: '03', title: 'Simulate', desc: 'Take timed mock exams, analyze weak areas, and track every gain.' },
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

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* 1. ANNOUNCEMENT BAR */}
      <div className="px-4 py-2 text-center text-sm font-medium text-white" style={{ backgroundColor: GOLD }}>
        <Bell className="mr-1.5 inline h-3.5 w-3.5 animate-pulse" />
        Admissions open for Fall 2026: FCPS Part 1 preparation now live.
        <Link href="/register" className="ml-1 underline hover:text-[#0f2942]">Get started →</Link>
      </div>

      {/* 2. NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-bold text-white shadow-md" style={{ backgroundColor: NAVY, borderColor: GOLD }}>
                F
              </div>
              <div>
                <span className="block text-xl font-bold tracking-tight" style={{ color: NAVY }}>FCPS Simulator</span>
                <span className="block text-xs uppercase tracking-wider text-gray-500">Physicians &amp; Surgeons Prep</span>
              </div>
            </Link>

            <div className="hidden items-center space-x-8 text-sm font-medium text-gray-600 md:flex">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="transition hover:text-[#0f2942]">{l.label}</a>
              ))}
            </div>

            <div className="hidden items-center space-x-4 md:flex">
              <Link href="/login" className="text-sm font-semibold transition hover:text-[#b89244]" style={{ color: NAVY }}>
                Log in
              </Link>
              <Link href="/register" className="rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-lg transition hover:opacity-90" style={{ backgroundColor: NAVY }}>
                Register Online
              </Link>
            </div>

            <MobileNav />
          </div>
        </div>
      </nav>

      {/* 3. HERO */}
      <header className="relative overflow-hidden py-20 text-white lg:py-28" style={{ background: `linear-gradient(to bottom right, ${NAVY}, ${NAVY_ACCENT})` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          {/* Left */}
          <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm" style={{ color: GOLD }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GOLD }} />
              Premier CBT Exam Preparation Platform
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Shaping the Future of <span style={{ color: GOLD }}>Medical Excellence</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300 lg:mx-0">
              Access comprehensive digital mock exams, analyze your performance, and track your specialist medical training progress — effortlessly.
            </p>
            <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row lg:justify-start">
              <Link href="/register" className="rounded-lg px-8 py-3.5 text-center font-bold shadow-xl transition hover:bg-white" style={{ backgroundColor: GOLD, color: NAVY }}>
                Start Free Demo
              </Link>
              <a href="#hiw" className="rounded-lg border border-white/30 bg-white/5 px-8 py-3.5 text-center font-medium text-white backdrop-blur-sm transition hover:bg-white/10">
                How to Apply
              </a>
            </div>
          </div>

          {/* Right — Quick Gateway card */}
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8 lg:col-span-5">
            <h3 className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 text-xl font-bold text-white">
              <span>Quick Gateway</span>
              <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: `${GOLD}33`, color: GOLD }}>Live</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {GATEWAY.map((g) => {
                const Icon = g.icon;
                return (
                  <Link key={g.title} href={g.href} className="group rounded-xl border border-white/5 bg-white/5 p-4 text-left transition hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <Icon className="mb-2 h-6 w-6 transition-transform group-hover:scale-110" style={{ color: GOLD }} />
                    <h4 className="text-sm font-semibold text-white">{g.title}</h4>
                    <p className="mt-1 text-xs text-gray-400">{g.desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* 4. STATS */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center">
              <div className="text-3xl font-extrabold" style={{ color: NAVY }}>{s.value}</div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>Platform Features</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: NAVY }}>Built for medical excellence</h2>
          <p className="mt-3 text-gray-600">Every feature engineered to replicate the real exam environment and maximize your preparation.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = ICONS[f.id] ?? Sparkles;
            return (
              <Link key={f.id} href={`/feature/${f.id}`} className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl" style={{ borderTopWidth: 3, borderTopColor: GOLD }}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${NAVY}0d`, color: NAVY }}>
                  <Icon size={22} />
                </div>
                <h3 className="mb-1.5 text-base font-bold" style={{ color: NAVY }}>{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.shortDesc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section id="hiw" className="border-y border-gray-100 bg-white py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>Process</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: NAVY }}>Start in 3 simple steps</h2>
            <p className="mt-3 text-gray-600">From registration to full simulation in minutes.</p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-md" style={{ backgroundColor: NAVY }}>
                  {s.num}
                </div>
                <h3 className="mb-2 text-lg font-bold" style={{ color: NAVY }}>{s.title}</h3>
                <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>Pricing</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: NAVY }}>Choose your elite plan</h2>
          <p className="mt-3 text-gray-600">Transparent pricing. No hidden fees. Instant access after payment.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${plan.featured ? 'lg:scale-[1.04]' : ''}`} style={plan.featured ? { borderColor: GOLD, borderWidth: 2, boxShadow: `0 20px 50px -20px ${GOLD}66` } : { borderColor: '#e5e7eb' }}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: GOLD }}>
                  {plan.badge}
                </span>
              )}
              <div className="mb-1 text-sm font-semibold text-gray-500">{plan.name}</div>
              <div className="mb-0.5 text-2xl font-extrabold" style={{ color: NAVY }}>{plan.price}</div>
              <div className="mb-5 text-xs text-gray-400">{plan.period}</div>
              <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={15} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/subscription-expired" className="rounded-lg px-4 py-2.5 text-center text-sm font-bold text-white transition hover:opacity-90" style={{ backgroundColor: plan.featured ? GOLD : NAVY }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      <section id="testimonials" className="border-y border-gray-100 bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>Success Stories</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: NAVY }}>Trusted by medical professionals</h2>
            <p className="mt-3 text-gray-600">Real results from real FCPS candidates across Pakistan.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
                <div className="mb-3 font-serif text-4xl leading-none" style={{ color: `${GOLD}88` }}>&ldquo;</div>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-700">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: NAVY }}>
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

      {/* 9. FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>FAQ</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: NAVY }}>Common questions</h2>
          <p className="mt-3 text-gray-600">Everything you need to know before getting started.</p>
        </div>
        <div className="mt-14">
          <FaqAccordion faqs={FAQS} />
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-24 text-white" style={{ background: `linear-gradient(to bottom right, ${NAVY}, ${NAVY_ACCENT})` }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-lg text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Ready to secure your <span style={{ color: GOLD }}>residency?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-gray-300">
            Join thousands of medical professionals already preparing smarter with the FCPS Part 1 Simulator.
          </p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg px-8 py-3.5 font-bold shadow-xl transition hover:bg-white" style={{ backgroundColor: GOLD, color: NAVY }}>
            Get instant access <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="text-white" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: GOLD }}>F</div>
                <span className="text-lg font-bold">FCPS Simulator</span>
              </div>
              <p className="mt-3 text-sm text-gray-400">The elite CBT infrastructure for medical professionals preparing for FCPS Part 1.</p>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>Platform</h4>
                <div className="flex flex-col gap-2 text-sm text-gray-300">
                  {NAV_LINKS.map((l) => (
                    <a key={l.href} href={l.href} className="transition hover:text-white">{l.label}</a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>Account</h4>
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
