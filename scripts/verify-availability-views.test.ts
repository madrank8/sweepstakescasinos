import assert from 'node:assert/strict';
import { getPartner } from '../src/data/affiliates';
import {
  bestPartnerAvailabilityView,
  noDepositOfferAvailabilityView,
} from '../src/lib/availabilityViews';

const mcluck = getPartner('mcluck')!;
const cardCrush = getPartner('card-crush')!;

assert.deepEqual(bestPartnerAvailabilityView(mcluck, 'TX'), {
  canCta: true,
  reason: 'allowed',
  label: 'Available in your location',
});
assert.deepEqual(bestPartnerAvailabilityView(mcluck, 'CA'), {
  canCta: false,
  reason: 'site-policy-suppressed',
  label: 'Not available in your location',
});
assert.deepEqual(bestPartnerAvailabilityView(cardCrush, 'TX'), {
  canCta: false,
  reason: 'partner-restricted',
  label: 'Not available in your location',
});

const missingVerification = noDepositOfferAvailabilityView(
  { slug: 'mcluck', verifiedOn: undefined },
  mcluck,
  'TX',
);
assert.equal(missingVerification.canCta, true);
assert.equal(missingVerification.reason, 'allowed');
assert.deepEqual(missingVerification.verification, {
  available: false,
  label: 'Verification unavailable',
  datetime: null,
});
assert.doesNotMatch(
  missingVerification.verification.label,
  /2026-07-12/,
  'page publication dates must not stand in for offer verification',
);

const suppressedOffer = noDepositOfferAvailabilityView(
  { slug: 'mcluck', verifiedOn: '2026-05-20' },
  mcluck,
  'CA',
);
assert.equal(suppressedOffer.canCta, false);
assert.equal(suppressedOffer.reason, 'site-policy-suppressed');
assert.deepEqual(suppressedOffer.verification, {
  available: true,
  label: '2026-05-20',
  datetime: '2026-05-20',
});

const commerciallyRestrictedOffer = noDepositOfferAvailabilityView(
  { slug: 'card-crush', verifiedOn: undefined },
  cardCrush,
  'TX',
);
assert.equal(commerciallyRestrictedOffer.canCta, false);
assert.equal(commerciallyRestrictedOffer.reason, 'partner-restricted');

console.log('availability view tests: OK — SSR comparison and no-deposit behavior');
