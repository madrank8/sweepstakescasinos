/**
 * Focused verification for Task 1: technical entity and discovery paths.
 *
 * Checks:
 * 1. Four canonical brand entities exist in src/data/brandEntities.ts:
 *    dexyplay, sweepico, wow-vegas, big-pirate.
 * 2. Each entity carries the required official identity (operator, address
 *    where provided, official URL).
 * 3. DexyPlay appears in the /new/ hub roster (src/routes/new/index.astro);
 *    dateModified is updated to 2026-09-08 while datePublished keeps its
 *    historical value; all visible freshness tokens/captions read September 2026.
 * 4. The homepage (index.html) contains a contextual link to /bonuses/no-deposit/.
 * 5. Existing trackerReconcile behavior maps the new operator slugs to Wiz
 *    review paths (editorial cross-links only; no affiliate behavior).
 * 6. The four new slugs are explicitly absent from the affiliate partner list.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BRAND_ENTITIES, getBrandEntity, brandEntityId } from '../src/data/brandEntities';
import { AFFILIATE_PARTNERS } from '../src/data/affiliates';
import { wizReviewPathForOperator } from '../src/data/trackerReconcile';

const REPO_ROOT = new URL('..', import.meta.url).pathname;

// ── 1. Brand entities ──
const requiredSlugs = ['dexyplay', 'sweepico', 'wow-vegas', 'big-pirate'] as const;
for (const slug of requiredSlugs) {
  assert.ok(slug in BRAND_ENTITIES, `BRAND_ENTITIES must include ${slug}`);
}

// DexyPlay
const dexy = getBrandEntity('dexyplay')!;
assert.equal(dexy.name, 'DexyPlay');
assert.equal(dexy.officialUrl, 'https://www.dexyplay.com/');
assert.equal(dexy.operatorName, 'UTech Solutions LLC');
assert.deepEqual(dexy.operatorAddress, {
  streetAddress: '571 S Washington',
  addressLocality: 'Afton',
  addressRegion: 'WY',
  postalCode: '83110',
  addressCountry: 'US',
});

// Sweepico
const sweepico = getBrandEntity('sweepico')!;
assert.equal(sweepico.name, 'Sweepico');
assert.equal(sweepico.officialUrl, 'https://www.sweepico.com/');
assert.equal(sweepico.operatorName, 'UTech Solutions LLC');
assert.deepEqual(sweepico.operatorAddress, {
  streetAddress: '571 S Washington',
  addressLocality: 'Afton',
  addressRegion: 'WY',
  postalCode: '83110',
  addressCountry: 'US',
});

// WOW Vegas
const wow = getBrandEntity('wow-vegas')!;
assert.equal(wow.name, 'WOW Vegas');
assert.equal(wow.officialUrl, 'https://www.wowvegas.com/');
assert.equal(wow.operatorName, 'MW Services Limited');
assert.deepEqual(wow.operatorAddress, {
  streetAddress: '5–9 Main Street',
  addressLocality: 'Gibraltar',
  postalCode: 'GX11 1AA',
  addressCountry: 'GI',
});

// Big Pirate — transcribed exactly from the inline #brand JSON-LD in reviews/big-pirate.html
const bigPirate = getBrandEntity('big-pirate')!;
assert.equal(bigPirate.name, 'Big Pirate Sweepstakes Casino');
assert.equal(bigPirate.officialUrl, 'https://www.bigpirate.com/');
assert.equal(bigPirate.operatorName, 'Rafflefy Limited');
assert.equal(bigPirate.operatorAddress, undefined, 'Big Pirate JSON-LD does not publish an operator address');

// Stable @id must match the canonical pattern
for (const slug of requiredSlugs) {
  assert.equal(brandEntityId(slug), `https://sweepstakeswiz.com/reviews/${slug}/#brand`);
}

// ── 2. /new/ hub roster and freshness ──
const newHub = readFileSync(`${REPO_ROOT}src/routes/new/index.astro`, 'utf8');
assert.match(newHub, /slug:\s*['"]dexyplay['"]/, '/new/ hub must include DexyPlay roster entry');
assert.match(newHub, /const UPDATED_LABEL = 'September 2026';/, 'UPDATED_LABEL must be September 2026');
assert.match(newHub, /const DATE_PUBLISHED = '2026-07-08';/, 'DATE_PUBLISHED keeps historical 2026-07-08');
assert.match(newHub, /const DATE_MODIFIED = '2026-09-08';/, 'DATE_MODIFIED must be 2026-09-08');
assert.match(newHub, /<strong>Updated \{UPDATED_LABEL\}\.<\/strong>/, 'Visible updated line must use UPDATED_LABEL');
// Every September 2026 freshness token/caption: UPDATED_LABEL, American Luck added line, 2 JSON-LD captions, 2 figcaptions.
const septemberMatches = newHub.match(/September 2026/g);
assert.ok(septemberMatches, 'September 2026 freshness tokens must be present');
assert.equal(septemberMatches.length, 6, 'All six intended September 2026 freshness tokens/captions must be present');

// ── 3. Homepage contextual link to no-deposit hub ──
const homepage = readFileSync(`${REPO_ROOT}index.html`, 'utf8');
assert.match(homepage, /href="\/bonuses\/no-deposit\//, 'Homepage must link to /bonuses/no-deposit/');

// ── 4. Tracker reconciliation behavior (editorial review paths only) ──
for (const slug of requiredSlugs) {
  const path = wizReviewPathForOperator(slug);
  assert.equal(path, `/reviews/${slug}/`, `trackerReconcile must map ${slug} to editorial review path`);
}

// ── 5. No affiliate behavior for the new non-partner entities ──
const affiliateSlugs = new Set(AFFILIATE_PARTNERS.map((p) => p.slug));
for (const slug of requiredSlugs) {
  assert.ok(!affiliateSlugs.has(slug), `${slug} must not be an affiliate partner`);
  assert.ok(getBrandEntity(slug), `${slug} must have a canonical brand entity`);
}

console.log('verify-priority-seo-technical: OK');
