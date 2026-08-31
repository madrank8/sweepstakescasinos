import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { BRAND_ENTITIES } from '../src/data/brandEntities';
import {
  CANONICAL_OPERATOR_FIELDS,
  OPERATORS,
  getOperator,
  verifiedValue,
  type OperatorRecord,
} from '../src/data/operators';
import { injectOperatorFactsHtml } from '../src/lib/operatorFactsHtml';
import { consolidateJsonLd } from '../src/lib/pageChrome';
import {
  validateOperatorConsistency,
  validateOperatorRecords,
} from './verify-operator-consistency';

const root = resolve(import.meta.dirname, '..');
const reviewSlugs = readdirSync(resolve(root, 'reviews'))
  .filter((file) => file.endsWith('.html'))
  .map((file) => file.replace(/\.html$/, ''))
  .sort();

assert.equal(OPERATORS.length, 29);
assert.deepEqual(
  OPERATORS.map((operator) => operator.slug).sort(),
  reviewSlugs,
  'canonical records must exactly cover the authored review inventory',
);
assert.deepEqual(
  Object.keys(BRAND_ENTITIES).sort(),
  reviewSlugs,
  'schema identities must exactly cover the authored review inventory',
);

for (const operator of OPERATORS) {
  assert.equal(
    new Set(CANONICAL_OPERATOR_FIELDS.map((field) => operator[field].status)).size > 0,
    true,
    `${operator.slug} must explicitly model every canonical field`,
  );
  for (const field of CANONICAL_OPERATOR_FIELDS) {
    assert.ok(operator[field], `${operator.slug}.${field} must be explicit`);
  }
  const source = readFileSync(resolve(root, `reviews/${operator.slug}.html`), 'utf8');
  assert.match(
    source,
    new RegExp(
      `<!--sc-operator-facts\\s+data-operator="${operator.slug}"\\s+data-fields="[^"]+"\\s*-->`,
    ),
    `${operator.slug} review must declare its canonical fact fields`,
  );
}

assert.equal(getOperator('american-luck')?.editorScore100.status, 'verified');
assert.equal(verifiedValue(getOperator('american-luck')!.editorScore100), 72);
assert.equal(getOperator('mcluck')?.editorScore100.status, 'unresolved');
assert.equal(verifiedValue(getOperator('mcluck')!.editorScore100), undefined);
assert.ok(
  OPERATORS.every((operator) => {
    const score = verifiedValue(operator.editorScore100);
    return score === undefined || (score >= 0 && score <= 100 && score > 5);
  }),
  'five-star values must never be mislabeled as editorScore100',
);

const fixture =
  '<main><!--sc-operator-facts data-operator="american-luck" ' +
  'data-fields="name,operatorName,editorScore100,lastVerifiedDate"--></main>';
const injected = injectOperatorFactsHtml(fixture, 'american-luck');
assert.match(injected, /data-canonical-operator="american-luck"/);
assert.match(injected, /data-canonical-field="editorScore100"[^>]*>72\/100</);
assert.match(injected, /data-canonical-field="operatorName"[^>]*>SGSE LLC</);
assert.equal(injectOperatorFactsHtml(injected, 'american-luck'), injected, 'injection is idempotent');

const unresolvedFixture =
  '<main><!--sc-operator-facts data-operator="mcluck" ' +
  'data-fields="name,editorScore100"--></main>';
const unresolvedRendered = injectOperatorFactsHtml(unresolvedFixture, 'mcluck');
assert.doesNotMatch(unresolvedRendered, /data-canonical-field="editorScore100"/);
assert.doesNotMatch(unresolvedRendered, />\d+(?:\.\d+)?\/100</);

function reviewNode(html: string): Record<string, unknown> {
  const block = html.match(
    /<!--sc-jsonld-graph-->\s*<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  assert.ok(block, 'rendered review must contain the consolidated graph');
  const graph = JSON.parse(block[1])['@graph'] as Array<Record<string, unknown>>;
  const review = graph.find((node) => node['@type'] === 'Review');
  assert.ok(review, 'rendered review graph must retain Review');
  return review;
}

for (const [slug, expectedScore] of [
  ['american-luck', 72],
  ['mcluck', undefined],
] as const) {
  const source = readFileSync(resolve(root, `reviews/${slug}.html`), 'utf8');
  const rendered = consolidateJsonLd(injectOperatorFactsHtml(source, slug));
  const review = reviewNode(rendered);
  if (expectedScore === undefined) {
    assert.equal(review.reviewRating, undefined, `${slug} unresolved score must be omitted from schema`);
  } else {
    assert.deepEqual(review.reviewRating, {
      '@type': 'Rating',
      ratingValue: expectedScore,
      bestRating: 100,
      worstRating: 0,
    });
  }
}

const malformed = structuredClone(OPERATORS) as OperatorRecord[];
malformed[0].editorScore100 = {
  status: 'verified',
  value: 101,
  provenance: [{ source: 'reviews/acebet.html', verifiedOn: '2026-99-99' }],
};
malformed[0].externalRatings = {
  status: 'verified',
  value: [{ sourceName: 'Example', value: 6, scale: 5, sourceUrl: 'not-a-url', asOf: 'bad' }],
  provenance: [{ source: '' }],
};
const malformedErrors = validateOperatorRecords(malformed, BRAND_ENTITIES);
assert.ok(malformedErrors.some((error) => error.includes('editorScore100')));
assert.ok(malformedErrors.some((error) => error.includes('date')));
assert.ok(malformedErrors.some((error) => error.includes('externalRatings')));
assert.ok(malformedErrors.some((error) => error.includes('provenance')));

assert.deepEqual(validateOperatorConsistency(root), []);

const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
assert.match(packageJson.scripts.prebuild, /\boperator:verify\b/);
assert.match(packageJson.scripts.ci, /\boperator:test\b/);
assert.match(packageJson.scripts.ci, /\boperator:verify\b/);

const noDepositRoute = readFileSync(
  resolve(root, 'src/routes/bonuses/no-deposit/index.astro'),
  'utf8',
);
assert.match(noDepositRoute, /from '\.\.\/\.\.\/\.\.\/data\/operators'/);
assert.doesNotMatch(noDepositRoute, /\bsignup:\s*['"]/);
const newRoute = readFileSync(resolve(root, 'src/routes/new/index.astro'), 'utf8');
assert.match(newRoute, /from '\.\.\/\.\.\/data\/operators'/);
assert.match(newRoute, /canonicalOperatorName/);
const bestRoute = readFileSync(resolve(root, 'src/routes/best/\[slug\]\.astro'), 'utf8');
assert.match(bestRoute, /from '\.\.\/\.\.\/data\/operators'/);

console.log('verify-operator-consistency tests: OK — 29 records, markers, validation, rendering');
