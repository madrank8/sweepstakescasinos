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
import { getStaticReviewHtml } from '../src/lib/staticHtml.js';
import { prepareSsrAffiliateReviewHtml } from '../src/lib/affiliateHtml';

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
  '<main><div class="verdict-box"><span class="big">88</span>' +
  '<span class="denom">/100</span></div>' +
  '<!--sc-operator-facts data-operator="mcluck" ' +
  'data-fields="name,editorScore100"--></main>';
const unresolvedRendered = injectOperatorFactsHtml(unresolvedFixture, 'mcluck');
assert.doesNotMatch(unresolvedRendered, /data-canonical-field="editorScore100"/);
assert.doesNotMatch(unresolvedRendered, />\s*88\s*<\/span>\s*<span[^>]*>\s*\/100</);
assert.match(unresolvedRendered, /data-canonical-score-status="unresolved"/);

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

function obviousLegacyEditorScoreContexts(html: string): string[] {
  const visible = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');
  const contexts: string[] = [];
  const patterns: Array<[string, RegExp]> = [
    [
      'legacy score widget',
      /class=["'][^"']*\b(?:v-score|vb-num|sh-score|verdict-score|sb-num)\b[^"']*["'][^>]*>[\s\S]{0,160}?\d+(?:\.\d+)?\s*\/\s*100/gi,
    ],
    [
      'legacy stars widget',
      /class=["'][^"']*\b(?:v-stars|vb-stars|sh-stars|verdict-stars|sb-stars|oc-score)\b[^"']*["'][^>]*>[\s\S]{0,160}?\d(?:\.\d+)?\s*\/\s*5/gi,
    ],
    [
      'score-bars total',
      /class=["'][^"']*\bscore-bars\b[^"']*["'][\s\S]{0,300}?\d+\s*\/\s*100/gi,
    ],
    [
      'labeled editor score',
      /class=["'][^"']*\b(?:metric|stat|qp-item|qf-item)\b[^"']*["'][^>]*>[^\n]*(?:Editor Score|Overall(?: Score| Rating)?)[^\n]*\d+(?:\.\d+)?\s*\/?\s*(?:5|100)?/gi,
    ],
    [
      'sticky score label',
      /class=["'][^"']*\bsticky-(?:sub|st)\b[^"']*["'][^>]*>[^\n]*?(?:★|&#9733;)[^\n]*?\d(?:\.\d+)?\s*\/\s*5/gi,
    ],
  ];
  for (const [label, pattern] of patterns) {
    if (pattern.test(visible)) contexts.push(label);
  }
  return contexts;
}

const renderedReviews = new Map<string, string>();
let staticReviewCount = 0;
let ssrReviewCount = 0;
for (const operator of OPERATORS) {
  const relativePath = `reviews/${operator.slug}.html`;
  const source = readFileSync(resolve(root, relativePath), 'utf8');
  const rendered = /href=["']\/bonuses\//i.test(source)
    ? (ssrReviewCount++,
      prepareSsrAffiliateReviewHtml(source, null, operator.slug, `review-${operator.slug}`))
    : (staticReviewCount++, getStaticReviewHtml(relativePath, operator.slug));
  renderedReviews.set(operator.slug, rendered);
}
assert.ok(staticReviewCount > 0, 'real review integration must exercise getStaticReviewHtml');
assert.ok(ssrReviewCount > 0, 'real review integration must exercise prepareSsrAffiliateReviewHtml');

const unresolvedLeaks = OPERATORS.filter(
  (operator) => operator.editorScore100.status === 'unresolved',
).flatMap((operator) => {
  const contexts = obviousLegacyEditorScoreContexts(renderedReviews.get(operator.slug)!);
  return contexts.length === 0 ? [] : [`${operator.slug}: ${contexts.join(', ')}`];
});
assert.deepEqual(
  unresolvedLeaks,
  [],
  `fully rendered unresolved reviews leaked legacy editor scores:\n${unresolvedLeaks.join('\n')}`,
);

const staticAmericanLuck = getStaticReviewHtml(
  'reviews/american-luck.html',
  'american-luck',
);
assert.equal(
  getStaticReviewHtml('reviews/american-luck.html', 'american-luck'),
  staticAmericanLuck,
  'static review integration must be deterministic',
);
const mcluckSource = readFileSync(resolve(root, 'reviews/mcluck.html'), 'utf8');
const ssrMcluck = prepareSsrAffiliateReviewHtml(
  mcluckSource,
  null,
  'mcluck',
  'review-mcluck',
);
assert.equal(
  prepareSsrAffiliateReviewHtml(ssrMcluck, null, 'mcluck', 'review-mcluck'),
  ssrMcluck,
  'SSR review integration must be idempotent',
);

const staticPipelineSource = readFileSync(resolve(root, 'src/lib/staticHtml.js'), 'utf8');
assert.match(
  staticPipelineSource,
  /injectOperatorFactsHtml\(source, slug\)[\s\S]*decorateChrome\(canonicalFacts\)/,
  'static review facts must be injected before JSON-LD consolidation',
);
const ssrPipelineSource = readFileSync(resolve(root, 'src/lib/affiliateHtml.ts'), 'utf8');
assert.match(
  ssrPipelineSource,
  /prepareSsrAffiliateHtml\(injectOperatorFactsHtml\(rawHtml, slug\)/,
  'SSR review facts must be injected before JSON-LD consolidation',
);

const preservationFixture =
  '<main><div class="sticky-sub">★★★★★ 4.5/5 · 29,000+ reviews · ' +
  '4.6/5 Trustpilot</div><!--sc-operator-facts data-operator="mcluck" ' +
  'data-fields="name,editorScore100"--></main>';
const preservationRendered = injectOperatorFactsHtml(preservationFixture, 'mcluck');
assert.match(preservationRendered, /29,000\+ reviews/);
assert.match(preservationRendered, /4\.6\/5 Trustpilot/);

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
