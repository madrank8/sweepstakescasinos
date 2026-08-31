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

/** Card chrome for a partner slug when an explicit editorial set is supplied. */
export interface OddsPartnerCardMeta {
  logoSrc: string;
  displayName: string;
  accentClass: 'line-purple' | 'line-cyan' | 'line-gold' | 'line-pink' | 'line-green' | 'line-red';
}

/**
 * Presentation map keyed by affiliate slug.
 * This contains presentation-only identity fields, not unresolved score or offer facts.
 */
export const ODDS_PARTNER_CARD_META: Record<string, OddsPartnerCardMeta> = {
  mcluck: {
    logoSrc: '/sweepstakeslogo/mcluck.webp',
    displayName: 'MCLUCK',
    accentClass: 'line-purple',
  },
  pulsz: {
    logoSrc: '/sweepstakeslogo/pulsz.webp',
    displayName: 'PULSZ',
    accentClass: 'line-cyan',
  },
  'crown-coins': {
    logoSrc: '/sweepstakeslogo/crowncoinslogo.webp',
    displayName: 'CROWN COINS',
    accentClass: 'line-gold',
  },
  'hello-millions': {
    logoSrc: '/sweepstakeslogo/hellomillionslogo.webp',
    displayName: 'HELLO MILLIONS',
    accentClass: 'line-cyan',
  },
  playfame: {
    logoSrc: '/sweepstakeslogo/playfame.webp',
    displayName: 'PLAYFAME',
    accentClass: 'line-pink',
  },
  'casino-click': {
    logoSrc: '/sweepstakeslogo/casinoclicklogo.webp',
    displayName: 'CASINO CLICK',
    accentClass: 'line-gold',
  },
  spinblitz: {
    logoSrc: '/sweepstakeslogo/spinblitzlogo.webp',
    displayName: 'SPINBLITZ',
    accentClass: 'line-gold',
  },
  legendz: {
    logoSrc: '/sweepstakeslogo/legendz.webp',
    displayName: 'LEGENDZ',
    accentClass: 'line-green',
  },
  thrillzz: {
    logoSrc: '/sweepstakeslogo/thrillzz.webp',
    displayName: 'THRILLZZ',
    accentClass: 'line-gold',
  },
  'card-crush': {
    logoSrc: '/sweepstakeslogo/card-crush.webp',
    displayName: 'CARD CRUSH',
    accentClass: 'line-red',
  },
  spree: {
    logoSrc: '/sweepstakeslogo/spreelogo.webp',
    displayName: 'SPREE',
    accentClass: 'line-green',
  },
  zula: {
    logoSrc: '/sweepstakeslogo/zula.webp',
    displayName: 'ZULA',
    accentClass: 'line-cyan',
  },
};

export interface OddsRecommendationItem {
  partner: AffiliatePartner;
  available: boolean;
  reviewHref: string;
  logoSrc: string;
  logoAlt: string;
  displayName: string;
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
  return partners.map((partner) => {
    const meta = cardMetaFor(partner);
    return {
      partner,
      available: availabilityForPartner(partner, state).cta.eligible,
      reviewHref: `/reviews/${partner.slug}/`,
      logoSrc: meta.logoSrc,
      logoAlt: `${partner.name} sweepstakes casino logo`,
      displayName: meta.displayName,
      accentClass: meta.accentClass,
    };
  });
}
