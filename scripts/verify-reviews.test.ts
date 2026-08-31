import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { runReviewQa } from './verify-reviews';

const root = resolve(import.meta.dirname, '..');
const result = runReviewQa(root);

assert.equal(result.sourceCount, 29);
assert.equal(result.renderCount, 29);
assert.equal(result.uniqueTitleCount, 29);
assert.ok(result.staticRenderCount > 0, 'QA must exercise the static review pipeline');
assert.ok(result.ssrRenderCount > 0, 'QA must exercise the SSR review pipeline');
assert.equal(result.factSummaryCount, 29);
assert.ok(result.answerBlockCount > 29, 'verified facts must produce reusable answer blocks');
assert.equal(result.disclosureCount, 29);
assert.equal(result.contextualNavigationCount, 29);
assert.equal(result.faqSchemaMismatchCount, 0);
assert.deepEqual(result.errors, []);

console.log(
  `review QA tests: OK — ${result.renderCount} renders, ` +
    `${result.answerBlockCount} answers, ${result.faqPageCount} FAQ schemas`,
);
