import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { READER_REPORT_AGGREGATES } from '../src/data/readerReports.generated';
import {
  loadTestingResultsCsv,
  type TestingResultRow,
} from '../src/data/testingResults';
import {
  REDEMPTION_INDEX_MIN_OPERATORS,
  REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR,
  assessRedemptionIndex,
  type RedemptionEvidenceRecord,
} from '../src/lib/redemptionIndex';
import {
  adaptProductionRedemptionEvidence,
  assessProductionRedemptionEvidence,
} from '../src/lib/redemptionEvidenceAdapter';

const AS_OF = '2026-08-31';
const root = resolve(import.meta.dirname, '..');

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

const testingFixture: TestingResultRow = {
  brand_slug: 'mcluck',
  date_tested: '2026-08-01',
  tester_state: 'TX',
  could_test: 'Y',
  welcome_credited: '',
  promo_code_needed: '',
  redemption_method: 'ACH',
  min_redemption: '50 SC',
  request_timestamp: '2026-08-01T00:00:00Z',
  payout_timestamp: '2026-08-01T18:00:00Z',
  hours_to_payout: '18',
  kyc_docs: '',
  kyc_hours: '',
  support_channel: '',
  support_first_response: '',
  support_resolved: '',
  games_ok: '',
  state_availability_ok: '',
  evidence_files: 'mcluck-redemption-20260801.png',
  notes: '',
};
const adaptedFixture = adaptProductionRedemptionEvidence({
  testingRows: [testingFixture],
  testingIssues: [],
  readerAggregates: {
    pulsz: {
      count: 5,
      medianHours: 20,
      avgRating: 4,
      methods: { Skrill: 5 },
      lastReport: '2026-08-01',
    },
  },
});
assert.deepEqual(adaptedFixture.records, [
  record('mcluck', 18, {
    source: 'first-party-testing',
    redemptionMethod: 'ACH',
    redemptionMinimum: { amount: 50, currency: 'SC' },
    verifiedOn: '2026-08-01',
  }),
]);
assert.ok(
  adaptedFixture.diagnostics.some(
    (diagnostic) =>
      diagnostic.operatorSlug === 'pulsz' &&
      /aggregate cannot establish an exact redemption minimum/i.test(diagnostic.reason),
  ),
  'reader aggregates must be loaded but never expanded into pseudo-records',
);

const production = assessProductionRedemptionEvidence({
  testingRows: loadTestingResultsCsv(),
  testingIssues: [],
  readerAggregates: READER_REPORT_AGGREGATES,
  asOf: AS_OF,
});
assert.equal(production.testingRowsLoaded, loadTestingResultsCsv().length);
assert.equal(
  production.readerAggregateOperatorsLoaded,
  Object.keys(READER_REPORT_AGGREGATES).length,
);
if (production.assessment.status === 'not-publishable') {
  assert.equal(
    existsSync(resolve(root, 'src/routes/redemption-index/index.astro')),
    false,
    'non-publishable production evidence must not expose a public result route',
  );
}

const packageJson = JSON.parse(
  readFileSync(resolve(root, 'package.json'), 'utf8'),
) as { scripts: Record<string, string> };
assert.match(packageJson.scripts['verify:redemption-index'], /verify-redemption-index/);
assert.match(packageJson.scripts['verify:reviews'], /verify-reviews/);
assert.match(packageJson.scripts.ci, /\bverify:reviews\b/);
assert.match(packageJson.scripts.ci, /\bverify:redemption-index\b/);

const methodology = readFileSync(
  resolve(root, 'docs/seo/redemption-index-methodology.md'),
  'utf8',
);
assert.match(methodology, /approved records only/i);
assert.match(
  methodology,
  new RegExp(`${REDEMPTION_INDEX_MIN_SAMPLE_PER_OPERATOR} approved records`),
);
assert.match(
  methodology,
  new RegExp(`${REDEMPTION_INDEX_MIN_OPERATORS} publishable operators`),
);
assert.match(methodology, /no[- ]seeding/i);
assert.match(methodology, /median/i);
assert.match(methodology, /limitations/i);
assert.match(
  methodology,
  /deterministic audit snapshot input, not a future publication default/i,
);

const productionVerifier = readFileSync(
  resolve(root, 'scripts/verify-redemption-index.ts'),
  'utf8',
);
assert.match(
  productionVerifier,
  /assessProductionRedemptionEvidence/,
  'the production verifier must evaluate adapted production inputs',
);
assert.doesNotMatch(
  productionVerifier,
  /assert\.equal\(testingRows\.length,\s*0|assert\.equal\([^)]*readerAggregateOperators\.length,\s*0|assessRedemptionIndex\(\[\]/s,
  'production-facing evaluation must not require evidence inputs to stay empty',
);

console.log(
  'redemption-index tests: OK — malformed, insufficient, mixed-approved, publishable, empty production',
);
