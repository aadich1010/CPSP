/**
 * subscription.ts
 * -----------------------------------------------------------------------------
 * Single source of truth for "is this account actually paying us money".
 *
 * Written against the real schema in supabase-schema.sql:
 *
 *   profiles.role                    'student' | 'admin'
 *   profiles.subscription_status     'pending' | 'active' | 'expired'   (CHECK)
 *   profiles.subscription_expires_at timestamptz, nullable
 *
 * There are no tiers in this database. The shipped draft of this file guessed
 * at PAID_TIERS ('vvip', 'platinum', 'gold', …), entitlement arrays, and
 * camelCase keys — none of which exist here. All of that is gone.
 *
 * THE RULE, and it deliberately mirrors the server exactly:
 *
 *   active  ==  subscription_status = 'active'
 *               AND (subscription_expires_at IS NULL OR > now())
 *
 * That is the same predicate used by the RLS policy in
 * 20260722030000_gate_exam_sessions_by_subscription.sql. Client and server
 * must agree, or the UI offers something the database then refuses.
 *
 * WHY THE EXPIRY CHECK MATTERS HERE. The auto-expiry cron in supabase-schema.sql
 * (§5) is commented out, so nothing flips 'active' to 'expired' when the date
 * passes. A lapsed row can sit at status='active' indefinitely. Checking status
 * alone — which src/app/exam/setup/page.tsx and exam/session/page.tsx currently
 * do — treats those accounts as paid. The database does not.
 *
 * DESIGN RULE: deny by default. A free user seeing a "VVIP Premium" modal is a
 * support ticket and a trust problem; a paid user missing it once is a shrug.
 */

/** The subset of `profiles` this module needs. Matches the DB column names. */
export interface SubscriptionProfile {
  role?: string | null;
  full_name?: string | null;
  email?: string | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
}

/** The only status the CHECK constraint allows that means "entitled". */
const ACTIVE_STATUS = 'active';

/**
 * Parses a timestamptz string to epoch ms.
 *
 * Three outcomes, and the distinction matters:
 *   null      — no expiry on file. A legitimate lifetime subscription.
 *   number    — a real date.
 *   NaN       — the column held something unparseable. Postgres shouldn't allow
 *               this, but if it happens we must not read it as "lifetime".
 *               Deny by default means corruption denies.
 */
function expiryMillis(profile: SubscriptionProfile | null | undefined): number | null {
  const raw = profile?.subscription_expires_at;
  if (raw === null || raw === undefined || raw === '') return null;
  return Date.parse(raw);
}

/**
 * True only for an active, unexpired subscription.
 *
 * Admins are NOT included. `role = 'admin'` is a permission, not a purchase —
 * elsewhere the app treats admins as premium for feature access, which is
 * correct for access but wrong for a "thank you for subscribing" modal.
 * Pass `isPaid` on the gate if you want admins to see it.
 */
export function isPaidMember(profile: SubscriptionProfile | null | undefined): boolean {
  if (!profile || typeof profile !== 'object') return false;
  if (profile.subscription_status !== ACTIVE_STATUS) return false;

  const endsAt = expiryMillis(profile);
  if (endsAt !== null && (Number.isNaN(endsAt) || endsAt <= Date.now())) return false;

  return true;
}

/** Whole days until expiry; null when there is no expiry date on file. */
export function daysRemaining(profile: SubscriptionProfile | null | undefined): number | null {
  const endsAt = expiryMillis(profile);
  if (endsAt === null || Number.isNaN(endsAt)) return null;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 86_400_000));
}

/**
 * Label for the modal eyebrow. The schema carries no plan name, so this is
 * branding, not data. Change the string, not the logic.
 */
export function planLabel(_profile?: SubscriptionProfile | null, fallback = 'VVIP Premium'): string {
  return fallback;
}

/** Expiry date formatted for display, or null when none is set. */
export function renewalDate(
  profile: SubscriptionProfile | null | undefined,
  locale?: string
): string | null {
  const ms = expiryMillis(profile);
  if (ms === null || Number.isNaN(ms)) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(ms);
  } catch {
    return null;
  }
}

// Common South-Asian formal/religious first names (Muhammad, Syed, ...) that
// people are addressed by their SECOND name day-to-day -- e.g. "Muhammad
// Adeel" goes by "Adeel", not "Muhammad". Only stripped when a further word
// remains, so a profile whose full_name is literally just "Muhammad" still
// gets greeted by it instead of an empty string.
const COMMON_PREFIX_NAMES = /^(muhammad|mohammad|mohammed|mohd|md|syed|hafiz)$/i;

/** First name for the greeting. Never returns "undefined". */
export function firstNameOf(profile: SubscriptionProfile | null | undefined): string {
  const cleaned = String(profile?.full_name ?? '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  // Strip an existing honorific so we never render "Dr. Dr. Ayesha".
  const withoutTitle = cleaned.replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|miss)\s+/i, '');
  const words = withoutTitle.split(' ').filter(Boolean);
  if (words.length === 0) return '';
  if (words.length > 1 && COMMON_PREFIX_NAMES.test(words[0])) {
    return words[1];
  }
  return words[0];
}

/** Up to two uppercase initials for the seal. Falls back to a bullet. */
export function initialsOf(profile: SubscriptionProfile | null | undefined): string {
  const parts = String(profile?.full_name ?? '')
    .replace(/^(dr\.?|prof\.?)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    const first = firstNameOf(profile);
    return first ? first.slice(0, 1).toUpperCase() : '\u2022';
  }

  const letters = [parts[0][0], parts.length > 1 ? parts[parts.length - 1][0] : ''].join('');
  return letters.toUpperCase().slice(0, 2) || '\u2022';
}
