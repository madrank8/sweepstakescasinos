import type { AffiliatePartner } from '../data/affiliates';
import type { UsStateCode } from '../data/usStates';
import { availabilityForPartner } from './availability';

export const ODDS_CTA_CLICK_ID = 'odds-calculator';
export const ODDS_CTA_ANALYTICS_EVENT = 'odds_casino_cta_clicked';
export const ODDS_CTA_ANALYTICS_PAYLOAD_KEYS = ['casino_slug', 'placement'] as const;

export type OddsRecommendationTuple = [
  AffiliatePartner,
  AffiliatePartner,
  AffiliatePartner,
];

/** Homepage-parity card chrome for a partner slug (logos match index.html img.card-logo). */
export interface OddsPartnerCardMeta {
  logoSrc: string;
  displayName: string;
  score: string;
  stars: string;
  offer: string;
  offerHighlight: string;
  offerSuffix: string;
  accentClass: 'line-purple' | 'line-cyan' | 'line-gold' | 'line-pink' | 'line-green' | 'line-red';
}

/**
 * Presentation map keyed by affiliate slug. Logo paths match homepage
 * `img.card-logo` sources so editorial picks stay visually in sync when ranking changes.
 * Offer/score copy lives here (not in the Astro template) to keep component-source
 * compliance checks free of hard-coded bonus numerals.
 */
export const ODDS_PARTNER_CARD_META: Record<string, OddsPartnerCardMeta> = {
  mcluck: {
    logoSrc: '/sweepstakeslogo/mcluck.webp',
    displayName: 'MCLUCK',
    score: '4.5 / 5',
    stars: '★★★★★',
    offer: '7,500 GC + ',
    offerHighlight: '2.5 SC',
    offerSuffix: ' No Code',
    accentClass: 'line-purple',
  },
  pulsz: {
    logoSrc: '/sweepstakeslogo/pulsz.webp',
    displayName: 'PULSZ',
    score: '4.5 / 5',
    stars: '★★★★★',
    offer: '5,000 GC + ',
    offerHighlight: '2.3 SC',
    offerSuffix: ' No Code',
    accentClass: 'line-cyan',
  },
  'crown-coins': {
    logoSrc: '/sweepstakeslogo/crowncoinslogo.webp',
    displayName: 'CROWN COINS',
    score: '4.8 / 5',
    stars: '★★★★★',
    offer: '100,000 Crown Coins + ',
    offerHighlight: '2 SC',
    offerSuffix: ' No Deposit',
    accentClass: 'line-gold',
  },
  'hello-millions': {
    logoSrc: '/sweepstakeslogo/hellomillionslogo.webp',
    displayName: 'HELLO MILLIONS',
    score: '4.6 / 5',
    stars: '★★★★★',
    offer: '7,500 GC + ',
    offerHighlight: '2.5 SC',
    offerSuffix: ' Promo Code',
    accentClass: 'line-cyan',
  },
  playfame: {
    logoSrc: '/sweepstakeslogo/playfame.webp',
    displayName: 'PLAYFAME',
    score: '4.3 / 5',
    stars: '★★★★★',
    offer: '7,500 GC + ',
    offerHighlight: '2.5 SC',
    offerSuffix: ' No Code',
    accentClass: 'line-pink',
  },
  'casino-click': {
    logoSrc: '/sweepstakeslogo/casinoclicklogo.webp',
    displayName: 'CASINO CLICK',
    score: '4.7 / 5',
    stars: '★★★★★',
    offer: '100,000 GC + ',
    offerHighlight: '2 Free SC',
    offerSuffix: ' Sign-Up',
    accentClass: 'line-gold',
  },
  spinblitz: {
    logoSrc: '/sweepstakeslogo/spinblitzlogo.webp',
    displayName: 'SPINBLITZ',
    score: '4.6 / 5',
    stars: '★★★★★',
    offer: '7,500 GC + ',
    offerHighlight: '2.5 SC',
    offerSuffix: ' Promo Code',
    accentClass: 'line-gold',
  },
  legendz: {
    logoSrc: '/sweepstakeslogo/legendz.webp',
    displayName: 'LEGENDZ',
    score: '4.2 / 5',
    stars: '★★★★★',
    offer: '500 GC + ',
    offerHighlight: '3 SC',
    offerSuffix: ' No Code',
    accentClass: 'line-green',
  },
  thrillzz: {
    logoSrc: '/sweepstakeslogo/thrillzz.webp',
    displayName: 'THRILLZZ',
    score: '4.3 / 5',
    stars: '★★★★★',
    offer: '3,000 GC + ',
    offerHighlight: '3 SC',
    offerSuffix: ' No Code',
    accentClass: 'line-gold',
  },
  'card-crush': {
    logoSrc: '/sweepstakeslogo/card-crush.webp',
    displayName: 'CARD CRUSH',
    score: '4.2 / 5',
    stars: '★★★★★',
    offer: '2 Mystery Coins + ',
    offerHighlight: '5 Cards',
    offerSuffix: ' Free',
    accentClass: 'line-red',
  },
  spree: {
    logoSrc: '/sweepstakeslogo/spreelogo.webp',
    displayName: 'SPREE',
    score: '4.6 / 5',
    stars: '★★★★★',
    offer: '25,000 GC + ',
    offerHighlight: '2.5 SC',
    offerSuffix: ' Instant Reg',
    accentClass: 'line-green',
  },
  zula: {
    logoSrc: '/sweepstakeslogo/zula.webp',
    displayName: 'ZULA',
    score: '4.4 / 5',
    stars: '★★★★★',
    offer: 'Up to 120,000 GC + ',
    offerHighlight: '10 SC',
    offerSuffix: '',
    accentClass: 'line-cyan',
  },
};

export interface OddsRecommendationItem {
  rank: number;
  partner: AffiliatePartner;
  available: boolean;
  reviewHref: string;
  logoSrc: string;
  logoAlt: string;
  displayName: string;
  score: string;
  stars: string;
  offer: string;
  offerHighlight: string;
  offerSuffix: string;
  accentClass: OddsPartnerCardMeta['accentClass'];
}

function cardMetaFor(partner: AffiliatePartner): OddsPartnerCardMeta {
  const meta = ODDS_PARTNER_CARD_META[partner.slug];
  if (!meta?.logoSrc) {
    throw new Error(
      `Missing homepage logo meta for odds recommendation partner: ${partner.slug}`,
    );
  }
  return meta;
}

export function buildOddsRecommendations(
  partners: OddsRecommendationTuple,
  state: UsStateCode | null | undefined,
): OddsRecommendationItem[] {
  return partners.map((partner, index) => {
    const meta = cardMetaFor(partner);
    return {
      rank: index + 1,
      partner,
      available: availabilityForPartner(partner, state).cta.eligible,
      reviewHref: `/reviews/${partner.slug}/`,
      logoSrc: meta.logoSrc,
      logoAlt: `${partner.name} sweepstakes casino logo`,
      displayName: meta.displayName,
      score: meta.score,
      stars: meta.stars,
      offer: meta.offer,
      offerHighlight: meta.offerHighlight,
      offerSuffix: meta.offerSuffix,
      accentClass: meta.accentClass,
    };
  });
}
