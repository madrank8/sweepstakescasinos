export const REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR = 5;
export const REDEMPTION_INDEX_MIN_OPERATORS = 3;
export const REDEMPTION_INDEX_MAX_RECORD_AGE_DAYS = 180;

const DAY_MS = 86_400_000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENCIES = new Set(['SC', 'MC', 'Diamond']);

export type RedemptionEvidenceRecord = {
  operatorSlug: string;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  source: 'first-party-testing' | 'reader-report';
  hoursToPayout: number;
  redemptionMethod: string;
  redemptionMinimum: {
    amount: number;
    currency: 'SC' | 'MC' | 'Diamond';
  };
  verifiedOn: string;
};

export type RedemptionIndexDiagnostic =
  | {
      operatorSlug: string;
      status: 'malformed';
      issues: string[];
    }
  | {
      operatorSlug: string;
      status: 'insufficient-sample';
      validApprovedRecords: number;
      required: number;
    }
  | {
      operatorSlug: string;
      status: 'publishable';
      validApprovedRecords: number;
    };

export type RedemptionIndexOperator = {
  rank: number;
  operatorSlug: string;
  medianHours: number;
  approvedSampleSize: number;
  redemptionMethod: string;
  redemptionMinimum: RedemptionEvidenceRecord['redemptionMinimum'];
  freshestVerifiedOn: string;
};

export type RedemptionIndexAssessment =
  | {
      status: 'not-publishable';
      reason:
        | 'no-approved-records'
        | 'no-valid-approved-records'
        | 'insufficient-publishable-operators';
      diagnostics: RedemptionIndexDiagnostic[];
    }
  | {
      status: 'publishable';
      asOf: string;
      methodologyVersion: 1;
      operators: RedemptionIndexOperator[];
      diagnostics: RedemptionIndexDiagnostic[];
    };

function isoDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : null;
}

function recordIssues(
  record: RedemptionEvidenceRecord,
  asOfTimestamp: number,
): string[] {
  const issues: string[] = [];
  if (!SLUG.test(record.operatorSlug)) issues.push('invalid operator slug');
  if (!['first-party-testing', 'reader-report'].includes(record.source)) {
    issues.push('invalid evidence source');
  }
  if (!Number.isFinite(record.hoursToPayout) || record.hoursToPayout < 0) {
    issues.push('invalid payout duration');
  }
  if (!record.redemptionMethod.trim()) issues.push('missing redemption method');
  if (
    !Number.isFinite(record.redemptionMinimum.amount) ||
    record.redemptionMinimum.amount <= 0 ||
    !CURRENCIES.has(record.redemptionMinimum.currency)
  ) {
    issues.push('invalid redemption minimum');
  }
  const verifiedTimestamp = isoDay(record.verifiedOn);
  if (verifiedTimestamp === null) {
    issues.push('invalid freshness date');
  } else {
    const ageDays = (asOfTimestamp - verifiedTimestamp) / DAY_MS;
    if (ageDays < 0) issues.push('future freshness date');
    if (ageDays > REDEMPTION_INDEX_MAX_RECORD_AGE_DAYS) {
      issues.push('stale evidence');
    }
  }
  return issues;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 1
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  return Math.round(value * 100) / 100;
}

function cohortKey(record: RedemptionEvidenceRecord): string {
  return [
    record.redemptionMethod.trim().toLowerCase(),
    record.redemptionMinimum.amount,
    record.redemptionMinimum.currency,
  ].join('\u0000');
}

export function assessRedemptionIndex(
  records: readonly RedemptionEvidenceRecord[],
  options: { asOf: string },
): RedemptionIndexAssessment {
  const asOfTimestamp = isoDay(options.asOf);
  if (asOfTimestamp === null) {
    throw new Error(`Invalid redemption-index asOf date: ${options.asOf}`);
  }
  const approved = records.filter(
    (record) => record.approvalStatus === 'approved',
  );
  if (approved.length === 0) {
    return {
      status: 'not-publishable',
      reason: 'no-approved-records',
      diagnostics: [],
    };
  }

  const diagnostics: RedemptionIndexDiagnostic[] = [];
  const valid: RedemptionEvidenceRecord[] = [];
  for (const record of approved) {
    const issues = recordIssues(record, asOfTimestamp);
    if (issues.length > 0) {
      diagnostics.push({
        operatorSlug: record.operatorSlug,
        status: 'malformed',
        issues,
      });
    } else {
      valid.push(record);
    }
  }
  if (valid.length === 0) {
    return {
      status: 'not-publishable',
      reason: 'no-valid-approved-records',
      diagnostics,
    };
  }

  const byOperator = new Map<string, RedemptionEvidenceRecord[]>();
  for (const record of valid) {
    const operatorRecords = byOperator.get(record.operatorSlug) ?? [];
    operatorRecords.push(record);
    byOperator.set(record.operatorSlug, operatorRecords);
  }

  const candidates: Omit<RedemptionIndexOperator, 'rank'>[] = [];
  for (const operatorSlug of [...byOperator.keys()].sort()) {
    const cohorts = new Map<string, RedemptionEvidenceRecord[]>();
    for (const record of byOperator.get(operatorSlug) ?? []) {
      const key = cohortKey(record);
      const cohort = cohorts.get(key) ?? [];
      cohort.push(record);
      cohorts.set(key, cohort);
    }
    const selected = [...cohorts.entries()]
      .sort(
        ([leftKey, left], [rightKey, right]) =>
          right.length - left.length || leftKey.localeCompare(rightKey),
      )[0]?.[1] ?? [];
    if (selected.length < REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR) {
      diagnostics.push({
        operatorSlug,
        status: 'insufficient-sample',
        validApprovedRecords: selected.length,
        required: REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR,
      });
      continue;
    }
    diagnostics.push({
      operatorSlug,
      status: 'publishable',
      validApprovedRecords: selected.length,
    });
    const first = selected[0];
    candidates.push({
      operatorSlug,
      medianHours: median(selected.map((record) => record.hoursToPayout)),
      approvedSampleSize: selected.length,
      redemptionMethod: first.redemptionMethod.trim(),
      redemptionMinimum: first.redemptionMinimum,
      freshestVerifiedOn: selected
        .map((record) => record.verifiedOn)
        .sort()
        .at(-1)!,
    });
  }

  if (candidates.length < REDEMPTION_INDEX_MIN_OPERATORS) {
    return {
      status: 'not-publishable',
      reason: 'insufficient-publishable-operators',
      diagnostics,
    };
  }
  const operators = candidates
    .sort(
      (left, right) =>
        left.medianHours - right.medianHours ||
        left.operatorSlug.localeCompare(right.operatorSlug),
    )
    .map((operator, index) => ({ rank: index + 1, ...operator }));
  return {
    status: 'publishable',
    asOf: options.asOf,
    methodologyVersion: 1,
    operators,
    diagnostics,
  };
}
