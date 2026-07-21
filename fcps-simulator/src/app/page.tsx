'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FEATURES } from '../lib/featuresData';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  .lp {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #ffffff;
    color: #0f172a;
    min-height: 100vh;
    overflow-x: hidden;
    zoom: 0.75;
  }

  /* ─── NAVBAR ─── */
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(13,148,136,0.1);
  }
  .nav-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 32px; height: 70px;
    display: flex; align-items: center; justify-content: space-between; gap: 32px;
  }
  .nav-logo {
    font-size: 17px; font-weight: 800;
    color: #0f172a; text-decoration: none;
    letter-spacing: -0.02em;
  }
  .nav-logo span { color: #0d9488; }
  .nav-links { display: flex; gap: 28px; list-style: none; }
  .nav-links a {
    color: #475569; text-decoration: none;
    font-size: 14px; font-weight: 500; transition: color 0.2s;
  }
  .nav-links a:hover { color: #0d9488; }
  .btn-cta {
    background: linear-gradient(135deg, #0d9488, #3b82f6);
    color: #ffffff; padding: 10px 22px;
    border-radius: 8px; font-size: 13px; font-weight: 800;
    text-decoration: none; transition: all 0.2s;
    white-space: nowrap; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .btn-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(59,130,246,0.4); }

  /* ─── HERO ─── */
  .hero {
    position: relative; overflow: hidden;
    padding: 100px 32px 80px;
  }
  .hero-bg-grad {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(circle at 10% 40%, rgba(139, 92, 246, 0.12), transparent 45%),
      radial-gradient(circle at 90% 20%, rgba(236, 72, 153, 0.12), transparent 45%),
      radial-gradient(circle at 50% 90%, rgba(59, 130, 246, 0.1), transparent 50%),
      radial-gradient(ellipse 70% 35% at 50% 100%, rgba(240,253,250,1) 0%, transparent 65%);
    filter: blur(20px);
  }
  .hero-grid-bg {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(13,148,136,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(13,148,136,0.02) 1px, transparent 1px);
    background-size: 56px 56px;
  }
  .hero-inner {
    position: relative; max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
  }
  .tag-pill {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(13,148,136,0.06);
    border: 1px solid rgba(13,148,136,0.2);
    color: #0d9488; font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 6px 14px; border-radius: 30px; margin-bottom: 22px;
  }
  .tag-dot { width: 6px; height: 6px; border-radius: 50%; background: #0d9488; animation: blink 2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .hero-h1 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(32px, 4vw, 52px);
    line-height: 1.05; font-weight: 400;
    letter-spacing: -0.02em; margin-bottom: 20px;
    color: #0f172a;
  }
  .hero-h1 em { 
    background: linear-gradient(135deg, #0d9488, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-style: normal; 
  }
  .hero-sub {
    font-size: 15px; line-height: 1.65;
    color: #475569;
    max-width: 440px; margin-bottom: 32px;
  }
  .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
  .btn-primary {
    background: linear-gradient(135deg, #0d9488, #3b82f6);
    color: #ffffff; border: none; padding: 12px 28px;
    border-radius: 8px; font-size: 14px; font-weight: 800;
    cursor: pointer; transition: all 0.2s; text-decoration: none;
    display: inline-block; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(59,130,246,0.4); }
  .btn-ghost {
    background: #f8fafc;
    backdrop-filter: blur(10px);
    color: #475569;
    border: 1px solid #e2e8f0;
    padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; text-decoration: none;
    display: inline-block; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .btn-ghost:hover { border-color: #0d9488; color: #0d9488; background: #ffffff; }
  .hero-trust {
    display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
    font-size: 12px; color: #94a3b8;
  }
  .trust-sep { color: rgba(255,255,255,0.15); }

  /* Hero Mockup */
  .mockup-wrap { position: relative; }
  .mockup-glow {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.12) 40%, transparent 70%);
    filter: blur(30px);
    pointer-events: none; z-index: 0;
  }
  .mockup-card {
    position: relative; z-index: 1;
    background: #ffffff;
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid #e2e8f0;
    border-radius: 18px; padding: 24px;
    box-shadow: 0 30px 70px rgba(0,0,0,0.08);
  }
  .mock-bar {
    display: flex; align-items: center; gap: 7px;
    padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 18px;
  }
  .mock-dot { width: 10px; height: 10px; border-radius: 50%; }
  .mock-title { font-size: 11px; color: rgba(255,255,255,0.35); margin-left: auto; }
  .mock-q-wrap {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 16px; margin-bottom: 14px;
  }
  .mock-qlabel {
    font-size: 10px; color: #0d9488; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 9px;
  }
  .mock-qtext {
    font-size: 13px; color: #0f172a;
    line-height: 1.5; margin-bottom: 14px;
  }
  .mock-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .mock-opt {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 8px; padding: 9px 11px; font-size: 11px; color: #64748b;
  }
  .mock-opt.sel {
    background: rgba(13,148,136,0.08); border-color: rgba(13,148,136,0.3); color: #0d9488; font-weight: 600;
  }
  .mock-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
  .mock-stat {
    background: #f8fafc; border: 1px solid #f1f5f9;
    border-radius: 8px; padding: 10px; text-align: center;
  }
  .mock-stat-val { font-size: 15px; font-weight: 800; color: #0d9488; }
  .mock-stat-lbl { font-size: 9px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.06em; }

  /* ─── STATS STRIP ─── */
  .stats-strip {
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
    background: #f0fdfa; padding: 30px 32px;
  }
  .stats-inner {
    max-width: 1100px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(3,1fr);
    text-align: center;
  }
  .stat-box { padding: 10px; border-right: 1px solid rgba(255,255,255,0.05); }
  .stat-box:last-child { border-right: none; }
  .stat-val {
    font-family: 'DM Serif Display', serif;
    font-size: 38px; font-weight: 400;
    color: #0d9488; line-height: 1; margin-bottom: 4px;
  }
  .stat-lbl { font-size: 11px; color: #64748b; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }

  /* ─── SECTION COMMON ─── */
  .section { padding: 64px 32px; }
  .section-inner { max-width: 1200px; margin: 0 auto; }
  .section-head { text-align: center; margin-bottom: 40px; }
  .section-h2 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(26px, 3vw, 38px);
    font-weight: 400; line-height: 1.1;
    letter-spacing: -0.01em; margin-bottom: 10px;
    color: #0f172a;
  }
  .section-sub {
    font-size: 14px; color: #64748b;
    line-height: 1.6; max-width: 460px; margin: 0 auto;
  }

  /* ─── FEATURES ─── */
  .features-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 14px;
  }
  .feat-link { text-decoration: none; display: block; height: 100%; }
  .feat-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px; padding: 22px;
    transition: all 0.3s; cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    height: 100%;
  }
  .feat-card:hover {
    border-color: #0d9488;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(13,148,136,0.08);
  }
  .feat-icon {
    width: 44px; height: 44px;
    border-radius: 12px; display: flex;
    align-items: center; justify-content: center;
    font-size: 20px; margin-bottom: 16px;
  }
  .feat-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
  .feat-desc { font-size: 12px; color: #64748b; line-height: 1.6; }

  /* ─── HOW IT WORKS ─── */
  .hiw-bg {
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
  }
  .steps-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; position: relative;
  }
  .steps-grid::before {
    content: '';
    position: absolute; top: 38px; left: 18%; right: 18%; height: 1px;
    background: linear-gradient(90deg, transparent, #e2e8f0, #e2e8f0, transparent);
  }
  .step-card {
    text-align: center; padding: 36px 24px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px; position: relative;
    transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  }
  .step-card:hover { border-color: #0d9488; background: #ffffff; transform: translateY(-3px); }
  .step-num {
    font-family: 'DM Serif Display', serif; font-size: 50px; font-weight: 400;
    background: linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; line-height: 1; margin-bottom: 18px;
  }
  .step-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
  .step-desc { font-size: 13px; color: #64748b; line-height: 1.7; }

  /* ─── PRICING ─── */
  .pricing-grid {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 16px; max-width: 1200px; margin: 0 auto;
  }
  .plan-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 22px; padding: 30px 20px; position: relative;
    transition: all 0.3s;
    display: flex; flex-direction: column;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  }
  .plan-card.featured {
    border-color: #0d9488;
    background: #f0fdfa;
    box-shadow: 0 20px 40px rgba(13,148,136,0.1);
  }
  .plan-badge {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    color: #ffffff; font-size: 11px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 4px 18px; border-radius: 30px; white-space: nowrap;
    box-shadow: 0 4px 12px rgba(236,72,153,0.3);
  }
  .plan-name { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
  .plan-price {
    font-family: 'DM Serif Display', serif; font-size: 40px; font-weight: 400;
    color: #0d9488; line-height: 1; margin: 18px 0 4px;
  }
  .plan-period { font-size: 13px; color: #94a3b8; margin-bottom: 28px; }
  .plan-feats { list-style: none; margin-bottom: 32px; }
  .plan-feats li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 14px; color: #475569;
    padding: 9px 0; border-bottom: 1px solid #f1f5f9;
  }
  .plan-feats li:last-child { border-bottom: none; }
  .check { color: #0d9488; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .btn-plan {
    width: 100%; padding: 14px; border-radius: 10px;
    font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    font-family: 'Plus Jakarta Sans', sans-serif; border: none; display: block;
  }
  .btn-plan-feat {
    background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff;
  }
  .btn-plan-feat:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(236,72,153,0.3); }
  .btn-plan-std {
    background: #f8fafc; color: #475569;
    border: 1px solid #e2e8f0 !important;
  }
  .btn-plan-std:hover { background: #ffffff; border-color: #0d9488 !important; color: #0d9488; }

  /* ─── TESTIMONIALS ─── */
  .testi-bg {
    background: #f0fdfa;
    border-top: 1px solid #ccfbf1;
    border-bottom: 1px solid #ccfbf1;
  }
  .testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .testi-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 18px; padding: 28px; transition: all 0.3s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  }
  .testi-card:hover { border-color: #0d9488; background: #ffffff; box-shadow: 0 10px 30px rgba(13,148,136,0.1); }
  .testi-mark {
    font-family: 'DM Serif Display', serif; font-size: 40px;
    color: #ccfbf1; line-height: 1; margin-bottom: 10px;
  }
  .testi-text { font-size: 14px; color: #475569; line-height: 1.75; margin-bottom: 22px; }
  .testi-author { display: flex; align-items: center; gap: 12px; }
  .author-av {
    width: 38px; height: 38px; border-radius: 50%;
    background: #f0fdfa;
    border: 1px solid #ccfbf1;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #0d9488; flex-shrink: 0;
  }
  .author-name { font-size: 14px; font-weight: 700; color: #0f172a; }
  .author-role { font-size: 11px; color: #94a3b8; margin-top: 2px; }

  /* ─── FAQ ─── */
  .faq-wrap { max-width: 720px; margin: 0 auto; }
  .faq-item { border-bottom: 1px solid #f1f5f9; }
  .faq-btn {
    width: 100%; background: none; border: none; color: #0f172a;
    display: flex; justify-content: space-between; align-items: center;
    padding: 22px 0; cursor: pointer; text-align: left;
    font-size: 16px; font-weight: 600; gap: 20px;
    font-family: 'Plus Jakarta Sans', sans-serif; transition: color 0.2s;
  }
  .faq-btn:hover { color: #0d9488; }
  .faq-icon {
    width: 26px; height: 26px; border-radius: 50%;
    border: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0; transition: all 0.25s;
    color: #94a3b8;
  }
  .faq-icon.open { background: #f0fdfa; border-color: #0d9488; color: #0d9488; }
  .faq-ans {
    font-size: 14px; color: #64748b;
    line-height: 1.8; padding-bottom: 22px;
  }

  /* ─── FOOTER CTA ─── */
  .fcta {
    position: relative; overflow: hidden;
    padding: 100px 32px; text-align: center;
    background: #f0fdfa;
  }
  .fcta-glow {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    width: 700px; height: 350px;
    background: radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.1) 40%, transparent 70%);
    filter: blur(20px);
    pointer-events: none;
  }
  .fcta-inner { position: relative; z-index: 1; }
  .fcta-h2 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(32px, 4vw, 54px);
    font-weight: 400; letter-spacing: -0.02em;
    line-height: 1.1; margin-bottom: 18px;
    color: #0f172a;
  }
  .fcta-h2 em { 
    background: linear-gradient(135deg, #0d9488, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-style: normal;
  }
  .fcta-sub {
    font-size: 16px; color: #64748b;
    max-width: 480px; margin: 0 auto 38px; line-height: 1.7;
  }

  /* ─── FOOTER ─── */
  .footer {
    border-top: 1px solid #f1f5f9;
    padding: 48px 32px 28px;
  }
  .footer-inner {
    max-width: 1200px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 20px;
  }
  .footer-logo { font-size: 16px; font-weight: 800; color: #0f172a; text-decoration: none; }
  .footer-logo span { color: #0d9488; }
  .footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
  .footer-link {
    color: #64748b; font-size: 13px;
    text-decoration: none; transition: color 0.2s; font-weight: 500;
  }
  .footer-link:hover { color: #0d9488; }
  .footer-copy {
    max-width: 1200px; margin: 24px auto 0;
    padding-top: 20px; border-top: 1px solid #f1f5f9;
    font-size: 12px; color: #94a3b8; text-align: center;
  }

  /* ─── RESPONSIVE ─── */
  @media (max-width: 1100px) {
    .pricing-grid { grid-template-columns: repeat(2,1fr); max-width: 800px; }
    .hero-inner { grid-template-columns: 1fr; }
    .features-grid { grid-template-columns: repeat(2,1fr); }
    .steps-grid { grid-template-columns: 1fr; }
    .steps-grid::before { display: none; }
    .testi-grid { grid-template-columns: 1fr; }
    .stats-inner { grid-template-columns: 1fr; }
    .stat-box { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .stat-box:last-child { border-bottom: none; }
    .nav-links { display: none; }
  }
  @media (max-width: 600px) {
    .features-grid { grid-template-columns: 1fr; }
    .footer-inner { flex-direction: column; text-align: center; }
    .footer-links { justify-content: center; }
  }
`;

// FEATURES are now imported from ../lib/featuresData

const STEPS = [
  { num: '01', title: 'Register', desc: 'Create your secure profile on our elite infrastructure.' },
  { num: '02', title: 'Subscribe', desc: 'Choose a premium plan that fits your residency timeline.' },
  { num: '03', title: 'Simulate', desc: 'Take timed mock exams, analyze weak areas, and secure your success.' },
];

const PLANS = [
  {
    name: 'Standard',
    price: 'Rs. 1,999',
    period: '/ 1 month',
    features: ['1 Month Access', 'Basic Analytics', 'Mock Exams'],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Elite Pro',
    badge: '✦ Best Value',
    price: 'Rs. 4,999',
    period: '/ 3 months',
    features: ['3 Months Access', 'Smart Heatmaps', 'Forensic Security', 'VIP Support'],
    cta: 'Instant Access',
    featured: true,
  },
  {
    name: 'Advanced',
    price: 'Rs. 8,999',
    period: '/ 6 months',
    features: ['6 Months Access', 'Premium Analytics', 'Priority Sync', 'Extended Bank'],
    cta: 'Go Advanced',
    featured: false,
  },
  {
    name: 'Platinum',
    price: 'Rs. 14,999',
    period: '/ 1 year',
    features: ['1 Year Access', 'Ultimate Prep Kit', 'Direct Support', 'Full Analytics'],
    cta: 'Go Platinum',
    featured: false,
  },
];

const TESTIMONIALS = [
  { quote: 'The analytics helped me identify my weak areas in Anatomy within days. A game-changer for Part 1.', name: 'Dr. Ahmed', role: 'Resident' },
  { quote: 'The interface is identical to the actual exam. It removed all my fear of the CBT environment.', name: 'Dr. Sara', role: 'FCPS Candidate' },
  { quote: 'Most secure and updated question bank I\'ve used. The watermark feature shows how serious they are.', name: 'Dr. Zohaib', role: 'Medical Officer' },
];

const FAQS = [
  { q: 'Is the interface same as the real exam?', a: 'Yes, we have replicated the official CBT environment for 100% familiarity.' },
  { q: 'How do I activate my account?', a: 'Simply share your payment proof via WhatsApp for instant premium activation.' },
  { q: 'Can I track my progress?', a: 'Absolutely. Our Smart Analytics provide detailed heatmaps of your performance across all subjects.' },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lp">

        {/* ── NAVBAR ── */}
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">FCPS <span>Simulator</span></Link>
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#hiw">How It Works</a></li>
              <li><a href="#testimonials">Success Stories</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><Link href="/login" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Login / Sign Up</Link></li>
            </ul>
            <Link href="/login?type=admin" className="btn-cta">Member Login</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-bg-grad" />
          <div className="hero-grid-bg" />
          <div className="hero-inner">
            <div>
              <div className="tag-pill">
                <span className="tag-dot" />
                Elite CBT Infrastructure
              </div>
              <h1 className="hero-h1">
                Master the FCPS Part 1 with <em>Elite CBT</em> Simulation
              </h1>
              <p className="hero-sub">
                Engineered for perfection. Secured for integrity. Experience the most advanced medical exam platform designed to guarantee your residency success.
              </p>
              <div className="hero-btns">
                <Link href="/register" className="btn-primary">Start Free Demo</Link>
                <a href="#pricing" className="btn-ghost">View Elite Plans</a>
              </div>
              <div className="hero-trust">
                <span>✓ No credit card required</span>
                <span className="trust-sep">·</span>
                <span>✓ Instant activation</span>
                <span className="trust-sep">·</span>
                <span>✓ 100% secure platform</span>
              </div>
            </div>

            {/* Mockup */}
            <div className="mockup-wrap">
              <div className="mockup-glow" />
              <div className="mockup-card">
                <div className="mock-bar">
                  <div className="mock-dot" style={{ background: '#ff5f57' }} />
                  <div className="mock-dot" style={{ background: '#febc2e' }} />
                  <div className="mock-dot" style={{ background: '#28c840' }} />
                  <span className="mock-title">FCPS Part 1 — Mock Exam #14</span>
                </div>
                <div className="mock-q-wrap">
                  <div className="mock-qlabel">Question 23 / 100 &nbsp;·&nbsp; Anatomy</div>
                  <div className="mock-qtext">
                    Which nerve passes through the carpal tunnel alongside the flexor tendons?
                  </div>
                  <div className="mock-opts">
                    <div className="mock-opt">A. Ulnar Nerve</div>
                    <div className="mock-opt sel">B. Median Nerve ✓</div>
                    <div className="mock-opt">C. Radial Nerve</div>
                    <div className="mock-opt">D. Axillary Nerve</div>
                  </div>
                </div>
                <div className="mock-stats">
                  <div className="mock-stat">
                    <div className="mock-stat-val">78%</div>
                    <div className="mock-stat-lbl">Accuracy</div>
                  </div>
                  <div className="mock-stat">
                    <div className="mock-stat-val">2:14</div>
                    <div className="mock-stat-lbl">Time Left</div>
                  </div>
                  <div className="mock-stat">
                    <div className="mock-stat-val">#12</div>
                    <div className="mock-stat-lbl">Global Rank</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="stats-strip">
          <div className="stats-inner">
            <div className="stat-box">
              <div className="stat-val">10,000+</div>
              <div className="stat-lbl">Medical Professionals</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">4.9 / 5</div>
              <div className="stat-lbl">Average Rating</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">99.9%</div>
              <div className="stat-lbl">Platform Uptime</div>
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="section" id="features">
          <div className="section-inner">
            <div className="section-head">
              <div className="tag-pill">Platform Features</div>
              <h2 className="section-h2">Built for Medical Excellence</h2>
              <p className="section-sub">Every feature engineered to replicate the real exam environment and maximize your preparation.</p>
            </div>
            <div className="features-grid">
              {FEATURES.map((f, i) => {
                return (
                  <Link href={`/feature/${f.id}`} key={i} className="feat-link">
                    <div className="feat-card">
                      <div className="feat-icon" style={{ color: f.color, background: f.bg, border: `1px solid ${f.border}` }}>{f.icon}</div>
                      <div className="feat-title">{f.title}</div>
                      <div className="feat-desc">{f.shortDesc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section hiw-bg" id="hiw">
          <div className="section-inner">
            <div className="section-head">
              <div className="tag-pill">Process</div>
              <h2 className="section-h2">Start in 3 Simple Steps</h2>
              <p className="section-sub">From registration to full simulation in minutes.</p>
            </div>
            <div className="steps-grid">
              {STEPS.map((s, i) => (
                <div className="step-card" key={i}>
                  <div className="step-num">{s.num}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="section" id="pricing">
          <div className="section-inner">
            <div className="section-head">
              <div className="tag-pill">Pricing</div>
              <h2 className="section-h2">Choose Your Elite Plan</h2>
              <p className="section-sub">Transparent pricing. No hidden fees. Instant access after payment.</p>
            </div>
            <div className="pricing-grid">
              {PLANS.map((plan, i) => (
                <div className={`plan-card ${plan.featured ? 'featured' : ''}`} key={i}>
                  {plan.badge && <div className="plan-badge">{plan.badge}</div>}
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price">{plan.price}</div>
                  <div className="plan-period">{plan.period}</div>
                  <ul className="plan-feats">
                    {plan.features.map((f, j) => (
                      <li key={j}><span className="check">✓</span>{f}</li>
                    ))}
                  </ul>
                  <Link href="/register" className={`btn-plan ${plan.featured ? 'btn-plan-feat' : 'btn-plan-std'}`} style={{ textDecoration: 'none', textAlign: 'center' }}>
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="section testi-bg" id="testimonials">
          <div className="section-inner">
            <div className="section-head">
              <div className="tag-pill">Success Stories</div>
              <h2 className="section-h2">Trusted by Medical Professionals</h2>
              <p className="section-sub">Real results from real FCPS candidates across Pakistan.</p>
            </div>
            <div className="testi-grid">
              {TESTIMONIALS.map((t, i) => (
                <div className="testi-card" key={i}>
                  <div className="testi-mark">"</div>
                  <p className="testi-text">{t.quote}</p>
                  <div className="testi-author">
                    <div className="author-av">{t.name.replace('Dr. ', '')[0]}</div>
                    <div>
                      <div className="author-name">{t.name}</div>
                      <div className="author-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section" id="faq">
          <div className="section-inner">
            <div className="section-head">
              <div className="tag-pill">FAQ</div>
              <h2 className="section-h2">Common Questions</h2>
              <p className="section-sub">Everything you need to know before getting started.</p>
            </div>
            <div className="faq-wrap">
              {FAQS.map((faq, i) => (
                <div className="faq-item" key={i}>
                  <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {faq.q}
                    <span className={`faq-icon ${openFaq === i ? 'open' : ''}`}>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && <p className="faq-ans">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA ── */}
        <section className="fcta">
          <div className="fcta-glow" />
          <div className="fcta-inner">
            <div className="tag-pill" style={{ margin: '0 auto 20px' }}>Get Started Today</div>
            <h2 className="fcta-h2">
              Ready to Secure Your <em>Residency?</em>
            </h2>
            <p className="fcta-sub">
              Join thousands of medical professionals already preparing smarter with the FCPS Part 1 Simulator.
            </p>
            <Link href="/register" className="btn-primary" style={{ fontSize: '16px', padding: '16px 44px' }}>
              Get Instant Access
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div className="footer-inner">
            <Link href="/" className="footer-logo">FCPS <span>Simulator</span></Link>
            <div className="footer-links">
              <a href="#features" className="footer-link">Features</a>
              <a href="#pricing" className="footer-link">Pricing</a>
              <a href="#testimonials" className="footer-link">Success Stories</a>
              <a href="#faq" className="footer-link">FAQ</a>
              <a href="https://wa.me/923324737436" className="footer-link">WhatsApp Support</a>
              <a href="#" className="footer-link">Facebook Community</a>
              <a href="#" className="footer-link">Instagram</a>
            </div>
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} FCPS Part 1 Simulator — The Elite CBT Infrastructure for Medical Professionals. All rights reserved.
          </div>
        </footer>

      </div>
    </>
  );
}
