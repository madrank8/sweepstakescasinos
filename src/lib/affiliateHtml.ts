import { getPartner } from '../data/affiliates';
import { shouldRenderAffiliateCta } from '../data/geo';
import { stampUpdatedDate } from './htmlStamp';
import { injectLegalStatusBadge } from './legalStatusBadge';
import { decorateChrome } from './pageChrome';
import { injectReaderReports } from './readerReportsDisplay';
import type { UsStateCode } from '../data/usStates';

/**
 * Server-side suppression of affiliate CTAs embedded in hand-authored HTML.
 *
 * All affiliate CTAs in this site point internally to `/bonuses/<slug>/` (the
 * gateway). When the resolved state suppresses a given partner, we replace its
 * CTA anchor with an inline "not available" note so the link/CTA does not render
 * at all — satisfying the rule that CTAs must NOT render in banned states.
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

/**
 * Replace suppressed partners' CTA anchors with an inline note, and stamp the
 * `?clickId=<placement>` attribution param onto the anchors that survive.
 * Anchors for partners that are allowed in `state` keep their markup (only the
 * href gains the clickId). Unknown slugs (non-partner bonus pages) are left
 * untouched. `placement` is a build-time-trusted label (see generate script);
 * when omitted, hrefs are left as-is.
 */
export function suppressAffiliateCtas(
  html: string,
  state: UsStateCode | null | undefined,
  placement?: string,
): string {
  return html.replace(BONUS_ANCHOR, (match, slug: string) => {
    const partner = getPartner(slug);
    if (!partner) return match; // not one of our 13 partners — leave as-is
    if (!shouldRenderAffiliateCta(partner, state)) return NOTE;
    return placement ? match.replace(HREF_TARGET, `$1?clickId=${placement}$2`) : match;
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
