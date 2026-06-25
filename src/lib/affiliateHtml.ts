import { getPartner } from '../data/affiliates';
import { shouldRenderAffiliateCta } from '../data/geo';
import { stampUpdatedDate } from './htmlStamp';
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

/**
 * Replace suppressed partners' CTA anchors with an inline note.
 * Anchors for partners that are allowed in `state` are left untouched.
 * Unknown slugs (non-partner bonus pages) are left untouched.
 */
export function suppressAffiliateCtas(
  html: string,
  state: UsStateCode | null | undefined,
): string {
  return html.replace(BONUS_ANCHOR, (match, slug: string) => {
    const partner = getPartner(slug);
    if (!partner) return match; // not one of our 13 partners — leave as-is
    return shouldRenderAffiliateCta(partner, state) ? match : NOTE;
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
): string {
  return suppressAffiliateCtas(stampUpdatedDate(rawHtml), state);
}
