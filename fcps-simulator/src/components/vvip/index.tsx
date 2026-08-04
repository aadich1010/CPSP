'use client';

/**
 * The one-line integration point.
 *
 *   <VvipWelcomeGate user={user} isAuthenticated={isAuthenticated} />
 *
 * Mount it once inside your authenticated layout (the shell that renders the
 * sidebar + dashboard outlet). It renders nothing at all for free accounts,
 * logged-out visitors, or a session that has already seen it.
 */

import VvipWelcomeModal from './VvipWelcomeModal';
import type { VvipWelcomeModalProps } from './VvipWelcomeModal';
import { useVvipWelcome, clearVvipWelcome, getLoginSessionKey } from '../../hooks/useVvipWelcome';
import type { VvipUser } from '../../hooks/useVvipWelcome';

export interface VvipWelcomeGateProps extends Omit<VvipWelcomeModalProps, 'user' | 'open' | 'onClose'> {
  user?: VvipUser | null;
  isAuthenticated?: boolean;
  enabled?: boolean;
  /** Overrides the subscription check entirely. */
  isPaid?: boolean;
  /** Dev/QA only: ignore the once-per-session flag. */
  force?: boolean;
  delayMs?: number;
}

export function VvipWelcomeGate({
  user,
  isAuthenticated = true,
  enabled = true,
  isPaid,
  force = false,
  delayMs = 350,
  ...modalProps
}: VvipWelcomeGateProps) {
  const { shouldShow, dismiss } = useVvipWelcome({
    user,
    isAuthenticated,
    enabled,
    isPaid,
    force,
    delayMs,
  });

  if (!shouldShow) return null;

  return <VvipWelcomeModal user={user} open onClose={dismiss} {...modalProps} />;
}

export default VvipWelcomeGate;
export { VvipWelcomeModal, useVvipWelcome, clearVvipWelcome, getLoginSessionKey };
