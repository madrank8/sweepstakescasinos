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
import { fallbackStates } from '../src/lib/tracker/fallback';
import {
  findRenderedEditorScoreContexts,
  validateRenderedEditorScoreContexts,
} from './lib/rendered-editor-score-detector';

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
  const authoredGraph = JSON.parse(
    [...source.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )][0][1],
  )['@graph'] as Array<Record<string, unknown>>;
  const authoredReview = authoredGraph.find((node) => node['@type'] === 'Review');
  assert.ok(authoredReview, `${operator.slug} must retain authored Review JSON-LD`);
  const publishedOn = String(authoredReview.datePublished).slice(0, 10);
  const modifiedOn = String(authoredReview.dateModified).slice(0, 10);
  assert.deepEqual(
    operator.name.status === 'verified' ? operator.name.provenance[0] : undefined,
    {
      source: `reviews/${operator.slug}.html`,
      publishedOn,
      modifiedOn,
    },
    `${operator.slug} review provenance must use its authored publication/modification dates`,
  );
  if (operator.editorScore100.status === 'unresolved') {
    const rating = authoredReview.reviewRating as Record<string, unknown>;
    assert.ok(rating, `${operator.slug} unresolved evidence must include legacy Review rating`);
    assert.ok(
      operator.editorScore100.sources.some(
        (source) =>
          source.value === `${rating.ratingValue}/${rating.bestRating}` &&
          source.provenance.source ===
            `reviews/${operator.slug}.html#review-jsonld` &&
          source.provenance.publishedOn === publishedOn &&
          source.provenance.modifiedOn === modifiedOn,
      ),
      `${operator.slug} unresolved score must retain legacy Review JSON-LD as a third source`,
    );
  }
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
assert.match(unresolvedRendered, /data-editor-score-status="unresolved"/);

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

  const summaryStart = rendered.indexOf(
    `<section class="sc-review-fact-summary" data-canonical-operator="${operator.slug}">`,
  );
  const h1End = rendered.search(/<\/h1\s*>/i);
  const firstH2 = rendered.search(/<h2\b/i);
  assert.ok(summaryStart > h1End, `${operator.slug} fact summary must follow its H1`);
  assert.ok(
    firstH2 === -1 || summaryStart < firstH2,
    `${operator.slug} fact summary must precede the first H2`,
  );
  assert.equal(
    rendered.match(/class="sc-review-fact-summary"/g)?.length,
    1,
    `${operator.slug} must render one canonical fact summary`,
  );
  for (const field of CANONICAL_OPERATOR_FIELDS) {
    assert.match(
      rendered,
      new RegExp(
        `data-canonical-field="${field}"\\s+data-fact-status="${operator[field].status}"`,
      ),
      `${operator.slug}.${field} must render its canonical status`,
    );
  }
  for (const field of [
    'legal-status-source',
    'visitor-offer-eligibility',
    'operator-verification-date',
  ]) {
    assert.match(
      rendered,
      new RegExp(`data-review-fact="${field}"`),
      `${operator.slug} summary must render ${field}`,
    );
  }

  const expectedAnswerKinds = [
    operator.cashRedemptionMinimum.status === 'verified' ||
    operator.giftCardRedemptionMinimum.status === 'verified' ||
    operator.publishedRedemptionTiming.status === 'verified'
      ? 'redemption'
      : null,
    operator.paymentMethods.status === 'verified' ? 'payments' : null,
    operator.gameCount.status === 'verified' ? 'games' : null,
    operator.operatorName.status === 'verified' &&
    operator.launchDate.status === 'verified'
      ? 'company-launch'
      : null,
    operator.signupOffer.status === 'verified' ||
    operator.dailyOffer.status === 'verified'
      ? 'offer'
      : null,
  ].filter((kind): kind is string => kind !== null);
  const answerBlocks = [
    ...rendered.matchAll(
      /<section class="sc-review-answer" data-answer-kind="([^"]+)">([\s\S]*?)<\/section>/g,
    ),
  ];
  assert.deepEqual(
    answerBlocks.map((match) => match[1]),
    expectedAnswerKinds,
    `${operator.slug} answer blocks must follow canonical evidence gates`,
  );
  const name = verifiedValue(operator.name)!;
  for (const [, kind, block] of answerBlocks) {
    assert.match(block, /<h2[^>]*>[^<]*\?<\/h2>/, `${operator.slug}/${kind} needs a question H2`);
    assert.ok(
      block.indexOf(name) >= 0 && block.indexOf(name) < block.indexOf('</p>'),
      `${operator.slug}/${kind} must name the operator in its first sentence`,
    );
    assert.doesNotMatch(
      block,
      /\b(?:we|our)\s+(?:observed|tested|measured)\b/i,
      `${operator.slug}/${kind} must not imply first-hand testing`,
    );
  }
}
assert.ok(staticReviewCount > 0, 'real review integration must exercise getStaticReviewHtml');
assert.ok(ssrReviewCount > 0, 'real review integration must exercise prepareSsrAffiliateReviewHtml');
assert.equal(renderedReviews.size, 29, 'integration must render all 29 authored reviews');
assert.equal(
  OPERATORS.filter((operator) => operator.editorScore100.status === 'unresolved').length,
  25,
  'integration must enforce score suppression on all 25 unresolved reviews',
);

const unresolvedLeaks = OPERATORS.filter(
  (operator) => operator.editorScore100.status === 'unresolved',
).flatMap((operator) => {
  const errors = validateRenderedEditorScoreContexts(
    undefined,
    renderedReviews.get(operator.slug)!,
  );
  return errors.length === 0 ? [] : [`${operator.slug}: ${errors.join(', ')}`];
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
assert.match(ssrMcluck, /Location unknown/);
assert.equal(
  prepareSsrAffiliateReviewHtml(ssrMcluck, null, 'mcluck', 'review-mcluck'),
  ssrMcluck,
  'SSR review integration must be idempotent',
);
const txTrackerState = fallbackStates.find((state) => state.state_code === 'TX')!;
const stateSpecificMcluck = prepareSsrAffiliateReviewHtml(
  mcluckSource,
  'TX',
  'mcluck',
  'review-mcluck',
  txTrackerState,
);
assert.match(stateSpecificMcluck, /Tracker legal status/);
assert.match(stateSpecificMcluck, /Affiliate offer availability: available/);
assert.match(stateSpecificMcluck, /2026-07-12/);

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
const generatorSource = readFileSync(resolve(root, 'scripts/generate-astro-pages.mjs'), 'utf8');
assert.match(generatorSource, /getTrackerData/);
assert.match(
  generatorSource,
  /prepareSsrAffiliateReviewHtml\([^)]*trackerState/s,
  'generated SSR review wrappers must pass live tracker freshness to the summary',
);

const preservationFixture =
  '<main><div class="sticky-sub">★★★★★ 4.5/5 · 29,000+ reviews · ' +
  '4.6/5 Trustpilot</div><!--sc-operator-facts data-operator="mcluck" ' +
  'data-fields="name,editorScore100"--></main>';
const preservationRendered = injectOperatorFactsHtml(preservationFixture, 'mcluck');
assert.match(preservationRendered, /29,000\+ reviews/);
assert.match(preservationRendered, /4\.6\/5 Trustpilot/);

const semanticLeakFixture = `
  <main>
    <p>We rate Example Casino 4.6/5 and 91/100.</p>
    <p>Example Casino earns its 88/100 through fast payouts.</p>
    <p>Example Casino is rated 4.3/5.</p>
    <div class="oc-rating">4.1 / 5 Editor Score</div>
    <div class="offer-rating">4.7 / 5 — Editor Score</div>
    <table><tr><td>Editor score</td><td>4.5 / 5</td><td>91 / 100</td></tr></table>
    <section>
      <h3>How We Rate Example Casino</h3>
      <div><strong>Overall</strong><span>91 / 100</span></div>
      <div><span>Redemption speed</span><span>96 / 100</span></div>
      <div><span>Game library</span><span>92 / 100</span></div>
    </section>
    <p>Trustpilot rates Example Casino 4.4/5 from 29,000 reviews.</p>
    <!--sc-operator-facts data-operator="mcluck" data-fields="name,editorScore100"-->
  </main>
`;
const rawSemanticLeaks = findRenderedEditorScoreContexts(semanticLeakFixture);
assert.ok(
  rawSemanticLeaks.length >= 6,
  'independent detector must fail prose, unknown-class, table, and aggregate leaks',
);
for (const leakedValue of [91, 88, 4.3, 4.1, 4.7, 4.5]) {
  assert.ok(
    rawSemanticLeaks.some((context) => context.value === leakedValue),
    `independent detector missed semantic score ${leakedValue}`,
  );
}
const semanticLeakRendered = injectOperatorFactsHtml(semanticLeakFixture, 'mcluck');
for (const leakedClaim of [
  /We rate Example Casino 4\.6\/5 and 91\/100/,
  /earns its 88\/100/,
  /is rated 4\.3\/5/,
  /class="oc-rating"[^>]*>4\.1\s*\/\s*5/,
  /class="offer-rating"[^>]*>4\.7\s*\/\s*5/,
  /Editor score<\/td><td>4\.5\s*\/\s*5/,
]) {
  assert.doesNotMatch(
    semanticLeakRendered,
    leakedClaim,
    `unresolved semantic claim leaked: ${leakedClaim}`,
  );
}
assert.deepEqual(
  validateRenderedEditorScoreContexts(undefined, semanticLeakRendered),
  [],
  'independent detector must accept a fully normalized unresolved review',
);
assert.match(semanticLeakRendered, /Redemption speed<\/span><span>96\s*\/\s*100/);
assert.match(semanticLeakRendered, /Game library<\/span><span>92\s*\/\s*100/);
assert.match(semanticLeakRendered, /Trustpilot rates Example Casino 4\.4\/5/);
assert.match(semanticLeakRendered, /29,000 reviews/);

const verifiedSemanticFixture = semanticLeakFixture
  .replaceAll('Example Casino', 'American Luck')
  .replace(
    'data-operator="mcluck"',
    'data-operator="american-luck"',
  );
const verifiedSemanticRendered = injectOperatorFactsHtml(
  verifiedSemanticFixture,
  'american-luck',
);
assert.doesNotMatch(verifiedSemanticRendered, /(?:4\.6|4\.3|4\.1|4\.7|4\.5)\s*\/\s*5/);
assert.doesNotMatch(verifiedSemanticRendered, /(?:91|88)\s*\/\s*100/);
assert.deepEqual(
  validateRenderedEditorScoreContexts(72, verifiedSemanticRendered),
  [],
  'all first-party aggregate contexts must use the verified canonical score',
);
assert.match(verifiedSemanticRendered, /Trustpilot rates American Luck 4\.4\/5/);
assert.match(verifiedSemanticRendered, /Redemption speed<\/span><span>96\s*\/\s*100/);

const leakedScoreFixture = `
  <div class="metric"><div>4.5</div><div>Editor Score</div></div>
  <div class="v-score"><span>88</span><span>/100</span></div>
  <div class="v-stars"><span>★★★★★</span><span>4.5 / 5</span></div>
  <div class="score-bars"><div class="sbars-total">88 / 100</div></div>
  <div class="qp-item"><span>Overall</span><span>88 / 100</span></div>
  <div class="sticky-sub">★★★★★ 4.5/5 · 29,000+ reviews</div>
  <div class="sticky-sub">★★★★★ 4.6/5 Trustpilot · 29,000+ reviews</div>
`;
assert.deepEqual(
  new Set(findRenderedEditorScoreContexts(leakedScoreFixture).map((context) => context.kind)),
  new Set([
    'first-party-language',
    'unattributed-rating',
  ]),
  'independent detector must recognize labeled and unattributed score claims',
);
assert.deepEqual(
  findRenderedEditorScoreContexts(
    '<div class="sticky-sub">★★★★★ 4.6/5 Trustpilot · 29,000+ reviews</div>',
  ),
  [],
  'independent detector must preserve explicitly labeled third-party ratings',
);
assert.ok(
  validateRenderedEditorScoreContexts(undefined, leakedScoreFixture).length > 0,
  'post-build detector must fail an unresolved review fixture with leaked score contexts',
);
assert.deepEqual(
  validateRenderedEditorScoreContexts(
    undefined,
    '<div class="sticky-sub">★★★★★ 4.6/5 Trustpilot · 29,000+ reviews</div>',
  ),
  [],
);

const builtVerifierSource = readFileSync(
  resolve(root, 'scripts/verify-schema-built.ts'),
  'utf8',
);
assert.doesNotMatch(
  builtVerifierSource,
  /data-canonical-field=["']editorScore100/,
  'post-build detection must not trust the canonical field marker',
);
assert.match(builtVerifierSource, /findRenderedEditorScoreContexts\(html\)/);
assert.match(
  readFileSync(resolve(root, 'scripts/verify-operator-consistency.ts'), 'utf8'),
  /findRenderedEditorScoreContexts\(rendered\)/,
  'operator validation must scan each fully rendered review',
);
const productionNormalizerSource = readFileSync(
  resolve(root, 'src/lib/operatorFactsHtml.ts'),
  'utf8',
);
assert.doesNotMatch(
  productionNormalizerSource,
  /(?:SCORE_ONLY|SCORE_STARS|LABELED_SCORE_ITEM|STICKY_SCORE)_CLASSES/,
  'production score normalization must not depend on a closed CSS-class whitelist',
);
const independentDetectorSource = readFileSync(
  resolve(root, 'scripts/lib/rendered-editor-score-detector.ts'),
  'utf8',
);
assert.doesNotMatch(
  independentDetectorSource,
  /(?:SCORE_TOTAL|STAR_SCORE|LABELED_SCORE|STICKY)_CLASSES/,
  'independent detection must not duplicate production class lists',
);

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
assert.match(noDepositRoute, /operator\.lastVerifiedDate/);
assert.doesNotMatch(
  noDepositRoute,
  /const VERIFIED_LABEL/,
  'missing operator verification dates must not inherit a page-level date',
);
const newRoute = readFileSync(resolve(root, 'src/routes/new/index.astro'), 'utf8');
assert.match(newRoute, /from '\.\.\/\.\.\/data\/operators'/);
assert.match(newRoute, /canonicalOperatorName/);
const bestRoute = readFileSync(resolve(root, 'src/routes/best/\[slug\]\.astro'), 'utf8');
assert.match(bestRoute, /from '\.\.\/\.\.\/data\/operators'/);

console.log('verify-operator-consistency tests: OK — 29 records, markers, validation, rendering');
