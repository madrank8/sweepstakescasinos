import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CALCULATION_COMPLETED_PAYLOAD_KEYS,
  entryMixDisplayLabels,
  formatDrawingsResult,
  formatEntryMixValue,
  ODDS_EVENT_CALCULATION_COMPLETED,
  ODDS_EVENT_OPTIONS_OPENED,
  OPTIONS_OPENED_PAYLOAD_KEYS,
  RESULT_INVALIDATING_INPUT_IDS,
} from '../src/lib/oddsCalculatorUi';
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

interface ParsedSendEventCall {
  eventRef: string;
  payloadKeys: string[];
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

const pools = deriveEstimatedPools({ entries: 1, estimate: 5_000, prizes: 10 });
assert.deepEqual(pools, { low: 4_000, base: 5_000, high: 6_250 });
const estimated = estimateProbabilityRange({ entries: 1, estimate: 5_000, prizes: 10 });
assert.equal(formatChance(estimated.best).reciprocal, '1 in 400');
assert.equal(formatChance(estimated.baseChance).reciprocal, '1 in 500');
assert.equal(formatChance(estimated.worst).reciprocal, '1 in 625');
assert.ok(estimated.best >= estimated.baseChance && estimated.baseChance >= estimated.worst);

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

assert.equal(formatChance(0).headline, 'No chance with zero entries.');
assert.equal(formatChance(1).headline, 'Certain under these inputs (100%).');
assert.equal(formatChance(1 / 1_234).reciprocal, 'about 1 in 1,230');
assert.equal(formatChance(1e-10).percent, '<0.000001%');

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

assert.match(calculatorSource, /<section class="odds-result" data-result aria-live="polite" hidden>/);

assert.match(calculatorSource, /function hideResult\(\)/);
assert.match(calculatorSource, /function showErrors\([\s\S]*?hideResult\(\)/);
assert.match(calculatorSource, /function setAdvanced\([\s\S]*?hideResult\(\)/);
assert.match(
  calculatorSource,
  /estimatedToggle\.addEventListener\(['"]change['"],[\s\S]*?hideResult\(\)/,
);
assert.match(
  calculatorSource,
  /form\.addEventListener\(['"]input['"],[\s\S]*?hideResult\(\)/,
);
assert.match(
  calculatorSource,
  /if \(!result\.ok\)[\s\S]*?hideResult\(\)[\s\S]*?showErrors\(result\.issues\)/,
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

console.log('verify-sweepstakes-odds: OK');
