import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { READER_REPORT_AGGREGATES } from '../src/data/readerReports.generated';
import { OPERATORS } from '../src/data/operators';
import { loadTestingResultsCsv } from '../src/data/testingResults';
import { brandAggregateRating } from '../src/lib/brandAggregateRating';
import { assessRedemptionIndex } from '../src/lib/redemptionIndex';

const testingRows = loadTestingResultsCsv();
const readerAggregateOperators = Object.keys(READER_REPORT_AGGREGATES);
// This fallback keeps the empty-evidence verification reproducible. A future
// production publisher must supply its evaluation date explicitly.
const verificationAsOf =
  process.env.REDEMPTION_INDEX_AS_OF ?? '2026-08-31';
const assessment = assessRedemptionIndex([], { asOf: verificationAsOf });

assert.equal(testingRows.length, 0, 'production testing data is no longer empty');
assert.equal(
  readerAggregateOperators.length,
  0,
  'production reader aggregate data is no longer empty',
);
assert.deepEqual(assessment, {
  status: 'not-publishable',
  reason: 'no-approved-records',
  diagnostics: [],
});
assert.ok(
  OPERATORS.every((operator) => brandAggregateRating(operator.slug) === undefined),
  'empty reader data must not emit AggregateRating',
);
assert.equal(
  existsSync(resolve('src/routes/redemption-index/index.astro')),
  false,
  'a public redemption-index route must not exist while evidence is empty',
);

console.log(
  JSON.stringify(
    {
      testingRows: testingRows.length,
      readerAggregateOperators: readerAggregateOperators.length,
      assessment,
      publicResultsRoute: false,
      aggregateRatings: 0,
    },
    null,
    2,
  ),
);
