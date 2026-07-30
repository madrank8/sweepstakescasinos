import type { AffiliatePartner } from '../data/affiliates';
import { shouldRenderAffiliateCta } from '../data/geo';
import type { UsStateCode } from '../data/usStates';

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
