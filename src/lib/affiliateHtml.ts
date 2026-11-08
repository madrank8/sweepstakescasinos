import { getPartner } from '../data/affiliates';
import { getEditorialOutbound } from '../data/editorialOutbound';
import { stampReviewFreshness, stampUpdatedDate } from './htmlStamp';
import { reviewSourceDates } from '../data/operators';
import { injectLegalStatusBadge } from './legalStatusBadge';
import { decorateChrome } from './pageChrome';
import { injectReaderReports } from './readerReportsDisplay';
import { injectOperatorFactsHtml } from './operatorFactsHtml';
import { injectReviewContextualLinks } from './internalLinks';
import type { UsStateCode } from '../data/usStates';
import { availabilityForPartner, siteCtaEligibility } from './availability';
import type { StateRecord } from './tracker/types';

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
  if (partner) return availabilityForPartner(partner, state).cta.eligible;
  // Known editorial outbound (non-partner) — site legal layer only.
  if (!getEditorialOutbound(slug)) return false;
  return siteCtaEligibility(state).eligible;
}

/**
 * Replace suppressed CTA anchors with an inline note, and stamp the
 * `?clickId=<placement>` attribution param onto partner anchors that survive.
 * Non-partner editorial outbound links keep their href (no clickId) when allowed.
 * `placement` is a build-time-trusted label (see generate script);
 * when omitted, hrefs are left as-is.
 */
function withRel(anchor: string, rel: string): string {
  if (/\brel=/i.test(anchor)) {
    return anchor.replace(/\brel=(["'])[^"']*\1/i, `rel="${rel}"`);
  }
  return anchor.replace(/<a\b/i, `<a rel="${rel}"`);
}

function withAttr(anchor: string, name: string, value: string): string {
  const pattern = new RegExp(`\\b${name}=(["'])[^"']*\\1`, 'i');
  if (pattern.test(anchor)) return anchor.replace(pattern, `${name}="${value}"`);
  return anchor.replace(/<a\b/i, `<a ${name}="${value}"`);
}

function stampPlacement(anchor: string, placement?: string): string {
  if (!placement) return anchor;
  return anchor.replace(HREF_TARGET, `$1?clickId=${placement}$2`);
}

export function suppressAffiliateCtas(
  html: string,
  state: UsStateCode | null | undefined,
  placement?: string,
  options: { crawlableDefault?: boolean } = {},
): string {
  return html.replace(BONUS_ANCHOR, (match, slug: string) => {
    // `/bonuses/no-deposit/` is an indexable editorial hub, not a gateway CTA.
    if (slug === 'no-deposit') return match;
    if (shouldRenderBonusCta(slug, state)) {
      const partner = getPartner(slug);
      let kept = withRel(match, 'sponsored nofollow noopener');
      kept = withAttr(kept, 'data-geo-swap', '1');
      if (partner && placement) kept = stampPlacement(kept, placement);
      return kept;
    }
    if (options.crawlableDefault && !state) {
      const partner = getPartner(slug);
      let kept = withRel(match, 'sponsored nofollow noopener');
      kept = withAttr(kept, 'data-geo-swap', '1');
      if (partner && placement) kept = stampPlacement(kept, placement);
      return kept;
    }
    if (options.crawlableDefault) {
      let fallback = match.replace(
        /\bhref=(["'])\/bonuses\/[a-z0-9-]+\/?[^"']*\1/i,
        'href="/bonuses/no-deposit/"',
      );
      fallback = withRel(fallback, 'nofollow noopener');
      fallback = withAttr(fallback, 'data-geo-swap', 'restricted');
      return fallback;
    }
    return NOTE;
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
  trackerState?: StateRecord,
): string {
  const facts = injectOperatorFactsHtml(rawHtml, slug, { state, trackerState });
  const dated = stampReviewFreshness(facts, slug);
  const chrome = decorateChrome(dated);
  const dates = reviewSourceDates(slug);
  const stamped = dates
    ? stampUpdatedDate(chrome, new Date(`${dates.modifiedOn}T00:00:00Z`))
    : stampUpdatedDate(chrome);
  const withCtas = suppressAffiliateCtas(stamped, state, placement, {
    crawlableDefault: true,
  });
  const withBadge = injectLegalStatusBadge(withCtas, {
    state,
    trackerState,
    partner: getPartner(slug),
  });
  return injectReaderReports(
    injectReviewContextualLinks(withBadge, { reviewSlug: slug, state }),
    slug,
  );
}
