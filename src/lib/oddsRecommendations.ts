import { getPartner, type AffiliatePartner } from '../data/affiliates';
import { shouldRenderAffiliateCta } from '../data/geo';
import type { UsStateCode } from '../data/usStates';

/** First three slugs from `comparisons/sweepstakes-casinos` editorial ranking. */
export const ODDS_EDITORIAL_TOP_THREE_SLUGS = ['mcluck', 'pulsz', 'crown-coins'] as const;

export const ODDS_CTA_CLICK_ID = 'odds-calculator';
export const ODDS_CTA_ANALYTICS_EVENT = 'odds_casino_cta_clicked';
export const ODDS_CTA_ANALYTICS_PAYLOAD_KEYS = ['casino_slug', 'placement'] as const;

export type OddsRecommendationTuple = [
  AffiliatePartner,
  AffiliatePartner,
  AffiliatePartner,
];

export interface OddsRecommendationItem {
  rank: number;
  partner: AffiliatePartner;
  available: boolean;
  reviewHref: string;
}

export function getOddsEditorialTopThree(): OddsRecommendationTuple {
  const partners = ODDS_EDITORIAL_TOP_THREE_SLUGS.map((slug) => {
    const partner = getPartner(slug);
    if (!partner) throw new Error(`missing odds editorial partner: ${slug}`);
    return partner;
  });
  return partners as OddsRecommendationTuple;
}

export function buildOddsRecommendations(
  partners: OddsRecommendationTuple,
  state: UsStateCode | null | undefined,
): OddsRecommendationItem[] {
  return partners.map((partner, index) => ({
    rank: index + 1,
    partner,
    available: shouldRenderAffiliateCta(partner, state),
    reviewHref: `/reviews/${partner.slug}/`,
  }));
}
