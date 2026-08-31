/**
 * Focused unit checks for audit P1 schema helpers (Legislation, FAQPage null-on-empty).
 * Run: npx tsx scripts/verify-schema-helpers.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AUTHOR_ID,
  ORG_ID,
  WEBSITE_ID,
  brandOrganizationNode,
  breadcrumbNode,
  faqPageNode,
  legislationNode,
  organizationNode,
} from '../src/lib/schema';
import { ALL_US_STATE_CODES } from '../src/data/usStates';
import { pngDimensions } from '../src/lib/pngDimensions';

const PAGE = 'https://sweepstakeswiz.com/news/california-ab831-sweepstakes-ban/';

// --- FAQPage null-on-empty ---
assert.equal(faqPageNode(PAGE, null), null, 'null faqs → null');
assert.equal(faqPageNode(PAGE, undefined), null, 'undefined faqs → null');
assert.equal(faqPageNode(PAGE, []), null, 'empty faqs → null');

const faq = faqPageNode(PAGE, [{ q: 'When?', a: 'January 1, 2026.' }]);
assert.ok(faq, 'non-empty faqs → node');
assert.equal(faq!['@type'], 'FAQPage');
assert.equal(faq!['@id'], `${PAGE}#faq`);
const main = faq!.mainEntity as unknown[];
assert.equal(main.length, 1);
assert.notEqual(main.length, 0, 'must never emit empty mainEntity');

// --- Legislation node ---
const leg = legislationNode({
  pageUrl: PAGE,
  fragmentId: 'ab831',
  name: 'California Assembly Bill 831',
  alternateName: 'AB-831',
  legislationDate: '2025-10-11',
  legislationDateOfApplicability: '2026-01-01',
  legalForce: 'InForce',
  jurisdictionName: 'California',
  url: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB831',
});

assert.equal(leg['@type'], 'Legislation');
assert.equal(leg['@id'], `${PAGE}#ab831`);
assert.equal(leg.alternateName, 'AB-831');
assert.equal(leg.legislationDate, '2025-10-11');
assert.equal(leg.legislationDateOfApplicability, '2026-01-01');
assert.equal(leg.legislationLegalForce, 'https://schema.org/InForce');
assert.equal((leg.legislationJurisdiction as { name: string }).name, 'California');
assert.ok(!('sameAs' in ((leg.legislationJurisdiction as object) || {})), 'no invented Wikidata');
assert.ok(!('hasCredential' in leg), 'no invented credentials');

const pending = legislationNode({
  pageUrl: 'https://sweepstakeswiz.com/states/texas/',
  fragmentId: 'hb-189',
  name: 'Texas HB 189',
  alternateName: 'HB 189',
  legislationDate: '2025-03-01',
  legalForce: 'NotInForce',
  jurisdictionName: 'Texas',
});
assert.equal(pending.legislationLegalForce, 'https://schema.org/NotInForce');
assert.ok(!('legislationDateOfApplicability' in pending), 'omit optional when unset');

// --- JSON-LD gap-fill helpers ---
const crumbs = breadcrumbNode('https://sweepstakeswiz.com/guides/example/', [
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/guides/' },
  { name: 'Example', path: '/guides/example/' },
]);
const crumbItems = crumbs.itemListElement as Array<Record<string, unknown>>;
assert.equal(crumbItems[1].item, 'https://sweepstakeswiz.com/guides/');
assert.ok(!('item' in crumbItems[2]), 'current-page breadcrumb must omit item');

const schemaModule = (await import('../src/lib/schema')) as Record<string, unknown>;
assert.equal(typeof schemaModule.serializeJsonLd, 'function', 'shared serializer must be exported');
const serializeJsonLd = schemaModule.serializeJsonLd as (value: unknown) => string;
const serialized = serializeJsonLd({ text: '</script>\u2028next\u2029line' });
assert.equal(serialized, '{"text":"\\u003c/script>\\u2028next\\u2029line"}');
assert.deepEqual(JSON.parse(serialized), { text: '</script>\u2028next\u2029line' });

const logo = organizationNode().logo as Record<string, unknown>;
const sourceLogoDimensions = pngDimensions('sweepstakeslogo/sweepstakeswiz.png');
assert.ok(sourceLogoDimensions, 'publisher logo PNG must be readable');
assert.deepEqual(
  { width: logo.width, height: logo.height },
  sourceLogoDimensions,
  'publisher logo schema must reflect the PNG IHDR',
);
assert.deepEqual(
  pngDimensions('public/sweepstakeslogo/sweepstakeswiz.png'),
  sourceLogoDimensions,
  'PNG reader must accept copied-public asset paths',
);

const stateModule = (await import('../src/data/usStates')) as Record<string, unknown>;
const stateWikidataIds = stateModule.STATE_WIKIDATA_IDS as Record<string, string>;
const stateWikidataIri = stateModule.stateWikidataIri as (code: string) => string;
assert.deepEqual(
  Object.keys(stateWikidataIds).sort(),
  [...ALL_US_STATE_CODES].sort(),
  'Wikidata mapping must cover the 50 states plus DC tracker set',
);
for (const code of ALL_US_STATE_CODES) {
  assert.match(stateWikidataIds[code], /^Q\d+$/, `${code} must have a Wikidata Q-id`);
  assert.equal(
    stateWikidataIri(code),
    `https://www.wikidata.org/entity/${stateWikidataIds[code]}`,
  );
}
assert.equal(stateWikidataIds.CA, 'Q99');
assert.equal(stateWikidataIds.DC, 'Q61');

const aggregateModule = (await import('../src/lib/brandAggregateRating')) as Record<
  string,
  unknown
>;
const buildBrandAggregateRating = aggregateModule.buildBrandAggregateRating as (
  aggregate: Record<string, unknown> | undefined,
) => Record<string, unknown> | undefined;
assert.equal(
  buildBrandAggregateRating({ count: 9, avgRating: 5 }),
  undefined,
  'fewer than 10 approved reports must not emit AggregateRating',
);
assert.deepEqual(buildBrandAggregateRating({ count: 10, avgRating: 4.25 }), {
  '@type': 'AggregateRating',
  ratingValue: 4.25,
  ratingCount: 10,
  bestRating: 5,
  worstRating: 1,
});

const chromeModule = (await import('../src/lib/pageChrome')) as Record<string, unknown>;
assert.equal(
  typeof chromeModule.consolidateJsonLd,
  'function',
  'legacy graph consolidator must be exported',
);
const consolidateJsonLd = chromeModule.consolidateJsonLd as (html: string) => string;
const visibleEditorialScore = chromeModule.visibleEditorialScore as (html: string) => number | undefined;

function graphFromHtml(html: string): Array<Record<string, unknown>> {
  const block = [
    ...html.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  assert.equal(block.length, 1, 'expected one consolidated graph');
  return (JSON.parse(block[0][1]) as { '@graph': Array<Record<string, unknown>> })['@graph'];
}

for (const [file, expected] of [
  ['big-pirate.html', 79],
  ['sweepico.html', 85],
] as const) {
  const source = readFileSync(new URL(`../reviews/${file}`, import.meta.url), 'utf8');
  assert.equal(
    visibleEditorialScore(source),
    expected,
    `${file} visible verdict score must be detected`,
  );
  const reviewNode = graphFromHtml(consolidateJsonLd(source)).find(
    (node) => node['@type'] === 'Review',
  );
  assert.deepEqual(reviewNode?.reviewRating, {
    '@type': 'Rating',
    ratingValue: expected,
    bestRating: 100,
    worstRating: 0,
  });
}

assert.equal(
  typeof aggregateModule.meetsBrandAggregateRatingThreshold,
  'function',
  'reader-report display and schema must share one threshold predicate',
);
const meetsBrandAggregateRatingThreshold =
  aggregateModule.meetsBrandAggregateRatingThreshold as (
    aggregate: Record<string, unknown> | undefined,
  ) => boolean;
assert.equal(meetsBrandAggregateRatingThreshold({ count: 9, avgRating: 5 }), false);
assert.equal(meetsBrandAggregateRatingThreshold({ count: 10, avgRating: 4.25 }), true);
assert.equal(meetsBrandAggregateRatingThreshold({ count: 10, avgRating: null }), false);

for (const slug of [
  'american-luck',
  'card-crush',
  'casino-click',
  'hello-millions',
  'legendz',
  'mcluck',
  'pulsz',
]) {
  const source = readFileSync(new URL(`../reviews/${slug}.html`, import.meta.url), 'utf8');
  const sourceBlock = [
    ...source.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ][0];
  const sourceDocument = JSON.parse(sourceBlock[1]) as {
    '@graph': Array<Record<string, unknown>>;
  };
  const legacyBrand = sourceDocument['@graph'].find(
    (node) => node['@id'] === `https://sweepstakeswiz.com/reviews/${slug}/#brand`,
  );
  const canonicalBrand = brandOrganizationNode(slug);
  assert.deepEqual(
    canonicalBrand?.sameAs,
    legacyBrand?.sameAs,
    `${slug} canonical identity must preserve verified legacy sameAs URLs`,
  );
}

const authorSource = readFileSync(
  new URL('../author/ilija-milosevic.html', import.meta.url),
  'utf8',
);
const identifiedProfile = authorSource.replace(
  '"@type":"ProfilePage"',
  '"@type":"ProfilePage","@id":"https://sweepstakeswiz.com/author/ilija-milosevic/#legacy-profile"',
);
const profileGraph = graphFromHtml(consolidateJsonLd(identifiedProfile));
const profilePages = profileGraph.filter((node) => node['@type'] === 'ProfilePage');
assert.equal(profilePages.length, 1, 'legacy ProfilePage must be replaced, not duplicated');
assert.equal(
  profilePages[0]['@id'],
  'https://sweepstakeswiz.com/author/ilija-milosevic/#webpage',
);
assert.deepEqual(profilePages[0].mainEntity, { '@id': AUTHOR_ID });

const legacy = `<!doctype html><html><head>
<title>Example Review</title>
<meta name="description" content="A <safe> review">
<link rel="canonical" href="https://sweepstakeswiz.com/reviews/example/">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Review","@id":"https://sweepstakeswiz.com/reviews/example/#review","reviewRating":{"@type":"Rating","ratingValue":"4.5","bestRating":"5","worstRating":"1"},"itemReviewed":{"@id":"https://sweepstakeswiz.com/reviews/example/#brand"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://sweepstakeswiz.com/reviews/example/#brand","name":"Example"},{"@type":"FAQPage","@id":"https://sweepstakeswiz.com/reviews/example/#faq","mainEntity":[{"@type":"Question","name":"Is it safe?","acceptedAnswer":{"@type":"Answer","text":"Use <care>."}}]},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://sweepstakeswiz.com/"},{"@type":"ListItem","position":2,"name":"Example Review","item":"https://sweepstakeswiz.com/reviews/example/"}]}]}</script>
</head><body><div class="verdict-box"><div class="verdict-score"><span class="big">88</span><span class="denom">/100</span></div></div></body></html>`;
const consolidated = consolidateJsonLd(legacy);
const blocks = [
  ...consolidated.matchAll(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  ),
];
assert.equal(blocks.length, 1, 'legacy JSON-LD must become one block');
assert.ok(!blocks[0][1].includes('<'), 'serialized graph must escape less-than signs');
const consolidatedGraph = JSON.parse(blocks[0][1]) as {
  '@graph': Array<Record<string, unknown>>;
};
assert.ok(Array.isArray(consolidatedGraph['@graph']));
assert.equal(
  consolidatedGraph['@graph'].find(
    (node) => node['@id'] === 'https://sweepstakeswiz.com/reviews/example/#webpage',
  )?.['@type'],
  'ItemPage',
  'content FAQPage must not become the foundation WebPage type',
);
for (const id of [
  ORG_ID,
  WEBSITE_ID,
  AUTHOR_ID,
  'https://sweepstakeswiz.com/reviews/example/#webpage',
  'https://sweepstakeswiz.com/reviews/example/#breadcrumb',
  'https://sweepstakeswiz.com/reviews/example/#brand',
  'https://sweepstakeswiz.com/reviews/example/#faq',
]) {
  assert.ok(
    consolidatedGraph['@graph'].some((node) => node['@id'] === id),
    `consolidated graph must preserve or define ${id}`,
  );
}
const review = consolidatedGraph['@graph'].find((node) => node['@type'] === 'Review')!;
assert.deepEqual(review.reviewRating, {
  '@type': 'Rating',
  ratingValue: 88,
  bestRating: 100,
  worstRating: 0,
});
const finalCrumb = consolidatedGraph['@graph']
  .find((node) => node['@type'] === 'BreadcrumbList')!
  .itemListElement as Array<Record<string, unknown>>;
assert.ok(!('item' in finalCrumb.at(-1)!));
assert.equal(consolidateJsonLd(consolidated), consolidated, 'graph consolidation is idempotent');

const noEditorialScore = consolidateJsonLd(
  legacy.replace(
    '<div class="verdict-box"><div class="verdict-score"><span class="big">88</span><span class="denom">/100</span></div></div>',
    '<div class="review-stars">4.5 / 5</div>',
  ),
);
const noScoreGraph = JSON.parse(
  [...noEditorialScore.matchAll(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )][0][1],
) as { '@graph': Array<Record<string, unknown>> };
const noScoreReview = noScoreGraph['@graph'].find((node) => node['@type'] === 'Review')!;
assert.ok(
  !('reviewRating' in noScoreReview),
  'five-star values must not be converted when no visible /100 score exists',
);

// --- Legal status badge (grounded date, idempotent) ---
import { SITE_LEGAL_STATUS_VERIFIED_ON } from '../src/data/geo';
import { injectLegalStatusBadge } from '../src/lib/legalStatusBadge';

assert.equal(SITE_LEGAL_STATUS_VERIFIED_ON, '2026-07-09', 'badge date must match geo verification note');
const sample = `<body><div class="restricted-box" id="restricted"><div class="rh">x</div></div></body>`;
const badged = injectLegalStatusBadge(sample);
assert.match(badged, /Legal status last verified/);
assert.match(badged, new RegExp(`datetime="${SITE_LEGAL_STATUS_VERIFIED_ON}"`));
assert.equal(injectLegalStatusBadge(badged), badged, 'badge inject is idempotent');

// Chrome-light reviews: prefer verdict-box over dumping the badge at <body>
const light = `<body><nav>n</nav><main><div class="verdict-box"><div class="vtext">v</div></div></main></body>`;
const lightBadged = injectLegalStatusBadge(light);
assert.ok(
  lightBadged.indexOf('sc-legal-verified') < lightBadged.indexOf('class="verdict-box"'),
  'badge should sit immediately before verdict-box',
);
assert.ok(
  !/^<body[^>]*>\s*<!--sc-legal-verified-->/.test(lightBadged),
  'must not fall back to body-start when verdict-box exists',
);

// --- NCPG link on trust ribbon ---
import { complianceRibbonMarkup } from '../src/lib/pageChrome';
const ribbon = complianceRibbonMarkup();
assert.match(ribbon, /https:\/\/www\.ncpgambling\.org\//);
assert.match(ribbon, /1-800-GAMBLER/);

console.log('verify-schema-helpers: OK');
