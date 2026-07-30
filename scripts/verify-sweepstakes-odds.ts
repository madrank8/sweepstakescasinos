import assert from 'node:assert/strict';
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

console.log('verify-sweepstakes-odds: OK');
