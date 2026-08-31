import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { AFFILIATE_PARTNERS } from '../src/data/affiliates';
import { OPERATORS } from '../src/data/operators';
import {
  contextualLinksForGuide,
  injectReviewContextualLinks,
  selectAvailableStateReviews,
  selectReviewAlternatives,
  selectReviewContextualLinks,
} from '../src/lib/internalLinks';
import {
  hasAffiliateCtas,
  prepareSsrAffiliateReviewHtml,
} from '../src/lib/affiliateHtml';
import { getStaticReviewHtml } from '../src/lib/staticHtml.js';
import { fallbackStates } from '../src/lib/tracker/fallback';
import { auditAuthoredRoutes } from './seo/audit-core';

const root = resolve(import.meta.dirname, '..');

const alternatives = selectReviewAlternatives('mcluck', OPERATORS, 2);
const reversedAlternatives = selectReviewAlternatives(
  'mcluck',
  [...OPERATORS].reverse(),
  2,
);
assert.deepEqual(
  alternatives,
  reversedAlternatives,
  'alternative selection must not depend on source ordering',
);
assert.equal(alternatives.length, 2);
assert.ok(alternatives.every((link) => link.href !== '/reviews/mcluck/'));
assert.ok(alternatives.every((link) => /\b(?:related|similar)\b/i.test(link.label)));
assert.ok(alternatives.every((link) => !/\bbetter\b/i.test(link.label)));

const alphabetical = selectAvailableStateReviews('TX', undefined, AFFILIATE_PARTNERS);
const commerciallyReordered = selectAvailableStateReviews(
  'TX',
  undefined,
  [...AFFILIATE_PARTNERS]
    .map((partner, index) => ({ ...partner, cpa: 10_000 - index }))
    .reverse(),
);
assert.deepEqual(
  alphabetical,
  commerciallyReordered,
  'state review links must ignore affiliate input order and CPA',
);
assert.deepEqual(
  alphabetical.map((link) => link.label),
  [...alphabetical.map((link) => link.label)].sort((a, b) => a.localeCompare(b)),
  'state review links must use deterministic editorial ordering',
);

const knownStateLinks = selectReviewContextualLinks('mcluck', 'CA');
assert.ok(knownStateLinks.some((link) => link.href === '/states/california/'));
assert.ok(!knownStateLinks.some((link) => link.href === '/state-legality/'));
const unknownStateLinks = selectReviewContextualLinks('mcluck');
assert.ok(unknownStateLinks.some((link) => link.href === '/state-legality/'));
assert.equal(
  new Set(unknownStateLinks.map((link) => link.href)).size,
  unknownStateLinks.length,
  'review contextual destinations must be unique',
);

const fixture =
  '<html><body><main><p>Original review copy.</p><p><a href="/new/">Existing new hub link</a></p></main></body></html>';
const injected = injectReviewContextualLinks(fixture, {
  reviewSlug: 'mcluck',
  state: 'CA',
});
assert.match(injected, /<!--sc-contextual-nav-->/);
assert.match(injected, /Original review copy\./);
assert.equal(
  (injected.match(/href="\/new\/"/g) ?? []).length,
  1,
  'a nearby destination must not be duplicated by the contextual block',
);
assert.equal(
  injectReviewContextualLinks(injected, { reviewSlug: 'mcluck', state: 'CA' }),
  injected,
  'review contextual injection must be idempotent',
);

const reviewFiles = readdirSync(resolve(root, 'reviews'))
  .filter((file) => file.endsWith('.html'))
  .sort();
assert.equal(reviewFiles.length, 29);
for (const file of reviewFiles) {
  const slug = file.replace(/\.html$/, '');
  const relativePath = `reviews/${file}`;
  const raw = readFileSync(resolve(root, relativePath), 'utf8');
  const rendered = hasAffiliateCtas(raw)
    ? prepareSsrAffiliateReviewHtml(raw, undefined, slug, `review-${slug}`)
    : getStaticReviewHtml(relativePath, slug);
  assert.match(rendered, /<!--sc-contextual-nav-->/, `${slug} must receive contextual links`);
  assert.match(rendered, /href="\/state-legality\/"/, `${slug} unknown-region fallback`);
  const block = rendered.match(
    /<!--sc-contextual-nav-->[\s\S]*?<\/(?:nav|aside)>/,
  )?.[0];
  assert.ok(block, `${slug} must render a concise contextual navigation block`);
  const destinations = [...block.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(
    new Set(destinations).size,
    destinations.length,
    `${slug} contextual block destinations must be unique`,
  );
  assert.ok(
    destinations.some((href) => /^\/reviews\/[^/]+\/$/.test(href)),
    `${slug} must link to at least one deterministic related review`,
  );
}

const ssrRaw = readFileSync(resolve(root, 'reviews/mcluck.html'), 'utf8');
const ssrKnownState = prepareSsrAffiliateReviewHtml(
  ssrRaw,
  'CA',
  'mcluck',
  'review-mcluck',
  fallbackStates.find((state) => state.state_code === 'CA'),
);
assert.match(ssrKnownState, /href="\/states\/california\/"/);
const knownStateBadge = ssrKnownState.match(
  /<!--sc-legal-verified-->[\s\S]*?<\/p>/,
)?.[0];
assert.ok(knownStateBadge);
assert.doesNotMatch(knownStateBadge, /Location unknown/);

for (const guideSlug of [
  'amoe-sweepstakes-casinos',
  'how-to-redeem-sweeps-coins',
  'what-are-sweepstakes-casinos',
]) {
  const guideLinks = contextualLinksForGuide(guideSlug);
  assert.equal(guideLinks[0]?.href, '/guides/');
  assert.ok(
    guideLinks.some((link) =>
      ['/best/sweepstakes-casinos/', '/bonuses/no-deposit/', '/state-legality/'].includes(
        link.href,
      ),
    ),
    `${guideSlug} must receive a context-appropriate commercial destination`,
  );
}

const routeAudit = auditAuthoredRoutes(root);
assert.ok(
  !routeAudit.orphanCandidates.some((route) => route.url === '/best/'),
  'redirect-only section roots must not be reported as content orphans',
);

console.log(
  `internal-link tests: OK — ${reviewFiles.length} reviews, ` +
    `${alphabetical.length} Texas review links`,
);
