import type { UsStateCode } from './usStates';

/**
 * Typed affiliate data layer for the 13 sweepstakes-casino partners.
 *
 * Source of truth: `.planning/affiliate-deals.csv` (the "Affiliate Brands"
 * dataset). Values transcribed here so the app never reads CSV at runtime and
 * never hardcodes raw tracking URLs in pages.
 *
 * IMPORTANT compliance note: `restrictedStates` / `availableOnlyInStates`
 * describe PARTNER availability only. A separate, stricter site-level legal
 * suppression (see `src/data/geo.ts` -> SITE_BANNED_STATES) is applied ON TOP
 * of this before any CTA is allowed to render.
 */

export type AffiliateModel = 'cpa' | 'revshare';

export interface AffiliatePartner {
  /** URL-safe identifier, matches existing /reviews/<slug> and /bonuses/<slug>. */
  slug: string;
  /** Display name. */
  name: string;
  /** Payout in USD. 0 for pure revshare deals. */
  cpa: number;
  /** Commercial model. */
  model: AffiliateModel;
  /**
   * Blocklist: 2-letter US state codes where the PARTNER is not available.
   * Mutually exclusive with `availableOnlyInStates`.
   */
  restrictedStates: UsStateCode[];
  /**
   * Allowlist override (inverse availability). When present, the partner is
   * available ONLY in these states and `restrictedStates` is ignored.
   * Used for Card Crush (available only in CA & NY).
   */
  availableOnlyInStates?: UsStateCode[];
  /** Gemified tracking URL. Never render this raw — always via <AffiliateLink>. */
  trackingLink: string;
}

/**
 * The 13 partners. `restrictedStates` are exactly the CSV "Restricted in:"
 * values, filtered to valid US state codes (McLuck's "QC"/Quebec is dropped as
 * it is not a US state).
 */
export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    slug: 'mcluck',
    name: 'McLuck',
    cpa: 250,
    model: 'cpa',
    restrictedStates: ['ID', 'KY', 'MI', 'MT', 'NV', 'WA', 'LA', 'DE', 'NJ', 'NY', 'OH', 'MD', 'WV', 'CT', 'CA', 'TN', 'IN'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/67fd0f0908d1190d074d0da3',
  },
  {
    slug: 'pulsz',
    name: 'Pulsz',
    cpa: 250,
    model: 'cpa',
    restrictedStates: ['WA', 'ID', 'MI', 'MT', 'NV', 'AL', 'TN', 'CT', 'NY', 'LA', 'MS', 'WV', 'MD', 'AZ', 'CA', 'NJ', 'IN', 'ME'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/67fd143b3d46f08cc61b8199',
  },
  {
    slug: 'casino-click',
    name: 'Casino Click',
    cpa: 200,
    model: 'cpa',
    restrictedStates: ['ID', 'KY', 'MI', 'MD', 'NV', 'WA', 'CA', 'CT', 'MT', 'NY'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/67fd1998570905aaacec84b7',
  },
  {
    slug: 'spinblitz',
    name: 'SpinBlitz',
    cpa: 200,
    model: 'cpa',
    restrictedStates: ['ID', 'KY', 'MI', 'MT', 'NV', 'WA', 'LA', 'DE', 'NJ', 'NY', 'OH', 'MD', 'WV', 'CT', 'CA', 'TN', 'IN'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/6830291f7833e7518b44aaa7',
  },
  {
    slug: 'hello-millions',
    name: 'HelloMillions',
    cpa: 230,
    model: 'cpa',
    restrictedStates: ['ID', 'KY', 'LA', 'MD', 'MI', 'MT', 'NV', 'NY', 'WA', 'WV', 'CA', 'TN', 'IN', 'DE', 'NJ', 'OH', 'CT'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/6839a8aabfaf29f4ad1d710f',
  },
  {
    slug: 'crown-coins',
    name: 'CrownCoins Casino',
    cpa: 230,
    model: 'cpa',
    restrictedStates: ['ID', 'MI', 'NV', 'WA', 'MT', 'LA', 'CT', 'NY', 'NJ', 'CA', 'IN'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/6846f91db5a0aef86a89c82f',
  },
  {
    slug: 'legendz',
    name: 'Legendz',
    cpa: 200,
    model: 'cpa',
    restrictedStates: ['WA', 'NV', 'NE', 'MD', 'MI', 'ID', 'ND', 'KY', 'WV', 'CT', 'NY', 'LA', 'NJ', 'CA', 'TN', 'IL', 'IN'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/68498faeb5a0aef86a89f63b',
  },
  {
    slug: 'playfame',
    name: 'PlayFame',
    cpa: 220,
    model: 'cpa',
    restrictedStates: ['ID', 'KY', 'MI', 'MT', 'NV', 'WA', 'LA', 'DE', 'NJ', 'NY', 'OH', 'MD', 'WV', 'CT', 'CA', 'TN', 'IN'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/6852b86a2811510748242f49',
  },
  {
    slug: 'spree',
    name: 'Spree',
    cpa: 180,
    model: 'cpa',
    restrictedStates: ['MT', 'AL', 'WA', 'ID', 'NV', 'KY', 'GA', 'LA', 'DE', 'WV', 'MI', 'MD', 'CT', 'NJ', 'NY', 'CA', 'TN', 'IL'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/685a92e2947366d354d37430',
  },
  {
    slug: 'thrillzz',
    name: 'Thrillzz',
    cpa: 200,
    model: 'cpa',
    restrictedStates: ['AL', 'CT', 'GA', 'HI', 'ID', 'KY', 'LA', 'MI', 'MS', 'MT', 'NY', 'NV', 'OH', 'WA'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/68750a473eb8fc6bed64abbb',
  },
  {
    slug: 'zula',
    name: 'Zula Casino',
    cpa: 0,
    model: 'revshare',
    restrictedStates: ['ID', 'MI', 'WA'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/68930e11bfbdf41d51d3d78b',
  },
  {
    slug: 'roxymoxy',
    name: 'RoxyMoxy',
    cpa: 160,
    model: 'cpa',
    restrictedStates: ['CT', 'DE', 'ID', 'LA', 'MI', 'MT', 'NV', 'NJ', 'NY', 'PA', 'WA', 'WV', 'CA', 'AZ', 'KY', 'UT', 'MN', 'TN', 'MD', 'IN'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/68ad7b59acc04452caf30db3',
  },
  {
    slug: 'card-crush',
    name: 'Card Crush',
    cpa: 200,
    model: 'cpa',
    // Inverse availability: available ONLY in CA & NY.
    restrictedStates: [],
    availableOnlyInStates: ['CA', 'NY'],
    trackingLink: 'https://tracker.gemified.io/r/IfwzBLhob64t/69caa16701e1ec3e1f1d9a5c',
  },
];

const PARTNERS_BY_SLUG: Map<string, AffiliatePartner> = new Map(
  AFFILIATE_PARTNERS.map((p) => [p.slug, p]),
);

export function getPartner(slug: string): AffiliatePartner | undefined {
  return PARTNERS_BY_SLUG.get(slug);
}
