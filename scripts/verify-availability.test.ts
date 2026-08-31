import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AFFILIATE_PARTNERS } from '../src/data/affiliates';
import { ALL_US_STATE_CODES } from '../src/data/usStates';
import { fallbackStates } from '../src/lib/tracker/fallback';
import {
  availabilityForPartner,
  availabilityForState,
  reconcileAvailabilityAuthorities,
  renderAvailabilityConflictReport,
} from '../src/lib/availability';

const byCode = new Map(fallbackStates.map((state) => [state.state_code, state]));
const mcluck = AFFILIATE_PARTNERS.find((partner) => partner.slug === 'mcluck')!;
const cardCrush = AFFILIATE_PARTNERS.find((partner) => partner.slug === 'card-crush')!;

const allowed = availabilityForPartner(mcluck, 'TX', byCode.get('TX'));
assert.equal(allowed.site.status, 'eligible');
assert.equal(allowed.affiliate.status, 'available');
assert.deepEqual(allowed.cta, { eligible: true, reason: 'allowed' });
assert.equal(allowed.legal?.authority, 'tracker-legal-display');
assert.equal(allowed.legal?.status, 'gray');

const siteSuppressedCommerciallyAvailable = availabilityForPartner(
  cardCrush,
  'CA',
  byCode.get('CA'),
);
assert.equal(siteSuppressedCommerciallyAvailable.site.status, 'suppressed');
assert.equal(siteSuppressedCommerciallyAvailable.affiliate.status, 'available');
assert.deepEqual(siteSuppressedCommerciallyAvailable.cta, {
  eligible: false,
  reason: 'site-policy-suppressed',
});
assert.equal(
  siteSuppressedCommerciallyAvailable.legal?.status,
  'gray',
  'commercial availability and site CTA policy must not overwrite tracker legality',
);
assert.ok(
  siteSuppressedCommerciallyAvailable.warnings.some(
    (warning) => warning.kind === 'commercial-site-policy-difference',
  ),
);

const commerciallyRestricted = availabilityForPartner(cardCrush, 'TX', byCode.get('TX'));
assert.equal(commerciallyRestricted.site.status, 'eligible');
assert.equal(commerciallyRestricted.affiliate.status, 'restricted');
assert.deepEqual(commerciallyRestricted.cta, {
  eligible: false,
  reason: 'partner-restricted',
});
assert.equal(
  commerciallyRestricted.legal?.status,
  'gray',
  'partner restrictions must never be presented as legal conclusions',
);

const unknown = availabilityForPartner(mcluck, null);
assert.equal(unknown.site.status, 'unknown-region');
assert.equal(unknown.affiliate.status, 'unknown-region');
assert.deepEqual(unknown.cta, { eligible: false, reason: 'region-unknown' });
assert.equal(unknown.legal, null);

const stateViews = fallbackStates.map((state) => availabilityForState(state.state_code, state));
assert.equal(stateViews.length, 51);
assert.deepEqual(
  new Set(stateViews.map((view) => view.state)),
  new Set(ALL_US_STATE_CODES),
  'all 51 state routes must resolve through the facade',
);
assert.ok(stateViews.every((view) => view.legal?.freshness.value));
assert.ok(
  stateViews.every(
    (view) => view.legal?.freshness.value !== new Date().toISOString().slice(0, 10),
  ),
  'fallback freshness must not be replaced with build time',
);

const reconciliation = reconcileAvailabilityAuthorities({
  states: fallbackStates,
  partners: AFFILIATE_PARTNERS,
});
assert.deepEqual(reconciliation.errors, []);
assert.equal(reconciliation.jurisdictionCount, 51);
assert.equal(reconciliation.partnerCount, 13);
assert.ok(
  reconciliation.warnings.some(
    (warning) =>
      warning.kind === 'impossible-commercial-intersection' &&
      warning.operatorSlug === 'card-crush' &&
      warning.message.includes('commercially unavailable everywhere') &&
      !warning.message.includes('illegal'),
  ),
  'Card Crush must be explicitly commercial-only and never mislabeled illegal',
);
assert.ok(
  reconciliation.warnings.some(
    (warning) => warning.kind === 'tracker-policy-difference' && warning.state === 'CA',
  ),
);

const malformed = reconcileAvailabilityAuthorities({
  states: [
    {
      ...fallbackStates[0],
      state_code: 'XX',
      last_reviewed_at: '',
      last_auto_updated_at: 'not-a-date',
    },
    {
      ...fallbackStates[1],
      last_reviewed_at: '2025-01-01T00:00:00Z',
    },
    ...fallbackStates.slice(2),
  ],
  partners: [
    {
      ...mcluck,
      restrictedStates: ['TX', 'XX' as never],
      availableOnlyInStates: ['TX'],
    },
  ],
  trackerOperators: [{ operator_slug: 'tracker-only' }],
  trackerAvailability: [
    {
      operator_slug: 'missing-operator',
      state_code: 'YY',
      status: 'available',
      last_verified_at: '',
      notes: null,
    },
  ],
});
assert.ok(malformed.errors.some((error) => error.kind === 'invalid-state-reference'));
assert.ok(malformed.errors.some((error) => error.kind === 'invalid-operator-reference'));
assert.ok(malformed.errors.some((error) => error.kind === 'conflicting-affiliate-rules'));
assert.ok(malformed.warnings.some((warning) => warning.kind === 'missing-freshness'));
assert.ok(malformed.warnings.some((warning) => warning.kind === 'stale-freshness'));

const expectedReport = renderAvailabilityConflictReport(reconciliation);
assert.equal(
  readFileSync(resolve('docs/seo/state-legality-conflicts.md'), 'utf8'),
  expectedReport,
  'committed reconciliation report must equal deterministic facade output',
);

for (const path of [
  'src/components/AffiliateLink.astro',
  'src/lib/affiliateHtml.ts',
  'src/lib/bonusGateway.ts',
  'src/lib/oddsRecommendations.ts',
  'src/routes/best/[slug].astro',
  'src/routes/bonuses/no-deposit/index.astro',
  'src/routes/states/[slug].astro',
  'src/routes/state-legality/index.astro',
]) {
  const source = readFileSync(resolve(path), 'utf8');
  assert.match(
    source,
    /(?:lib\/availability|\.\/availability|data\/availability|lib\/homepage)/,
    `${path} must consume the facade or an availability-aware view model`,
  );
  assert.doesNotMatch(source, /from ['"][^'"]*data\/geo['"]/, `${path} must not bypass the facade`);
}

const stateRoute = readFileSync(resolve('src/routes/states/[slug].astro'), 'utf8');
assert.match(stateRoute, /legalFreshnessIso\s*=\s*stateAvailability\.legal\?\.freshness\.value/);
assert.match(stateRoute, /dateModified=\{legalFreshnessIso\}/);
assert.match(stateRoute, /datetime=\{legalFreshnessIso\}/);
assert.doesNotMatch(
  stateRoute,
  /mdxUpdated\s*\?\s*mdxUpdated\.toISOString\(\)\s*:\s*trackerState\.last_auto_updated_at/,
  'state legal freshness must not be replaced by page publication metadata',
);
assert.match(stateRoute, /site CTA policy is separate from the tracker legal status/i);
assert.doesNotMatch(
  stateRoute,
  /Because of \$\{name\}.*rules on marketing sweepstakes casinos/,
  'site policy suppression must not be narrated as a state legal conclusion',
);
const trackerReconcileSource = readFileSync(
  resolve('src/data/trackerReconcile.ts'),
  'utf8',
);
assert.doesNotMatch(
  trackerReconcileSource,
  /wizAvailabilityForState/,
  'the unused compatibility availability helper must stay removed',
);

console.log('verify-availability tests: OK — 51 jurisdictions, 13 partners, unified CTA facade');
