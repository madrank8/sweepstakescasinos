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
  /** Authored review carrying this schema identity. */
  provenance: { source: string; publishedOn: string };
}

const BRAND_ENTITY_VALUES: Record<string, Omit<BrandEntity, 'provenance'>> = {
  acebet: {
    slug: 'acebet',
    name: 'Acebet Sweepstakes Casino',
    officialUrl: 'https://www.acebet.cc/',
    sameAs: [
      'https://www.acebet.cc/',
      'https://www.trustpilot.com/review/acebet.cc',
    ],
    operatorName: 'Trey Mark Services Limited',
  },
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
  'big-pirate': {
    slug: 'big-pirate',
    name: 'Big Pirate Sweepstakes Casino',
    officialUrl: 'https://www.bigpirate.com/',
    sameAs: [
      'https://www.bigpirate.com/',
      'https://www.trustpilot.com/review/bigpirate.com',
    ],
    operatorName: 'Rafflefy Limited',
  },
  dexyplay: {
    slug: 'dexyplay',
    name: 'DexyPlay Sweepstakes Casino',
    officialUrl: 'https://www.dexyplay.com/',
    sameAs: ['https://www.dexyplay.com/'],
    operatorName: 'UTech Solutions LLC',
  },
  freespin: {
    slug: 'freespin',
    name: 'FreeSpin Sweepstakes Casino',
    officialUrl: 'https://www.freespin.com/',
    sameAs: [
      'https://www.freespin.com/',
      'https://www.trustpilot.com/review/www.freespin.com',
    ],
    operatorName: 'Free Spin',
  },
  high5: {
    slug: 'high5',
    name: 'High 5 Casino',
    officialUrl: 'https://high5casino.com/',
    sameAs: [
      'https://high5casino.com/',
      'https://www.trustpilot.com/review/high5casino.com',
    ],
    operatorName: 'High 5 Entertainment LLC',
  },
  'jackpot-go': {
    slug: 'jackpot-go',
    name: 'JackpotGo Casino',
    officialUrl: 'https://www.jackpotgo.com/',
    sameAs: [
      'https://www.jackpotgo.com/',
      'https://www.trustpilot.com/review/jackpotgo.com',
    ],
    operatorName: 'Hiwingo Limited',
    operatorAddress: { addressCountry: 'GB' },
  },
  jackpota: {
    slug: 'jackpota',
    name: 'Jackpota Sweepstakes Casino',
    officialUrl: 'https://www.jackpota.com/',
    sameAs: [
      'https://www.jackpota.com/',
      'https://www.trustpilot.com/review/jackpota.com',
    ],
    operatorName: 'Silver Social Operations Limited / B2Services OU',
  },
  'lucky-bunny': {
    slug: 'lucky-bunny',
    name: 'Lucky Bunny Sweepstakes Casino',
    officialUrl: 'https://www.luckybunny.fun/',
    sameAs: ['https://www.luckybunny.fun/'],
    operatorName: 'Optivara LLC',
    operatorAddress: { addressRegion: 'DE', addressCountry: 'US' },
  },
  'mega-bonanza': {
    slug: 'mega-bonanza',
    name: 'Mega Bonanza Sweepstakes Casino',
    officialUrl: 'https://www.megabonanza.com/',
    sameAs: ['https://www.megabonanza.com/'],
    operatorName: 'B2 Services OU / LuminaryPlay Operations',
  },
  rolla: {
    slug: 'rolla',
    name: 'Rolla Sweepstakes Casino',
    officialUrl: 'https://www.rolla.com/',
    sameAs: ['https://www.rolla.com/'],
    operatorName: 'MW Services Limited',
    operatorAddress: {
      streetAddress: '5-9 Main Street',
      addressLocality: 'Gibraltar',
      postalCode: 'GX11 1AA',
      addressCountry: 'GI',
    },
  },
  spinfinite: {
    slug: 'spinfinite',
    name: 'Spinfinite Sweepstakes Casino',
    officialUrl: 'https://www.spinfinite.com/',
    sameAs: ['https://www.spinfinite.com/'],
    operatorName: 'Forever Winning LLC',
  },
  'splash-coins': {
    slug: 'splash-coins',
    name: 'Splash Coins Sweepstakes Casino',
    officialUrl: 'https://www.splashcoins.com/',
    sameAs: ['https://www.splashcoins.com/'],
    operatorName: 'Interactive Studios Inc',
    operatorAddress: {
      streetAddress: 'Suite 201, 900 Foulk Rd',
      addressLocality: 'Wilmington',
      addressRegion: 'DE',
      postalCode: '19803',
      addressCountry: 'US',
    },
  },
  sweepico: {
    slug: 'sweepico',
    name: 'Sweepico Sweepstakes Casino',
    officialUrl: 'https://www.sweepico.com/',
    sameAs: ['https://www.sweepico.com/'],
    operatorName: 'UTech Solutions LLC',
  },
  'sweet-sweeps': {
    slug: 'sweet-sweeps',
    name: 'Sweet Sweeps Sweepstakes Casino',
    officialUrl: 'https://www.sweetsweeps.com/',
    sameAs: ['https://www.sweetsweeps.com/'],
    operatorName: 'Inimitable Solutions Limited',
    operatorAddress: {
      streetAddress: '5-9 Main Street',
      addressLocality: 'Gibraltar',
      addressCountry: 'GI',
    },
  },
  'wow-vegas': {
    slug: 'wow-vegas',
    name: 'WOW Vegas Sweepstakes Casino',
    officialUrl: 'https://www.wowvegas.com/',
    sameAs: ['https://www.wowvegas.com/'],
    operatorName: 'MW Services Limited',
    operatorAddress: { addressLocality: 'Gibraltar', addressCountry: 'GI' },
  },
};

export const BRAND_ENTITIES: Record<string, BrandEntity> = Object.fromEntries(
  Object.entries(BRAND_ENTITY_VALUES).map(([slug, entity]) => [
    slug,
    {
      ...entity,
      provenance: {
        source: `reviews/${slug}.html`,
        publishedOn: '2026-05-20',
      },
    },
  ]),
);

/** Stable @id for a brand entity — canonical home is its review page. */
export function brandEntityId(slug: string): string {
  return `${SITE.origin}/reviews/${slug}/#brand`;
}

export function getBrandEntity(slug: string): BrandEntity | undefined {
  return BRAND_ENTITIES[slug];
}
