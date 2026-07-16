/**
 * State-availability verification for the affiliate data layer.
 *
 * Run:  npx tsx scripts/verify-availability.ts
 *
 * Checks data integrity, prints the per-partner availability matrix (compare
 * against the "State Availability" expected output), and surfaces where the
 * site-level legal suppression overrides partner availability.
 */
import { AFFILIATE_PARTNERS } from '../src/data/affiliates';
import { ALL_US_STATE_CODES, isUsStateCode, type UsStateCode } from '../src/data/usStates';
import {
  SITE_BANNED_STATES,
  isPartnerAvailableInState,
  shouldRenderAffiliateCta,
  isStateBannedSitewide,
} from '../src/data/geo';
import { resolveBonusGateway } from '../src/lib/bonusGateway';
import { suppressAffiliateCtas } from '../src/lib/affiliateHtml';

let failures = 0;
const fail = (msg: string) => {
  failures += 1;
  console.error(`  ✗ ${msg}`);
};
const ok = (msg: string) => console.log(`  ✓ ${msg}`);

console.log('\n=== 1. Data integrity ===');

if (AFFILIATE_PARTNERS.length === 13) ok('13 partners loaded');
else fail(`expected 13 partners, got ${AFFILIATE_PARTNERS.length}`);

const slugs = new Set<string>();
for (const p of AFFILIATE_PARTNERS) {
  if (slugs.has(p.slug)) fail(`duplicate slug: ${p.slug}`);
  slugs.add(p.slug);
  for (const s of p.restrictedStates) {
    if (!isUsStateCode(s)) fail(`${p.name}: invalid restricted code "${s}"`);
  }
  for (const s of p.availableOnlyInStates ?? []) {
    if (!isUsStateCode(s)) fail(`${p.name}: invalid allowlist code "${s}"`);
  }
  if (!/^https:\/\/tracker\.gemified\.io\//.test(p.trackingLink)) {
    fail(`${p.name}: tracking link is not a Gemified URL`);
  }
}
if (failures === 0) ok('all slugs unique, all state codes valid, all links Gemified');

console.log('\n=== 2. Spot-checks (tricky cases) ===');
const check = (label: string, actual: boolean, expected: boolean) =>
  actual === expected ? ok(label) : fail(`${label} (got ${actual}, expected ${expected})`);

const cardCrush = AFFILIATE_PARTNERS.find((p) => p.slug === 'card-crush')!;
check('Card Crush available in CA (inverse)', isPartnerAvailableInState(cardCrush, 'CA'), true);
check('Card Crush available in NY (inverse)', isPartnerAvailableInState(cardCrush, 'NY'), true);
check('Card Crush NOT available in TX (inverse)', isPartnerAvailableInState(cardCrush, 'TX'), false);
check('Card Crush NOT available in FL (inverse)', isPartnerAvailableInState(cardCrush, 'FL'), false);

const zula = AFFILIATE_PARTNERS.find((p) => p.slug === 'zula')!;
check('Zula available in TX', isPartnerAvailableInState(zula, 'TX'), true);
check('Zula NOT available in WA', isPartnerAvailableInState(zula, 'WA'), false);

const mcluck = AFFILIATE_PARTNERS.find((p) => p.slug === 'mcluck')!;
check('McLuck available in TX', isPartnerAvailableInState(mcluck, 'TX'), true);
check('McLuck NOT available in CA', isPartnerAvailableInState(mcluck, 'CA'), false);
check('McLuck dropped non-US "QC"', !(mcluck.restrictedStates as string[]).includes('QC'), true);

console.log('\n=== 3. Site-level legal layer (13 banned states) ===');
if (SITE_BANNED_STATES.length === 13) ok(`13 banned states: ${SITE_BANNED_STATES.join(', ')}`);
else fail(`expected 13 banned states, got ${SITE_BANNED_STATES.length}`);

// In a banned state, NO partner CTA may render regardless of availability.
let bannedLeak = 0;
for (const state of SITE_BANNED_STATES) {
  for (const p of AFFILIATE_PARTNERS) {
    if (shouldRenderAffiliateCta(p, state)) {
      bannedLeak += 1;
      fail(`CTA leaked: ${p.name} renders in banned state ${state}`);
    }
  }
}
if (bannedLeak === 0) ok('no CTA renders in any of the 13 banned states');

console.log('\n=== 4. Per-partner availability matrix (partner-level only) ===');
console.log('   (count = jurisdictions out of 51 where the PARTNER is available)\n');
const sorted = [...AFFILIATE_PARTNERS].sort((a, b) => a.name.localeCompare(b.name));
for (const p of sorted) {
  const available = ALL_US_STATE_CODES.filter((s) => isPartnerAvailableInState(p, s));
  const tag = p.availableOnlyInStates ? ' [allowlist]' : '';
  console.log(
    `   ${p.name.padEnd(20)} ${String(available.length).padStart(2)}/51${tag}`,
  );
}

console.log('\n=== 5. Conflict report: availability vs legal layer ===');
// Card Crush is available ONLY in CA & NY — both site-banned. Flag it.
for (const p of AFFILIATE_PARTNERS) {
  const availableStates = ALL_US_STATE_CODES.filter((s) => isPartnerAvailableInState(p, s));
  const renderable = availableStates.filter((s) => !isStateBannedSitewide(s));
  if (renderable.length === 0) {
    console.log(
      `   ⚠ ${p.name}: available in ${availableStates.length} state(s) but ALL are site-banned -> CTA never renders (info-only everywhere).`,
    );
  }
}

console.log('\n=== 6. Bonus gateway (the gemified-link chokepoint) ===');
// Allowed state -> redirect to the gemified link.
const txMcLuck = resolveBonusGateway('mcluck', 'TX');
check('McLuck gateway redirects in TX', txMcLuck.status === 'redirect', true);
if (txMcLuck.status === 'redirect') {
  check(
    'McLuck redirect target is the gemified link',
    /tracker\.gemified\.io/.test(txMcLuck.url),
    true,
  );
  check('no clickId -> bare tracking link (no clickId param)', !txMcLuck.url.includes('clickId'), true);
}
// Allowed state + clickId -> gemified link with `&clickId=<value>` appended.
const txMcLuckClick = resolveBonusGateway('mcluck', 'TX', 'no-deposit');
check('McLuck gateway redirects in TX with clickId', txMcLuckClick.status === 'redirect', true);
if (txMcLuckClick.status === 'redirect') {
  check(
    'clickId appended with literal & (gemified format)',
    txMcLuckClick.url === `${mcluck.trackingLink}&clickId=no-deposit`,
    true,
  );
}
// Malicious clickId -> stripped; redirect stays anchored to the gemified domain.
const evilClick = resolveBonusGateway('mcluck', 'TX', 'evil"><script>?x=/../@attacker.com');
check('malicious clickId gateway still redirects in TX', evilClick.status === 'redirect', true);
if (evilClick.status === 'redirect') {
  check('malicious clickId is dropped entirely', !evilClick.url.includes('clickId'), true);
  check('malicious clickId cannot break the tracker URL', evilClick.url === mcluck.trackingLink, true);
}
// Over-long clickId (>64 chars) -> rejected.
const longClick = resolveBonusGateway('mcluck', 'TX', 'a'.repeat(65));
check(
  'over-long clickId (>64) is rejected',
  longClick.status === 'redirect' && !longClick.url.includes('clickId'),
  true,
);
// Banned state -> blocked, NO url emitted (clickId must never resurrect a CTA).
const caMcLuck = resolveBonusGateway('mcluck', 'CA', 'no-deposit');
check('McLuck gateway blocked in CA (banned)', caMcLuck.status === 'blocked', true);
check('blocked result carries no url', !('url' in caMcLuck), true);
// Unknown slug -> not-found.
check('unknown slug -> not-found', resolveBonusGateway('not-a-brand', 'TX').status === 'not-found', true);
// Card Crush -> blocked everywhere (only CA/NY, both banned).
check('Card Crush gateway blocked in CA', resolveBonusGateway('card-crush', 'CA').status === 'blocked', true);
check('Card Crush gateway blocked in NY', resolveBonusGateway('card-crush', 'NY').status === 'blocked', true);
// Non-partner editorial outbound: geo-gated (no static interstitial bypass).
const rollaTX = resolveBonusGateway('rolla', 'TX');
check('Rolla (non-partner) redirects in TX', rollaTX.status === 'redirect', true);
if (rollaTX.status === 'redirect') {
  check('Rolla TX target is rolla.com (not WOW Vegas)', /rolla\.com/i.test(rollaTX.url), true);
}
check('Rolla (non-partner) blocked in CA', resolveBonusGateway('rolla', 'CA').status === 'blocked', true);
check('Rolla (non-partner) blocked when region unknown', resolveBonusGateway('rolla', null).status === 'blocked', true);

console.log('\n=== 7. HTML CTA suppression transform ===');
const sampleHtml =
  '<a href="/bonuses/mcluck/" class="btn-claim" rel="nofollow noopener">Claim Bonus</a>' +
  '<a href="/bonuses/zula/" class="btn-claim">Claim Zula</a>' +
  '<a href="/bonuses/rolla/" class="btn-claim">Claim Rolla</a>' +
  '<a href="/reviews/mcluck/">Read review</a>';
const inTX = suppressAffiliateCtas(sampleHtml, 'TX', 'homepage');
check('TX keeps McLuck CTA', inTX.includes('/bonuses/mcluck/'), true);
check('TX stamps clickId placement on surviving CTA', inTX.includes('/bonuses/mcluck/?clickId=homepage'), true);
check('TX stamps clickId on Zula CTA too', inTX.includes('/bonuses/zula/?clickId=homepage'), true);
check('TX keeps non-partner Rolla CTA (no clickId)', inTX.includes('/bonuses/rolla/"'), true);
check('TX keeps editorial link untouched (no clickId)', inTX.includes('/reviews/mcluck/"'), true);
// No placement -> hrefs left as-is (back-compat).
const inTXNoPlacement = suppressAffiliateCtas(sampleHtml, 'TX');
check('no placement -> CTA href unchanged', inTXNoPlacement.includes('/bonuses/mcluck/"'), true);
const inCA = suppressAffiliateCtas(sampleHtml, 'CA', 'homepage');
check('CA removes McLuck affiliate CTA', !inCA.includes('/bonuses/mcluck/'), true);
check('CA removes Zula affiliate CTA', !inCA.includes('/bonuses/zula/'), true);
check('CA removes non-partner Rolla CTA', !inCA.includes('/bonuses/rolla/'), true);
check('CA keeps editorial (non-affiliate) link', inCA.includes('/reviews/mcluck/'), true);
check('CA shows unavailable note', inCA.includes('affiliate-unavailable'), true);

console.log(`\n${failures === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
