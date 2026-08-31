import assert from 'node:assert/strict';
import { READER_REPORT_AGGREGATES } from '../src/data/readerReports.generated';
import { loadTestingResultsCsv } from '../src/data/testingResults';
import {
  REDEMPTION_INDEX_MIN_OPERATORS,
  REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR,
  assessRedemptionIndex,
  type RedemptionEvidenceRecord,
} from '../src/lib/redemptionIndex';

const AS_OF = '2026-08-31';

function record(
  operatorSlug: string,
  hoursToPayout: number,
  overrides: Partial<RedemptionEvidenceRecord> = {},
): RedemptionEvidenceRecord {
  return {
    operatorSlug,
    approvalStatus: 'approved',
    source: 'reader-report',
    hoursToPayout,
    redemptionMethod: 'ACH',
    redemptionMinimum: { amount: 50, currency: 'SC' },
    verifiedOn: '2026-08-01',
    ...overrides,
  };
}

const empty = assessRedemptionIndex([], { asOf: AS_OF });
assert.deepEqual(empty, {
  status: 'not-publishable',
  reason: 'no-approved-records',
  diagnostics: [],
});
assert.doesNotMatch(
  JSON.stringify(empty),
  /median|sampleSize|ranking|observation/i,
  'empty evidence must not expose result metrics',
);

const malformed = assessRedemptionIndex(
  [
    record('mcluck', -1, {
      redemptionMethod: '',
      redemptionMinimum: { amount: 0, currency: 'SC' },
      verifiedOn: 'not-a-date',
    }),
  ],
  { asOf: AS_OF },
);
assert.equal(malformed.status, 'not-publishable');
assert.equal(malformed.reason, 'no-valid-approved-records');
assert.ok(
  malformed.diagnostics.some((diagnostic) => diagnostic.status === 'malformed'),
  'malformed approved records must be rejected explicitly',
);

const insufficient = assessRedemptionIndex(
  Array.from(
    { length: REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR - 1 },
    (_, index) => record('mcluck', index + 1),
  ),
  { asOf: AS_OF },
);
assert.equal(insufficient.status, 'not-publishable');
assert.equal(insufficient.reason, 'insufficient-publishable-operators');
assert.ok(
  insufficient.diagnostics.some(
    (diagnostic) =>
      diagnostic.operatorSlug === 'mcluck' &&
      diagnostic.status === 'insufficient-sample',
  ),
);

const mixedApproved = assessRedemptionIndex(
  [
    ...Array.from(
      { length: REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR },
      (_, index) => record('mcluck', 10 + index),
    ),
    ...Array.from(
      { length: REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR },
      (_, index) => record('pulsz', 20 + index),
    ),
    ...Array.from(
      { length: REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR - 1 },
      (_, index) => record('zula', 30 + index),
    ),
    record('zula', 1, { approvalStatus: 'pending' }),
    record('zula', 1, { approvalStatus: 'rejected' }),
  ],
  { asOf: AS_OF },
);
assert.equal(mixedApproved.status, 'not-publishable');
assert.equal(mixedApproved.reason, 'insufficient-publishable-operators');
assert.ok(
  mixedApproved.diagnostics.some(
    (diagnostic) =>
      diagnostic.operatorSlug === 'zula' &&
      diagnostic.status === 'insufficient-sample',
  ),
  'pending and rejected records must not satisfy the sample threshold',
);

const publishable = assessRedemptionIndex(
  ['mcluck', 'pulsz', 'zula'].flatMap((slug, operatorIndex) =>
    Array.from(
      { length: REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR },
      (_, sampleIndex) =>
        record(slug, (operatorIndex + 1) * 10 + sampleIndex, {
          redemptionMethod: operatorIndex === 1 ? 'Skrill' : 'ACH',
          redemptionMinimum: {
            amount: operatorIndex === 2 ? 100 : 50,
            currency: 'SC',
          },
        }),
    ),
  ),
  { asOf: AS_OF },
);
assert.equal(REDEMPTION_INDEX_MIN_OPERATORS, 3);
assert.equal(publishable.status, 'publishable');
if (publishable.status === 'publishable') {
  assert.equal(publishable.operators.length, REDEMPTION_INDEX_MIN_OPERATORS);
  assert.deepEqual(
    publishable.operators.map((operator) => operator.operatorSlug),
    ['mcluck', 'pulsz', 'zula'],
  );
  assert.deepEqual(publishable.operators[0], {
    rank: 1,
    operatorSlug: 'mcluck',
    medianHours: 12,
    approvedSampleSize: REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR,
    redemptionMethod: 'ACH',
    redemptionMinimum: { amount: 50, currency: 'SC' },
    freshestVerifiedOn: '2026-08-01',
  });
}

assert.equal(loadTestingResultsCsv().length, 0, 'production testing CSV must remain empty');
assert.equal(
  Object.keys(READER_REPORT_AGGREGATES).length,
  0,
  'production reader aggregate dataset must remain empty',
);

console.log(
  'redemption-index tests: OK — malformed, insufficient, mixed-approved, publishable, empty production',
);
