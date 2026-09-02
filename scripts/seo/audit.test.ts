import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TESTING_BRANDS } from '../../src/data/testingBrands';
import { AFFILIATE_PARTNERS } from '../../src/data/affiliates';
import {
  reconcileAvailabilityAuthorities,
  renderAvailabilityConflictReport,
} from '../../src/lib/availability';
import {
  fallbackAvailability,
  fallbackOperators,
  fallbackStates,
} from '../../src/lib/tracker/fallback';
import { softenOverclaimHtml } from '../../src/lib/testingFragments';
import {
  DETERMINISTIC_AUDIT_SNAPSHOT_AS_OF,
  auditAuthoredRoutes,
  auditSchemaParity,
  evaluateCommercialHubCandidates,
  findAuditReportDrift,
  inventoryOperatorFacts,
  renderAuditReports,
  scanTestingClaims,
} from './audit-core';
import { classifyTestingClaim, findUnsupportedTestingClaims } from './claim-policy';

const root = resolve(import.meta.dirname, '../..');
const conflicts = readFileSync(resolve(root, 'docs/seo/operator-data-conflicts.md'), 'utf8');
const unresolvedScores = (
  conflicts.match(/^\| [a-z0-9-]+ \| editorial score \|.*\| UNRESOLVED \|$/gm) ?? []
).length;
assert.equal(unresolvedScores, 0, 'no editorial score conflicts may remain unresolved');

const generator = readFileSync(resolve(root, 'scripts/generate-astro-pages.mjs'), 'utf8');
assert.doesNotMatch(generator, /independent US guide that tests and ranks/i);
assert.doesNotMatch(generator, /Reviews are hands-on tested and dated/i);

const operators = inventoryOperatorFacts(root);
assert.equal(operators.reviews.length, 29, 'all 29 authored reviews must be inventoried');
assert.equal(
  operators.homepage.length,
  12,
  'the served homepage primary decision-support set must be inventoried',
);
assert.ok(
  operators.homepage.every((operator) => operator.path === 'src/routes/index.astro'),
  'homepage inventory must use the served authored Astro source',
);
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
assert.equal(
  new Set(operators.homepage.map((card) => card.slug)).size,
  operators.homepage.length,
);
const historicalScoreConflictSlugs = [
  'acebet',
  'big-pirate',
  'card-crush',
  'casino-click',
  'crown-coins',
  'dexyplay',
  'freespin',
  'hello-millions',
  'high5',
  'jackpot-go',
  'jackpota',
  'lucky-bunny',
  'mcluck',
  'mega-bonanza',
  'pulsz',
  'rolla',
  'spinblitz',
  'spinfinite',
  'splash-coins',
  'spree',
  'sweepico',
  'sweet-sweeps',
  'thrillzz',
  'wow-vegas',
  'zula',
];
const historicalScoreConflicts = operators.conflicts.filter(
  (conflict) => conflict.field === 'editorial score',
);
assert.deepEqual(
  historicalScoreConflicts.map((conflict) => conflict.slug),
  historicalScoreConflictSlugs,
  'all 25 historical score disagreements must remain explicit audit evidence',
);
for (const conflict of historicalScoreConflicts) {
  assert.ok(
    conflict.sources.some(
      (source) =>
        source.path === 'index.html' &&
        /^(?:[1-5](?:\.\d+)?)\/5$/.test(source.value),
    ),
    `${conflict.slug} must retain its historical homepage /5 score`,
  );
  assert.ok(
    conflict.sources.some(
      (source) =>
        source.path === `reviews/${conflict.slug}.html#review-jsonld` &&
        /^(?:[1-5](?:\.\d+)?)\/5$/.test(source.value),
    ),
    `${conflict.slug} must retain its legacy Review JSON-LD /5 score`,
  );
}
const welcomeOfferConflicts = operators.conflicts.filter(
  (conflict) => conflict.field === 'welcome offer',
);
assert.deepEqual(
  welcomeOfferConflicts.map((conflict) => conflict.slug),
  ['crown-coins', 'hello-millions', 'spinblitz', 'spree'],
  'all four unresolved welcome-offer conflicts must remain detected',
);
for (const conflict of welcomeOfferConflicts) {
  assert.ok(
    conflict.sources.some((source) =>
      source.path.startsWith(`src/data/operators.ts#${conflict.slug}.signupOffer`),
    ),
    `${conflict.slug} must cite its canonical unresolved fact sources`,
  );
  assert.ok(
    conflict.sources.some((source) =>
      [
        'reviews/',
        'src/content/comparisons/sweepstakes-casinos.mdx',
        'src/routes/bonuses/no-deposit/index.astro',
      ].some((prefix) => source.path.startsWith(prefix)),
    ),
    `${conflict.slug} must cite a currently served review or hub/comparison surface`,
  );
  assert.ok(
    conflict.sources.every((source) => source.path !== 'src/routes/index.astro'),
    `${conflict.slug} must not be attributed to the served homepage`,
  );
}
assert.equal(
  new Set(operators.homepage.map((card) => card.slug)).size,
  operators.homepage.length,
  'the homepage inventory must not duplicate primary candidates',
);

const hubCandidates = evaluateCommercialHubCandidates();
assert.ok(hubCandidates.length >= 2);
assert.ok(
  hubCandidates.every((candidate) => candidate.decision === 'DEFER'),
  'freshness-dependent candidate hubs must remain deferred',
);
assert.ok(
  hubCandidates.every((candidate) =>
    candidate.unmetGates.some((gate) => /lastVerifiedDate|freshness/i.test(gate)),
  ),
  'every freshness-dependent candidate must name the missing freshness gate',
);
assert.ok(
  hubCandidates
    .find((candidate) => candidate.id === 'free-sweeps-coins-superlative')
    ?.unmetGates.some((gate) => /bonuses\/no-deposit/i.test(gate)),
  'the free-SC candidate must record the existing competing URL',
);

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
  "When we tested this casino against the operator's published terms, we found redemptions landed in 18 hours.",
  'Our own tests show payouts arrive in 18 hours, if the operator policy allows it.',
  'Our editors registered accounts and requested a redemption before publishing.',
];
for (const fixture of unsupportedFirstHandFixtures) {
  const hits = findUnsupportedTestingClaims(
    `<p>${fixture}</p>`,
    'reviews/fixture.html',
    false,
  );
  assert.ok(
    hits.length >= 1,
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
    '<p>Deadspin.com full independent review — redemption timelines and legitimacy tested.</p>',
    'reviews/fixture.html',
    false,
  ).length,
  0,
  'a domain-name period must not sever third-party attribution',
);
assert.equal(
  findUnsupportedTestingClaims(
    "<p>We don't publish invented first-hand payout numbers; our reviews track published policy.</p>",
    'reviews/fixture.html',
    false,
  ).length,
  0,
  'an explicit first-hand claim negation remains permitted',
);
assert.equal(
  findUnsupportedTestingClaims(
    '<p>Share your real, first-hand redemption experience; we aggregate reader reports.</p>',
    'reviews/fixture.html',
    false,
  ).length,
  0,
  'a request for attributed reader experience is not a site testing claim',
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
const softenedClaim = softenOverclaimHtml(
  '{"text":"Our own tests cleared in two business days. Published policy and attributed reader reports remain."}',
);
assert.doesNotMatch(
  softenedClaim,
  /\bour own tests?\b/i,
  'the content softener must remove unsupported own-test sentences',
);
assert.match(
  softenedClaim,
  /Published policy and attributed reader reports remain\./,
  'the content softener must preserve attributed information after an own-test sentence',
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
const aboutHtml = readFileSync(resolve(root, 'about.html'), 'utf8');
assert.match(aboutHtml, /Rates sites against 4 fixed criteria/i);
assert.doesNotMatch(aboutHtml, /Rates sites against 7 fixed criteria/i);
const howWeRateHtml = readFileSync(resolve(root, 'how-we-rate.html'), 'utf8');
const howWeRateDescription =
  howWeRateHtml.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? '';
assert.match(
  howWeRateDescription,
  /\b(?:four|4)[ -]criteria\b/i,
  'How We Rate metadata must describe the current four-criteria methodology',
);
assert.doesNotMatch(
  howWeRateDescription,
  /\b(?:seven|7)[ -]criteria\b/i,
  'How We Rate metadata must not describe the retired seven-criteria methodology',
);
for (const unsupportedProcessClaim of [
  /drives roughly half of our re-investigations/i,
  /operators have offered increased commission rates/i,
  /reviewers are not informed which operators have signed referral agreements/i,
  /the site that ranks #1 is the site that scored highest/i,
]) {
  assert.doesNotMatch(
    aboutHtml,
    unsupportedProcessClaim,
    `About copy must state policy without unsupported operational history: ${unsupportedProcessClaim}`,
  );
}

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
assert.deepEqual(
  routes.routes.filter((route) => route.url === '/').map((route) => route.source),
  ['src/routes/index.astro'],
  'legacy index.html must remain audit evidence, not a live route',
);
assert.ok(routes.routes.some((route) => route.url === '/reviews/'));
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

const reports = renderAuditReports(root, {
  redemptionIndexAsOf: DETERMINISTIC_AUDIT_SNAPSHOT_AS_OF,
});
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
assert.deepEqual(
  findAuditReportDrift(root, reports),
  [],
  'every committed deterministic SEO audit must match generated bytes',
);
assert.match(
  readFileSync(resolve(root, 'scripts/seo/run-audits.ts'), 'utf8'),
  /findAuditReportDrift/,
  'the CI audit entrypoint must fail on committed report byte drift',
);
assert.match(
  reports.get('cannibalisation-review.md') ?? '',
  /Directory intent/,
  'cannibalisation report must explain reviews directory intent',
);
assert.match(
  reports.get('cannibalisation-review.md') ?? '',
  /historical audit evidence/i,
  'cannibalisation report must identify legacy index.html as historical only',
);
for (const name of [
  'cannibalisation-review.md',
  'commercial-hub-plan.md',
  'technical-audit.md',
] as const) {
  assert.doesNotMatch(
    reports.get(name) ?? '',
    /four supported editor picks|supported ranked cards|canonically supported ranked set|deeper ranked[/-]comparison/i,
    `${name} must not reintroduce an unsupported homepage or comparison ranking`,
  );
}
assert.match(
  reports.get('commercial-hub-plan.md') ?? '',
  /12 operator decision-support entries/i,
);
assert.match(
  reports.get('cannibalisation-review.md') ?? '',
  /verified editor scores as supporting details/i,
);
assert.match(
  reports.get('commercial-hub-plan.md') ?? '',
  /0\/29 records have a verified lastVerifiedDate/,
);
assert.match(
  reports.get('commercial-hub-plan.md') ?? '',
  /DEFER: Most free Sweeps Coins/,
);
assert.match(
  reports.get('internal-link-map.md') ?? '',
  /29 review contextual blocks/,
);
assert.match(
  reports.get('internal-link-map.md') ?? '',
  /## Orphan candidates\n\nNone detected\./,
  'redirect-only /best/ must not be listed as a content orphan',
);
assert.match(
  reports.get('technical-audit.md') ?? '',
  /redirect-only routes are excluded from content-orphan findings/i,
);
assert.match(
  reports.get('technical-audit.md') ?? '',
  /29 review sources and 29 rendered reviews pass the dedicated review QA gate/i,
);
assert.match(
  reports.get('testing-claims-audit.md') ?? '',
  /Redemption index publication state: \*\*NOT PUBLISHABLE\*\* — no approved records/i,
);
assert.match(
  reports.get('testing-claims-audit.md') ?? '',
  /2026-08-31 is an explicit deterministic audit snapshot input, not a future publication default/i,
);
assert.match(
  reports.get('schema-audit.md') ?? '',
  /Approved reader aggregate operators available to the rating gate: \*\*0\*\*/i,
);
assert.match(
  reports.get('cannibalisation-review.md') ?? '',
  /freshness-dependent superlative routes remain deferred/i,
);
const availability = reconcileAvailabilityAuthorities({
  states: fallbackStates,
  partners: AFFILIATE_PARTNERS,
  trackerOperators: fallbackOperators,
  trackerAvailability: fallbackAvailability,
});
const availabilityReport = renderAvailabilityConflictReport(availability);
assert.equal(
  reports.get('state-legality-conflicts.md'),
  availabilityReport,
  'SEO report generation must delegate to the availability facade renderer',
);
assert.equal(
  readFileSync(resolve(root, 'docs/seo/state-legality-conflicts.md'), 'utf8'),
  availabilityReport,
  'the committed state-legality report must match the facade renderer exactly',
);
for (const name of reports.keys()) {
  assert.equal(
    readFileSync(resolve(root, `docs/seo/${name}`), 'utf8'),
    reports.get(name),
    `${name} must match deterministic audit output exactly`,
  );
}

console.log(
  `seo audit tests: OK — ${operators.reviews.length} reviews, ` +
    `${operators.homepage.length} homepage cards, ${claims.length} claim matches`,
);
