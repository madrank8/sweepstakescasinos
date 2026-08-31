import type { AffiliatePartner } from '../data/affiliates';
import type { UsStateCode } from '../data/usStates';
import {
  availabilityForPartner,
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
          label: 'Verification unavailable',
          datetime: null,
        },
  };
}
