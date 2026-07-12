/**
 * Correlation layer between the Sweepstakes Legality Tracker dataset and the
 * Wiz's own affiliate + geo model. This is what makes the tracker "native":
 * the same state maps to both the tracker's legal-status taxonomy and the Wiz's
 * operator availability.
 *
 * Authority split (do not blur these):
 *   - Affiliate CTA suppression  -> src/data/geo.ts is authoritative (legal).
 *   - Displayed legal status/bills/freshness -> the tracker dataset is authoritative.
 */
import { AFFILIATE_PARTNERS } from './affiliates';
import { getBrandEntity } from './brandEntities';
import {
  isPartnerAvailableInState,
  isStateBannedSitewide,
} from './geo';
import { isUsStateCode, type UsStateCode } from './usStates';
import type { SweepsCasinoStatus } from '../lib/tracker/types';

/** Wiz editorial legal posture used on state pages (matches content.config states). */
export type WizLegalStatus = 'available' | 'info-only' | 'restricted';

/**
 * Map the tracker's operator-legal-status taxonomy to the Wiz's editorial
 * posture. Note this is the OPERATOR legal reality, not the affiliate posture;
 * the affiliate posture is decided by isStateBannedSitewide() + partner data.
 */
export function trackerStatusToWizLegal(status: SweepsCasinoStatus): WizLegalStatus {
  switch (status) {
    case 'legal_unregulated':
    case 'gray':
      return 'available';
    case 'restricted':
      return 'restricted';
    case 'banned':
    case 'pending_ban':
      return 'info-only';
    default:
      return 'info-only';
  }
}

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
  if (!isUsStateCode(code)) {
    return { banned: false, availableCount: 0, total, availableSlugs: [] };
  }
  const state = code as UsStateCode;
  const banned = isStateBannedSitewide(state);
  if (banned) return { banned: true, availableCount: 0, total, availableSlugs: [] };
  const available = AFFILIATE_PARTNERS.filter((p) => isPartnerAvailableInState(p, state));
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
