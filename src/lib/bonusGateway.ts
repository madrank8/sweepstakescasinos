import { getPartner } from '../data/affiliates';
import { getEditorialOutbound } from '../data/editorialOutbound';
import {
  isStateBannedSitewide,
  shouldRenderAffiliateCta,
  SUPPRESS_WHEN_REGION_UNKNOWN,
  suppressionReason,
  type SuppressionReason,
} from '../data/geo';
import type { UsStateCode } from '../data/usStates';

/**
 * Server-side decision for the /bonuses/<slug>/ affiliate gateway.
 *
 * Partner slugs: Gemified tracking URL only after geo check passes.
 * Non-partner editorial slugs: official/outbound URL from editorialOutbound,
 * still blocked in SITE_BANNED_STATES (and when region is unknown).
 *
 * In suppressed states we return `blocked` — the outbound URL is never sent
 * to the client.
 */
export type BonusSubject = { slug: string; name: string };

export type BonusGatewayResult =
  | { status: 'not-found' }
  | { status: 'redirect'; url: string; partner: BonusSubject }
  | { status: 'blocked'; reason: SuppressionReason; partner: BonusSubject };

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

function regionAllowsOutbound(state: UsStateCode | null | undefined): boolean {
  if (!state) return !SUPPRESS_WHEN_REGION_UNKNOWN;
  return !isStateBannedSitewide(state);
}

export function resolveBonusGateway(
  slug: string | undefined,
  state: UsStateCode | null | undefined,
  clickId?: string | null,
): BonusGatewayResult {
  if (!slug) return { status: 'not-found' };

  const partner = getPartner(slug);
  if (partner) {
    if (shouldRenderAffiliateCta(partner, state)) {
      const safeId = sanitizeClickId(clickId);
      // Gemified's tracker expects the clickId appended with a literal `&`, even
      // though the base URL has no query string (see publisher.gemified.io/offers).
      const url = safeId ? `${partner.trackingLink}&clickId=${safeId}` : partner.trackingLink;
      return { status: 'redirect', url, partner: { slug: partner.slug, name: partner.name } };
    }
    return {
      status: 'blocked',
      reason: suppressionReason(partner, state),
      partner: { slug: partner.slug, name: partner.name },
    };
  }

  const editorial = getEditorialOutbound(slug);
  if (!editorial) return { status: 'not-found' };

  const subject: BonusSubject = { slug: editorial.slug, name: editorial.name };
  if (!regionAllowsOutbound(state)) {
    return {
      status: 'blocked',
      reason: !state ? 'region-unknown' : 'state-banned-sitewide',
      partner: subject,
    };
  }
  return { status: 'redirect', url: editorial.url, partner: subject };
}
