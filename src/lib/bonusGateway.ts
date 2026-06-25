import { getPartner } from '../data/affiliates';
import {
  shouldRenderAffiliateCta,
  suppressionReason,
  type SuppressionReason,
} from '../data/geo';
import type { UsStateCode } from '../data/usStates';
import type { AffiliatePartner } from '../data/affiliates';

/**
 * Server-side decision for the /bonuses/<slug>/ affiliate gateway.
 *
 * This is the ONLY place the raw Gemified tracking link is ever emitted, and it
 * only happens after the geo check passes. In suppressed states we return a
 * `blocked` result and the page renders an informational notice instead of
 * redirecting — the affiliate URL is never sent to the client.
 */
export type BonusGatewayResult =
  | { status: 'not-found' }
  | { status: 'redirect'; url: string; partner: AffiliatePartner }
  | { status: 'blocked'; reason: SuppressionReason; partner: AffiliatePartner };

export function resolveBonusGateway(
  slug: string | undefined,
  state: UsStateCode | null | undefined,
): BonusGatewayResult {
  if (!slug) return { status: 'not-found' };
  const partner = getPartner(slug);
  if (!partner) return { status: 'not-found' };

  if (shouldRenderAffiliateCta(partner, state)) {
    return { status: 'redirect', url: partner.trackingLink, partner };
  }
  return {
    status: 'blocked',
    reason: suppressionReason(partner, state),
    partner,
  };
}
