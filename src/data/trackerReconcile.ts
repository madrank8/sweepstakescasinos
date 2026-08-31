/**
 * Compatibility helpers for tracker editorial cross-links.
 */
import { AFFILIATE_PARTNERS } from './affiliates';
import { getBrandEntity } from './brandEntities';

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
