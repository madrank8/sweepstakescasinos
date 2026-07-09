import type { AffiliatePartner } from './affiliates';
import type { UsStateCode } from './usStates';
import { isUsStateCode } from './usStates';

/**
 * Geo-suppression layer for affiliate CTAs.
 *
 * Two independent rules must BOTH pass before an affiliate CTA may render:
 *
 *   1. Site-level legal suppression (SITE_BANNED_STATES) — applies to ALL
 *      partners, in every banned state, regardless of the partner's own
 *      availability. Driven by marketing-affiliate liability laws
 *      (e.g. CA AB-831, NY S5935). In these states we show informational
 *      content only — no affiliate links/CTAs.
 *
 *   2. Per-partner availability (restrictedStates / availableOnlyInStates).
 *
 * `shouldRenderAffiliateCta()` is the single decision function the rest of the
 * app must use. Do not re-implement this logic in components.
 */

/**
 * States where we suppress ALL affiliate CTAs site-wide and publish info-only
 * content. Two grounds qualify a state for this list:
 *
 *   (a) Marketing-affiliate / promoter legal exposure — the statute reaches
 *       those who promote, support, or facilitate the games (e.g. CA AB-831,
 *       NY S5935A, ME LD 2007, TN SB 2136/TCPA). This is the original rationale.
 *   (b) The dual-currency sweepstakes model is banned outright, so no lawful
 *       operator offers exist even absent explicit affiliate liability. Indiana
 *       (HB 1052, eff. Jul 1 2026) is civil + operators-only, but the product
 *       is prohibited, so we do not promote it.
 *
 * Verified 2026 bans folded in (source: state legislatures + industry press,
 * checked 2026-07-09):
 *   - IN  HB 1052            eff. 2026-07-01  (civil, operators only)   [ground b]
 *   - ME  LD 2007            eff. 2026-07-14  (operator + promoter)     [ground a]
 *   - TN  SB 2136 / HB 1885  eff. immediately (TCPA, facilitators)      [ground a]
 *
 * SCHEDULED — not yet active:
 *   - OK  SB 1589 (veto override)  eff. 2026-11-01  (felony, incl. affiliates).
 *     Oklahoma offers remain LAWFUL until 2026-11-01. On/after that date, add
 *     'OK' to this array to switch Oklahoma to info-only site-wide.
 */
export const SITE_BANNED_STATES: readonly UsStateCode[] = [
  'CA',
  'NY',
  'MT',
  'CT',
  'NV',
  'NJ',
  'LA',
  'MI',
  'ID',
  'WA',
  'IN',
  'ME',
  'TN',
];

const SITE_BANNED_SET = new Set<UsStateCode>(SITE_BANNED_STATES);

/**
 * Fail-closed policy: when we cannot resolve a visitor's US state, should we
 * suppress affiliate CTAs?
 *
 * For a YMYL site with legal exposure the defensible default is `true`
 * (suppress when unknown). Note this also suppresses CTAs for non-US visitors
 * and during local dev where no geo header exists — use `resolveStateForEnv`
 * or set a dev override to preview CTAs locally.
 */
export const SUPPRESS_WHEN_REGION_UNKNOWN = true;

/** Normalize an arbitrary region string (e.g. Vercel header) to a US state code. */
export function normalizeRegion(region: string | null | undefined): UsStateCode | null {
  if (!region) return null;
  const code = region.trim().toUpperCase();
  return isUsStateCode(code) ? code : null;
}

/** True if affiliate CTAs are suppressed site-wide for this state (legal layer). */
export function isStateBannedSitewide(state: UsStateCode): boolean {
  return SITE_BANNED_SET.has(state);
}

/**
 * Per-partner availability ONLY (ignores the site-level legal layer).
 * This mirrors the "State Availability" expected output.
 */
export function isPartnerAvailableInState(
  partner: AffiliatePartner,
  state: UsStateCode,
): boolean {
  if (partner.availableOnlyInStates && partner.availableOnlyInStates.length > 0) {
    return partner.availableOnlyInStates.includes(state);
  }
  return !partner.restrictedStates.includes(state);
}

/**
 * THE decision function for whether an affiliate CTA may render.
 * Combines the legal layer + per-partner availability + unknown-region policy.
 *
 * @param partner the affiliate partner
 * @param state   resolved US state code, or null/undefined if unknown
 */
export function shouldRenderAffiliateCta(
  partner: AffiliatePartner,
  state: UsStateCode | null | undefined,
): boolean {
  if (!state) return !SUPPRESS_WHEN_REGION_UNKNOWN;
  if (isStateBannedSitewide(state)) return false;
  return isPartnerAvailableInState(partner, state);
}

/** Reason codes for diagnostics / "not available" messaging. */
export type SuppressionReason =
  | 'allowed'
  | 'region-unknown'
  | 'state-banned-sitewide'
  | 'partner-restricted';

export function suppressionReason(
  partner: AffiliatePartner,
  state: UsStateCode | null | undefined,
): SuppressionReason {
  if (!state) return SUPPRESS_WHEN_REGION_UNKNOWN ? 'region-unknown' : 'allowed';
  if (isStateBannedSitewide(state)) return 'state-banned-sitewide';
  if (!isPartnerAvailableInState(partner, state)) return 'partner-restricted';
  return 'allowed';
}
