import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  CALCULATION_COMPLETED_PAYLOAD_KEYS,
  entryMixDisplayLabels,
  formatDrawingsResult,
  formatEntryMixValue,
  formatEstimatedChanceHeadline,
  formatEstimatedProbabilityRange,
  formatKnownChanceHeadline,
  ODDS_EVENT_CALCULATION_COMPLETED,
  ODDS_EVENT_OPTIONS_OPENED,
  OPTIONS_OPENED_PAYLOAD_KEYS,
  RESULT_INVALIDATING_INPUT_IDS,
} from '../src/lib/oddsCalculatorUi';
import {
  buildOddsRecommendations,
  ODDS_CTA_ANALYTICS_EVENT,
  ODDS_CTA_ANALYTICS_PAYLOAD_KEYS,
  ODDS_CTA_CLICK_ID,
  type OddsRecommendationTuple,
} from '../src/lib/oddsRecommendations';
import { getPartner } from '../src/data/affiliates';
import { shouldRenderAffiliateCta } from '../src/data/geo';
import {
  deriveEstimatedPools,
  entryMixProbabilities,
  estimateProbabilityRange,
  estimatedEntryMixProbabilities,
  exactWinProbability,
  formatChance,
  repeatProbability,
  validateCalculatorInput,
} from '../src/lib/sweepstakesOdds';
import {
  ODDS_FAQ,
  ODDS_MAIN_ENTITY_ID,
  ODDS_SCHEMA_NODES,
} from '../src/lib/oddsPageSchema';

interface ParsedSendEventCall {
  eventRef: string;
  payloadKeys: string[];
}

interface ParsedGtagEventCall {
  eventName: string;
  payloadKeys: string[];
  payloadLiteral: string;
}

function parseRecommendationsGtagCalls(source: string): ParsedGtagEventCall[] {
  const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'OddsCasinoRecommendations must include a script block');
  const script = scriptMatch[1]!;
  const calls: ParsedGtagEventCall[] = [];
  const needles = ["gtag?.('event',", 'gtag?.("event",', "window.gtag?.('event',", 'window.gtag?.("event",'];
  let index = 0;
  while (index < script.length) {
    let at = -1;
    let needle = '';
    for (const candidate of needles) {
      const found = script.indexOf(candidate, index);
      if (found !== -1 && (at === -1 || found < at)) {
        at = found;
        needle = candidate;
      }
    }
    if (at === -1) break;
    const before = script.slice(Math.max(0, at - 'function '.length), at);
    if (before === 'function ') {
      index = at + needle.length;
      continue;
    }
    let pos = at + needle.length;
    pos = skipWhitespace(script, pos);
    const eventNameMatch = script.slice(pos).match(/^(['"])([^'"]+)\1/);
    assert.ok(eventNameMatch, 'gtag event call must include a string event name');
    const eventName = eventNameMatch[2]!;
    pos += eventNameMatch[0]!.length;
    pos = skipWhitespace(script, pos);
    assert.equal(script[pos], ',', 'gtag event call must include a payload object');
    pos = skipWhitespace(script, pos + 1);
    assert.equal(script[pos], '{', 'gtag event payload must be an object literal');
    const { literal, end } = readBalancedObjectLiteral(script, pos);
    calls.push({
      eventName,
      payloadKeys: extractFlatObjectKeys(literal).sort(),
      payloadLiteral: literal,
    });
    index = end + 1;
  }
  return calls;
}

function assertNoProhibitedRecommendationClaims(source: string) {
  assert.doesNotMatch(source, /"@type"\s*:\s*"Offer"/);
  assert.doesNotMatch(source, /"@type"\s*:\s*"Product"/);
  assert.doesNotMatch(source, /"@type"\s*:\s*"Review"/);
  assert.doesNotMatch(source, /"@type"\s*:\s*"AggregateRating"/);
  assert.doesNotMatch(source, /"@type"\s*:\s*"Rating"/);
  assert.doesNotMatch(source, /ratingValue|bestRating|worstRating|reviewRating/i);
  assert.doesNotMatch(source, /\b\d+(?:\.\d+)?\s*\/\s*5\b/);
  assert.doesNotMatch(source, /stars?\s+out\s+of/i);
  assert.doesNotMatch(source, /tracker\.gemified\.io/);
  assert.doesNotMatch(source, /\btrackingLink\b/);
  assert.doesNotMatch(source, /\$\d+/);
  assert.doesNotMatch(source, /\b\d{1,3}(?:,\d{3})+\s*(?:GC|SC|Coins?)\b/i);
  assert.doesNotMatch(source, /\b\d+\s*(?:GC|SC|free\s+coins?)\b/i);
  assert.match(source, /editorially ranked casinos/);
}

function skipWhitespace(source: string, index: number): number {
  while (index < source.length && /\s/.test(source[index]!)) {
    index++;
  }
  return index;
}

function readBalancedObjectLiteral(source: string, openBraceIndex: number): { literal: string; end: number } {
  assert.equal(source[openBraceIndex], '{');
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i++) {
    const ch = source[i]!;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { literal: source.slice(openBraceIndex, i + 1), end: i };
      }
    }
  }
  throw new Error('unbalanced object literal in sendEvent payload');
}

function readBalancedBlock(source: string, openBraceIndex: number): string {
  assert.equal(source[openBraceIndex], '{', 'block must begin with an opening brace');
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(openBraceIndex + 1, i);
    }
  }
  throw new Error('unbalanced source block');
}

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `expected function ${name}`);
  const openBrace = source.indexOf('{', start);
  assert.ok(openBrace >= 0, `expected body for function ${name}`);
  return readBalancedBlock(source, openBrace);
}

function callbackBody(source: string, marker: string): string {
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `expected callback marker: ${marker}`);
  const arrow = source.indexOf('=>', start);
  assert.ok(arrow >= 0, `expected arrow callback after: ${marker}`);
  const openBrace = source.indexOf('{', arrow);
  assert.ok(openBrace >= 0, `expected callback body after: ${marker}`);
  return readBalancedBlock(source, openBrace);
}

function assertOrder(source: string, before: string, after: string, message: string): void {
  const beforeIndex = source.indexOf(before);
  const afterIndex = source.indexOf(after);
  assert.ok(beforeIndex >= 0, `${message}: missing before statement: ${before}`);
  assert.ok(afterIndex >= 0, `${message}: missing after statement: ${after}`);
  assert.ok(afterIndex > beforeIndex, message);
}

function extractFlatObjectKeys(objectLiteral: string): string[] {
  return [...objectLiteral.matchAll(/\b([a-z_][a-z0-9_]*)\s*:/g)].map((match) => match[1]!);
}

function parseOddsCalculatorSendEventCalls(source: string): ParsedSendEventCall[] {
  const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'OddsCalculator.astro must include a script block');
  const script = scriptMatch[1]!;
  const calls: ParsedSendEventCall[] = [];
  const needle = 'sendEvent(';
  let index = 0;
  while (index < script.length) {
    const at = script.indexOf(needle, index);
    if (at === -1) break;
    const before = script.slice(Math.max(0, at - 'function '.length), at);
    if (before === 'function ') {
      index = at + needle.length;
      continue;
    }
    let pos = at + needle.length;
    pos = skipWhitespace(script, pos);
    const comma = script.indexOf(',', pos);
    assert.notEqual(comma, -1, 'sendEvent call must include an event reference and payload');
    const eventRef = script.slice(pos, comma).trim();
    pos = skipWhitespace(script, comma + 1);
    assert.equal(script[pos], '{', 'sendEvent payload must be an object literal');
    const { literal, end } = readBalancedObjectLiteral(script, pos);
    calls.push({
      eventRef,
      payloadKeys: extractFlatObjectKeys(literal).sort(),
    });
    index = end + 1;
  }
  return calls;
}

function resolveSendEventName(eventRef: string): string {
  if (eventRef === 'ODDS_EVENT_CALCULATION_COMPLETED') return ODDS_EVENT_CALCULATION_COMPLETED;
  if (eventRef === 'ODDS_EVENT_OPTIONS_OPENED') return ODDS_EVENT_OPTIONS_OPENED;
  const literal = eventRef.match(/^(['"])(.+)\1$/);
  if (literal) return literal[2]!;
  throw new Error(`unexpected sendEvent event reference: ${eventRef}`);
}

const close = (actual: number, expected: number, tolerance = 1e-12) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );

const known = exactWinProbability({ entries: 1, totalEntries: 5_000, prizes: 10 });
close(known, 0.002);
assert.deepEqual(formatChance(known), {
  headline: '1 in 500',
  reciprocal: '1 in 500',
  percent: '0.2%',
  approximate: false,
  certainty: 'normal',
});

for (const [entries, total] of [[1, 10], [3, 10], [10, 10]] as const) {
  close(exactWinProbability({ entries, totalEntries: total, prizes: 1 }), entries / total);
}
assert.equal(exactWinProbability({ entries: 0, totalEntries: 10, prizes: 1 }), 0);
assert.equal(exactWinProbability({ entries: 10, totalEntries: 10, prizes: 1 }), 1);
assert.equal(exactWinProbability({ entries: 1, totalEntries: 10, prizes: 10 }), 1);
assert.equal(exactWinProbability({ entries: 6, totalEntries: 10, prizes: 5 }), 1);
close(
  exactWinProbability({ entries: 1, totalEntries: 1_000_000_000, prizes: 1 }),
  1e-9,
  1e-9,
);
assert.ok(Number.isFinite(exactWinProbability({
  entries: 1,
  totalEntries: 1_000_000_000,
  prizes: 1,
})));
assert.throws(
  () => exactWinProbability({
    entries: 2_000_000,
    totalEntries: 4_000_000,
    prizes: 2_000_000,
  }),
  (error: unknown) =>
    error instanceof RangeError &&
    /1,000,000 iteration limit/.test(error.message),
  'direct exact calculations above the product-iteration cap must fail fast',
);

const pools = deriveEstimatedPools({ entries: 1, estimate: 5_000, prizes: 10 });
assert.deepEqual(pools, { low: 4_000, base: 5_000, high: 6_250 });
const estimated = estimateProbabilityRange({ entries: 1, estimate: 5_000, prizes: 10 });
assert.equal(formatChance(estimated.best).reciprocal, '1 in 400');
assert.equal(formatChance(estimated.baseChance).reciprocal, '1 in 500');
assert.equal(formatChance(estimated.worst).reciprocal, '1 in 625');
assert.ok(estimated.best >= estimated.baseChance && estimated.baseChance >= estimated.worst);
assert.equal(
  formatEstimatedProbabilityRange(estimated),
  'Estimated probability range: 0.25% to 0.16%; base assumption 0.2%.',
);
assert.equal(
  formatEstimatedChanceHeadline(estimated),
  'Your estimated chance ranges from 1 in 400 to 1 in 625 (base estimate: 1 in 500).',
);

const mix = entryMixProbabilities({
  entries: 5,
  totalEntries: 100,
  prizes: 1,
  freeEntries: 2,
});
close(mix.combined, 5 / 100);
close(mix.freeOnlyCurrentPool, 2 / 100);
close(mix.noPurchase, 2 / 97);
assert.equal(mix.paidEntries, 3);
assert.equal(mix.counterfactualTotalEntries, 97);

const estimatedMix = estimatedEntryMixProbabilities({
  entries: 5,
  estimate: 100,
  prizes: 1,
  freeEntries: 2,
});
assert.equal(estimatedMix.low.counterfactualTotalEntries, 77);
assert.equal(estimatedMix.base.counterfactualTotalEntries, 97);
assert.equal(estimatedMix.high.counterfactualTotalEntries, 122);

assert.equal(repeatProbability(0, 10), 0);
assert.equal(repeatProbability(1, 10), 1);
close(repeatProbability(0.2, 1), 0.2);
close(repeatProbability(0.2, 4), 1 - (1 - 0.2) ** 4);
assert.ok(Number.isFinite(repeatProbability(1e-9, 1_000_000)));

assert.equal(formatChance(0).certainty, 'zero');
assert.equal(formatChance(0).headline, 'No chance with zero entries.');
assert.equal(formatChance(1).certainty, 'exact');
assert.equal(formatChance(1).headline, 'Certain under these inputs (100%).');
assert.equal(formatChance(1 / 1_234).reciprocal, 'about 1 in 1,230');
assert.equal(formatChance(1e-10).percent, '<0.000001%');
assert.equal(formatChance(3.456e-8).percent, '0.00000346%');
for (const nearCertain of [0.9996, 1 - 1e-12]) {
  const display = formatChance(nearCertain);
  assert.equal(display.headline, 'Almost certain');
  assert.equal(display.reciprocal, 'Almost certain');
  assert.equal(display.percent, '>99.9%');
  assert.equal(display.approximate, true);
  assert.equal(display.certainty, 'almost');
  assert.doesNotMatch(
    `${display.headline} ${display.reciprocal} ${display.percent}`,
    /100%|Certain|1 in 1/,
  );
}

const knownNearCertainDisplay = formatChance(
  exactWinProbability({ entries: 9_996, totalEntries: 10_000, prizes: 1 }),
);
assert.equal(
  formatKnownChanceHeadline(knownNearCertainDisplay),
  'Almost certain under these inputs (>99.9%).',
);

const estimatedNearCertain = estimateProbabilityRange({
  entries: 7_996,
  estimate: 10_000,
  prizes: 1,
});
assert.equal(
  formatEstimatedChanceHeadline(estimatedNearCertain),
  'Your estimated chance ranges from almost certain under the low-pool assumption to 1 in 1.56 (base estimate: 1 in 1.25).',
);
for (const headline of [
  formatKnownChanceHeadline(knownNearCertainDisplay),
  formatEstimatedChanceHeadline(estimatedNearCertain),
]) {
  assert.doesNotMatch(headline, /about Almost|is Almost|1 in 1(?![\d.])/);
}
assert.equal(
  formatKnownChanceHeadline(formatChance(known)),
  'Your calculated chance is 1 in 500.',
);
assert.equal(
  formatEstimatedChanceHeadline(
    estimateProbabilityRange({ entries: 10, estimate: 10, prizes: 10 }),
  ),
  'Certain under these inputs (100%).',
);

const invalidExactInputs = [
  { entries: '1.5', pool: '100', prizes: '1', expected: 'Use a whole number of entries.' },
  { entries: '1e3', pool: '10000', prizes: '1', expected: 'Use a whole number of entries.' },
  { entries: '-1', pool: '100', prizes: '1', expected: 'Your entries can’t be negative.' },
  { entries: '9007199254740992', pool: '9007199254740992', prizes: '1', expected: 'Enter a whole number smaller than the calculator’s maximum.' },
  { entries: '101', pool: '100', prizes: '1', expected: 'Total entries must include your entries, so it can’t be smaller than your entries.' },
  { entries: '1', pool: '5', prizes: '6', expected: 'The number of prizes can’t be greater than the total entries.' },
  { entries: '1', pool: '5', prizes: '0', expected: 'Enter at least one prize.' },
] as const;

for (const c of invalidExactInputs) {
  const result = validateCalculatorInput({
    poolMode: 'known',
    entries: c.entries,
    pool: c.pool,
    prizes: c.prizes,
    entryMixActive: false,
    multipleDrawingsActive: false,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.issues.some((issue) => issue.message === c.expected));
}

const acceptedLargePoolSmallLoop = validateCalculatorInput({
  poolMode: 'known',
  entries: '1',
  pool: '1000000000',
  prizes: '1',
  entryMixActive: false,
  multipleDrawingsActive: false,
});
assert.equal(acceptedLargePoolSmallLoop.ok, true, 'billion-entry pools remain valid for short products');

const tooLargeMessage =
  'Use a smaller combination of entries and prizes so the calculation stays instant.';
for (const input of [
  {
    poolMode: 'known' as const,
    entries: '2000000',
    pool: '4000000',
    prizes: '2000000',
    entryMixActive: false,
    multipleDrawingsActive: false,
  },
  {
    poolMode: 'estimated' as const,
    entries: '2000000',
    pool: '4000000',
    prizes: '2000000',
    entryMixActive: false,
    multipleDrawingsActive: false,
  },
  {
    poolMode: 'known' as const,
    entries: '3000000',
    pool: '5000000',
    prizes: '2000001',
    entryMixActive: true,
    freeEntries: '1500000',
    multipleDrawingsActive: false,
  },
]) {
  const result = validateCalculatorInput(input);
  assert.equal(result.ok, false, `${input.poolMode} oversized calculation must fail validation`);
  if (!result.ok) {
    assert.ok(
      result.issues.some(
        (issue) => issue.code === 'calculation_too_large' && issue.message === tooLargeMessage,
      ),
    );
  }
}

const missingPool = validateCalculatorInput({
  poolMode: 'known',
  entries: '1',
  pool: '',
  prizes: '1',
  entryMixActive: false,
  multipleDrawingsActive: false,
});
assert.equal(missingPool.ok, false);
if (!missingPool.ok) assert.equal(missingPool.issues[0].message, 'Enter your total entries.');

const estimateTooSmall = validateCalculatorInput({
  poolMode: 'estimated',
  entries: '10',
  pool: '9',
  prizes: '1',
  entryMixActive: false,
  multipleDrawingsActive: false,
});
assert.equal(estimateTooSmall.ok, false);
if (!estimateTooSmall.ok) {
  assert.ok(estimateTooSmall.issues.some((i) => i.message === 'Your estimated total must include your entries.'));
}

const estimateBelowPrizes = validateCalculatorInput({
  poolMode: 'estimated',
  entries: '1',
  pool: '5',
  prizes: '6',
  entryMixActive: false,
  multipleDrawingsActive: false,
});
assert.equal(estimateBelowPrizes.ok, false);
if (!estimateBelowPrizes.ok) {
  assert.ok(estimateBelowPrizes.issues.some((i) => i.message === 'Your estimated total can’t be smaller than the number of prizes.'));
}

const estimateOverflow = validateCalculatorInput({
  poolMode: 'estimated',
  entries: '1',
  pool: String(Number.MAX_SAFE_INTEGER),
  prizes: '1',
  entryMixActive: false,
  multipleDrawingsActive: false,
});
assert.equal(estimateOverflow.ok, false);
if (!estimateOverflow.ok) {
  assert.ok(estimateOverflow.issues.some((i) => i.message === 'Use a smaller estimated total so the full range can be calculated.'));
}

const badFree = validateCalculatorInput({
  poolMode: 'known',
  entries: '5',
  pool: '100',
  prizes: '1',
  entryMixActive: true,
  freeEntries: '6',
  multipleDrawingsActive: false,
});
assert.equal(badFree.ok, false);
if (!badFree.ok) {
  assert.ok(badFree.issues.some((i) => i.message === 'Free entries must be between 0 and your total entries.'));
}

const invalidFreeSuppressesSizeIssue = validateCalculatorInput({
  poolMode: 'known',
  entries: '2000000',
  pool: '4000000',
  prizes: '2000000',
  entryMixActive: true,
  freeEntries: '3000000',
  multipleDrawingsActive: false,
});
assert.equal(invalidFreeSuppressesSizeIssue.ok, false);
if (!invalidFreeSuppressesSizeIssue.ok) {
  assert.deepEqual(
    invalidFreeSuppressesSizeIssue.issues.map((issue) => issue.code),
    ['free_entries_range'],
  );
}

const impossibleCounterfactual = validateCalculatorInput({
  poolMode: 'known',
  entries: '5',
  pool: '6',
  prizes: '3',
  entryMixActive: true,
  freeEntries: '1',
  multipleDrawingsActive: false,
});
assert.equal(impossibleCounterfactual.ok, false);
if (!impossibleCounterfactual.ok) {
  assert.ok(impossibleCounterfactual.issues.some((i) =>
    i.message === 'Without your paid entries, this scenario would have more prizes than entries. Adjust the entry split or prize count.',
  ));
}

for (const drawings of ['0', '1.5']) {
  const result = validateCalculatorInput({
    poolMode: 'known',
    entries: '1',
    pool: '100',
    prizes: '1',
    entryMixActive: false,
    multipleDrawingsActive: true,
    drawings,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.issues.some((i) => i.message === 'Enter at least one whole drawing.'));
  }
}

const mixedFieldOrder = validateCalculatorInput({
  poolMode: 'known',
  entries: '-1',
  pool: '1.5',
  prizes: '0',
  entryMixActive: true,
  freeEntries: 'bad',
  multipleDrawingsActive: true,
  drawings: '0',
});
assert.equal(mixedFieldOrder.ok, false);
if (!mixedFieldOrder.ok) {
  assert.deepEqual(
    mixedFieldOrder.issues.map((issue) => issue.field),
    ['entries', 'pool', 'prizes', 'freeEntries', 'drawings'],
  );
}

const mixedCrossFieldOrder = validateCalculatorInput({
  poolMode: 'known',
  entries: '101',
  pool: '100',
  prizes: '101',
  entryMixActive: false,
  multipleDrawingsActive: true,
  drawings: '0',
});
assert.equal(mixedCrossFieldOrder.ok, false);
if (!mixedCrossFieldOrder.ok) {
  assert.deepEqual(
    mixedCrossFieldOrder.issues.map((issue) => issue.field),
    ['drawings', 'pool', 'prizes'],
  );
}

const calculatorSource = readFileSync(
  new URL('../src/components/odds/OddsCalculator.astro', import.meta.url),
  'utf8',
);
assert.match(calculatorSource, /<form\b/);
assert.match(calculatorSource, /aria-live="polite"/);
assert.match(calculatorSource, /data-error-summary/);
assert.match(calculatorSource, /validateCalculatorInput/);
assert.match(calculatorSource, /textContent/);
assert.doesNotMatch(calculatorSource, /localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
assert.doesNotMatch(calculatorSource, /innerHTML/);
const calculatorFormTag = calculatorSource.match(/<form\b[^>]*>/)?.[0];
assert.ok(calculatorFormTag, 'calculator form tag exists');
assert.match(calculatorFormTag, /\bmethod="dialog"/);
assert.doesNotMatch(calculatorFormTag, /\baction\s*=/);
const submitButtonTag = calculatorSource.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0];
assert.ok(submitButtonTag, 'calculator submit button exists');
assert.doesNotMatch(submitButtonTag, /\bformaction\s*=/);
assert.doesNotMatch(submitButtonTag, /\bformmethod\s*=/);
assertOrder(
  calculatorSource,
  '<noscript>',
  '<form data-odds-form',
  'no-JS notice appears before the form',
);
assert.match(
  calculatorSource,
  /id="odds-estimated-toggle"[^>]*aria-controls="odds-pool"[^>]*aria-describedby="odds-estimated-instructions"/,
);
assert.match(calculatorSource, /id="odds-estimated-instructions"/);
assert.match(
  calculatorSource,
  /Use this when the total entry pool is unknown; enter your best estimate including your entries\./,
);
assert.match(calculatorSource, /id="odds-pool-hint"[^>]*aria-live="polite"[^>]*role="status"/);
assert.match(calculatorSource, /<h3 tabindex="-1" data-result-heading>/);

// --- UI helper unit contracts (estimated advanced labeling) ---
assert.deepEqual(entryMixDisplayLabels('known'), {
  combined: 'Combined current-pool odds',
  freeCurrent: 'Free-only odds in the same current pool',
  noPurchase: 'No-purchase counterfactual',
  sectionNote: null,
});
const estimatedMixLabels = entryMixDisplayLabels('estimated');
assert.match(estimatedMixLabels.combined, /base pool estimate/i);
assert.match(estimatedMixLabels.freeCurrent, /base pool estimate/i);
assert.match(estimatedMixLabels.noPurchase, /base pool estimate/i);
assert.match(estimatedMixLabels.sectionNote ?? '', /base pool assumption/i);

assert.equal(formatEntryMixValue('known', '1 in 100', '1%'), '1 in 100 (1%)');
assert.match(
  formatEntryMixValue('estimated', '1 in 100', '1%'),
  /^Estimated: 1 in 100 \(1%\) — base pool assumption$/,
);

assert.match(
  formatDrawingsResult('known', '1 in 50', '2%'),
  /^Across the entered number of independent drawings: 1 in 50 \(2%\)\./,
);
assert.doesNotMatch(formatDrawingsResult('known', '1 in 50', '2%'), /base pool assumption/i);
assert.match(formatDrawingsResult('estimated', '1 in 50', '2%'), /\(estimated\)/);
assert.match(formatDrawingsResult('estimated', '1 in 50', '2%'), /base pool assumption/i);

// --- Component wiring contracts ---
assert.match(calculatorSource, /from ['"].*oddsCalculatorUi['"]/);
assert.match(calculatorSource, /entryMixDisplayLabels/);
assert.match(calculatorSource, /formatEntryMixValue/);
assert.match(calculatorSource, /formatDrawingsResult/);
assert.match(calculatorSource, /ODDS_EVENT_CALCULATION_COMPLETED/);
assert.match(calculatorSource, /ODDS_EVENT_OPTIONS_OPENED/);
assert.match(calculatorSource, /RESULT_INVALIDATING_INPUT_IDS/);
assert.match(calculatorSource, /formatEstimatedProbabilityRange/);
assert.doesNotMatch(calculatorSource, /estimatedEntryMixProbabilities/);

assert.match(calculatorSource, /<section class="odds-result" data-result aria-live="polite" hidden>/);

const showErrorsBody = functionBody(calculatorSource, 'showErrors');
assert.ok(showErrorsBody.includes('hideResult()'));
assertOrder(
  showErrorsBody,
  'summary.hidden = false',
  'list.append(item)',
  'error live region must be unhidden before messages are appended',
);
assertOrder(
  showErrorsBody,
  "closest('details')",
  'summary.focus()',
  'errored controls reveal their details ancestor before summary focus',
);
assert.match(showErrorsBody, /details\.open = true/);
assert.throws(
  () => assertOrder(
    showErrorsBody.replace('summary.hidden = false', ''),
    'summary.hidden = false',
    'list.append(item)',
    'mutated live-region order',
  ),
  /missing before statement/,
);

const setAdvancedBody = functionBody(calculatorSource, 'setAdvanced');
assert.ok(setAdvancedBody.includes('hideResult()'));
const estimatedChangeBody = callbackBody(
  calculatorSource,
  "estimatedToggle.addEventListener('change'",
);
assert.ok(estimatedChangeBody.includes('hideResult()'));
const submitBody = callbackBody(calculatorSource, "form.addEventListener('submit'");
assertOrder(
  submitBody,
  'resultRegion.hidden = false',
  'heading.textContent',
  'result live region must be unhidden before result content is written',
);
assertOrder(
  submitBody,
  'hideResult()',
  'showErrors(result.issues)',
  'invalid submissions hide stale results before showing errors',
);
assertOrder(
  submitBody,
  "mixCombined.textContent = '';",
  'if (scenario.entryMixActive',
  'successful recalculation clears hidden entry-mix text before optional rendering',
);
assertOrder(
  submitBody,
  "drawingsResult.textContent = '';",
  'if (scenario.multipleDrawingsActive',
  'successful recalculation clears hidden drawings text before optional rendering',
);
assert.ok(
  calculatorSource.indexOf('for (const id of RESULT_INVALIDATING_INPUT_IDS)') >= 0,
  'result invalidation listeners are wired through the shared input ID contract',
);

assert.deepEqual([...CALCULATION_COMPLETED_PAYLOAD_KEYS], [
  'pool_mode',
  'entry_mix_active',
  'multiple_drawings_active',
]);
assert.deepEqual([...OPTIONS_OPENED_PAYLOAD_KEYS], ['option_name']);

assert.equal(ODDS_EVENT_CALCULATION_COMPLETED, 'odds_calculation_completed');
assert.equal(ODDS_EVENT_OPTIONS_OPENED, 'odds_options_opened');

const analyticsCalls = parseOddsCalculatorSendEventCalls(calculatorSource);
assert.equal(
  analyticsCalls.length,
  2,
  'OddsCalculator must emit exactly two analytics sendEvent call sites',
);

const resolvedEventNames = analyticsCalls.map((call) => resolveSendEventName(call.eventRef));
assert.deepEqual([...new Set(resolvedEventNames)].sort(), [
  ODDS_EVENT_CALCULATION_COMPLETED,
  ODDS_EVENT_OPTIONS_OPENED,
].sort());

for (const call of analyticsCalls) {
  const eventName = resolveSendEventName(call.eventRef);
  const expectedKeys =
    eventName === ODDS_EVENT_CALCULATION_COMPLETED
      ? [...CALCULATION_COMPLETED_PAYLOAD_KEYS].sort()
      : eventName === ODDS_EVENT_OPTIONS_OPENED
        ? [...OPTIONS_OPENED_PAYLOAD_KEYS].sort()
        : null;
  assert.ok(expectedKeys, `unexpected analytics event: ${eventName}`);
  assert.deepEqual(call.payloadKeys, expectedKeys);
}

for (const id of RESULT_INVALIDATING_INPUT_IDS) {
  assert.match(calculatorSource, new RegExp(`id="${id}"`));
}

const recommendationsSource = readFileSync(
  new URL('../src/components/odds/OddsCasinoRecommendations.astro', import.meta.url),
  'utf8',
);
const recommendationModelSource = readFileSync(
  new URL('../src/lib/oddsRecommendations.ts', import.meta.url),
  'utf8',
);
assert.doesNotMatch(
  recommendationModelSource,
  /\bgetPartner\b|partnerSlugs/,
  'recommendation helper must accept resolved partners without owning ranking data',
);

// --- Spec oracle (independent of production constants) ---
const SPEC_ODDS_CTA_CLICK_ID = 'odds-calculator';
const SPEC_ODDS_CTA_ANALYTICS_EVENT = 'odds_casino_cta_clicked';
const SPEC_ODDS_CTA_ANALYTICS_PAYLOAD_KEYS = ['casino_slug', 'placement'] as const;

assert.equal(ODDS_CTA_CLICK_ID, SPEC_ODDS_CTA_CLICK_ID);
assert.equal(ODDS_CTA_ANALYTICS_EVENT, SPEC_ODDS_CTA_ANALYTICS_EVENT);
assert.deepEqual(
  [...ODDS_CTA_ANALYTICS_PAYLOAD_KEYS].sort(),
  [...SPEC_ODDS_CTA_ANALYTICS_PAYLOAD_KEYS].sort(),
);

// --- Pure model: editorial top-three order and geo flags ---
const rankingSource = readFileSync(
  new URL('../src/content/comparisons/sweepstakes-casinos.mdx', import.meta.url),
  'utf8',
);
assert.match(rankingSource, /^published:\s*\d{4}-\d{2}-\d{2}$/m);
assert.match(rankingSource, /^draft:\s*false$/m);
const partnerSlugsBlock = rankingSource.match(
  /^partnerSlugs:\s*\n((?:  - [a-z0-9-]+\n)+)/m,
);
assert.ok(partnerSlugsBlock, 'ranking must define partnerSlugs');
const editorialSlugs = [...partnerSlugsBlock[1]!.matchAll(/^  - ([a-z0-9-]+)$/gm)]
  .slice(0, 3)
  .map((match) => match[1]!);
assert.equal(editorialSlugs.length, 3, 'ranking must supply exactly three recommendation slots');
assert.equal(new Set(editorialSlugs).size, 3, 'top three ranking slugs must be unique');
const resolvedEditorialPartners = editorialSlugs.map((slug) => {
  const partner = getPartner(slug);
  assert.ok(partner, `ranking partner must resolve: ${slug}`);
  assert.ok(
    existsSync(new URL(`../reviews/${slug}.html`, import.meta.url)),
    `ranked review must exist: ${slug}`,
  );
  return partner;
});
const editorialTopThree = resolvedEditorialPartners as OddsRecommendationTuple;

for (const [state, label] of [
  ['TX', 'allowed state'],
  ['CA', 'site-banned state'],
  [null, 'unknown state'],
] as const) {
  const items = buildOddsRecommendations(editorialTopThree, state);
  assert.equal(items.length, 3, `${label}: must keep exactly three cards`);
  assert.deepEqual(
    items.map((item) => item.partner.slug),
    editorialSlugs,
    `${label}: must preserve editorial order`,
  );
  assert.deepEqual(
    items.map((item) => item.rank),
    [1, 2, 3],
    `${label}: ranks must stay 1..3`,
  );
  for (const item of items) {
    assert.equal(
      item.available,
      shouldRenderAffiliateCta(item.partner, state),
      `${label}: availability must follow shouldRenderAffiliateCta for ${item.partner.slug}`,
    );
    assert.equal(item.reviewHref, `/reviews/${item.partner.slug}/`);
  }
}

// --- Component wiring: model-driven cards, review retention, AffiliateLink-only CTAs ---
assert.match(recommendationsSource, /from ['"].*oddsRecommendations['"]/);
assert.match(recommendationsSource, /buildOddsRecommendations\(/);
assert.match(recommendationsSource, /items\.map\(\(item\)/);
assert.match(recommendationsSource, /#\{item\.rank\}/);
assert.match(recommendationsSource, /href=\{item\.reviewHref\}/);
assert.match(recommendationsSource, /Read review/);
assert.match(
  recommendationsSource,
  /href=\{item\.reviewHref\}[\s\S]*?AffiliateLink/,
  'review links must render outside AffiliateLink-only CTA routing',
);
assert.match(recommendationsSource, /<AffiliateLink[\s\S]*?clickId=\{ODDS_CTA_CLICK_ID\}/);
assert.doesNotMatch(recommendationsSource, /\/bonuses\//);
assert.doesNotMatch(recommendationsSource, /partner\.trackingLink/);
assert.match(
  recommendationsSource,
  /editorially ranked casinos, not recommendations produced by your odds result/,
);
assertNoProhibitedRecommendationClaims(recommendationsSource);

const ctaAnalyticsCalls = parseRecommendationsGtagCalls(recommendationsSource);
assert.equal(
  ctaAnalyticsCalls.length,
  1,
  'OddsCasinoRecommendations must emit exactly one gtag analytics call site',
);
assert.equal(ctaAnalyticsCalls[0]!.eventName, SPEC_ODDS_CTA_ANALYTICS_EVENT);
assert.deepEqual(
  ctaAnalyticsCalls[0]!.payloadKeys,
  [...SPEC_ODDS_CTA_ANALYTICS_PAYLOAD_KEYS].sort(),
);
assert.match(
  ctaAnalyticsCalls[0]!.payloadLiteral,
  new RegExp(`placement:\\s*'${SPEC_ODDS_CTA_CLICK_ID}'`),
);
assert.match(recommendationsSource, /closest<HTMLAnchorElement>\('a\[data-affiliate\]'\)/);

const routeSource = readFileSync(
  new URL('../src/routes/tools/sweepstakes-odds-calculator/index.astro', import.meta.url),
  'utf8',
);
assert.match(routeSource, /export const prerender = false/);
assert.match(routeSource, /getEntry\('comparisons', 'sweepstakes-casinos'\)/);
assert.doesNotMatch(routeSource, /throw new Error/);
assert.match(routeSource, /OddsRecommendationTuple \| null/);
assert.match(
  routeSource,
  /\{topPartners && \(\s*<OddsCasinoRecommendations partners=\{topPartners\} \/>\s*\)\}/,
);
assert.match(routeSource, /from '\.\.\/\.\.\/\.\.\/lib\/oddsPageSchema'/);
assert.match(routeSource, /mainEntityId=\{ODDS_MAIN_ENTITY_ID\}/);
assert.match(routeSource, /jsonLd=\{ODDS_SCHEMA_NODES\}/);
assert.match(routeSource, /\{ODDS_FAQ\.map/);
const webApplicationSchema = ODDS_SCHEMA_NODES.find(
  (node) => node['@type'] === 'WebApplication',
);
assert.ok(webApplicationSchema);
assert.equal(webApplicationSchema['@id'], ODDS_MAIN_ENTITY_ID);
assert.equal(webApplicationSchema.applicationCategory, 'UtilitiesApplication');
assert.equal(webApplicationSchema.browserRequirements, 'Requires JavaScript');
const faqSchema = ODDS_SCHEMA_NODES.find((node) => node['@type'] === 'FAQPage');
assert.ok(faqSchema);
assert.equal((faqSchema.mainEntity as unknown[]).length, ODDS_FAQ.length);
assert.doesNotMatch(
  JSON.stringify(ODDS_SCHEMA_NODES),
  /"@type":"(?:Offer|Product|Review|AggregateRating)"|expected winnings|real odds/i,
);

const toolsHubSource = readFileSync(
  new URL('../src/routes/tools/index.astro', import.meta.url),
  'utf8',
);
assert.match(toolsHubSource, /export const prerender = true/);
assert.match(toolsHubSource, /\/tools\/sweepstakes-odds-calculator\//);

const generatorSource = readFileSync(
  new URL('../scripts/generate-astro-pages.mjs', import.meta.url),
  'utf8',
);
assert.match(generatorSource, /'\/tools\/': 'src\/routes\/tools\/index\.astro'/);
assert.match(generatorSource, /'\/tools\/sweepstakes-odds-calculator\/': 'src\/routes\/tools\/sweepstakes-odds-calculator\/index\.astro'/);
assert.match(generatorSource, /push\('\/tools\/'\)/);
assert.match(generatorSource, /push\('\/tools\/sweepstakes-odds-calculator\/'\)/);

console.log('verify-sweepstakes-odds: OK');
