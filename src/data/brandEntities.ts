import { SITE } from './site';

/**
 * Canonical schema.org brand entities for the reviewed sweepstakes casinos.
 *
 * Each brand is defined ONCE as an Organization node whose stable @id lives on
 * its review page (`/reviews/<slug>/#brand`). Every other page that mentions
 * the brand (best-of hub, homepage, state pages, versus) re-ships the SAME
 * node with the SAME @id — Google reads page-by-page, so the full node must be
 * present wherever it is referenced. See docs/schema-markup-plan.md §3.1.
 *
 * Data provenance: operator legal names + registered addresses transcribed
 * from the published review pages (which sourced them from operator ToS).
 * Only verifiable identity facts belong here — no ratings, no offers.
 * `foundingDate` is intentionally absent until per-brand launch years are
 * confirmed (plan §6 open item 4).
 */

export interface BrandAddress {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry: string;
}

export interface BrandEntity {
  /** Matches AffiliatePartner.slug and /reviews/<slug>. */
  slug: string;
  /** Entity display name as published on the review page. */
  name: string;
  /** Official brand site (Organization.url + sameAs anchor). */
  officialUrl: string;
  /** Verified identity/profile URLs, including the official site. */
  sameAs?: string[];
  /** Operator legal name (parentOrganization). */
  operatorName?: string;
  /** Operator registered address, where published. */
  operatorAddress?: BrandAddress;
}

export const BRAND_ENTITIES: Record<string, BrandEntity> = {
  'american-luck': {
    slug: 'american-luck',
    name: 'American Luck',
    officialUrl: 'https://americanluck.com/',
    sameAs: [
      'https://americanluck.com/',
      'https://www.facebook.com/AmericanLuck/',
      'https://x.com/American_Luck',
      'https://www.instagram.com/americanluckcasino/',
      'https://www.trustpilot.com/review/americanluck.com',
    ],
    operatorName: 'SGSE LLC',
    operatorAddress: {
      streetAddress: '251 Little Falls Drive',
      addressLocality: 'Wilmington',
      addressRegion: 'DE',
      postalCode: '19808',
      addressCountry: 'US',
    },
  },
  mcluck: {
    slug: 'mcluck',
    name: 'McLuck Sweepstakes Casino',
    officialUrl: 'https://www.mcluck.com/',
    sameAs: [
      'https://www.mcluck.com/',
      'https://x.com/McLuckOfficial',
      'https://www.facebook.com/Mcluckdotcom',
      'https://www.instagram.com/mcluck.com.official',
    ],
    operatorName: 'B-Two Operations Limited',
    operatorAddress: {
      streetAddress: 'Second Floor, 18-20 North Quay',
      addressLocality: 'Douglas',
      postalCode: 'IM1 4LE',
      addressCountry: 'IM',
    },
  },
  pulsz: {
    slug: 'pulsz',
    name: 'Pulsz Sweepstakes Casino',
    officialUrl: 'https://www.pulsz.com/',
    sameAs: [
      'https://www.pulsz.com/',
      'https://www.trustpilot.com/review/pulsz.com',
    ],
    operatorName: 'Yellow Social Interactive Limited',
    operatorAddress: { addressLocality: "St. Julian's", addressCountry: 'MT' },
  },
  'casino-click': {
    slug: 'casino-click',
    name: 'Casino Click Sweepstakes Casino',
    officialUrl: 'https://www.casino.click/',
    sameAs: [
      'https://www.casino.click/',
      'https://www.trustpilot.com/review/casino.click',
    ],
    operatorName: 'Click Entertainment LLC',
  },
  spinblitz: {
    slug: 'spinblitz',
    name: 'SpinBlitz Sweepstakes Casino',
    officialUrl: 'https://www.spinblitz.com/',
    operatorName: 'B-Two Operations Limited',
    operatorAddress: { addressLocality: 'Isle of Man', addressCountry: 'GB' },
  },
  'hello-millions': {
    slug: 'hello-millions',
    name: 'Hello Millions Sweepstakes Casino',
    officialUrl: 'https://www.hellomillions.com/',
    sameAs: [
      'https://www.hellomillions.com/',
      'https://www.trustpilot.com/review/hellomillions.com',
    ],
    operatorName: 'B-Two Operations Limited',
    operatorAddress: {
      streetAddress: 'Second Floor, 18-20 North Quay',
      addressLocality: 'Douglas',
      postalCode: 'IM1 4LE',
      addressCountry: 'IM',
    },
  },
  'crown-coins': {
    slug: 'crown-coins',
    name: 'Crown Coins Sweepstakes Casino',
    officialUrl: 'https://www.crowncoins.com/',
    operatorName: 'Sunflower Limited',
  },
  legendz: {
    slug: 'legendz',
    name: 'Legendz Sweepstakes Casino',
    officialUrl: 'https://www.legendz.com/',
    sameAs: [
      'https://www.legendz.com/',
      'https://www.trustpilot.com/review/legendz.com',
    ],
    operatorName: 'Platinum Panther Ltd.',
  },
  playfame: {
    slug: 'playfame',
    name: 'PlayFame Sweepstakes Casino',
    officialUrl: 'https://www.playfame.com/',
    operatorName: 'PlayFame Operations Limited',
    operatorAddress: { addressLocality: 'Douglas', addressCountry: 'IM' },
  },
  spree: {
    slug: 'spree',
    name: 'Spree Sweepstakes Casino',
    officialUrl: 'https://www.spree.com/',
    operatorName: 'Play Spree Ltd',
    operatorAddress: { addressLocality: 'Isle of Man', addressCountry: 'GB' },
  },
  thrillzz: {
    slug: 'thrillzz',
    name: 'Thrillzz',
    officialUrl: 'https://thrillzz.com/',
    operatorName: 'Thrillzz Inc.',
    operatorAddress: { addressLocality: 'Franklin', addressRegion: 'TN', addressCountry: 'US' },
  },
  zula: {
    slug: 'zula',
    name: 'Zula Casino',
    officialUrl: 'https://www.zulacasino.com/',
    operatorName: 'SCPS LLC (Blazesoft)',
    operatorAddress: { addressLocality: 'Dover', addressRegion: 'DE', addressCountry: 'US' },
  },
  roxymoxy: {
    slug: 'roxymoxy',
    name: 'RoxyMoxy Sweepstakes Casino',
    officialUrl: 'https://www.roxymoxy.com/',
    operatorName: 'Rainforest LTD',
    operatorAddress: { addressLocality: 'Wilmington', addressRegion: 'DE', addressCountry: 'US' },
  },
  'card-crush': {
    slug: 'card-crush',
    name: 'Card Crush',
    officialUrl: 'https://www.cardcrush.com/',
    sameAs: [
      'https://www.cardcrush.com/',
      'https://www.trustpilot.com/review/cardcrush.com',
    ],
    operatorName: 'Vision NL Limited',
    operatorAddress: {
      streetAddress: 'First Floor, 11-13 Hill Street',
      addressLocality: 'Douglas',
      postalCode: 'IM1 1EF',
      addressCountry: 'IM',
    },
  },
};

/** Stable @id for a brand entity — canonical home is its review page. */
export function brandEntityId(slug: string): string {
  return `${SITE.origin}/reviews/${slug}/#brand`;
}

export function getBrandEntity(slug: string): BrandEntity | undefined {
  return BRAND_ENTITIES[slug];
}
