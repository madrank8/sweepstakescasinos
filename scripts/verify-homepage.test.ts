import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OPERATORS, type CanonicalFact } from '../src/data/operators';
import {
  formatPartialIsoDate,
  operatorFactNote,
} from '../src/lib/operatorPresentation';
import { itemListParityErrors } from './lib/itemlist-parity';

const root = resolve(import.meta.dirname, '..');

assert.ok(
  !existsSync(resolve(root, 'src/routes/index.astro')),
  'the original index.html homepage must not be overridden by an authored Astro route',
);
assert.ok(
  existsSync(resolve(root, 'src/routes/reviews/index.astro')),
  'the authored reviews directory route must exist',
);
assert.ok(
  existsSync(resolve(root, 'src/lib/homepage.ts')),
  'pure homepage selectors must live outside the Astro route',
);

const homepage = await import('../src/lib/homepage');
assert.equal(formatPartialIsoDate('2025-12'), 'December 2025');
assert.equal(formatPartialIsoDate('2024'), '2024');
const cardCrush = OPERATORS.find((operator) => operator.slug === 'card-crush')!;
assert.doesNotMatch(operatorFactNote(cardCrush), /\b(?:CA|NY)\b|available/i);
assert.match(operatorFactNote(cardCrush), /Vision NL Limited/);
assert.equal(
  typeof homepage.selectVerifiedEditorScores,
  'function',
  'verified editor scores must be available as supporting data',
);
assert.equal(
  typeof homepage.selectComparisonOperators,
  'function',
  'comparison selector must be exported',
);
assert.equal(
  typeof homepage.selectUniqueSuperlative,
  'function',
  'fail-closed superlative selector must be exported',
);
assert.equal(
  typeof homepage.buildComparisonOperatorViews,
  'function',
  'availability-aware primary comparison view builder must be exported',
);
assert.equal(
  typeof homepage.operatorLogoSrc,
  'function',
  'homepage cards must resolve presentation logos without inventing facts',
);

const verifiedScores = homepage.selectVerifiedEditorScores(OPERATORS);
assert.equal(verifiedScores.length, OPERATORS.length);
assert.deepEqual(
  verifiedScores.map((entry) => entry.slug),
  OPERATORS.map((operator) => ({
    slug: operator.slug,
    name: operator.name.status === 'verified' ? operator.name.value : '',
  }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug))
    .map((operator) => operator.slug),
  'resolved scores are supporting attributes in alphabetical, non-ranking order',
);
for (const entry of verifiedScores) {
  const score = OPERATORS.find((operator) => operator.slug === entry.slug)!.editorScore100;
  assert.equal(score.status, 'verified');
  assert.equal(entry.score, score.status === 'verified' ? score.value : undefined);
}

const comparison = homepage.selectComparisonOperators(OPERATORS);
assert.equal(comparison.length, 12, 'decision-support comparison should contain 12 operators');
assert.deepEqual(
  comparison.map((entry) => entry.slug),
  [
    'acebet',
    'freespin',
    'lucky-bunny',
    'spinfinite',
    'big-pirate',
    'dexyplay',
    'high5',
    'jackpot-go',
    'jackpota',
    'mega-bonanza',
    'rolla',
    'splash-coins',
  ],
  'comparison selection must use completeness descending then slug ascending',
);
assert.ok(
  comparison.every((entry) => entry.completeness >= 3),
  'comparison entries must meet the documented completeness threshold',
);
assert.ok(
  comparison.every(
    (entry) =>
      entry.editorScore === undefined ||
      /^\d+\/100$/.test(entry.editorScore),
  ),
  'missing or unresolved scores must be omitted from reader-facing view data',
);

const verified = <T>(value: T): CanonicalFact<T> => ({
  status: 'verified',
  value,
  provenance: [{ source: 'fixture', verifiedOn: '2026-08-01' }],
});
const missing = <T>(): CanonicalFact<T> => ({ status: 'missing', reason: 'fixture missing' });
const unresolved = <T>(): CanonicalFact<T> => ({
  status: 'unresolved',
  reason: 'fixture conflict',
  sources: [],
});
const candidate = (
  slug: string,
  value: CanonicalFact<number>,
  date: CanonicalFact<string> = verified('2026-08-01'),
) => ({ slug, name: verified(slug), value, lastVerifiedDate: date });
const superlativeOptions = {
  label: 'Lowest verified cash redemption minimum',
  asOf: new Date('2026-08-31T00:00:00Z'),
  maxAgeDays: 60,
  metric: (value: number) => value,
};

assert.equal(
  homepage.selectUniqueSuperlative(
    [candidate('alpha', verified(25)), candidate('beta', verified(50))],
    superlativeOptions,
  )?.slug,
  'alpha',
  'a fresh, unique, resolved result may render',
);
assert.equal(
  homepage.selectUniqueSuperlative(
    [candidate('alpha', missing()), candidate('beta', verified(50))],
    superlativeOptions,
  ),
  undefined,
  'missing required facts suppress the entire superlative card',
);
assert.equal(
  homepage.selectUniqueSuperlative(
    [candidate('alpha', unresolved()), candidate('beta', verified(50))],
    superlativeOptions,
  ),
  undefined,
  'unresolved required facts suppress the entire superlative card',
);
assert.equal(
  homepage.selectUniqueSuperlative(
    [
      candidate('alpha', verified(25), verified('2026-01-01')),
      candidate('beta', verified(50)),
    ],
    superlativeOptions,
  ),
  undefined,
  'stale required facts suppress the entire superlative card',
);
assert.equal(
  homepage.selectUniqueSuperlative(
    [candidate('alpha', verified(25)), candidate('beta', verified(25))],
    superlativeOptions,
  ),
  undefined,
  'tied results must not produce a superlative card',
);
assert.equal(
  homepage.selectUniqueSuperlative(
    OPERATORS.map((operator) => ({
      slug: operator.slug,
      name: operator.name,
      value: operator.cashRedemptionMinimum.status === 'verified'
        ? verified(operator.cashRedemptionMinimum.value.amount)
        : operator.cashRedemptionMinimum,
      lastVerifiedDate: operator.lastVerifiedDate,
    })),
    superlativeOptions,
  ),
  undefined,
  'current canonical data has no verified dates, so the homepage must show no superlative',
);

const texasViews = homepage.buildComparisonOperatorViews(OPERATORS, 'TX');
assert.ok(
  texasViews.filter((entry) => entry.hasPartner).every((entry) => entry.canCta),
  'allowed-state partner CTAs should render',
);
assert.equal(
  texasViews.find((entry) => entry.slug === 'acebet')?.canCta,
  false,
  'non-partner primary candidates remain editorial review links only',
);
assert.ok(
  homepage.buildComparisonOperatorViews(OPERATORS, 'CA').every((entry) => !entry.canCta),
  'site-banned-state primary CTAs must be suppressed',
);
assert.ok(
  homepage.buildComparisonOperatorViews(OPERATORS, undefined).every((entry) => !entry.canCta),
  'unknown-state primary CTAs must fail closed',
);

const selectorSource = readFileSync(resolve(root, 'src/lib/homepage.ts'), 'utf8');
assert.doesNotMatch(
  selectorSource,
  /\bcpa\b|trackingLink|revshare/i,
  'editorial selectors must not use affiliate economics or tracking links',
);
assert.equal(comparison.find((entry) => entry.slug === 'acebet')?.editorScore, '88/100');

for (const entry of comparison) {
  const logoSrc = homepage.operatorLogoSrc(entry.slug);
  assert.ok(logoSrc, `${entry.slug} must have a presentation logo for homepage cards`);
  assert.match(logoSrc, /^\/sweepstakeslogo\/.+\.(?:webp|png)$/);
  const logoFile = resolve(root, logoSrc.slice(1));
  assert.ok(existsSync(logoFile), `${logoFile} must exist on disk`);
}
const texasAcebet = texasViews.find((entry) => entry.slug === 'acebet');
assert.ok(texasAcebet?.logoSrc, 'comparison views must include logo paths for card chrome');

const homeSource = readFileSync(resolve(root, 'index.html'), 'utf8');
assert.match(homeSource, /<header class="hero">/, 'original arcade hero must remain');
assert.match(homeSource, /id="casino-grid"/, 'original ranked card grid must remain');
assert.match(homeSource, /id="rankings"/, 'original rankings landmark must remain');
assert.match(homeSource, /id="offers"/, 'original offers alias must remain');
assert.match(homeSource, /class="btn-claim"/, 'original gold claim buttons must remain');
assert.match(
  homeSource,
  /Best Sweepstakes Casinos 2026/,
  'original ranked homepage title must remain',
);
assert.equal(
  [...homeSource.matchAll(/<article\b[^>]*\bclass=["'][^"']*\bcard\b/g)].length,
  28,
  'the original homepage must keep its 28 ranked operator cards',
);
assert.match(
  homeSource,
  /id="casino-grid"[^>]*data-item-list="https:\/\/sweepstakeswiz\.com\/#toplist"/,
  'visible card grid must opt into ItemList parity with the original #toplist schema',
);
assert.match(
  homeSource,
  /data-item-list-order="https:\/\/schema\.org\/ItemListOrderDescending"/,
  'visible card grid must declare the original descending rank order',
);
assert.match(
  homeSource,
  /data-item-position="1"[^>]*data-item-name="McLuck"[^>]*data-item-url="https:\/\/sweepstakeswiz\.com\/reviews\/mcluck\/"/,
  'first ranked card must expose McLuck parity attributes',
);
assert.match(
  homeSource,
  /data-item-position="28"[^>]*data-item-name="Mega Bonanza"[^>]*data-item-url="https:\/\/sweepstakeswiz\.com\/reviews\/mega-bonanza\/"/,
  'last ranked card must expose Mega Bonanza parity attributes',
);

const bestSource = readFileSync(resolve(root, 'src/routes/best/[slug].astro'), 'utf8');
const bestContent = readFileSync(
  resolve(root, 'src/content/comparisons/sweepstakes-casinos.mdx'),
  'utf8',
);
assert.match(bestSource, /data-comparison-list/);
assert.match(bestSource, /itemListElement:\s*comparisonOperators\.map/);
assert.match(bestSource, /\{comparisonOperators\.map/);
assert.doesNotMatch(bestSource, /ranked ItemList|top-rated|best-rank/i);
assert.doesNotMatch(
  bestContent,
  /top overall pick|1,000\+ game library|top 10 ranked|ranked using|###\s*\d+\./i,
  'the comparison content must not publish unsupported McLuck or ranking claims',
);
for (const path of [
  'src/content/guides/social-casinos.mdx',
  'src/content/states/florida.mdx',
  'src/content/states/ohio.mdx',
  'src/content/states/texas.mdx',
]) {
  assert.doesNotMatch(
    readFileSync(resolve(root, path), 'utf8'),
    /ranked comparison|higher-CPA brands/i,
    `${path} must describe the unranked comparison hub accurately`,
  );
}

const noDepositSource = readFileSync(
  resolve(root, 'src/routes/bonuses/no-deposit/index.astro'),
  'utf8',
);
assert.doesNotMatch(noDepositSource, /July 2026|DATE_MODIFIED\s*=/);
assert.doesNotMatch(
  noDepositSource,
  /Not canonicalized|Verification unavailable|Biggest signup SC|Best ongoing daily value|Best combined stack/,
);
assert.match(noDepositSource, /aria-label="Details unavailable"/);
assert.match(noDepositSource, /ROUTE_LASTMOD/);

const newHubSource = readFileSync(resolve(root, 'src/routes/new/index.astro'), 'utf8');
assert.doesNotMatch(newHubSource, /Available only in CA & NY/i);
assert.doesNotMatch(
  newHubSource,
  /note:\s*'[^']*(?:SC|games|operator|redemption)/i,
  'duplicated operator facts must not remain hard-coded in new-hub notes',
);
assert.match(newHubSource, /operatorFactNote/);
assert.match(newHubSource, /reviewOutboundAvailabilityView/);
assert.match(
  newHubSource,
  /itemListOrder:\s*'https:\/\/schema\.org\/ItemListUnordered'/,
  'new hub must not claim a ranking through ItemList order',
);
assert.match(newHubSource, /data-item-list=\{`\$\{canonical\}#itemlist`\}/);
assert.match(newHubSource, /data-item-list-order="https:\/\/schema\.org\/ItemListUnordered"/);
assert.match(newHubSource, /data-item-position=\{o\.position\}/);
assert.match(newHubSource, /data-item-name=\{o\.name\}/);
assert.match(newHubSource, /data-item-url=\{`\$\{ORIGIN\}\/reviews\/\$\{o\.slug\}\/`\}/);

const generatorSource = readFileSync(resolve(root, 'scripts/generate-astro-pages.mjs'), 'utf8');
const generatedDates = readFileSync(
  resolve(root, 'src/data/routeLastmod.generated.ts'),
  'utf8',
);
assert.match(generatedDates, /\/bonuses\/no-deposit\//);
assert.match(generatorSource, /routeLastmod\.generated\.ts/);

const parityFixture = `
  <ol data-item-list="https://sweepstakeswiz.com/example/#operators">
    <li data-item-position="1" data-item-name="Alpha" data-item-url="https://sweepstakeswiz.com/reviews/alpha/"></li>
    <li data-item-position="2" data-item-name="Beta" data-item-url="https://sweepstakeswiz.com/reviews/beta/"></li>
  </ol>`;
const parityGraph = [{
  '@type': 'ItemList',
  '@id': 'https://sweepstakeswiz.com/example/#operators',
  numberOfItems: 2,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Alpha', url: 'https://sweepstakeswiz.com/reviews/alpha/' },
    { '@type': 'ListItem', position: 2, name: 'Beta', url: 'https://sweepstakeswiz.com/reviews/beta/' },
  ],
}];
assert.deepEqual(itemListParityErrors(parityFixture, parityGraph), []);
assert.ok(
  itemListParityErrors('', parityGraph).some((error) =>
    /ItemList schema has no visible parity markup/i.test(error),
  ),
  'every emitted ItemList must opt in to visible parity validation',
);
assert.ok(
  itemListParityErrors(
    parityFixture.replace('data-item-name="Beta"', 'data-item-name="Gamma"'),
    parityGraph,
  ).some((error) => /name/i.test(error)),
  'visible ItemList name drift must fail',
);
assert.ok(
  itemListParityErrors(
    parityFixture.replace('data-item-position="2"', 'data-item-position="3"'),
    parityGraph,
  ).some((error) => /position/i.test(error)),
  'visible ItemList position drift must fail',
);
const builtSchemaVerifier = readFileSync(
  resolve(root, 'scripts/verify-schema-built.ts'),
  'utf8',
);
assert.match(builtSchemaVerifier, /itemListParityErrors\(html, graph\)/);

for (const [relativePath, listId] of [
  ['src/routes/state-legality/index.astro', '#states'],
  ['src/routes/guides/index.astro', '#itemlist'],
  ['src/content/guides/social-casinos.mdx', '#itemlist'],
  ['src/routes/news/index.astro', '#itemlist'],
] as const) {
  const source = readFileSync(resolve(root, relativePath), 'utf8');
  assert.match(
    source,
    /data-item-list=/,
    `${relativePath} must expose visible parity markup for ${listId}`,
  );
  assert.match(source, /data-item-position=/);
  assert.match(source, /data-item-name=/);
  assert.match(source, /data-item-url=/);
}

const reviewsSource = readFileSync(resolve(root, 'src/routes/reviews/index.astro'), 'utf8');
assert.match(reviewsSource, /CollectionPage/);
assert.match(reviewsSource, /ItemList/);
assert.match(reviewsSource, /Breadcrumb/);
assert.match(reviewsSource, /OPERATORS/);
assert.match(reviewsSource, /\/reviews\/\$\{operator\.slug\}\//);
assert.doesNotMatch(
  reviewsSource,
  /Not verified|unresolved editor scores|supported ranked set/i,
  'the reader-facing directory must not expose canonical governance vocabulary',
);

assert.match(
  generatorSource,
  /if \(url === '\/'\) return \['index.html'\]/,
  'sitemap lastmod must use the original index.html homepage source',
);
assert.match(
  generatorSource,
  /prepareSsrAffiliateHtml\(rawHtml, Astro.locals.usState, '\$\{placement\}'\)/,
  'the generator must keep geo CTA suppression on the restored homepage wrapper',
);
assert.match(generatorSource, /push\('\/reviews\/'\)/, 'reviews directory must enter XML sitemap');
assert.match(
  generatorSource,
  /\[All casino reviews\]\(\$\{ORIGIN\}\/reviews\/\)/,
  'llms inventory must link the reviews directory',
);

const navSource = readFileSync(resolve(root, 'partials/nav.html'), 'utf8');
assert.match(navSource, /href="\/reviews\/"/, 'global navigation must link the reviews directory');
assert.match(
  navSource,
  /href="\/#rankings"/,
  'shared Best Deals must land on the restored homepage rankings grid',
);

const sitemapSource = readFileSync(resolve(root, 'sitemap.html'), 'utf8');
assert.match(sitemapSource, /href="\/reviews\/"/, 'HTML sitemap must link the reviews directory');

const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
assert.match(packageJson.scripts.ci, /verify:homepage/, 'full CI must run homepage gates');
