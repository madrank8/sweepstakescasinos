import type { ReaderReportAggregate } from '../data/readerReports.generated';
import {
  resolvedHoursToPayout,
  type TestingResultRow,
  type ValidationIssue,
} from '../data/testingResults';
import {
  assessRedemptionIndex,
  type RedemptionEvidenceRecord,
  type RedemptionIndexAssessment,
} from './redemptionIndex';

export type RedemptionEvidenceAdapterDiagnostic = {
  operatorSlug: string;
  source: 'first-party-testing' | 'reader-aggregate';
  reason: string;
};

export interface ProductionRedemptionEvidenceInput {
  testingRows: readonly TestingResultRow[];
  testingIssues: readonly ValidationIssue[];
  readerAggregates: Readonly<Record<string, ReaderReportAggregate>>;
}

export interface AdaptedProductionRedemptionEvidence {
  records: RedemptionEvidenceRecord[];
  diagnostics: RedemptionEvidenceAdapterDiagnostic[];
}

const MINIMUM =
  /^\s*(?:\$\s*)?(\d+(?:\.\d+)?)\s*(SC|MC|Diamond)\s*$/i;

function parseRedemptionMinimum(
  value: string,
): RedemptionEvidenceRecord['redemptionMinimum'] | undefined {
  const match = value.match(MINIMUM);
  if (!match) return undefined;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  const normalized = match[2].toLowerCase();
  const currency =
    normalized === 'sc' ? 'SC' : normalized === 'mc' ? 'MC' : 'Diamond';
  return { amount, currency };
}

export function adaptProductionRedemptionEvidence(
  input: ProductionRedemptionEvidenceInput,
): AdaptedProductionRedemptionEvidence {
  const records: RedemptionEvidenceRecord[] = [];
  const diagnostics: RedemptionEvidenceAdapterDiagnostic[] = [];
  const blockedTestingSlugs = new Set(
    input.testingIssues
      .filter((issue) => issue.level === 'error')
      .map((issue) => issue.slug),
  );

  for (const row of input.testingRows) {
    if (blockedTestingSlugs.has(row.brand_slug)) {
      diagnostics.push({
        operatorSlug: row.brand_slug,
        source: 'first-party-testing',
        reason: 'Testing row has validation errors and is not approved for adaptation.',
      });
      continue;
    }
    if (row.could_test !== 'Y') continue;
    const hoursToPayout = resolvedHoursToPayout(row);
    const redemptionMinimum = parseRedemptionMinimum(row.min_redemption);
    const redemptionMethod = row.redemption_method.trim();
    if (
      hoursToPayout === null ||
      !Number.isFinite(hoursToPayout) ||
      hoursToPayout < 0 ||
      !redemptionMinimum ||
      !redemptionMethod ||
      !row.date_tested
    ) {
      diagnostics.push({
        operatorSlug: row.brand_slug,
        source: 'first-party-testing',
        reason:
          'Testing row lacks an exact payout duration, redemption method, minimum, or verification date.',
      });
      continue;
    }
    records.push({
      operatorSlug: row.brand_slug,
      approvalStatus: 'approved',
      source: 'first-party-testing',
      hoursToPayout,
      redemptionMethod,
      redemptionMinimum,
      verifiedOn: row.date_tested,
    });
  }

  for (const [operatorSlug, aggregate] of Object.entries(
    input.readerAggregates,
  ).sort(([left], [right]) => left.localeCompare(right))) {
    if (aggregate.count <= 0) continue;
    diagnostics.push({
      operatorSlug,
      source: 'reader-aggregate',
      reason:
        'Reader aggregate cannot establish an exact redemption minimum or preserve individual approved records, so it is not expanded into pseudo-records.',
    });
  }

  return { records, diagnostics };
}

export function assessProductionRedemptionEvidence(
  input: ProductionRedemptionEvidenceInput & { asOf: string },
): AdaptedProductionRedemptionEvidence & {
  testingRowsLoaded: number;
  readerAggregateOperatorsLoaded: number;
  assessment: RedemptionIndexAssessment;
} {
  const adapted = adaptProductionRedemptionEvidence(input);
  return {
    ...adapted,
    testingRowsLoaded: input.testingRows.length,
    readerAggregateOperatorsLoaded: Object.keys(input.readerAggregates).length,
    assessment: assessRedemptionIndex(adapted.records, { asOf: input.asOf }),
  };
}
