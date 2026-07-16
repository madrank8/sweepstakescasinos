/**
 * Focused unit checks for audit P1 schema helpers (Legislation, FAQPage null-on-empty).
 * Run: npx tsx scripts/verify-schema-helpers.ts
 */
import assert from 'node:assert/strict';
import { faqPageNode, legislationNode } from '../src/lib/schema';

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
