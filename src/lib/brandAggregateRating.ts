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

export function buildBrandAggregateRating(
  aggregate: AggregateInput | undefined,
): AggregateRatingNode | undefined {
  if (
    !aggregate ||
    aggregate.count < BRAND_AGGREGATE_RATING_MIN_REPORTS ||
    aggregate.avgRating == null
  ) {
    return undefined;
  }
  return {
    '@type': 'AggregateRating',
    ratingValue: aggregate.avgRating,
    ratingCount: aggregate.count,
    bestRating: 5,
    worstRating: 1,
  };
}

export function brandAggregateRating(slug: string): AggregateRatingNode | undefined {
  return buildBrandAggregateRating(READER_REPORT_AGGREGATES[slug]);
}
