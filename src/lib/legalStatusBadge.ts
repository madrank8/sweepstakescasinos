/**
 * Three-authority availability summary for review pages.
 *
 * Tracker records supply legal display and freshness, affiliates supply
 * commercial availability, and geo.ts supplies site CTA policy. The copy keeps
 * those conclusions separate.
 */
import type { AffiliatePartner } from '../data/affiliates';
import { stateName, type UsStateCode } from '../data/usStates';
import {
  availabilityForPartner,
  availabilityForState,
} from './availability';
import type { StateRecord } from './tracker/types';

const BADGE_MARKER = '<!--sc-legal-verified-->';

export interface LegalStatusBadgeOptions {
  state?: UsStateCode | null;
  trackerState?: StateRecord | null;
  partner?: AffiliatePartner;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function badgeMarkup(options: LegalStatusBadgeOptions): string {
  const state = options.state ?? null;
  const view = options.partner
    ? availabilityForPartner(
        options.partner,
        state,
        options.trackerState ?? undefined,
      )
    : availabilityForState(state, options.trackerState ?? undefined);
  const legalLine = view.legal
    ? `<strong>Tracker legal status:</strong> ${escapeHtml(view.legal.label)} ` +
      (view.legal.freshness.value
        ? `(<time datetime="${view.legal.freshness.value}">${view.legal.freshness.value.slice(0, 10)}</time>)`
        : '(source freshness unavailable)')
    : '<strong>Location unknown.</strong> Tracker legal status is available after you choose a state.';
  let commercialLine = '';
  if (options.partner) {
    if (!state) {
      commercialLine =
        '<br><strong>Affiliate offer availability: unknown</strong> until your location is resolved.';
    } else if (view.affiliate?.available && view.site.status === 'suppressed') {
      commercialLine =
        '<br><strong>Affiliate offer availability:</strong> Commercially listed by the affiliate partner; ' +
        'site CTA policy suppresses this offer. This is not a legal conclusion.';
    } else if (view.affiliate?.available) {
      commercialLine =
        '<br><strong>Affiliate offer availability: available</strong> for the resolved state.';
    } else {
      commercialLine =
        '<br><strong>Affiliate offer availability:</strong> unavailable under the operator commercial policy. ' +
        'This is not a legal conclusion.';
    }
  }
  const policyLine = state
    ? `<br><strong>Site CTA policy verified:</strong> ` +
      `<time datetime="${view.site.verifiedOn}">${view.site.verifiedOn}</time>.`
    : '';
  const stateContextLink = state
    ? `<a href="/states/${escapeHtml(
        options.trackerState?.state_slug ??
          stateName(state).toLowerCase().replaceAll('.', '').replaceAll(' ', '-'),
      )}/">${escapeHtml(stateName(state))} availability context</a>`
    : '<a href="/state-legality/">Choose a state for availability context</a>';
  return `${BADGE_MARKER}
<style>
.sc-legal-verified{margin:14px 0 20px;padding:12px 16px;border:1px solid rgba(15,23,42,.16);border-left:5px solid #0a1628;border-radius:10px;background:linear-gradient(180deg,#f1f5f9 0%,#f8fafc 100%);font:600 13.5px/1.55 'DM Sans',system-ui,sans-serif;color:#1e293b;box-shadow:0 1px 2px rgba(15,23,42,.04);}
.sc-legal-verified time{font-variant-numeric:tabular-nums;color:#0a1628;font-weight:700;}
.sc-legal-verified a{color:#1d4ed8;text-decoration:underline;text-underline-offset:2px;}
.sc-legal-verified a:hover{color:#1e40af;}
</style>
<p class="sc-legal-verified" role="status">
  ${legalLine}${commercialLine}${policyLine}
  <br><a href="/sweepstakes-tracker/">Legality tracker</a>
  · ${stateContextLink}
</p>`;
}

/** Preferred → fallback anchors so chrome-light reviews still get a visible mid-page badge. */
const ANCHORS: RegExp[] = [
  /(<div\b[^>]*\bclass="[^"]*\brestricted-box\b[^"]*"[^>]*>)/i,
  /(<div\b[^>]*\bclass="[^"]*\bauthor-eeat\b[^"]*"[^>]*>)/i,
  /(<div\b[^>]*\bclass="[^"]*\bverdict-box\b[^"]*"[^>]*>)/i,
  /(<div\b[^>]*\bclass="[^"]*\banswer-capsule\b[^"]*"[^>]*>)/i,
  /(<div\b[^>]*\bclass="[^"]*\boffer-card\b[^"]*"[^>]*>)/i,
  /(<main\b[^>]*>)/i,
];

/**
 * Insert the verification badge immediately before the best available chrome
 * anchor. Idempotent; no nested-div parsing.
 */
export function injectLegalStatusBadge(
  html: string,
  options: LegalStatusBadgeOptions = {},
): string {
  if (html.includes(BADGE_MARKER)) return html;
  const badge = badgeMarkup(options);
  for (const re of ANCHORS) {
    if (re.test(html)) {
      return html.replace(re, `${badge}\n$1`);
    }
  }
  return html.replace(/<body\b[^>]*>/i, (m) => `${m}\n${badge}`);
}
