/**
 * Focused verification for Task 1: technical entity and discovery paths.
 *
 * Checks:
 * 1. Four canonical brand entities exist in src/data/brandEntities.ts:
 *    dexyplay, sweepico, wow-vegas, big-pirate.
 * 2. Each entity matches the canonical #brand node on its review page,
 *    including operator identity and only source-published address detail.
 * 3. DexyPlay appears in the /new/ hub roster (src/routes/new/index.astro);
 *    dateModified is updated to 2026-09-08 while datePublished keeps its
 *    historical value; all visible freshness tokens/captions read September 2026.
 * 4. The homepage (index.html) contains a contextual link to /bonuses/no-deposit/
 *    and the editorial hub anchor survives the SSR affiliate CTA transform in
 *    null/unknown, CA-banned and TX-allowed states while real operator CTAs stay
 *    suppressed in banned states.
 * 5. Existing trackerReconcile behavior maps the new operator slugs to Wiz
 *    review paths (editorial cross-links only; no affiliate behavior).
 * 6. The four new slugs are explicitly absent from the affiliate partner list.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BRAND_ENTITIES, getBrandEntity, brandEntityId } from '../src/data/brandEntities';
import { AFFILIATE_PARTNERS } from '../src/data/affiliates';
import type { UsStateCode } from '../src/data/usStates';
import { suppressAffiliateCtas } from '../src/lib/affiliateHtml';
import { wizReviewPathForOperator } from '../src/data/trackerReconcile';

const REPO_ROOT = new URL('..', import.meta.url).pathname;

// ── 1. Brand entities ──
const requiredSlugs = ['dexyplay', 'sweepico', 'wow-vegas', 'big-pirate'] as const;
for (const slug of requiredSlugs) {
  assert.ok(slug in BRAND_ENTITIES, `BRAND_ENTITIES must include ${slug}`);
}

// Stable @id must match the canonical pattern
for (const slug of requiredSlugs) {
  assert.equal(brandEntityId(slug), `https://sweepstakeswiz.com/reviews/${slug}/#brand`);
}

type JsonObject = Record<string, unknown>;

function canonicalReviewBrand(slug: (typeof requiredSlugs)[number]): JsonObject {
  const html = readFileSync(`${REPO_ROOT}reviews/${slug}.html`, 'utf8');
  const nodes: unknown[] = [];
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const parsed = JSON.parse(match[1]) as JsonObject;
    const graph = parsed['@graph'];
    nodes.push(...(Array.isArray(graph) ? graph : [parsed]));
  }
  const expectedId = brandEntityId(slug);
  const brand = nodes.find(
    (node): node is JsonObject =>
      node !== null && typeof node === 'object' && (node as JsonObject)['@id'] === expectedId,
  );
  assert.ok(brand, `reviews/${slug}.html must publish canonical ${expectedId}`);
  return brand;
}

for (const slug of requiredSlugs) {
  const entity = getBrandEntity(slug)!;
  const sourceBrand = canonicalReviewBrand(slug);
  const sourceOperator = sourceBrand.parentOrganization as JsonObject | undefined;
  const sourceAddress = sourceOperator?.address as JsonObject | undefined;
  const normalizedSourceAddress = sourceAddress
    ? Object.fromEntries(Object.entries(sourceAddress).filter(([key]) => key !== '@type'))
    : undefined;

  assert.equal(entity.name, sourceBrand.name, `${slug} entity name must match its review #brand`);
  assert.equal(entity.officialUrl, sourceBrand.url, `${slug} official URL must match its review #brand`);
  assert.equal(
    entity.operatorName,
    sourceOperator?.name,
    `${slug} operator name must match its review #brand`,
  );
  assert.deepEqual(
    entity.operatorAddress,
    normalizedSourceAddress,
    `${slug} operator address must contain only detail published by its review #brand`,
  );
}

// ── 2. /new/ hub roster and freshness ──
const newHub = readFileSync(`${REPO_ROOT}src/routes/new/index.astro`, 'utf8');
assert.match(newHub, /slug:\s*['"]dexyplay['"]/, '/new/ hub must include DexyPlay roster entry');
assert.match(newHub, /const UPDATED_LABEL = 'September 2026';/, 'UPDATED_LABEL must be September 2026');
assert.match(newHub, /const DATE_PUBLISHED = '2026-07-08';/, 'DATE_PUBLISHED keeps historical 2026-07-08');
assert.match(newHub, /const DATE_MODIFIED = '2026-09-08';/, 'DATE_MODIFIED must be 2026-09-08');
assert.match(newHub, /<strong>Updated \{UPDATED_LABEL\}\.<\/strong>/, 'Visible updated line must use UPDATED_LABEL');

function operatorEntry(slug: string): string {
  const start = newHub.indexOf(`slug: '${slug}'`);
  assert.ok(start >= 0, `/new/ hub must include ${slug}`);
  const end = newHub.indexOf('\n  },', start);
  assert.ok(end > start, `/new/ hub must have a complete ${slug} roster entry`);
  return newHub.slice(start, end);
}

assert.match(
  operatorEntry('american-luck'),
  /tier:\s*'recent'[\s\S]*added:\s*'Added July 2026'/,
  'American Luck must retain its July 2026 added date without remaining the newest addition',
);
assert.match(
  operatorEntry('dexyplay'),
  /tier:\s*'newest'[\s\S]*added:\s*'Added September 2026'/,
  'DexyPlay must be identified as the September 2026 addition',
);

const titleMatch = newHub.match(/const title = '([^']+)';/);
assert.ok(titleMatch, '/new/ hub must define a page title');
assert.match(titleMatch[1], /\bSeptember 2026\b/, '/new/ title must carry September 2026 freshness');

const descriptionMatch = newHub.match(/const description =([\s\S]*?);\n\nconst breadcrumbs/);
assert.ok(descriptionMatch, '/new/ hub must define a page description');
assert.match(
  descriptionMatch[1],
  /UPDATED_LABEL/,
  '/new/ description must resolve through the September 2026 updated label',
);

const heroTitleMatch = newHub.match(/heroTitle=\{'([^']+)'\}/);
assert.ok(heroTitleMatch, '/new/ hub must define a hero H1');
assert.match(heroTitleMatch[1], /\bSeptember 2026\b/, '/new/ H1 must carry September 2026 freshness');

for (const id of ['#vet-checklist', '#eligibility-flow']) {
  const start = newHub.indexOf(`\`\${canonical}${id}\``);
  const end = newHub.indexOf('creator:', start);
  assert.ok(start >= 0 && end > start, `/new/ JSON-LD must define ${id}`);
  assert.match(
    newHub.slice(start, end),
    /\bSeptember 2026\b/,
    `/new/ JSON-LD ${id} caption must carry September 2026 freshness`,
  );
}

for (const id of ['new-vet-cap', 'new-geo-cap']) {
  const caption = newHub.match(new RegExp(`<figcaption id="${id}">([\\s\\S]*?)<\\/figcaption>`));
  assert.ok(caption, `/new/ hub must define ${id}`);
  assert.match(
    caption[1],
    /\bSeptember 2026\b/,
    `/new/ ${id} must carry September 2026 freshness`,
  );
}

// ── 3. Homepage contextual link to no-deposit hub ──
const homepage = readFileSync(`${REPO_ROOT}index.html`, 'utf8');
assert.match(homepage, /href="\/bonuses\/no-deposit\//, 'Homepage source must link to /bonuses/no-deposit/');

// The no-deposit hub is an editorial route, not an operator CTA; it must survive
// the homepage SSR affiliate transform in every geo state.
for (const state of [null, 'CA', 'TX'] as Array<UsStateCode | null>) {
  const transformed = suppressAffiliateCtas(homepage, state);
  assert.match(
    transformed,
    /href="\/bonuses\/no-deposit\//,
    `Homepage no-deposit hub must survive suppressAffiliateCtas in state ${String(state)}`,
  );
}

// Sanity check: a real operator CTA must still be suppressed in CA so the fix
// cannot bypass legal gating.
const caHomepage = suppressAffiliateCtas(homepage, 'CA');
assert.doesNotMatch(
  caHomepage,
  /href="\/bonuses\/mcluck\//,
  'Operator CTA (/bonuses/mcluck/) must still be suppressed in CA',
);

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
