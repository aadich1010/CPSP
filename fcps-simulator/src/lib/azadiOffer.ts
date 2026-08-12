/**
 * azadiOffer.ts
 * -----------------------------------------------------------------------------
 * Single source of truth for the "Azadi Offer" (Pakistan Independence Day
 * discount) — 40% off the Advanced & Platinum plans, valid until 14 Aug 2026
 * midnight PKT. Shared between the pricing section on the homepage and the
 * AzadiOfferModal popup so the two never drift out of sync.
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
  period: string
  features: string[]
  cta: string
  ctaHref: string
  featured: boolean
  badge: string | null
}

export const AZADI_PLANS: AzadiPlan[] = [
  {
    name: 'Advanced',
    originalPrice: 'Rs. 8,999',
    price: 'Rs. 5,399',
    period: '/ 6 months',
    features: ['6 months access', 'Premium analytics', 'Priority sync', 'Extended bank'],
    cta: 'Go advanced',
    ctaHref: '/subscription-expired',
    featured: true,
    badge: 'Best value',
  },
  {
    name: 'Platinum',
    originalPrice: 'Rs. 14,999',
    price: 'Rs. 8,999',
    period: '/ 1 year',
    features: ['1 year access', 'Ultimate prep kit', 'Direct support', 'Full analytics'],
    cta: 'Go platinum',
    ctaHref: '/subscription-expired',
    featured: false,
    badge: null,
  },
]
