import { getPartner } from '../data/affiliates';
import { getEditorialOutbound } from '../data/editorialOutbound';
import {
  isStateBannedSitewide,
  shouldRenderAffiliateCta,
  SUPPRESS_WHEN_REGION_UNKNOWN,
} from '../data/geo';
import { stampUpdatedDate } from './htmlStamp';
import { injectLegalStatusBadge } from './legalStatusBadge';
import { decorateChrome } from './pageChrome';
import { injectReaderReports } from './readerReportsDisplay';
import type { UsStateCode } from '../data/usStates';

/**
 * Server-side suppression of affiliate CTAs embedded in hand-authored HTML.
 *
 * All bonus CTAs in this site point internally to `/bonuses/<slug>/` (the
 * gateway). When the resolved state suppresses a given slug, we replace its
 * CTA anchor with an inline "not available" note so the link/CTA does not render
 * at all — satisfying the rule that CTAs must NOT render in banned states.
 *
 * Partners use per-brand availability + site bans. Non-partner editorial
 * outbound slugs still respect SITE_BANNED_STATES / unknown-region policy.
 *
 * The gateway (`resolveBonusGateway`) is the hard legal backstop; this transform
 * is the visible-UI layer so users in suppressed states never see a dead CTA.
 *
 * Markup contract: CTAs are simple, non-nested anchors like
 *   <a ... href="/bonuses/<slug>/" ...> ...label... </a>
 */

// Matches a single (non-nested) anchor whose href targets /bonuses/<slug>/.
const BONUS_ANCHOR = /<a\b[^>]*?href="\/bonuses\/([a-z0-9-]+)\/?"[^>]*>.*?<\/a>/gis;

const NOTE =
  '<span class="affiliate-unavailable" data-reason="geo-suppressed">Not available in your location</span>';

// Injects `?clickId=<placement>` into a /bonuses/<slug>/ href while preserving
// the optional trailing slash. Only applied to CTAs that will actually render.
const HREF_TARGET = /(href="\/bonuses\/[a-z0-9-]+\/?)(")/i;

function shouldRenderBonusCta(
  slug: string,
  state: UsStateCode | null | undefined,
): boolean {
  const partner = getPartner(slug);
  if (partner) return shouldRenderAffiliateCta(partner, state);
  // Known editorial outbound (non-partner) — site legal layer only.
  if (!getEditorialOutbound(slug)) return false;
  if (!state) return !SUPPRESS_WHEN_REGION_UNKNOWN;
  return !isStateBannedSitewide(state);
}

/**
 * Replace suppressed CTA anchors with an inline note, and stamp the
 * `?clickId=<placement>` attribution param onto partner anchors that survive.
 * Non-partner editorial outbound links keep their href (no clickId) when allowed.
 * `placement` is a build-time-trusted label (see generate script);
 * when omitted, hrefs are left as-is.
 */
export function suppressAffiliateCtas(
  html: string,
  state: UsStateCode | null | undefined,
  placement?: string,
): string {
  return html.replace(BONUS_ANCHOR, (match, slug: string) => {
    if (!shouldRenderBonusCta(slug, state)) return NOTE;
    const partner = getPartner(slug);
    if (partner && placement) {
      return match.replace(HREF_TARGET, `$1?clickId=${placement}$2`);
    }
    return match;
  });
}

/** True if the HTML contains at least one affiliate CTA we must geo-gate. */
export function hasAffiliateCtas(html: string): boolean {
  BONUS_ANCHOR.lastIndex = 0;
  return BONUS_ANCHOR.test(html);
}

/**
 * Full SSR pipeline for an affiliate page: date-stamp the bundled raw HTML, then
 * geo-suppress CTAs for the resolved state. Used by generated SSR page wrappers
 * (which import the source HTML via `?raw` so it ships in the function bundle).
 */
export function prepareSsrAffiliateHtml(
  rawHtml: string,
  state: UsStateCode | null | undefined,
  placement?: string,
): string {
  return suppressAffiliateCtas(stampUpdatedDate(decorateChrome(rawHtml)), state, placement);
}

/**
 * SSR affiliate REVIEW pages: run the affiliate pipeline, then inject the Reader
 * Reports section for `slug`. (Kept separate from prepareSsrAffiliateHtml so the
 * homepage — also an affiliate page — does not get the review block.)
 */
export function prepareSsrAffiliateReviewHtml(
  rawHtml: string,
  state: UsStateCode | null | undefined,
  slug: string,
  placement?: string,
): string {
  const withBadge = injectLegalStatusBadge(
    prepareSsrAffiliateHtml(rawHtml, state, placement),
  );
  return injectReaderReports(withBadge, slug);
}
