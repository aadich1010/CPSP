'use client';

/**
 * AzadiOfferModal.tsx
 * -----------------------------------------------------------------------------
 * Promotional popup for the "Azadi Offer" (Pakistan Independence Day sale).
 * Shows once per browser session when a visitor lands on the homepage —
 * dismissible via the close button, a scrim click, or Escape — and stays
 * dismissed for the rest of that session (sessionStorage flag) so it never
 * nags on client-side navigation.
 *
 * Content (plans, prices, deadline) is pulled from ../../lib/azadiOffer so
 * this never drifts from the real pricing section further down the page.
 * Rendered through a portal on document.body, same pattern as
 * VvipWelcomeModal, so page-level stacking contexts can't clip it.
 */

import React, { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import { AZADI_OFFER_DEADLINE, AZADI_PLANS, isAzadiOfferActive } from '../../lib/azadiOffer';
import './azadi-offer-modal.css';

const SEEN_KEY = 'azadiOfferPopupSeen';
const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Decorative floating particles. Generated once per mount so re-renders
 *  (e.g. the countdown ticking every second) never reshuffle or restart
 *  them mid-flight. Skipped under prefers-reduced-motion. */
function AzadiParticles() {
  const [shapes] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 6 + Math.random() * 7,
      color: i % 2 === 0 ? '#12d492' : '#f4a83c',
      duration: 14 + Math.random() * 12,
      delay: Math.random() * 6,
    }))
  );
  return (
    <div className="azadi-particles" aria-hidden="true">
      {shapes.map((s) => (
        <span
          key={s.id}
          className="azadi-shape"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            borderRadius: '30%',
            background: s.color,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function useCountdown(deadline: Date) {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline.getTime() - Date.now()));
  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(Math.max(0, deadline.getTime() - Date.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return { days, hours, mins, secs };
}

/** One pricing card with the rotating-border + hover-sheen treatment. */
function OfferCard({ plan, onCtaClick }: { plan: (typeof AZADI_PLANS)[number]; onCtaClick: () => void }) {
  const sheenRef = useRef<HTMLSpanElement | null>(null);
  const variant = plan.featured ? 'advanced' : 'platinum';

  const runSheen = useCallback(() => {
    const el = sheenRef.current;
    if (!el) return;
    el.classList.remove('run');
    void el.offsetWidth; // force reflow so the animation can restart
    el.classList.add('run');
  }, []);

  return (
    <div className={`azadi-card azadi-card--${variant}`} onMouseEnter={runSheen}>
      <div className="azadi-card-inner">
        <span className="azadi-sheen" ref={sheenRef} aria-hidden="true" />
        {plan.badge && <span className="azadi-badge-best">{plan.badge}</span>}

        <div className="azadi-plan-label">{plan.name}</div>
        <div className="azadi-old-price">{plan.originalPrice}</div>
        <div className="azadi-new-price">{plan.price}</div>
        <div className="azadi-sub-price">{plan.period} &middot; 40% off</div>

        <div className="azadi-strip">
          <span className="pk">PK AZADI OFFER</span> Valid till 14 Aug 2026
        </div>

        <ul className="azadi-feat-list">
          {plan.features.map((f, i) => (
            <li key={f} style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
              <span className="azadi-chk">
                <Check size={8} strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <Link
          href={plan.ctaHref}
          onClick={onCtaClick}
          className={`azadi-btn azadi-btn--${variant}`}
        >
          {plan.cta} <ArrowRight size={11} className="azadi-arr" />
        </Link>
      </div>
    </div>
  );
}

export interface AzadiOfferModalProps {
  /** Override for testing — skips the sessionStorage "already seen" check. */
  forceOpen?: boolean;
}

export default function AzadiOfferModal({ forceOpen = false }: AzadiOfferModalProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'enter' | 'leave'>('enter');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<Element | null>(null);
  const exitTimerRef = useRef<number | undefined>(undefined);
  const labelId = useId();

  const { days, hours, mins, secs } = useCountdown(AZADI_OFFER_DEADLINE);

  // Decide whether to show, once, after mount (avoids SSR/hydration mismatch
  // and respects the per-session dismissal flag).
  useEffect(() => {
    if (!mounted) return;
    if (!isAzadiOfferActive()) return;
    if (!forceOpen) {
      try {
        if (window.sessionStorage.getItem(SEEN_KEY)) return;
      } catch {
        // sessionStorage unavailable (privacy mode etc.) -- show anyway.
      }
    }
    const t = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(t);
  }, [mounted, forceOpen]);

  const close = useCallback(() => {
    setPhase('leave');
    window.clearTimeout(exitTimerRef.current);
    exitTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      try {
        window.sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        // ignore
      }
    }, 260);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    returnFocusRef.current = document.activeElement;
    const raf = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      const target = returnFocusRef.current;
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    };
  }, [open, close]);

  if (!mounted || !open) return null;

  const reduced = prefersReducedMotion();
  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  const node = (
    <div className="azadi-overlay" data-phase={phase}>
      <div className="azadi-scrim" onClick={close} aria-hidden="true" />
      {!reduced && <AzadiParticles />}

      <div className="azadi-panel" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <button type="button" className="azadi-close" ref={closeRef} onClick={close} aria-label="Close offer popup">
          <X size={13} />
        </button>

        <span className="azadi-eyebrow-wrap">
          <span className="azadi-eyebrow" id={labelId}>
            <span className="dot" /> Pakistan Independence Sale
          </span>
        </span>

        <div className="azadi-headline">
          <h2>
            FCPS Part 1 <span className="grad">Paper I &amp; Paper II</span> Exam Preparation
          </h2>
          <p>Ultra Pro Solution &middot; As Per Original Exam Interface</p>
        </div>

        <div className="azadi-countdown" aria-label="Time remaining on the Azadi offer">
          <div className="azadi-cd-box"><div className="azadi-cd-num">{pad(days)}</div><div className="azadi-cd-label">Days</div></div>
          <div className="azadi-cd-box"><div className="azadi-cd-num">{pad(hours)}</div><div className="azadi-cd-label">Hours</div></div>
          <div className="azadi-cd-box"><div className="azadi-cd-num">{pad(mins)}</div><div className="azadi-cd-label">Mins</div></div>
          <div className="azadi-cd-box"><div className="azadi-cd-num">{pad(secs)}</div><div className="azadi-cd-label">Secs</div></div>
        </div>

        {AZADI_PLANS.map((plan) => (
          <OfferCard key={plan.name} plan={plan} onCtaClick={close} />
        ))}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
