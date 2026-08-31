import assert from 'node:assert/strict';
import { resolve } from 'node:path';
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

const operators = inventoryOperatorFacts(root);
assert.equal(operators.reviews.length, 29, 'all 29 authored reviews must be inventoried');
assert.equal(operators.homepage.length, 28, 'every homepage operator card must be inventoried');
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

const claims = scanTestingClaims(root);
assert.ok(claims.length > 0, 'the audit must enumerate matched testing phrases');
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
