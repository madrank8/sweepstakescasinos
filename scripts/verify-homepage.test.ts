import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OPERATORS, type CanonicalFact } from '../src/data/operators';

const root = resolve(import.meta.dirname, '..');

assert.ok(
  existsSync(resolve(root, 'src/routes/index.astro')),
  'the authored homepage route must override the generated legacy wrapper',
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
assert.equal(
  typeof homepage.selectRankedRecommendations,
  'function',
  'ranked recommendation selector must be exported',
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
  typeof homepage.buildRankedRecommendationViews,
  'function',
  'availability-aware ranked view builder must be exported',
);

const ranked = homepage.selectRankedRecommendations(OPERATORS);
assert.deepEqual(
  ranked.map((entry) => [entry.slug, entry.score]),
  [
    ['playfame', 86],
    ['legendz', 84],
    ['roxymoxy', 80],
    ['american-luck', 72],
  ],
  'only resolved scores with enough verified decision facts may rank',
);

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

const texasViews = homepage.buildRankedRecommendationViews(OPERATORS, 'TX');
assert.ok(
  texasViews.filter((entry) => entry.hasPartner).every((entry) => entry.canCta),
  'allowed-state partner CTAs should render',
);
assert.equal(
  texasViews.find((entry) => entry.slug === 'american-luck')?.canCta,
  false,
  'non-partner recommendations remain editorial review links only',
);
assert.ok(
  homepage.buildRankedRecommendationViews(OPERATORS, 'CA').every((entry) => !entry.canCta),
  'site-banned-state ranked CTAs must be suppressed',
);
assert.ok(
  homepage.buildRankedRecommendationViews(OPERATORS, undefined).every((entry) => !entry.canCta),
  'unknown-state ranked CTAs must fail closed',
);

const selectorSource = readFileSync(resolve(root, 'src/lib/homepage.ts'), 'utf8');
assert.doesNotMatch(
  selectorSource,
  /\bcpa\b|trackingLink|revshare/i,
  'editorial selectors must not use affiliate economics or tracking links',
);
assert.equal(
  comparison.find((entry) => entry.slug === 'acebet')?.editorScore,
  'Unresolved',
  'unresolved editor scores must render without a numeric value',
);

const homeSource = readFileSync(resolve(root, 'src/routes/index.astro'), 'utf8');
const requiredHomeSections = [
  'id="answer"',
  'id="recommendations"',
  'id="use-cases"',
  'id="comparison"',
  'id="methodology"',
  'id="legality"',
  'id="buyer-guidance"',
  'id="faq"',
  'id="specialist-hubs"',
];
let previousSection = -1;
for (const marker of requiredHomeSections) {
  const position = homeSource.indexOf(marker);
  assert.ok(position > previousSection, `${marker} must appear in the required homepage order`);
  previousSection = position;
}
assert.match(homeSource, /<AffiliateLink\b/, 'homepage partner CTAs must use AffiliateLink');
assert.match(homeSource, /<table\b/, 'homepage comparison must use a semantic table');
assert.match(homeSource, /<caption\b/, 'homepage comparison table must have a caption');
assert.match(homeSource, /<th\s+scope="col"/, 'comparison headers must identify column scope');
assert.match(homeSource, /overflow-x:\s*auto/, 'narrow viewports must contain table overflow');
assert.doesNotMatch(homeSource, /index\.html\?raw|prepareSsrAffiliateHtml/);

const reviewsSource = readFileSync(resolve(root, 'src/routes/reviews/index.astro'), 'utf8');
assert.match(reviewsSource, /CollectionPage/);
assert.match(reviewsSource, /ItemList/);
assert.match(reviewsSource, /Breadcrumb/);
assert.match(reviewsSource, /OPERATORS/);
assert.match(reviewsSource, /\/reviews\/\$\{operator\.slug\}\//);

const generatorSource = readFileSync(resolve(root, 'scripts/generate-astro-pages.mjs'), 'utf8');
assert.match(
  generatorSource,
  /if \(url === '\/'\) return \['src\/routes\/index\.astro'\]/,
  'sitemap lastmod must recognize the authored homepage source',
);
assert.match(generatorSource, /push\('\/reviews\/'\)/, 'reviews directory must enter XML sitemap');
assert.match(
  generatorSource,
  /\[All casino reviews\]\(\$\{ORIGIN\}\/reviews\/\)/,
  'llms inventory must link the reviews directory',
);

const navSource = readFileSync(resolve(root, 'partials/nav.html'), 'utf8');
assert.match(navSource, /href="\/reviews\/"/, 'global navigation must link the reviews directory');

const sitemapSource = readFileSync(resolve(root, 'sitemap.html'), 'utf8');
assert.match(sitemapSource, /href="\/reviews\/"/, 'HTML sitemap must link the reviews directory');

const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
assert.match(packageJson.scripts.ci, /verify:homepage/, 'full CI must run homepage gates');
