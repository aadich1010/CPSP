/**
 * azadiOffer.ts
 * -----------------------------------------------------------------------------
 * Single source of truth for the "Azadi Offer" (Pakistan Independence Day
 * discount) — 40% off the Advanced & Platinum plans, valid until 14 Aug 2026
 * midnight PKT. Shared between the pricing section on the homepage and the
 * AzadiOfferModal popup so the two never drift out of sync.
 *
 * ctaHref carries the plan name, amount, and period as query params so the
 * checkout page (/subscription-expired) can show the buyer exactly what
 * they're paying for instead of a generic, plan-agnostic payment screen —
 * previously every plan's button pointed at the same bare URL, so a student
 * had no way to tell how much to send or for what.
 */

// PKT midnight, 14 Aug -> 15 Aug. Anything checking "is the offer live" should
// compare Date.now() against this value.
export const AZADI_OFFER_DEADLINE = new Date('2026-08-15T00:00:00+05:00')

export function isAzadiOfferActive(): boolean {
  return Date.now() < AZADI_OFFER_DEADLINE.getTime()
}

export interface AzadiPlan {
  name: string
  originalPrice: string
  price: string
  /** Numeric rupee amount (no "Rs." / commas) — what the buyer actually sends. */
  amount: number
  period: string
  features: string[]
  cta: string
  ctaHref: string
  featured: boolean
  badge: string | null
}

function checkoutHref(plan: string, amount: number, period: string): string {
  const params = new URLSearchParams({ plan, amount: String(amount), period })
  return `/subscription-expired?${params.toString()}`
}

export const AZADI_PLANS: AzadiPlan[] = [
  {
    name: 'Advanced',
    originalPrice: 'Rs. 12,999',
    price: 'Rs. 9,999',
    amount: 9999,
    period: '6 months',
    features: [
      '6 months — go through the syllabus twice',
      'Deep subject + difficulty breakdowns',
      'Instant sync across every device',
      'Thousands of extra practice questions',
    ],
    cta: 'Upgrade to 6 Months',
    ctaHref: checkoutHref('Advanced', 9999, '6 months'),
    // "Best value" moved to Elite Pro (see PLANS in app/page.tsx) at the
    // owner's request -- this card is no longer featured/badged.
    featured: false,
    badge: null,
  },
  {
    name: 'Platinum',
    originalPrice: 'Rs. 18,999',
    price: 'Rs. 14,999',
    amount: 14999,
    period: '1 year',
    features: [
      'A full year — zero renewal stress',
      'Complete prep kit: notes + checklists',
      'Direct line to our support team',
      'Full analytics, week over week',
    ],
    cta: 'Lock In the Full Year',
    ctaHref: checkoutHref('Platinum', 14999, '1 year'),
    featured: false,
    badge: null,
  },
]
