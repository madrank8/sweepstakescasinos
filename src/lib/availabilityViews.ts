import type { AffiliatePartner } from '../data/affiliates';
import { getPartner } from '../data/affiliates';
import { getEditorialOutbound } from '../data/editorialOutbound';
import type { UsStateCode } from '../data/usStates';
import {
  availabilityForPartner,
  siteCtaEligibility,
  type AvailabilityFacade,
} from './availability';

export interface PartnerAvailabilityView {
  canCta: boolean;
  reason: AvailabilityFacade['cta']['reason'];
  label: 'Available in your location' | 'Not available in your location';
}

export interface OfferVerificationView {
  available: boolean;
  label: string;
  datetime: string | null;
}

export interface NoDepositOfferAvailabilityView {
  canCta: boolean;
  reason: AvailabilityFacade['cta']['reason'] | 'partner-not-found';
  verification: OfferVerificationView;
}

export interface ReviewOutboundAvailabilityView {
  kind: 'partner' | 'editorial' | 'none';
  canCta: boolean;
  reason: AvailabilityFacade['cta']['reason'] | 'no-outbound';
  label: string;
}

export function reviewOutboundAvailabilityView(
  slug: string,
  state: UsStateCode | null | undefined,
): ReviewOutboundAvailabilityView {
  const partner = getPartner(slug);
  if (partner) {
    const cta = availabilityForPartner(partner, state).cta;
    return {
      kind: 'partner',
      canCta: cta.eligible,
      reason: cta.reason,
      label: cta.eligible
        ? 'Affiliate offer link available under operator and site CTA policies.'
        : cta.reason === 'region-unknown'
          ? 'Affiliate offer link hidden until location is available.'
          : cta.reason === 'partner-restricted'
            ? 'Affiliate offer link hidden under operator commercial policy.'
            : 'Affiliate offer link hidden under site CTA policy.',
    };
  }
  if (getEditorialOutbound(slug)) {
    const site = siteCtaEligibility(state);
    return {
      kind: 'editorial',
      canCta: site.eligible,
      reason: !state
        ? 'region-unknown'
        : site.eligible
          ? 'allowed'
          : 'site-policy-suppressed',
      label: site.eligible
        ? 'Editorial outbound link available under site CTA policy.'
        : !state
          ? 'Editorial outbound link hidden until location is available.'
          : 'Editorial outbound link hidden under site CTA policy.',
    };
  }
  return {
    kind: 'none',
    canCta: false,
    reason: 'no-outbound',
    label: 'No outbound offer link is provided for this review.',
  };
}

export function bestPartnerAvailabilityView(
  partner: AffiliatePartner,
  state: UsStateCode | null | undefined,
): PartnerAvailabilityView {
  const cta = availabilityForPartner(partner, state).cta;
  return {
    canCta: cta.eligible,
    reason: cta.reason,
    label: cta.eligible
      ? 'Available in your location'
      : 'Not available in your location',
  };
}

export function noDepositOfferAvailabilityView(
  offer: { verifiedOn?: string },
  partner: AffiliatePartner | undefined,
  state: UsStateCode | null | undefined,
): NoDepositOfferAvailabilityView {
  const cta = partner
    ? availabilityForPartner(partner, state).cta
    : { eligible: false as const, reason: 'partner-not-found' as const };
  const verifiedOn = offer.verifiedOn?.trim() || null;
  return {
    canCta: cta.eligible,
    reason: cta.reason,
    verification: verifiedOn
      ? { available: true, label: verifiedOn, datetime: verifiedOn }
      : {
          available: false,
          label: 'Details unavailable',
          datetime: null,
        },
  };
}
