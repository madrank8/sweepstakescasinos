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
  authorPersonNode,
  brandOrganizationNode,
  breadcrumbNode,
  faqPageNode,
  legislationNode,
  organizationNode,
  webSiteNode,
} from '../src/lib/schema';
import { ALL_US_STATE_CODES } from '../src/data/usStates';
import { SITE } from '../src/data/site';
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

// --- Canonical publisher/author trust facts ---
const organization = organizationNode();
const website = webSiteNode();
const author = authorPersonNode();
assert.equal(organization['@id'], SITE.ids.organization);
assert.equal(organization.name, SITE.publisher.name);
assert.equal(organization.alternateName, SITE.publisher.alternateName);
assert.equal(organization.description, SITE.publisher.description);
assert.equal(
  (organization.contactPoint as Record<string, unknown>).email,
  SITE.contact.email,
);
assert.equal(website['@id'], SITE.ids.website);
assert.equal(website.name, SITE.publisher.name);
assert.equal(author['@id'], SITE.ids.author);
assert.equal(author.name, SITE.author.name);
assert.equal(author.description, SITE.author.description);
assert.equal(author.jobTitle, SITE.author.jobTitle);
assert.equal(AUTHOR_ID, SITE.ids.author);
assert.equal(ORG_ID, SITE.ids.organization);
assert.equal(WEBSITE_ID, SITE.ids.website);

const trustRibbon = (await import('../src/lib/pageChrome')).complianceRibbonMarkup();
assert.match(trustRibbon, new RegExp(SITE.author.name));
assert.match(trustRibbon, new RegExp(SITE.author.path));
const authoredBylines = [
  { path: '../src/routes/guides/index.astro', includesTitle: true },
  { path: '../src/routes/new/index.astro', includesTitle: true },
  { path: '../src/routes/bonuses/no-deposit/index.astro', includesTitle: true },
  { path: '../src/routes/states/[slug].astro', includesTitle: true },
  { path: '../src/routes/sweepstakes-tracker/index.astro', includesTitle: true },
  {
    path: '../src/routes/sweepstakes-tracker/methodology.astro',
    includesTitle: false,
  },
] as const;
for (const byline of authoredBylines) {
  const source = readFileSync(new URL(byline.path, import.meta.url), 'utf8');
  assert.match(source, /SITE\.author\.name/, `${byline.path} must use the canonical author name`);
  assert.match(source, /SITE\.author\.path/, `${byline.path} must use the canonical author path`);
  assert.doesNotMatch(source, new RegExp(SITE.author.name), `${byline.path} must not duplicate the author name`);
  if (byline.includesTitle) {
    assert.match(source, /SITE\.author\.jobTitle/, `${byline.path} must use the canonical author title`);
    assert.doesNotMatch(source, new RegExp(SITE.author.jobTitle), `${byline.path} must not duplicate the author title`);
  }
}
const contentLayoutSource = readFileSync(
  new URL('../src/layouts/ContentLayout.astro', import.meta.url),
  'utf8',
);
assert.match(contentLayoutSource, /SITE\.origin/);
assert.doesNotMatch(
  contentLayoutSource,
  /const ORIGIN = ['"]https:\/\/sweepstakeswiz\.com['"]/,
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

for (const [file, expectedVisible, expectedCanonical] of [
  ['big-pirate.html', 79, undefined],
  ['sweepico.html', 85, undefined],
  ['american-luck.html', 72, 72],
] as const) {
  const source = readFileSync(new URL(`../reviews/${file}`, import.meta.url), 'utf8');
  assert.equal(
    visibleEditorialScore(source),
    expectedVisible,
    `${file} visible verdict score must be detected`,
  );
  const reviewNode = graphFromHtml(consolidateJsonLd(source)).find(
    (node) => node['@type'] === 'Review',
  );
  assert.deepEqual(
    reviewNode?.reviewRating,
    expectedCanonical === undefined
      ? undefined
      : {
          '@type': 'Rating',
          ratingValue: expectedCanonical,
          bestRating: 100,
          worstRating: 0,
        },
  );
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
</head><body><div class="verdict-box"><div class="verdict-score"><span class="big">88</span><span class="denom">/100</span></div></div>
<div class="faq"><div class="faq-item"><button class="faq-btn">Is it safe?<span class="faq-arrow">+</span></button><div class="faq-inner">Use &lt;care&gt;.</div></div></div>
</body></html>`;
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
assert.deepEqual(
  consolidatedGraph['@graph'].find((node) => node['@type'] === 'FAQPage')
    ?.mainEntity,
  [
    {
      '@type': 'Question',
      name: 'Is it safe?',
      acceptedAnswer: { '@type': 'Answer', text: 'Use <care>.' },
    },
  ],
  'FAQPage schema must mirror the visible FAQ only',
);
const review = consolidatedGraph['@graph'].find((node) => node['@type'] === 'Review')!;
assert.equal(
  review.reviewRating,
  undefined,
  'reviews outside the canonical operator inventory must not inherit a visible score',
);
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

// --- Review availability summary (three authorities, grounded dates) ---
import { SITE_LEGAL_STATUS_VERIFIED_ON } from '../src/data/geo';
import { injectLegalStatusBadge } from '../src/lib/legalStatusBadge';
import { fallbackStates } from '../src/lib/tracker/fallback';
import { getPartner } from '../src/data/affiliates';

const sample = `<body><div class="restricted-box" id="restricted"><div class="rh">x</div></div></body>`;
const unknownBadged = injectLegalStatusBadge(sample, {
  partner: getPartner('mcluck'),
});
assert.match(unknownBadged, /Location unknown/);
assert.match(unknownBadged, /Affiliate offer availability: unknown/);
assert.doesNotMatch(
  unknownBadged,
  /Legal status last verified/,
  'site-policy date must not masquerade as tracker legal freshness',
);
assert.doesNotMatch(unknownBadged, /datetime=/, 'unknown legal freshness must remain absent');

const txState = fallbackStates.find((state) => state.state_code === 'TX')!;
const badged = injectLegalStatusBadge(sample, {
  state: 'TX',
  trackerState: txState,
  partner: getPartner('mcluck'),
});
assert.match(badged, /Tracker legal status/);
assert.match(badged, /Gray market/);
assert.match(badged, /Affiliate offer availability: available/);
assert.match(badged, /datetime="2026-07-12T00:00:00.000Z"/);
assert.match(badged, new RegExp(`Site CTA policy verified[\\s\\S]*${SITE_LEGAL_STATUS_VERIFIED_ON}`));
assert.equal(injectLegalStatusBadge(badged), badged, 'badge inject is idempotent');

const caState = fallbackStates.find((state) => state.state_code === 'CA')!;
const cardCrushBadge = injectLegalStatusBadge(sample, {
  state: 'CA',
  trackerState: caState,
  partner: getPartner('card-crush'),
});
assert.match(cardCrushBadge, /Commercially listed by the affiliate partner/);
assert.match(cardCrushBadge, /site CTA policy suppresses this offer/);
assert.doesNotMatch(cardCrushBadge, /Card Crush is illegal/i);

const missingFreshnessBadge = injectLegalStatusBadge(sample, {
  state: 'TX',
  trackerState: {
    ...txState,
    last_reviewed_at: '',
    last_auto_updated_at: '',
  },
  partner: getPartner('mcluck'),
});
assert.match(missingFreshnessBadge, /freshness unavailable/);
assert.doesNotMatch(missingFreshnessBadge, /datetime="(?:null|undefined|)"/);

// Chrome-light reviews: prefer verdict-box over dumping the badge at <body>
const light = `<body><nav>n</nav><main><div class="verdict-box"><div class="vtext">v</div></div></main></body>`;
const lightBadged = injectLegalStatusBadge(light, {
  state: 'TX',
  trackerState: txState,
  partner: getPartner('mcluck'),
});
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
