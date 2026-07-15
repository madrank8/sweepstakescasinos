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

/**
 * Sanitize a caller-supplied clickId before it is appended to the outbound
 * tracking URL. This value arrives from the `?clickId=` query param and is
 * therefore fully attacker-controllable, so we hard-restrict it to a safe
 * placement-label charset ([A-Za-z0-9_-]) and cap the length. Anything with
 * other characters (spaces, `#`, `?`, `/`, CR/LF, etc.) is rejected outright —
 * this keeps the redirect anchored to the trusted gemified domain and prevents
 * URL/redirect/header injection. Returns null when nothing usable remains.
 */
export function sanitizeClickId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(raw)) return null;
  return raw;
}

export function resolveBonusGateway(
  slug: string | undefined,
  state: UsStateCode | null | undefined,
  clickId?: string | null,
): BonusGatewayResult {
  if (!slug) return { status: 'not-found' };
  const partner = getPartner(slug);
  if (!partner) return { status: 'not-found' };

  if (shouldRenderAffiliateCta(partner, state)) {
    const safeId = sanitizeClickId(clickId);
    // Gemified's tracker expects the clickId appended with a literal `&`, even
    // though the base URL has no query string (see publisher.gemified.io/offers).
    const url = safeId ? `${partner.trackingLink}&clickId=${safeId}` : partner.trackingLink;
    return { status: 'redirect', url, partner };
  }
  return {
    status: 'blocked',
    reason: suppressionReason(partner, state),
    partner,
  };
}
