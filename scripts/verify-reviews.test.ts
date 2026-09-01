import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { runReviewQa } from './verify-reviews';

const root = resolve(import.meta.dirname, '..');
const result = runReviewQa(root);
const generatedReviewDir = resolve(root, 'src/pages/reviews');
const generatedReviewWrappers = readdirSync(generatedReviewDir)
  .filter((file) => file.endsWith('.astro') && file !== 'index.astro')
  .sort();

assert.equal(result.sourceCount, 29);
assert.equal(result.renderCount, 29);
assert.equal(result.uniqueTitleCount, 29);
assert.equal(result.staticRenderCount, 0, 'no review may freeze geo facts at build time');
assert.equal(result.ssrRenderCount, 29, 'QA must exercise every request-rendered review');
assert.equal(generatedReviewWrappers.length, 29);
for (const wrapper of generatedReviewWrappers) {
  const source = readFileSync(resolve(generatedReviewDir, wrapper), 'utf8');
  assert.match(
    source,
    /export const prerender = false/,
    `${wrapper} must render state-dependent review facts per request`,
  );
  assert.match(
    source,
    /prepareSsrAffiliateReviewHtml/,
    `${wrapper} must use the geo-aware review pipeline`,
  );
}
assert.equal(result.factSummaryCount, 29);
assert.ok(result.answerBlockCount <= 58, 'reviews may inject at most two answer blocks each');
assert.equal(
  result.maxAnswerBlocksPerReview,
  2,
  'the QA contract must enforce the two-block maximum',
);
assert.equal(
  result.factSummaryAfterVerdictCount,
  29,
  'every fact summary must follow the authored editorial verdict',
);
assert.equal(
  result.visibleInternalStatusLeakCount,
  0,
  'reader-facing review summaries must not expose governance status labels',
);
assert.equal(
  result.outboundEligibilityAssertionCount,
  87,
  'all 29 reviews must tie CTA eligibility to markup in TX, CA, and unknown modes',
);
assert.equal(result.disclosureCount, 29);
assert.equal(result.contextualNavigationCount, 29);
assert.equal(result.faqSchemaMismatchCount, 0);
assert.deepEqual(result.errors, []);

console.log(
  `review QA tests: OK — ${result.renderCount} renders, ` +
    `${result.answerBlockCount} answers, ${result.faqPageCount} FAQ schemas`,
);
