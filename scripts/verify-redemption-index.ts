import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { READER_REPORT_AGGREGATES } from '../src/data/readerReports.generated';
import { OPERATORS } from '../src/data/operators';
import { validateAllResults } from '../src/data/testingResults';
import { brandAggregateRating } from '../src/lib/brandAggregateRating';
import { assessProductionRedemptionEvidence } from '../src/lib/redemptionEvidenceAdapter';

const { rows: testingRows, issues: testingIssues } = validateAllResults();
const readerAggregateOperators = Object.keys(READER_REPORT_AGGREGATES).sort();
const verificationAsOf =
  process.env.REDEMPTION_INDEX_AS_OF ?? new Date().toISOString().slice(0, 10);
const production = assessProductionRedemptionEvidence({
  testingRows,
  testingIssues,
  readerAggregates: READER_REPORT_AGGREGATES,
  asOf: verificationAsOf,
});
const publicResultsRoute = existsSync(
  resolve('src/routes/redemption-index/index.astro'),
);

if (production.assessment.status === 'not-publishable') {
  assert.equal(
    publicResultsRoute,
    false,
    'a public redemption-index route must not exist while production evidence is non-publishable',
  );
  assert.doesNotMatch(
    JSON.stringify(production.assessment),
    /medianHours|approvedSampleSize|rank":/i,
    'non-publishable production state must not expose result metrics',
  );
}

const aggregateRatings = OPERATORS.filter(
  (operator) => brandAggregateRating(operator.slug) !== undefined,
).length;

console.log(
  JSON.stringify(
    {
      asOf: verificationAsOf,
      testingRows: production.testingRowsLoaded,
      readerAggregateOperators: production.readerAggregateOperatorsLoaded,
      adaptedRecords: production.records.length,
      adapterDiagnostics: production.diagnostics,
      assessment: production.assessment,
      publicResultsRoute,
      aggregateRatings,
    },
    null,
    2,
  ),
);
