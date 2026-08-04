'use client';

/**
 * VvipWelcomeModal.tsx
 * -----------------------------------------------------------------------------
 * Auto-dismissing welcome modal for paid accounts.
 *
 * Lifecycle:  enter (520ms)  ->  hold (exactly 5000ms)  ->  exit fade (620ms)
 *
 * Notes for reviewers:
 *  - Rendered through a portal on document.body so dashboard stacking contexts
 *    (transformed cards, sticky sidebars) can never clip it.
 *  - The hold timer is deadline-based. setTimeout is throttled in background
 *    tabs, so we re-check the deadline on visibilitychange and exit immediately
 *    if the tab was hidden through the window.
 *  - Zero icon-library dependency on purpose: this ships before/independently of
 *    the Lucide migration in Task 2.
 */

import React, { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { firstNameOf, initialsOf, planLabel, renewalDate } from '../../lib/subscription';
import type { SubscriptionProfile } from '../../lib/subscription';
import './vvip-welcome-modal.css';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const CONFETTI_COLORS = ['#d9b45b', '#f5e3b3', '#0d9488', '#ec4899', '#38bdf8', '#f97316'];
const CONFETTI_COUNT = 26;
const BALLOON_COLORS = ['#0d9488', '#ec4899', '#d9b45b', '#38bdf8'];

/** Pure-CSS confetti burst + rising balloons. Generated once per mount (not
 *  per render) via useState's lazy initialiser, same trick the parent uses
 *  for `shuffled` in ExamEngine -- otherwise every re-render would reshuffle
 *  the pieces and restart their animations mid-flight. Skipped entirely
 *  under prefers-reduced-motion. */
function CelebrationFx() {
  const [pieces] = useState(() =>
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.4,
      duration: 2.6 + Math.random() * 1.6,
      drift: (Math.random() - 0.5) * 140,
      size: 6 + Math.random() * 6,
      round: Math.random() > 0.5,
    }))
  );
  const [balloons] = useState(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: 8 + i * 20 + (Math.random() * 8 - 4),
      color: BALLOON_COLORS[i % BALLOON_COLORS.length],
      delay: Math.random() * 0.5,
      duration: 4 + Math.random() * 1.5,
    }))
  );

  return (
    <div className="vvip-fx" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="vvip-confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size * (p.round ? 1 : 2.4),
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--vvip-drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
      {balloons.map((b) => (
        <span
          key={b.id}
          className="vvip-balloon"
          style={{
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        >
          <span className="vvip-balloon-body" style={{ background: b.color }} />
          <span className="vvip-balloon-string" />
        </span>
      ))}
    </div>
  );
}

export interface VvipWelcomeModalProps {
  user?: SubscriptionProfile | null;
  open: boolean;
  onClose?: () => void;
  /** Visible duration in ms. The depleting hairline reads from the same value. */
  holdMs?: number;
  exitMs?: number;
  /** Pass '' to drop the honorific entirely. */
  honorific?: string;
  title?: string;
  message?: string;
  pauseOnHover?: boolean;
  portalTarget?: Element | null;
  /** Default true. Pass false to make this close ONLY via the holdMs
   *  auto-timer -- no Dismiss button, scrim click, or Escape key. */
  dismissible?: boolean;
}

export default function VvipWelcomeModal({
  user,
  open,
  onClose,
  holdMs = 5000,
  exitMs = 620,
  honorific = 'Dr.',
  title,
  message = 'Your full question bank, timed mock exams, and performance analytics are unlocked.',
  pauseOnHover = false,
  portalTarget,
  dismissible = true,
}: VvipWelcomeModalProps) {
  // Client-only flag without a setState-in-effect. Returns false during SSR and
  // on the hydration pass, true thereafter — which is exactly what createPortal
  // needs, since document.body does not exist on the server.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [phase, setPhase] = useState<'enter' | 'leave'>('enter');

  const cardRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<Element | null>(null);
  const deadlineRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  const exitTimerRef = useRef<number | undefined>(undefined);
  const closedRef = useRef(false);

  const labelId = useId();
  const descId = useId();

  const reduced = prefersReducedMotion();
  const resolvedExitMs = reduced ? 180 : exitMs;

  /* ---------------------------------------------------------------- closing */

  const finish = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose?.();
  }, [onClose]);

  const beginExit = useCallback(() => {
    if (closedRef.current) return;
    setPhase('leave');
    window.clearTimeout(exitTimerRef.current);
    exitTimerRef.current = window.setTimeout(finish, resolvedExitMs);
  }, [finish, resolvedExitMs]);

  // The auto-timer always calls beginExit directly (see `arm`). Every
  // USER-initiated close path (Dismiss button, scrim click, Escape) goes
  // through this gate instead, so dismissible={false} truly means "cannot
  // be closed early" rather than just hiding the button.
  const requestManualClose = useCallback(() => {
    if (!dismissible) return;
    beginExit();
  }, [dismissible, beginExit]);

  /* ------------------------------------------------------------ hold timer */

  const arm = useCallback(
    (ms: number) => {
      window.clearTimeout(timerRef.current);
      deadlineRef.current = Date.now() + ms;
      timerRef.current = window.setTimeout(beginExit, ms);
    },
    [beginExit]
  );

  useEffect(() => {
    if (!open) return undefined;
    closedRef.current = false;
    // No setPhase('enter') here: the component is mounted fresh for each
    // showing (VvipWelcomeGate returns null until it should appear), so the
    // 'enter' initial state is already correct. Toggling `open` on a persistent
    // instance is not supported — remount with a key instead.
    arm(holdMs);

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      // Background tabs throttle timers; if the window elapsed while hidden, leave now.
      if (Date.now() >= deadlineRef.current) beginExit();
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(timerRef.current);
      window.clearTimeout(exitTimerRef.current);
    };
  }, [open, holdMs, arm, beginExit]);

  /* ------------------------------------------- focus, escape, scroll lock */

  useEffect(() => {
    if (!open || !mounted) return undefined;

    returnFocusRef.current = document.activeElement;
    const raf = window.requestAnimationFrame(() => {
      (closeRef.current || cardRef.current)?.focus({ preventScroll: true });
    });

    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestManualClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = cardRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      const target = returnFocusRef.current;
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    };
  }, [open, mounted, requestManualClose]);

  /* -------------------------------------------------------- hover pausing */

  const onPointerEnter = useCallback(() => {
    if (!pauseOnHover || phase === 'leave') return;
    window.clearTimeout(timerRef.current);
    cardRef.current?.style.setProperty('--vvip-timer-play', 'paused');
  }, [pauseOnHover, phase]);

  const onPointerLeave = useCallback(() => {
    if (!pauseOnHover || phase === 'leave') return;
    cardRef.current?.style.setProperty('--vvip-timer-play', 'running');
    arm(Math.max(600, deadlineRef.current - Date.now()));
  }, [pauseOnHover, phase, arm]);

  if (!mounted || !open) return null;

  /* ----------------------------------------------------------- view model */

  const first = firstNameOf(user);
  const prefix = honorific ? `${honorific} ` : '';
  const greeting = first ? `${prefix}${first}` : 'back';
  const heading = title ?? (first ? 'Welcome back,' : 'Welcome back');
  const plan = planLabel(user);
  const renews = renewalDate(user);
  const initials = initialsOf(user);

  const node = (
    <div
      className="vvip-overlay"
      data-vvip-root
      data-phase={phase}
      style={{ '--vvip-hold': `${holdMs}ms`, '--vvip-exit': `${resolvedExitMs}ms` } as React.CSSProperties}
    >
      <div className="vvip-scrim" onClick={requestManualClose} aria-hidden="true" />
      {!reduced && <CelebrationFx />}

      <section
        ref={cardRef}
        className="vvip-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descId}
        tabIndex={-1}
        onMouseEnter={onPointerEnter}
        onMouseLeave={onPointerLeave}
      >
        <span className="vvip-sheen" aria-hidden="true" />
        <span className="vvip-grain" aria-hidden="true" />

        <header className="vvip-head">
          <span className="vvip-seal" aria-hidden="true">
            <svg viewBox="0 0 72 72" role="presentation" focusable="false">
              <circle className="vvip-seal-ring vvip-seal-ring--outer" cx="36" cy="36" r="33" />
              <circle className="vvip-seal-ring vvip-seal-ring--inner" cx="36" cy="36" r="27" />
              <text className="vvip-seal-text" x="36" y="37" dominantBaseline="central" textAnchor="middle">
                {initials}
              </text>
            </svg>
          </span>
          <p className="vvip-eyebrow">{plan}</p>
        </header>

        <h2 className="vvip-title" id={labelId}>
          {heading} <em className="vvip-name">{greeting}</em>
        </h2>

        <p className="vvip-message" id={descId}>
          {message}
        </p>

        {renews ? (
          <dl className="vvip-meta">
            <div className="vvip-meta-item">
              <dt>Plan</dt>
              <dd>{plan}</dd>
            </div>
            <div className="vvip-meta-item">
              <dt>Renews</dt>
              <dd>{renews}</dd>
            </div>
          </dl>
        ) : null}

        <footer className="vvip-foot" style={!dismissible ? { justifyContent: 'center' } : undefined}>
          {dismissible && (
            <button type="button" className="vvip-dismiss" ref={closeRef} onClick={requestManualClose}>
              Dismiss
            </button>
          )}
          <span className="vvip-auto">
            Closes automatically in {Math.round(holdMs / 1000)}s
          </span>
        </footer>

        <div className="vvip-timer" aria-hidden="true">
          <span className="vvip-timer-fill" />
        </div>
      </section>
    </div>
  );

  const target = portalTarget || (typeof document !== 'undefined' ? document.body : null);
  return target ? createPortal(node, target) : node;
}
