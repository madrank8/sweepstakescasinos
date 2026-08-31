/**
 * Compatibility helpers for tracker editorial cross-links.
 *
 * Availability decisions delegate to the facade, which preserves tracker legal
 * display, affiliate commercial availability, and site CTA policy separately.
 */
import { AFFILIATE_PARTNERS } from './affiliates';
import { getBrandEntity } from './brandEntities';
import {
  availabilityForPartner,
  availabilityForState,
} from '../lib/availability';

/**
 * The Wiz affiliate availability for a state: how many reviewed partners we may
 * promote there once the site-level legal layer is applied. This is the
 * "X of N operators" number shown on the state-legality hub.
 */
export function wizAvailabilityForState(code: string): {
  banned: boolean;
  availableCount: number;
  total: number;
  availableSlugs: string[];
} {
  const total = AFFILIATE_PARTNERS.length;
  const stateView = availabilityForState(code);
  if (!stateView.state) {
    return { banned: false, availableCount: 0, total, availableSlugs: [] };
  }
  const banned = stateView.site.status === 'suppressed';
  if (banned) return { banned: true, availableCount: 0, total, availableSlugs: [] };
  const available = AFFILIATE_PARTNERS.filter(
    (partner) =>
      availabilityForPartner(partner, stateView.state).cta.eligible,
  );
  return {
    banned: false,
    availableCount: available.length,
    total,
    availableSlugs: available.map((p) => p.slug),
  };
}

/**
 * Map a tracker operator_slug to an internal Wiz review path when we cover that
 * brand editorially, else null. Used ONLY for editorial cross-links on the
 * clean hub (never affiliate CTAs). Falls back to slug normalization so e.g.
 * "chumba-casino" can still match a "chumba" review if one exists.
 */
export function wizReviewPathForOperator(operatorSlug: string): string | null {
  const candidates = new Set<string>([
    operatorSlug,
    operatorSlug.replace(/-casino$/, ''),
    operatorSlug.replace(/-/g, ''),
    operatorSlug.replace(/-us$/, '-us'),
  ]);
  for (const slug of candidates) {
    if (AFFILIATE_PARTNERS.some((p) => p.slug === slug) || getBrandEntity(slug)) {
      return `/reviews/${slug}/`;
    }
  }
  return null;
}
