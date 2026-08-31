import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TESTING_BRANDS } from '../../src/data/testingBrands';
import {
  auditAuthoredRoutes,
  auditSchemaParity,
  inventoryOperatorFacts,
  reconcileStateAuthorities,
  renderAuditReports,
  scanTestingClaims,
} from './audit-core';
import { classifyTestingClaim, findUnsupportedTestingClaims } from './claim-policy';

const root = resolve(import.meta.dirname, '../..');
const generator = readFileSync(resolve(root, 'scripts/generate-astro-pages.mjs'), 'utf8');
assert.doesNotMatch(generator, /independent US guide that tests and ranks/i);
assert.doesNotMatch(generator, /Reviews are hands-on tested and dated/i);

const operators = inventoryOperatorFacts(root);
assert.equal(operators.reviews.length, 29, 'all 29 authored reviews must be inventoried');
assert.equal(operators.homepage.length, 28, 'every homepage operator card must be inventoried');
assert.ok(
  operators.hubs.some((entry) => entry.path === 'src/routes/new/index.astro'),
  'new-casino hub operator facts must be inventoried',
);
assert.ok(
  operators.hubs.some((entry) => entry.path === 'src/routes/bonuses/no-deposit/index.astro'),
  'no-deposit hub operator facts must be inventoried',
);
assert.ok(
  operators.hubs.some((entry) => entry.path === 'src/routes/state-legality/index.astro'),
  'state hub operator authority must be inventoried',
);
assert.deepEqual(
  operators.reviews.map((review) => review.slug),
  [...operators.reviews.map((review) => review.slug)].sort(),
  'review inventory must be deterministic',
);
assert.equal(new Set(operators.homepage.map((card) => card.slug)).size, 28);
for (const slug of ['jackpota', 'jackpot-go']) {
  assert.ok(
    operators.conflicts.some(
      (conflict) => conflict.slug === slug && conflict.field === 'editorial score',
    ),
    `${slug} score conflict must remain explicit`,
  );
}

assert.equal(
  classifyTestingClaim({
    phrase: 'Tested',
    context: '<title>Example Casino Review — Tested</title>',
    surface: 'title',
    hasDocumentedEvidence: false,
  }).classification,
  'UNSUPPORTED',
);
assert.equal(
  classifyTestingClaim({
    phrase: 'Tested',
    context: '<title>Example Casino Review — Tested</title>',
    surface: 'title',
    hasDocumentedEvidence: true,
  }).classification,
  'DOCUMENTED_FIRST_HAND',
);
assert.equal(
  classifyTestingClaim({
    phrase: 'tested',
    context: 'Games are supplied by independently RNG-tested studios.',
    surface: 'body',
    hasDocumentedEvidence: false,
  }).classification,
  'THIRD_PARTY_OR_READER_DATA',
);
assert.equal(
  classifyTestingClaim({
    phrase: 'we tested',
    context: 'We tested the redemption flow.',
    surface: 'body',
    hasDocumentedEvidence: false,
  }).classification,
  'UNSUPPORTED',
);
assert.equal(
  findUnsupportedTestingClaims(
    '<title>Documented Review — Tested</title><h1>Tested review</h1>',
    'reviews/example.html',
    true,
  ).length,
  0,
  'documented evidence permits accurately scoped first-hand labels',
);

const unsupportedFirstHandFixtures = [
  'Our own tests cleared in two business days.',
  'Our test measured a four-minute support response.',
  'Our live chat response (test 1) took four minutes.',
  'We ran checks against the redemption flow.',
  'We conducted three support tests.',
  'We collected our own tests plus published policy and third-party reports.',
];
for (const fixture of unsupportedFirstHandFixtures) {
  const hits = findUnsupportedTestingClaims(
    `<p>${fixture}</p>`,
    'reviews/fixture.html',
    false,
  );
  assert.equal(
    hits.length,
    1,
    `evidence-less first-hand fixture must be blocked: ${fixture}`,
  );
}

assert.equal(
  findUnsupportedTestingClaims(
    '<p>Our own tests cleared in two business days.</p>',
    'reviews/fixture.html',
    true,
  ).length,
  0,
  'documented evidence permits a first-person testing result',
);
assert.equal(
  findUnsupportedTestingClaims(
    '<p>The operator reports independently tested games from certified studios.</p>',
    'reviews/fixture.html',
    false,
  ).length,
  0,
  'attributed operator and laboratory testing remains permitted',
);
assert.equal(
  findUnsupportedTestingClaims(
    '<script type="application/ld+json">{"name":"How fast does it pay?","text":"Our own tests cleared in two business days."}</script>',
    'reviews/fixture.html',
    false,
  ).length,
  1,
  'a nearby FAQ question must not mask an unsupported first-hand answer',
);

const rollaPath = resolve(root, 'reviews/rolla.html');
const rollaHtml = readFileSync(rollaPath, 'utf8');
assert.ok(
  TESTING_BRANDS.some(
    (brand) =>
      brand.slug === 'rolla' &&
      brand.overclaimFlag &&
      brand.reviewPath === 'reviews/rolla.html',
  ),
  'the overclaim gate must include the real Rolla review',
);
assert.doesNotMatch(
  rollaHtml,
  /\bour(?: own)? tests?\b|\bour (?:live chat|email) response\s*\(\s*test\s*[123]\s*\)/i,
  'the real Rolla review must not retain unsupported first-hand test claims',
);

const claims = scanTestingClaims(root);
assert.ok(claims.length > 0, 'the audit must enumerate matched testing phrases');
assert.ok(
  claims.some((claim) => claim.path === 'reviews/rolla.html'),
  'content lint and SEO audit claim inventory must include the real Rolla review',
);
for (const claim of claims) {
  assert.ok(claim.path && claim.line > 0 && claim.phrase);
  assert.ok(claim.classification && claim.evidenceBasis);
}
assert.deepEqual(
  claims,
  [...claims].sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.column - b.column),
  'claim inventory must be deterministic',
);
assert.equal(
  claims.filter((claim) => claim.classification === 'UNSUPPORTED').length,
  0,
  'authored publishable sources must not retain unsupported testing claims',
);

const routes = auditAuthoredRoutes(root);
assert.ok(routes.routes.some((route) => route.url === '/'));
assert.ok(routes.routes.some((route) => route.url === '/reviews/jackpota/'));
assert.ok(routes.routes.some((route) => route.url === '/best/sweepstakes-casinos/'));
assert.ok(routes.prototypeNoindex, 'prototype output must be noindex');
assert.ok(routes.links.every((link) => link.path && link.line > 0 && link.target));
assert.ok(
  routes.missingTargets.every((link) => !link.normalizedTarget.startsWith('/_external/')),
  'mirrored static assets must not be reported as missing routes',
);

const schema = auditSchemaParity(root);
assert.equal(schema.reviews.length, 29, 'schema parity must cover every review');
assert.ok(schema.reviews.every((review) => review.usesExistingVisibleScoreHelper));

const states = reconcileStateAuthorities();
assert.equal(states.states.length, 51, 'all tracker jurisdictions must be reconciled');
assert.equal(states.affiliates.length, 13, 'all affiliate authorities must be reconciled');
assert.ok(
  states.conflicts.every((conflict) =>
    ['RESOLVED', 'UNRESOLVED', 'MANUAL_REVIEW'].includes(conflict.status),
  ),
);

const reports = renderAuditReports(root);
assert.deepEqual(
  [...reports.keys()].sort(),
  [
    'cannibalisation-review.md',
    'commercial-hub-plan.md',
    'internal-link-map.md',
    'operator-data-conflicts.md',
    'schema-audit.md',
    'state-legality-conflicts.md',
    'technical-audit.md',
    'testing-claims-audit.md',
  ],
);
for (const [name, report] of reports) {
  assert.match(report, /^# /);
  assert.ok(report.endsWith('\n'), `${name} must end with a newline`);
}

console.log(
  `seo audit tests: OK — ${operators.reviews.length} reviews, ` +
    `${operators.homepage.length} homepage cards, ${claims.length} claim matches`,
);
