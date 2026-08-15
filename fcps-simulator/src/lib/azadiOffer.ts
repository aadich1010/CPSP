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
    originalPrice: 'Rs. 8,999',
    price: 'Rs. 5,399',
    amount: 5399,
    period: '6 months',
    features: ['6 months access', 'Premium analytics', 'Priority sync', 'Extended bank'],
    cta: 'Go advanced',
    ctaHref: checkoutHref('Advanced', 5399, '6 months'),
    featured: true,
    badge: 'Best value',
  },
  {
    name: 'Platinum',
    originalPrice: 'Rs. 14,999',
    price: 'Rs. 8,999',
    amount: 8999,
    period: '1 year',
    features: ['1 year access', 'Ultimate prep kit', 'Direct support', 'Full analytics'],
    cta: 'Go platinum',
    ctaHref: checkoutHref('Platinum', 8999, '1 year'),
    featured: false,
    badge: null,
  },
]
