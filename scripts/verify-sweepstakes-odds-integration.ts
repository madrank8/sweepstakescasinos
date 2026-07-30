import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getPartner } from '../src/data/affiliates';
import { shouldRenderAffiliateCta } from '../src/data/geo';
import {
  buildOddsRecommendations,
  type OddsRecommendationTuple,
} from '../src/lib/oddsRecommendations';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
const scriptCommands = (name: string) =>
  pkg.scripts[name]!.split('&&').map((command) => command.trim());
const assertCommandOrder = (commands: string[], before: string, after: string) => {
  const beforeIndex = commands.indexOf(before);
  const afterIndex = commands.indexOf(after);
  assert.ok(beforeIndex >= 0, `script includes ${before}`);
  assert.ok(afterIndex > beforeIndex, `${after} runs after ${before}`);
};

assert.equal(
  pkg.scripts['verify:odds:integration'],
  'tsx scripts/verify-sweepstakes-odds-integration.ts',
  'package script verify:odds:integration',
);
assert.match(pkg.scripts.prebuild, /npm run verify:odds/);
const ciCommands = scriptCommands('ci');
for (const requiredCommand of [
  'npm run verify:availability',
  'npm run content:lint',
  'npm run tracker:lint',
  'npm run methodology:check',
  'npm run verify:odds',
  'npm run testing:verify',
  'npm run testing:verify-overclaims',
  'npm run build',
  'npm run verify:odds:integration',
]) {
  assert.ok(ciCommands.includes(requiredCommand), `ci includes ${requiredCommand}`);
}
assertCommandOrder(ciCommands, 'npm run verify:odds', 'npm run build');
assertCommandOrder(ciCommands, 'npm run build', 'npm run verify:odds:integration');

for (const path of [
  'src/lib/sweepstakesOdds.ts',
  'src/lib/oddsPageSchema.ts',
  'src/components/odds/OddsCalculator.astro',
  'src/components/odds/OddsCasinoRecommendations.astro',
  'src/routes/tools/index.astro',
  'src/routes/tools/sweepstakes-odds-calculator/index.astro',
  'src/pages/tools/index.astro',
  'src/pages/tools/sweepstakes-odds-calculator/index.astro',
]) {
  assert.ok(existsSync(join(root, path)), `expected ${path}`);
}

const {
  ODDS_CANONICAL,
  ODDS_DATE_MODIFIED,
  ODDS_FAQ,
  ODDS_MAIN_ENTITY_ID,
  buildOddsPageGraph,
} = await import('../src/lib/oddsPageSchema');

const workflow = read('.github/workflows/ci.yml');
assert.match(
  workflow,
  /uses: actions\/checkout@v4\s+with:\s+fetch-depth: 0/,
  'CI checkout must fetch full Git history for authoritative authored-source lastmod',
);
const buildStep = workflow.indexOf('- name: Build');
const integrationStep = workflow.indexOf('- name: Verify sweepstakes odds integration');
assert.ok(buildStep >= 0, 'CI contains Build step');
assert.ok(integrationStep > buildStep, 'CI integration verifier runs after Build');
assert.match(
  workflow.slice(integrationStep),
  /run: npm run verify:odds:integration/,
  'CI integration step invokes the package script',
);

const calculator = read('src/components/odds/OddsCalculator.astro');
assert.match(calculator, /<form\b[^>]*\bnovalidate\b/);
assert.match(calculator, /aria-live="polite"/);
assert.match(calculator, /tabindex="-1"/);
assert.match(
  calculator,
  /<noscript>[\s\S]*?calculator needs JavaScript[\s\S]*?methodology, examples, FAQ,[\s\S]*?casino reviews,[\s\S]*?<\/noscript>/,
  'no-JS notice preserves the editorial fallback',
);
assert.match(calculator, /preventDefault\(\)/);
assert.doesNotMatch(
  calculator,
  /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML/,
  'calculator keeps inputs and derived values local',
);
const keyboardOrder = [
  'id="odds-entries"',
  'id="odds-pool"',
  'id="odds-prizes"',
  'data-estimated-toggle',
  '<summary>More options</summary>',
  'type="submit"',
];
let previousControlIndex = -1;
for (const marker of keyboardOrder) {
  const markerIndex = calculator.indexOf(marker);
  assert.ok(markerIndex > previousControlIndex, `keyboard order includes ${marker}`);
  previousControlIndex = markerIndex;
}
const formBlocks = [...calculator.matchAll(/<form\b[\s\S]*?<\/form>/g)];
assert.equal((calculator.match(/<form\b/g) ?? []).length, 1, 'calculator has exactly one form');
assert.equal(formBlocks.length, 1, 'calculator has exactly one complete form');
const formMarkup = formBlocks[0][0];
const formTag = formMarkup.match(/^<form\b[^>]*>/)?.[0];
assert.ok(formTag, 'calculator form has an opening tag');
assert.match(formTag, /\bmethod="dialog"/);
assert.doesNotMatch(formTag, /\baction\s*=/);
const optionsTag = formMarkup.match(/<details\b[^>]*class="odds-options"[^>]*>/);
assert.ok(optionsTag, 'More options uses a details element');
assert.doesNotMatch(optionsTag[0], /\bopen\b/, 'More options starts collapsed');
const optionsStart = formMarkup.indexOf(optionsTag[0]);
const optionsEnd = formMarkup.indexOf('</details>', optionsStart);
assert.ok(optionsStart >= 0 && optionsEnd > optionsStart, 'More options is a collapsed details block');
const baseFormMarkup = formMarkup.slice(0, optionsStart);
const advancedFormMarkup = formMarkup.slice(optionsStart, optionsEnd);
const postOptionsFormMarkup = formMarkup.slice(optionsEnd + '</details>'.length);
const formControls = (markup: string) =>
  [...markup.matchAll(/<(input|select|textarea)\b[^>]*>/g)].map(([tag, element]) => {
    const attributes = Object.fromEntries(
      [
        ...tag.matchAll(
          /\b([a-zA-Z:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
        ),
      ].map(([, name, doubleQuoted, singleQuoted, unquoted]) => [
        name,
        doubleQuoted ?? singleQuoted ?? unquoted ?? true,
      ]),
    );
    return { element, tag, attributes };
  });
const baseControls = formControls(baseFormMarkup).filter(
  ({ element, attributes }) => element !== 'input' || attributes.type !== 'hidden',
);
const estimatedModeControls = baseControls.filter(
  ({ element, attributes }) =>
    element === 'input' &&
    attributes.type === 'checkbox' &&
    attributes['data-estimated-toggle'] === true,
);
assert.equal(estimatedModeControls.length, 1, 'estimated mode has one intentional checkbox control');
const baseValueControls = baseControls.filter((control) => control !== estimatedModeControls[0]);
assert.deepEqual(
  baseValueControls.map(({ attributes }) => attributes.name),
  ['entries', 'pool', 'prizes'],
  'only the three ordered base value fields precede More options',
);
assert.equal(baseValueControls[2].attributes.value, '1', 'prizes defaults to 1');
assert.equal(estimatedModeControls[0].attributes.id, 'odds-estimated-toggle');
assert.equal(estimatedModeControls[0].attributes['aria-controls'], 'odds-pool');
assert.equal(
  estimatedModeControls[0].attributes['aria-describedby'],
  'odds-estimated-instructions',
);
assert.match(calculator, /id="odds-pool-hint"[^>]*aria-live="polite"[^>]*role="status"/);
for (const { tag } of baseValueControls) {
  assert.doesNotMatch(tag, /\b(?:hidden|disabled)\b/, 'base value fields are visible and enabled');
}
const advancedValueControls = formControls(advancedFormMarkup).filter(
  ({ attributes }) => typeof attributes.name === 'string',
);
assert.deepEqual(
  advancedValueControls.map(({ attributes }) => attributes.name),
  ['freeEntries', 'drawings'],
  'advanced value fields remain after the More options boundary',
);
for (const { tag } of advancedValueControls) {
  assert.match(tag, /\bdisabled\b/, 'advanced value fields start disabled');
}
assert.match(advancedFormMarkup, /data-entry-mix-fields hidden/);
assert.match(advancedFormMarkup, /data-drawings-fields hidden/);
const postOptionsValueControls = formControls(postOptionsFormMarkup).filter(
  ({ attributes }) => typeof attributes.name === 'string',
);
assert.deepEqual(
  postOptionsValueControls.map(({ attributes }) => attributes.name),
  [],
  'no named value controls may appear after More options',
);
const recommendations = read('src/components/odds/OddsCasinoRecommendations.astro');
assert.match(recommendations, /AffiliateLink/);
assert.match(recommendations, /ODDS_CTA_CLICK_ID/);
assert.doesNotMatch(
  recommendations,
  /trackingLink|['"]@type['"]\s*:\s*['"](?:AggregateRating|Offer|Product|Review)['"]/,
);
const oddsEventSources = [
  read('src/lib/oddsCalculatorUi.ts'),
  read('src/lib/oddsRecommendations.ts'),
  calculator,
  recommendations,
].join('\n');
assert.deepEqual(
  [...new Set(oddsEventSources.match(/\bodds_[a-z_]+\b/g) ?? [])].sort(),
  ['odds_calculation_completed', 'odds_casino_cta_clicked', 'odds_options_opened'],
  'only the three approved coarse odds events exist',
);
assert.doesNotMatch(
  calculator,
  /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
  'shared html-level reduced-motion behavior is not shadowed by a component descendant rule',
);

const routePath = 'src/routes/tools/sweepstakes-odds-calculator/index.astro';
const generatedRoutePath = 'src/pages/tools/sweepstakes-odds-calculator/index.astro';
const route = read(routePath);
const generatedRoute = read(generatedRoutePath);
assert.equal(generatedRoute, route, 'generated calculator route exactly matches authored route');
const toolsRoutePath = 'src/routes/tools/index.astro';
const generatedToolsRoutePath = 'src/pages/tools/index.astro';
assert.equal(
  read(generatedToolsRoutePath),
  read(toolsRoutePath),
  'generated tools hub exactly matches authored route',
);

const orderedRouteMarkers = [
  '<OddsCalculator />',
  '<OddsCasinoRecommendations partners={topPartners} />',
  'id="what-it-tells"',
  'id="unknown-total"',
  'id="multiple-prizes"',
  'id="entry-types"',
  'id="independent-drawings"',
  'id="limitations"',
  'id="worked-examples"',
  '<details class="odds-methodology">',
  'id="calculator-faq"',
  'id="related-odds-links"',
  'class="odds-page-disclosure"',
];
let previousIndex = -1;
for (const marker of orderedRouteMarkers) {
  const markerIndex = generatedRoute.indexOf(marker);
  assert.ok(markerIndex > previousIndex, `generated component/editorial order includes ${marker}`);
  previousIndex = markerIndex;
}

for (const editorialCopy of [
  'What this calculator tells you',
  'What to do when total entries are unknown',
  'How multiple prizes change the result',
  'Free/AMOE entries versus purchase-associated entries',
  'Assumptions and limitations',
  'Worked examples',
  'How this works',
  'Frequently asked questions',
  'Related tools and guides',
  'No purchase necessary',
  'official rules',
]) {
  assert.ok(generatedRoute.includes(editorialCopy), `generated route contains ${editorialCopy}`);
}

assert.match(
  route,
  /from '\.\.\/\.\.\/\.\.\/lib\/oddsPageSchema'/,
  'production route imports the shared odds-page schema inputs',
);
assert.match(route, /\{ODDS_FAQ\.map\(\(item\) => \(/, 'visible FAQ consumes shared FAQ data');
assert.match(route, /mainEntityId=\{ODDS_MAIN_ENTITY_ID\}/, 'WebPage points to shared #app ID');
assert.match(route, /jsonLd=\{ODDS_SCHEMA_NODES\}/, 'route consumes shared schema nodes');
assert.doesNotMatch(route, /throw new Error/, 'SSR route must not fail when ranking data is unavailable');
assert.match(route, /OddsRecommendationTuple \| null/);
assert.match(
  route,
  /\{topPartners && \(\s*<OddsCasinoRecommendations partners=\{topPartners\} \/>\s*\)\}/,
  'recommendations are omitted when ranked partners cannot be resolved',
);
assert.doesNotMatch(route, /\/reviews\/(?:mcluck|pulsz|crown-coins)\//);
assert.match(route, /topPartners\.map\(/, 'contextual review links derive from resolved ranking data');
assert.equal((route.match(/href="\/best\/sweepstakes-casinos\/"/g) ?? []).length, 1);

const layout = read('src/layouts/ContentLayout.astro');
assert.equal(
  (layout.match(/<script type="application\/ld\+json"/g) ?? []).length,
  1,
  'layout emits one consolidated JSON-LD block',
);
assert.match(layout, /buildPageGraph\(/);

const producedGraph = buildOddsPageGraph() as Record<string, unknown>;
assert.equal(producedGraph['@context'], 'https://schema.org');
const graph = producedGraph['@graph'] as Array<Record<string, unknown>>;
assert.ok(Array.isArray(graph), 'odds page graph is executable output');
const expectedGraphNodes = [
  ['WebPage', `${ODDS_CANONICAL}#webpage`],
  ['BreadcrumbList', `${ODDS_CANONICAL}#breadcrumb`],
  ['WebApplication', `${ODDS_CANONICAL}#app`],
  ['FAQPage', `${ODDS_CANONICAL}#faq`],
] as const;
for (const [type, id] of expectedGraphNodes) {
  const matches = graph.filter((node) => node['@type'] === type);
  assert.equal(matches.length, 1, `graph contains exactly one ${type}`);
  assert.equal(matches[0]['@id'], id, `${type} uses exact ID ${id}`);
}
const webPage = graph.find((node) => node['@type'] === 'WebPage')!;
assert.deepEqual(webPage.mainEntity, { '@id': ODDS_MAIN_ENTITY_ID });
const faqPage = graph.find((node) => node['@type'] === 'FAQPage')!;
assert.deepEqual(
  (faqPage.mainEntity as Array<Record<string, unknown>>).map((question) => ({
    q: question.name,
    a: (question.acceptedAnswer as Record<string, unknown>).text,
  })),
  ODDS_FAQ,
  'visible FAQ data exactly equals produced FAQPage questions and answers',
);
const definedIdCounts = new Map<string, number>();
const referencedIds = new Set<string>();
const collectGraphIds = (value: unknown): void => {
  if (Array.isArray(value)) {
    value.forEach(collectGraphIds);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  const node = value as Record<string, unknown>;
  const keys = Object.keys(node);
  if (typeof node['@id'] === 'string') {
    if (keys.length === 1) referencedIds.add(node['@id']);
    else definedIdCounts.set(node['@id'], (definedIdCounts.get(node['@id']) ?? 0) + 1);
  }
  for (const [key, child] of Object.entries(node)) {
    if (key !== '@id') collectGraphIds(child);
  }
};
collectGraphIds(graph);
for (const [id, count] of definedIdCounts) {
  assert.equal(count, 1, `produced graph defines @id exactly once: ${id}`);
}
for (const [, id] of expectedGraphNodes) {
  assert.equal(definedIdCounts.get(id), 1, `required graph ID is defined exactly once: ${id}`);
}
for (const id of referencedIds) {
  if (id.startsWith('https://sweepstakeswiz.com') && id.includes('#')) {
    assert.ok(definedIdCounts.has(id), `produced graph resolves internal @id ${id}`);
  }
}
const serializedGraph = JSON.stringify(producedGraph);
assert.doesNotMatch(
  serializedGraph,
  /"@type":"(?:Offer|Product|Review|AggregateRating)"/,
  'produced graph excludes prohibited schema types',
);
assert.doesNotMatch(
  serializedGraph,
  /"(?:entries|totalEntries|prizes|freeEntries|drawings|probability|reciprocal)":|123457|7654321/,
  'produced graph excludes visitor-derived fields and values',
);

const ranking = read('src/content/comparisons/sweepstakes-casinos.mdx');
assert.match(ranking, /^published:\s*\d{4}-\d{2}-\d{2}$/m);
assert.match(ranking, /^draft:\s*false$/m);
const rankingBlock = ranking.match(/^partnerSlugs:\s*\n((?:  - [a-z0-9-]+\n)+)/m);
assert.ok(rankingBlock, 'ranking contains partnerSlugs frontmatter');
const rankedSlugs = [...rankingBlock[1].matchAll(/^  - ([a-z0-9-]+)$/gm)].map((m) => m[1]);
assert.ok(rankedSlugs.length >= 3, 'published ranking supplies at least three valid slugs');
const firstThree = rankedSlugs.slice(0, 3);
assert.equal(firstThree.length, 3, 'ranking supplies exactly three ordered recommendation slots');
assert.equal(new Set(firstThree).size, 3, 'top three ranking slugs are unique');
const rankedPartners = firstThree.map((slug) => {
  assert.ok(existsSync(join(root, `reviews/${slug}.html`)), `review exists for ${slug}`);
  const partner = getPartner(slug);
  assert.ok(partner, `affiliate partner resolves for ${slug}`);
  return partner;
});
for (const state of ['TX', 'CA', null] as const) {
  const items = buildOddsRecommendations(rankedPartners as OddsRecommendationTuple, state);
  assert.deepEqual(
    items.map((item) => item.partner.slug),
    firstThree,
    `${state ?? 'unknown'} preserves current editorial order`,
  );
  for (const item of items) {
    assert.equal(item.available, shouldRenderAffiliateCta(item.partner, state));
    assert.equal(item.reviewHref, `/reviews/${item.partner.slug}/`);
  }
}
assert.match(route, /ranking\.data\.partnerSlugs\.slice\(0, 3\)/, 'route consumes first three rankings');
assert.match(route, /topSlugs\.map\(\(slug\) => getPartner\(slug\)\)/, 'route resolves ranked partners');

const sitemap = read('sitemap.xml');
const sitemapEntry = (url: string) => {
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [
    ...sitemap.matchAll(
      new RegExp(
        `<url>\\s*<loc>${escapedUrl}<\\/loc>\\s*<lastmod>(\\d{4}-\\d{2}-\\d{2})<\\/lastmod>[\\s\\S]*?<\\/url>`,
        'g',
      ),
    ),
  ];
  assert.equal(matches.length, 1, `${url} appears exactly once in sitemap`);
  return matches[0][1];
};
const authoredSitemapPages = [
  {
    url: 'https://sweepstakeswiz.com/tools/',
    source: 'src/routes/tools/index.astro',
  },
  {
    url: 'https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/',
    source: routePath,
  },
];
const gitOutput = (args: string[], context: string) => {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    throw new Error(`Git history unavailable for ${context}`, { cause: error });
  }
};
assert.equal(
  gitOutput(['rev-parse', '--is-shallow-repository'], 'shallow-repository check'),
  'false',
  'full Git history is required for authoritative authored-source lastmod',
);
for (const { url, source } of authoredSitemapPages) {
  const expectedLastmod = gitOutput(
    ['log', '-1', '--format=%cs', '--', source],
    `authored-source lastmod: ${source}`,
  );
  assert.ok(expectedLastmod, `git provides authored-source lastmod for ${source}`);
  assert.equal(sitemapEntry(url), expectedLastmod, `${url} lastmod comes from ${source}`);
}
assert.equal(
  ODDS_DATE_MODIFIED,
  sitemapEntry('https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/'),
  'page dateModified stays aligned with the generated sitemap lastmod',
);

const requiredToolLinks = [
  ['partials/nav.html', '/tools/'],
  ['partials/footer.html', '/tools/'],
  ['src/content/guides/dual-currency-sweepstakes-model.mdx', '/tools/sweepstakes-odds-calculator/'],
  ['src/content/guides/amoe-sweepstakes-casinos.mdx', '/tools/sweepstakes-odds-calculator/'],
  ['src/content/guides/sweeps-coins-explained.mdx', '/tools/sweepstakes-odds-calculator/'],
  ['src/routes/bonuses/no-deposit/index.astro', '/tools/sweepstakes-odds-calculator/'],
] as const;
const authoredLinkDestinations = (path: string) => {
  const source = read(path);
  const hrefs = [...source.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/g)].map(
    (match) => match[2],
  );
  const markdownLinks = [...source.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)].map(
    (match) => match[1],
  );
  return [...hrefs, ...markdownLinks];
};
for (const [path, expectedDestination] of requiredToolLinks) {
  const toolDestinations = authoredLinkDestinations(path).filter((href) =>
    href.startsWith('/tools/'),
  );
  assert.deepEqual(
    toolDestinations,
    [expectedDestination],
    `${path} has exactly the expected authored tool link`,
  );
}

const authoredReviewPaths = readdirSync(join(root, 'reviews'))
  .filter((name) => name.endsWith('.html'))
  .map((name) => `reviews/${name}`);
const linkedReviewPaths = authoredReviewPaths.filter((path) =>
  authoredLinkDestinations(path).includes('/tools/sweepstakes-odds-calculator/'),
);
assert.ok(
  linkedReviewPaths.length >= 3,
  'at least three authored review pages link to the odds calculator',
);
for (const path of linkedReviewPaths) {
  assert.equal(
    authoredLinkDestinations(path).filter(
      (href) => href === '/tools/sweepstakes-odds-calculator/',
    ).length,
    1,
    `${path} links exactly once to the odds calculator`,
  );
}

const trustCss = read('partials/trust.css');
const cssBlockAfter = (source: string, marker: string) => {
  const markerIndex = source.indexOf(marker);
  assert.ok(markerIndex >= 0, `CSS contains ${marker}`);
  const openBrace = source.indexOf('{', markerIndex);
  assert.ok(openBrace >= 0, `CSS block opens after ${marker}`);
  let depth = 0;
  for (let i = openBrace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(openBrace + 1, i);
    }
  }
  throw new Error(`Unbalanced CSS block after ${marker}`);
};
const cssDeclarations = (ruleBody: string) =>
  new Map(
    ruleBody
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const colon = declaration.indexOf(':');
        return [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()];
      }),
  );
const reducedMotionBlock = cssBlockAfter(trustCss, '@media(prefers-reduced-motion:reduce)');
const htmlMotionDeclarations = cssDeclarations(cssBlockAfter(reducedMotionBlock, 'html'));
assert.equal(htmlMotionDeclarations.get('scroll-behavior'), 'auto !important');

const narrowNavBlock = cssBlockAfter(trustCss, '@media(max-width:360px)');
const brandImageDeclarations = cssDeclarations(cssBlockAfter(narrowNavBlock, '.nav-brand img'));
assert.equal(brandImageDeclarations.get('width'), '34px!important');
assert.equal(brandImageDeclarations.get('height'), '34px!important');
const brandTextDeclarations = cssDeclarations(cssBlockAfter(narrowNavBlock, '.nav-brand span'));
assert.equal(brandTextDeclarations.get('font-size'), '.78rem!important');

console.log('verify-sweepstakes-odds-integration: OK');
