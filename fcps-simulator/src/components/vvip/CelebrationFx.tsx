'use client';

/**
 * CelebrationFx.tsx
 * -----------------------------------------------------------------------------
 * Pure-CSS confetti burst + rising balloons. Originally lived as a private
 * function inside VvipWelcomeModal.tsx; extracted so PremiumResultScreen can
 * reuse the exact same effect for a high-score celebration instead of
 * re-implementing it. Self-contained -- imports its own stylesheet so any
 * consumer can render <CelebrationFx /> with no other setup.
 *
 * Generated once per mount (not per render) via useState's lazy initialiser,
 * same trick ExamEngine uses for `shuffled` -- otherwise every re-render
 * would reshuffle the pieces and restart their animations mid-flight.
 * Callers are expected to skip rendering this entirely under
 * prefers-reduced-motion (both current consumers already gate on it).
 */

import { useState } from 'react';
import type React from 'react';
import './vvip-welcome-modal.css';

const CONFETTI_COLORS = ['#d9b45b', '#f5e3b3', '#10B981', '#ec4899', '#38bdf8', '#f97316'];
const CONFETTI_COUNT = 26;
const BALLOON_COLORS = ['#10B981', '#ec4899', '#d9b45b', '#38bdf8'];

export default function CelebrationFx() {
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
