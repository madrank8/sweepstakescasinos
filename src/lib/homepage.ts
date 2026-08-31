import { getPartner } from '../data/affiliates';
import {
  type CanonicalFact,
  type OperatorRecord,
  type RedemptionMinimum,
  verifiedValue,
} from '../data/operators';
import type { UsStateCode } from '../data/usStates';
import { bestPartnerAvailabilityView } from './availabilityViews';

export const COMPARISON_SIZE = 12;
export const MINIMUM_DECISION_FACTS = 3;

const verified = <T>(fact: CanonicalFact<T>): boolean => fact.status === 'verified';

/**
 * The seven non-commercial facts used to select the comparison set. Cash and
 * gift-card minimums form one decision category so operators do not gain rank
 * merely by publishing two redemption rails.
 */
export function decisionFactCompleteness(operator: OperatorRecord): number {
  return [
    verified(operator.launchDate),
    verified(operator.signupOffer),
    verified(operator.dailyOffer),
    verified(operator.cashRedemptionMinimum) ||
      verified(operator.giftCardRedemptionMinimum),
    verified(operator.publishedRedemptionTiming),
    verified(operator.paymentMethods),
    verified(operator.gameCount),
  ].filter(Boolean).length;
}

export interface RankedRecommendation {
  slug: string;
  name: string;
  score: number;
  completeness: number;
  signupOffer: string | undefined;
  redemptionMinimum: string;
  publishedRedemptionTiming: string;
}

export function formatMinimum(operator: OperatorRecord): string {
  const gift = verifiedValue(operator.giftCardRedemptionMinimum);
  const cash = verifiedValue(operator.cashRedemptionMinimum);
  const parts = [
    ...(gift ? [`${gift.amount} ${gift.currency} gift cards`] : []),
    ...(cash ? [`${cash.amount} ${cash.currency} cash`] : []),
  ];
  return parts.join(' · ') || 'Not verified';
}

export function selectRankedRecommendations(
  operators: OperatorRecord[],
): RankedRecommendation[] {
  return operators
    .flatMap((operator): RankedRecommendation[] => {
      const name = verifiedValue(operator.name);
      const score = verifiedValue(operator.editorScore100);
      const completeness = decisionFactCompleteness(operator);
      if (!name || score == null || completeness < MINIMUM_DECISION_FACTS) return [];
      return [{
        slug: operator.slug,
        name,
        score,
        completeness,
        signupOffer: verifiedValue(operator.signupOffer),
        redemptionMinimum: formatMinimum(operator),
        publishedRedemptionTiming:
          verifiedValue(operator.publishedRedemptionTiming) ?? 'Not verified',
      }];
    })
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
}

export interface ComparisonOperator {
  slug: string;
  name: string;
  completeness: number;
  editorScore: string;
  welcomeOffer: string;
  redemptionMinimum: string;
  publishedRedemptionTiming: string;
  gameCount: string;
}

function factLabel<T>(
  fact: CanonicalFact<T>,
  formatter: (value: T) => string = String,
): string {
  if (fact.status === 'verified') return formatter(fact.value);
  return fact.status === 'unresolved' ? 'Unresolved' : 'Not verified';
}

export function selectComparisonOperators(
  operators: OperatorRecord[],
  limit = COMPARISON_SIZE,
): ComparisonOperator[] {
  return operators
    .flatMap((operator): ComparisonOperator[] => {
      const name = verifiedValue(operator.name);
      const completeness = decisionFactCompleteness(operator);
      if (!name || !verified(operator.operatorName) || completeness < MINIMUM_DECISION_FACTS) {
        return [];
      }
      return [{
        slug: operator.slug,
        name,
        completeness,
        editorScore: factLabel(operator.editorScore100, (score) => `${score}/100`),
        welcomeOffer: factLabel(operator.signupOffer),
        redemptionMinimum: formatMinimum(operator),
        publishedRedemptionTiming: factLabel(operator.publishedRedemptionTiming),
        gameCount: factLabel(operator.gameCount, (count) => count.toLocaleString('en-US')),
      }];
    })
    .sort((a, b) => b.completeness - a.completeness || a.slug.localeCompare(b.slug))
    .slice(0, Math.max(0, limit));
}

export interface SuperlativeCandidate<T> {
  slug: string;
  name: CanonicalFact<string>;
  value: CanonicalFact<T>;
  lastVerifiedDate: CanonicalFact<string>;
}

export interface SuperlativeOptions<T> {
  label: string;
  asOf: Date;
  maxAgeDays: number;
  metric: (value: T) => number;
}

export interface SuperlativeResult<T> {
  slug: string;
  name: string;
  label: string;
  value: T;
}

/**
 * Strict by design: a use-case claim is omitted when any candidate has an
 * unresolved/missing required fact, lacks a fresh verification date, or ties
 * for the best metric. This prevents a partial dataset from creating a false
 * superlative.
 */
export function selectUniqueSuperlative<T>(
  candidates: SuperlativeCandidate<T>[],
  options: SuperlativeOptions<T>,
): SuperlativeResult<T> | undefined {
  const asOf = options.asOf.getTime();
  const maxAgeMs = options.maxAgeDays * 86_400_000;
  if (!Number.isFinite(asOf) || maxAgeMs < 0 || candidates.length === 0) return undefined;

  const resolved = candidates.flatMap((candidate) => {
    const name = verifiedValue(candidate.name);
    const value = verifiedValue(candidate.value);
    const date = verifiedValue(candidate.lastVerifiedDate);
    if (!name || value == null || !date) return [];
    const verifiedAt = new Date(`${date}T00:00:00Z`).getTime();
    const age = asOf - verifiedAt;
    const metric = options.metric(value);
    if (!Number.isFinite(verifiedAt) || age < 0 || age > maxAgeMs || !Number.isFinite(metric)) {
      return [];
    }
    return [{ candidate, name, value, metric }];
  });

  if (resolved.length !== candidates.length) return undefined;
  resolved.sort((a, b) => a.metric - b.metric || a.candidate.slug.localeCompare(b.candidate.slug));
  if (resolved.length > 1 && resolved[0].metric === resolved[1].metric) return undefined;
  return {
    slug: resolved[0].candidate.slug,
    name: resolved[0].name,
    label: options.label,
    value: resolved[0].value,
  };
}

export interface RankedRecommendationView extends RankedRecommendation {
  hasPartner: boolean;
  canCta: boolean;
  availabilityLabel: string;
}

export function buildRankedRecommendationViews(
  operators: OperatorRecord[],
  state: UsStateCode | null | undefined,
): RankedRecommendationView[] {
  return selectRankedRecommendations(operators).map((operator) => {
    const partner = getPartner(operator.slug);
    if (!partner) {
      return {
        ...operator,
        hasPartner: false,
        canCta: false,
        availabilityLabel: 'Editorial review only',
      };
    }
    const availability = bestPartnerAvailabilityView(partner, state);
    return {
      ...operator,
      hasPartner: true,
      canCta: availability.canCta,
      availabilityLabel: availability.label,
    };
  });
}

export function cashMinimumCandidates(
  operators: OperatorRecord[],
): SuperlativeCandidate<RedemptionMinimum>[] {
  return operators.map((operator) => ({
    slug: operator.slug,
    name: operator.name,
    value: operator.cashRedemptionMinimum,
    lastVerifiedDate: operator.lastVerifiedDate,
  }));
}
