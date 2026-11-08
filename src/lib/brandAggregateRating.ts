import { getOperator, verifiedValue } from '../data/operators';
import {
  READER_REPORT_AGGREGATES,
  type ReaderReportAggregate,
} from '../data/readerReports.generated';

export const BRAND_AGGREGATE_RATING_MIN_REPORTS = 10;

type AggregateInput = Pick<ReaderReportAggregate, 'count' | 'avgRating'>;
type AggregateRatingNode = {
  '@type': 'AggregateRating';
  ratingValue: number;
  ratingCount: number;
  bestRating: 5;
  worstRating: 1;
};

export function meetsBrandAggregateRatingThreshold(
  aggregate: AggregateInput | undefined,
): aggregate is AggregateInput & { avgRating: number } {
  return (
    !!aggregate &&
    aggregate.count >= BRAND_AGGREGATE_RATING_MIN_REPORTS &&
    aggregate.avgRating != null
  );
}

export function buildBrandAggregateRating(
  aggregate: AggregateInput | undefined,
): AggregateRatingNode | undefined {
  if (!meetsBrandAggregateRatingThreshold(aggregate)) return undefined;
  return {
    '@type': 'AggregateRating',
    ratingValue: aggregate.avgRating,
    ratingCount: aggregate.count,
    bestRating: 5,
    worstRating: 1,
  };
}

/** Trustpilot aggregate from the operator canonical record, when count is known. */
export function trustpilotAggregateRating(slug: string): AggregateRatingNode | undefined {
  const operator = getOperator(slug);
  if (!operator) return undefined;
  const ratings = verifiedValue(operator.externalRatings);
  const trustpilot = ratings?.find(
    (rating) =>
      rating.sourceName === 'Trustpilot' &&
      rating.scale === 5 &&
      typeof rating.ratingCount === 'number' &&
      rating.ratingCount > 0,
  );
  if (!trustpilot?.ratingCount) return undefined;
  return {
    '@type': 'AggregateRating',
    ratingValue: trustpilot.value,
    ratingCount: trustpilot.ratingCount,
    bestRating: 5,
    worstRating: 1,
  };
}

export function brandAggregateRating(slug: string): AggregateRatingNode | undefined {
  return (
    trustpilotAggregateRating(slug) ??
    buildBrandAggregateRating(READER_REPORT_AGGREGATES[slug])
  );
}
