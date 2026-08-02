# SweepstakesWiz Odds Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Execution status is tracked in beads; numbered steps intentionally replace Markdown task checkboxes.

**Goal:** Publish a privacy-preserving SweepstakesWiz calculator that evaluates exact without-replacement drawing odds, clearly labels estimated pools, explains free-entry and repeated-drawing scenarios, and connects readers to the current editorial casino ranking.

**Architecture:** Put all parsing, validation, probability, estimate-band, entry-mix, repetition, and formatting logic in one DOM-free TypeScript module verified with deterministic `node:assert/strict` scripts. Render the calculator as a server-authored Astro component with a bundled vanilla TypeScript controller, render the top-three casino block separately through the existing ranking collection and `<AffiliateLink>`, and compose both on an SSR `ContentLayout` route. Add a prerendered `/tools/` hub and integrate both URLs through the authored-route generator, shared chrome, contextual links, sitemap source mapping, and repository gates.

**Tech Stack:** Astro 7, TypeScript executed by `tsx`, vanilla browser TypeScript, Astro content collections, `node:assert/strict`, existing `ContentLayout.astro`, existing `AffiliateLink.astro`, existing `buildPageGraph()` schema pipeline, existing `partials/trust.css`.

## Global Constraints

- Canonical calculator route: `/tools/sweepstakes-odds-calculator/`; tools hub: `/tools/`.
- Node runtime remains `>=22.12`; add no dependencies.
- Author routes only under `src/routes/`; never hand-edit generated or gitignored `src/pages/`.
- Calculator route must set `export const prerender = false`; tools hub must set `export const prerender = true`.
- All accepted numeric values are base-10 safe integers; reject decimals, exponents, invalid relationships, and any estimate whose high bound exceeds `Number.MAX_SAFE_INTEGER`.
- Use exact without-replacement probability `1 - C(N-M,K)/C(N,K)`, evaluated in log space with the shorter `K`-term or `M`-term product; do not use factorials, combinations, simulation, Monte Carlo, or weighted/tournament heuristics.
- Unknown-pool assumptions are exactly `max(M,K,floor(0.8E))`, `E`, and `ceil(1.25E)`; label them as estimated assumptions, never “real odds” or a confidence interval.
- Free-entry comparison must distinguish combined current-pool odds, free-only odds in the unchanged current pool, and the no-purchase counterfactual that removes paid entries from numerator and denominator.
- Repeated drawings use `-expm1(D * log1p(-p))` and state the independent-drawings/stable-pool assumption.
- Default UI exposes exactly three fields, with `Number of prizes` defaulting to `1`; no fabricated result appears before an explicit submit.
- Calculations stay local and ephemeral: no form submission, API request, query parameter, storage, logging, or analytics payload may contain entered values, derived values, odds, or numeric buckets.
- Only coarse GA4 events are permitted: `odds_calculation_completed`, `odds_options_opened`, and `odds_casino_cta_clicked`, with the fixed enum/boolean metadata specified below.
- Casino order comes only from the first three `partnerSlugs` in `src/content/comparisons/sweepstakes-casinos.mdx`; calculations never influence order, visibility, or CTA copy.
- Casino CTAs use `<AffiliateLink clickId="odds-calculator">`; no raw tracking URL, frozen bonus value, `Offer`, `Product`, `Review`, `AggregateRating`, or rating claim belongs on this tool.
- Preserve the existing affiliate disclosure, `18+ (21+ where required)`, state availability, no-purchase, official-rules, and responsible-play language.
- All key copy, methodology, FAQ, disclosures, review links, and casino cards render on the server and remain useful without JavaScript.
- Use a real form, visible labels, native buttons, native `<details>/<summary>`, linked error summary, inline `aria-describedby`, polite result announcement, result-heading focus, visible focus, text-plus-color status, practical 44px targets, responsive reflow, and reduced-motion handling.
- Build one consolidated JSON-LD graph through `ContentLayout`/`buildPageGraph()` with resolvable `#webpage`, `#breadcrumb`, `#app`, and `#faq` IDs; visitor inputs and results never enter schema.
- Use restrained internal links and include `/best/sweepstakes-casinos/` exactly once in calculator editorial copy.
- Keep unrelated working-tree changes intact. Use beads for execution tracking. Suggested commits below are guidance for implementation workers and are not authorization to commit during planning.

## File Structure and Responsibility Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/sweepstakesOdds.ts` | Create | Pure input parsing, validation, exact probability, estimate ranges, entry-mix comparison, repeated drawings, and display formatting. |
| `scripts/verify-sweepstakes-odds.ts` | Create | Deterministic mathematical and validation assertions. |
| `src/components/odds/OddsCalculator.astro` | Create | Accessible calculator markup, scoped styles, local browser controller, error/result state, and coarse calculation/option analytics. |
| `src/components/odds/OddsCasinoRecommendations.astro` | Create | Server-rendered top-three editorial cards, geo-aware affiliate CTAs, disclosures, and CTA analytics. |
| `src/routes/tools/sweepstakes-odds-calculator/index.astro` | Create | SSR page composition, ranking lookup, complete editorial article, visible FAQ, and `WebApplication`/`FAQPage` nodes. |
| `src/routes/tools/index.astro` | Create | Lightweight prerendered tools hub. |
| `scripts/verify-sweepstakes-odds-integration.ts` | Create | Source/build artifact assertions for route generation, copy, schema, privacy, ranking, and sitemap integration. |
| `package.json` | Modify | Register the two odds verifiers and include them in build/CI sequencing. |
| `.github/workflows/ci.yml` | Modify | Run the generated-artifact integration verifier after build. |
| `partials/nav.html` | Modify | Add a shared `Tools` navigation link. |
| `partials/footer.html` | Modify | Add a `Tools` footer link. |
| `scripts/generate-astro-pages.mjs` | Modify | Add tool source-path mappings, sitemap entries, and curated `llms.txt` tool link. |
| `src/content/guides/dual-currency-sweepstakes-model.mdx` | Modify | Replace “live tools” gap with a contextual odds-calculator link. |
| `src/content/guides/amoe-sweepstakes-casinos.mdx` | Modify | Add free-versus-paid odds context. |
| `src/content/guides/sweeps-coins-explained.mdx` | Modify | Add a natural odds-calculator link after the free-entry methods. |
| `src/routes/bonuses/no-deposit/index.astro` | Modify | Link free-entry readers to the calculator without changing offer data. |
| `reviews/mcluck.html` | Modify | Add a contextual calculator link beside the existing AMOE discussion. |
| `reviews/pulsz.html` | Modify | Add a contextual calculator link beside the existing AMOE discussion. |
| `reviews/crown-coins.html` | Modify | Add a contextual calculator link beside the existing free-entry/promotion discussion. |

---

### Task 1: Pure Odds Engine and Deterministic Verification

**Files:**
- Create: `src/lib/sweepstakesOdds.ts`
- Create: `scripts/verify-sweepstakes-odds.ts`
- Modify: `package.json:9-34`

**Interfaces:**
- Consumes: JavaScript `number`, `BigInt`, `Math.log1p`, `Math.expm1`, and `node:assert/strict`; no Astro, DOM, analytics, or storage API.
- Produces:
  - `type PoolMode = 'known' | 'estimated'`
  - `type OddsField = 'entries' | 'pool' | 'prizes' | 'freeEntries' | 'drawings'`
  - `interface RawCalculatorInput`
  - `interface CalculatorScenario`
  - `type ValidationResult = { ok: true; value: CalculatorScenario } | { ok: false; issues: ValidationIssue[] }`
  - `validateCalculatorInput(raw: RawCalculatorInput): ValidationResult`
  - `exactWinProbability(input: ExactOddsInput): number`
  - `deriveEstimatedPools(input: EstimatedOddsInput): EstimatedPools`
  - `estimateProbabilityRange(input: EstimatedOddsInput): EstimatedProbabilityRange`
  - `entryMixProbabilities(input: EntryMixInput): EntryMixResult`
  - `estimatedEntryMixProbabilities(input: EstimatedEntryMixInput): EstimatedEntryMixResult`
  - `repeatProbability(probability: number, drawings: number): number`
  - `formatChance(probability: number): ChanceDisplay`
- Later tasks must use these names and signatures exactly; browser code must not duplicate formulas or relational validation.

#### Step 1: Write the failing deterministic verifier

Create `scripts/verify-sweepstakes-odds.ts` first. Import the not-yet-created module and include these assertion groups:

```ts
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
```

#### Step 2: Run the verifier and prove the red state

Run:

```bash
npx tsx scripts/verify-sweepstakes-odds.ts
```

Expected: non-zero exit with `ERR_MODULE_NOT_FOUND` naming `src/lib/sweepstakesOdds`.

#### Step 3: Implement the complete pure API

Create `src/lib/sweepstakesOdds.ts`. Use these exact public types and invariants:

```ts
export type PoolMode = 'known' | 'estimated';
export type OddsField = 'entries' | 'pool' | 'prizes' | 'freeEntries' | 'drawings';

export interface RawCalculatorInput {
  poolMode: PoolMode;
  entries: string;
  pool: string;
  prizes: string;
  entryMixActive: boolean;
  freeEntries?: string;
  multipleDrawingsActive: boolean;
  drawings?: string;
}

export interface ValidationIssue {
  field: OddsField;
  code:
    | 'missing'
    | 'negative'
    | 'whole'
    | 'unsafe'
    | 'entries_exceed_pool'
    | 'prizes_below_one'
    | 'prizes_exceed_pool'
    | 'estimate_below_entries'
    | 'estimate_below_prizes'
    | 'estimate_overflow'
    | 'free_entries_range'
    | 'counterfactual_impossible'
    | 'drawings_below_one';
  message: string;
}

export interface CalculatorScenario {
  poolMode: PoolMode;
  entries: number;
  pool: number;
  prizes: number;
  entryMixActive: boolean;
  freeEntries?: number;
  multipleDrawingsActive: boolean;
  drawings?: number;
}

export type ValidationResult =
  | { ok: true; value: CalculatorScenario }
  | { ok: false; issues: ValidationIssue[] };

export interface ExactOddsInput {
  entries: number;
  totalEntries: number;
  prizes: number;
}

export interface EstimatedOddsInput {
  entries: number;
  estimate: number;
  prizes: number;
}

export interface EstimatedPools {
  low: number;
  base: number;
  high: number;
}

export interface EstimatedProbabilityRange extends EstimatedPools {
  best: number;
  baseChance: number;
  worst: number;
}

export interface EntryMixInput extends ExactOddsInput {
  freeEntries: number;
}

export interface EntryMixResult {
  paidEntries: number;
  counterfactualTotalEntries: number;
  combined: number;
  freeOnlyCurrentPool: number;
  noPurchase: number;
}

export interface EstimatedEntryMixInput extends EstimatedOddsInput {
  freeEntries: number;
}

export interface EstimatedEntryMixResult {
  low: EntryMixResult;
  base: EntryMixResult;
  high: EntryMixResult;
}

export interface ChanceDisplay {
  headline: string;
  reciprocal: string;
  percent: string;
  approximate: boolean;
}
```

Implement the functions with integer-safe range derivation and the shorter stable product:

```ts
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const INTEGER_TEXT = /^-?\d+$/;

function assertSafeInteger(name: string, value: number): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a safe integer`);
}

function assertExactInput({ entries, totalEntries, prizes }: ExactOddsInput): void {
  assertSafeInteger('entries', entries);
  assertSafeInteger('totalEntries', totalEntries);
  assertSafeInteger('prizes', prizes);
  if (entries < 0 || totalEntries < 0 || prizes < 1 || entries > totalEntries || prizes > totalEntries) {
    throw new RangeError('Invalid exact odds relationship');
  }
}

export function exactWinProbability(input: ExactOddsInput): number {
  assertExactInput(input);
  const { entries: m, totalEntries: n, prizes: k } = input;
  if (m === 0) return 0;
  if (k > n - m) return 1;

  let logNoWin = 0;
  if (k <= m) {
    for (let i = 0; i < k; i += 1) {
      logNoWin += Math.log1p(-m / (n - i));
    }
  } else {
    for (let i = 0; i < m; i += 1) {
      logNoWin += Math.log1p(-k / (n - i));
    }
  }
  return Math.min(1, Math.max(0, -Math.expm1(logNoWin)));
}

function floorRatio(value: number, numerator: bigint, denominator: bigint): number {
  return Number((BigInt(value) * numerator) / denominator);
}

function ceilRatio(value: number, numerator: bigint, denominator: bigint): number {
  const scaled = BigInt(value) * numerator;
  return Number((scaled + denominator - 1n) / denominator);
}

export function deriveEstimatedPools(input: EstimatedOddsInput): EstimatedPools {
  const { entries, estimate, prizes } = input;
  assertSafeInteger('entries', entries);
  assertSafeInteger('estimate', estimate);
  assertSafeInteger('prizes', prizes);
  if (entries < 0 || prizes < 1 || estimate < entries || estimate < prizes) {
    throw new RangeError('Invalid estimated odds relationship');
  }
  if (BigInt(estimate) * 5n > MAX_SAFE_BIGINT * 4n) {
    throw new RangeError('Estimated high pool exceeds Number.MAX_SAFE_INTEGER');
  }
  return {
    low: Math.max(entries, prizes, floorRatio(estimate, 4n, 5n)),
    base: estimate,
    high: ceilRatio(estimate, 5n, 4n),
  };
}

export function estimateProbabilityRange(input: EstimatedOddsInput): EstimatedProbabilityRange {
  const pools = deriveEstimatedPools(input);
  const exactAt = (totalEntries: number) =>
    exactWinProbability({ entries: input.entries, totalEntries, prizes: input.prizes });
  return {
    ...pools,
    best: exactAt(pools.low),
    baseChance: exactAt(pools.base),
    worst: exactAt(pools.high),
  };
}

export function entryMixProbabilities(input: EntryMixInput): EntryMixResult {
  assertExactInput(input);
  assertSafeInteger('freeEntries', input.freeEntries);
  if (input.freeEntries < 0 || input.freeEntries > input.entries) {
    throw new RangeError('Free entries outside valid range');
  }
  const paidEntries = input.entries - input.freeEntries;
  const counterfactualTotalEntries = input.totalEntries - paidEntries;
  if (input.prizes > counterfactualTotalEntries) {
    throw new RangeError('Counterfactual has more prizes than entries');
  }
  return {
    paidEntries,
    counterfactualTotalEntries,
    combined: exactWinProbability(input),
    freeOnlyCurrentPool: exactWinProbability({
      entries: input.freeEntries,
      totalEntries: input.totalEntries,
      prizes: input.prizes,
    }),
    noPurchase: exactWinProbability({
      entries: input.freeEntries,
      totalEntries: counterfactualTotalEntries,
      prizes: input.prizes,
    }),
  };
}

export function estimatedEntryMixProbabilities(
  input: EstimatedEntryMixInput,
): EstimatedEntryMixResult {
  const pools = deriveEstimatedPools(input);
  const at = (totalEntries: number) =>
    entryMixProbabilities({
      entries: input.entries,
      totalEntries,
      prizes: input.prizes,
      freeEntries: input.freeEntries,
    });
  return { low: at(pools.low), base: at(pools.base), high: at(pools.high) };
}

export function repeatProbability(probability: number, drawings: number): number {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError('Probability must be between 0 and 1');
  }
  assertSafeInteger('drawings', drawings);
  if (drawings < 1) throw new RangeError('Drawings must be at least one');
  if (probability === 0 || probability === 1) return probability;
  return Math.min(1, Math.max(0, -Math.expm1(drawings * Math.log1p(-probability))));
}

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });

export function formatChance(probability: number): ChanceDisplay {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError('Probability must be between 0 and 1');
  }
  if (probability === 0) {
    return {
      headline: 'No chance with zero entries.',
      reciprocal: 'No chance with zero entries.',
      percent: '0%',
      approximate: false,
    };
  }
  if (probability === 1) {
    return {
      headline: 'Certain under these inputs (100%).',
      reciprocal: 'Certain under these inputs',
      percent: '100%',
      approximate: false,
    };
  }

  const rawReciprocal = 1 / probability;
  const roundedReciprocal = Number(rawReciprocal.toPrecision(3));
  const approximate =
    Math.abs(rawReciprocal - roundedReciprocal) >
    Number.EPSILON * Math.max(1, Math.abs(rawReciprocal)) * 8;
  const reciprocal = `${approximate ? 'about ' : ''}1 in ${numberFormat.format(roundedReciprocal)}`;
  const rawPercent = probability * 100;
  const percent =
    rawPercent < 0.000001
      ? '<0.000001%'
      : `${numberFormat.format(Number(rawPercent.toPrecision(3)))}%`;
  return { headline: reciprocal, reciprocal, percent, approximate };
}
```

Add pure parsing and relationship validation beneath those functions. Keep issue order `entries`, `pool`, `prizes`, `freeEntries`, `drawings`, then cross-field errors:

```ts
const missingMessages: Record<OddsField, string> = {
  entries: 'Enter your entries.',
  pool: 'Enter your total entries.',
  prizes: 'Enter the number of prizes.',
  freeEntries: 'Enter how many entries were free/AMOE.',
  drawings: 'Enter the number of drawings.',
};

function parseInteger(
  field: OddsField,
  raw: string | undefined,
  issues: ValidationIssue[],
  poolMode: PoolMode,
): number | undefined {
  const text = raw?.trim() ?? '';
  const missing =
    field === 'pool' && poolMode === 'estimated'
      ? 'Enter your estimated total entries.'
      : missingMessages[field];
  if (!text) {
    issues.push({ field, code: 'missing', message: missing });
    return undefined;
  }
  if (!INTEGER_TEXT.test(text)) {
    issues.push({
      field,
      code: field === 'drawings' ? 'drawings_below_one' : 'whole',
      message: field === 'drawings'
        ? 'Enter at least one whole drawing.'
        : 'Use a whole number of entries.',
    });
    return undefined;
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value)) {
    issues.push({
      field,
      code: 'unsafe',
      message: 'Enter a whole number smaller than the calculator’s maximum.',
    });
    return undefined;
  }
  return value;
}

export function validateCalculatorInput(raw: RawCalculatorInput): ValidationResult {
  const issues: ValidationIssue[] = [];
  const entries = parseInteger('entries', raw.entries, issues, raw.poolMode);
  const pool = parseInteger('pool', raw.pool, issues, raw.poolMode);
  const prizes = parseInteger('prizes', raw.prizes, issues, raw.poolMode);
  const freeEntries = raw.entryMixActive
    ? parseInteger('freeEntries', raw.freeEntries, issues, raw.poolMode)
    : undefined;
  const drawings = raw.multipleDrawingsActive
    ? parseInteger('drawings', raw.drawings, issues, raw.poolMode)
    : undefined;

  if (entries !== undefined && entries < 0) {
    issues.push({ field: 'entries', code: 'negative', message: 'Your entries can’t be negative.' });
  }
  if (prizes !== undefined && prizes < 1) {
    issues.push({ field: 'prizes', code: 'prizes_below_one', message: 'Enter at least one prize.' });
  }
  if (drawings !== undefined && drawings < 1) {
    issues.push({ field: 'drawings', code: 'drawings_below_one', message: 'Enter at least one whole drawing.' });
  }

  if (
    entries !== undefined && pool !== undefined && prizes !== undefined &&
    entries >= 0 && prizes >= 1
  ) {
    if (raw.poolMode === 'known') {
      if (entries > pool) {
        issues.push({
          field: 'pool',
          code: 'entries_exceed_pool',
          message: 'Total entries must include your entries, so it can’t be smaller than your entries.',
        });
      }
      if (prizes > pool) {
        issues.push({
          field: 'prizes',
          code: 'prizes_exceed_pool',
          message: 'The number of prizes can’t be greater than the total entries.',
        });
      }
    } else {
      if (pool < entries) {
        issues.push({
          field: 'pool',
          code: 'estimate_below_entries',
          message: 'Your estimated total must include your entries.',
        });
      }
      if (pool < prizes) {
        issues.push({
          field: 'pool',
          code: 'estimate_below_prizes',
          message: 'Your estimated total can’t be smaller than the number of prizes.',
        });
      }
      if (pool >= 0 && BigInt(pool) * 5n > MAX_SAFE_BIGINT * 4n) {
        issues.push({
          field: 'pool',
          code: 'estimate_overflow',
          message: 'Use a smaller estimated total so the full range can be calculated.',
        });
      }
    }

    if (raw.entryMixActive && freeEntries !== undefined) {
      if (freeEntries < 0 || freeEntries > entries) {
        issues.push({
          field: 'freeEntries',
          code: 'free_entries_range',
          message: 'Free entries must be between 0 and your total entries.',
        });
      } else if (issues.length === 0) {
        const paidEntries = entries - freeEntries;
        const totals = raw.poolMode === 'known'
          ? [pool]
          : Object.values(deriveEstimatedPools({ entries, estimate: pool, prizes }));
        if (totals.some((total) => prizes > total - paidEntries)) {
          issues.push({
            field: 'freeEntries',
            code: 'counterfactual_impossible',
            message: 'Without your paid entries, this scenario would have more prizes than entries. Adjust the entry split or prize count.',
          });
        }
      }
    }
  }

  if (issues.length > 0 || entries === undefined || pool === undefined || prizes === undefined) {
    return { ok: false, issues };
  }
  return {
    ok: true,
    value: {
      poolMode: raw.poolMode,
      entries,
      pool,
      prizes,
      entryMixActive: raw.entryMixActive,
      ...(raw.entryMixActive ? { freeEntries } : {}),
      multipleDrawingsActive: raw.multipleDrawingsActive,
      ...(raw.multipleDrawingsActive ? { drawings } : {}),
    },
  };
}
```

#### Step 4: Run the focused verifier and correct only implementation defects

Run:

```bash
npx tsx scripts/verify-sweepstakes-odds.ts
```

Expected: `verify-sweepstakes-odds: OK` and exit code `0`.

#### Step 5: Register the focused verifier

Modify `package.json`:

```json
{
  "scripts": {
    "verify:odds": "tsx scripts/verify-sweepstakes-odds.ts",
    "prebuild": "npm run content:lint && npm run tracker:lint && npm run schema:verify && npm run methodology:check && npm run verify:odds && npm run reader-reports:aggregate && npm run generate:pages",
    "ci": "npm run verify:availability && npm run content:lint && npm run tracker:lint && npm run methodology:check && npm run verify:odds && npm run testing:verify && npm run testing:verify-overclaims && npm run build"
  }
}
```

Keep every existing script; only add `verify:odds` and insert it into the existing command chains.

#### Step 6: Run task gates

Run:

```bash
npm run verify:odds
npm run schema:verify
```

Expected:
- `verify-sweepstakes-odds: OK`
- `verify-schema-helpers: OK`
- static schema verifier reports `OK`

#### Step 7: Suggested conventional commit

```bash
git add src/lib/sweepstakesOdds.ts scripts/verify-sweepstakes-odds.ts package.json package-lock.json
git commit -m "feat: add stable sweepstakes odds engine"
```

`package-lock.json` should remain unchanged because no dependency is added; do not stage it if `git diff -- package-lock.json` is empty.

---

### Task 2: Accessible Local-Only Calculator Component

**Files:**
- Create: `src/components/odds/OddsCalculator.astro`
- Modify: `scripts/verify-sweepstakes-odds.ts`

**Interfaces:**
- Consumes all Task 1 interfaces, especially `validateCalculatorInput()`, `exactWinProbability()`, `estimateProbabilityRange()`, `entryMixProbabilities()`, `estimatedEntryMixProbabilities()`, `repeatProbability()`, and `formatChance()`.
- Produces server-rendered markup rooted at `[data-odds-calculator]`, stable field IDs `odds-entries`, `odds-pool`, `odds-prizes`, `odds-free-entries`, and `odds-drawings`, one replace-in-place result region, and no exported component props.
- Emits only:
  - `odds_calculation_completed` with `{ pool_mode: 'known' | 'estimated', entry_mix_active: boolean, multiple_drawings_active: boolean }`
  - `odds_options_opened` with `{ option_name: 'entry_mix' | 'multiple_drawings' }`
- The recommendation component in Task 3 is a sibling, not a child; do not put ranking data or affiliate logic in this file.

#### Step 1: Add failing source-contract assertions

Append to `scripts/verify-sweepstakes-odds.ts`:

```ts
import { readFileSync } from 'node:fs';

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
```

#### Step 2: Prove the component is absent

Run:

```bash
npm run verify:odds
```

Expected: non-zero exit with `ENOENT` for `src/components/odds/OddsCalculator.astro`.

#### Step 3: Create semantic server-rendered markup

Create `src/components/odds/OddsCalculator.astro` with this structure. Keep the field IDs exact because validation summary links and integration checks consume them:

```astro
---
// All behavior is bundled below; this component has no server props.
---
<section class="odds-calculator" data-odds-calculator aria-labelledby="odds-calculator-title">
  <h2 id="odds-calculator-title">Calculate your sweepstakes odds</h2>
  <p class="odds-intro">
    This calculates the chance that at least one of your entries is selected when unique winning
    entries are drawn without replacement.
  </p>

  <div class="odds-error-summary" data-error-summary tabindex="-1" role="alert" hidden>
    <h3>Check the highlighted fields</h3>
    <ul data-error-list></ul>
  </div>

  <form data-odds-form novalidate>
    <div class="odds-grid">
      <div class="odds-field" data-field-wrap="entries">
        <label for="odds-entries">Your entries</label>
        <input id="odds-entries" name="entries" type="text" inputmode="numeric"
          pattern="[0-9]*" autocomplete="off" aria-describedby="odds-entries-hint odds-entries-error" />
        <p id="odds-entries-hint" class="odds-hint">Include free and purchase-associated entries.</p>
        <p id="odds-entries-error" class="odds-field-error" data-error-for="entries" hidden></p>
      </div>

      <fieldset class="odds-field odds-pool-field">
        <legend>Entry pool</legend>
        <label for="odds-pool" data-pool-label>Total entries</label>
        <input id="odds-pool" name="pool" type="text" inputmode="numeric"
          pattern="[0-9]*" autocomplete="off" aria-describedby="odds-pool-hint odds-pool-error" />
        <p id="odds-pool-hint" class="odds-hint" data-pool-hint>
          Include your entries in the drawing total.
        </p>
        <p id="odds-pool-error" class="odds-field-error" data-error-for="pool" hidden></p>
        <label class="odds-mode-toggle">
          <input type="checkbox" data-estimated-toggle />
          I don’t know the total
        </label>
      </fieldset>

      <div class="odds-field" data-field-wrap="prizes">
        <label for="odds-prizes">Number of prizes</label>
        <input id="odds-prizes" name="prizes" type="text" inputmode="numeric"
          pattern="[0-9]*" autocomplete="off" value="1"
          aria-describedby="odds-prizes-hint odds-prizes-error" />
        <p id="odds-prizes-hint" class="odds-hint">Each prize selects one unique winning entry.</p>
        <p id="odds-prizes-error" class="odds-field-error" data-error-for="prizes" hidden></p>
      </div>
    </div>

    <details class="odds-options">
      <summary>More options</summary>
      <div class="odds-option">
        <label>
          <input type="checkbox" data-entry-mix-toggle />
          Compare free vs paid entries
        </label>
        <div data-entry-mix-fields hidden>
          <label for="odds-free-entries">How many of your entries were free/AMOE?</label>
          <input id="odds-free-entries" name="freeEntries" type="text" inputmode="numeric"
            pattern="[0-9]*" autocomplete="off" disabled
            aria-describedby="odds-free-entries-hint odds-free-entries-error" />
          <p id="odds-free-entries-hint" class="odds-hint">
            Purchase-associated entries are derived as your entries minus free entries.
          </p>
          <p id="odds-free-entries-error" class="odds-field-error"
            data-error-for="freeEntries" hidden></p>
        </div>
      </div>

      <div class="odds-option">
        <label>
          <input type="checkbox" data-drawings-toggle />
          Multiple drawings
        </label>
        <div data-drawings-fields hidden>
          <label for="odds-drawings">Number of independent drawings</label>
          <input id="odds-drawings" name="drawings" type="text" inputmode="numeric"
            pattern="[0-9]*" autocomplete="off" disabled
            aria-describedby="odds-drawings-hint odds-drawings-error" />
          <p id="odds-drawings-hint" class="odds-hint">
            Assumes each drawing is independent with the same pool and probability.
          </p>
          <p id="odds-drawings-error" class="odds-field-error"
            data-error-for="drawings" hidden></p>
        </div>
      </div>
    </details>

    <p class="odds-assumption">Unique winning entries · drawn without replacement</p>
    <button class="odds-submit" type="submit">Calculate my odds</button>
  </form>

  <section class="odds-result" data-result aria-live="polite" hidden>
    <h2 tabindex="-1" data-result-heading></h2>
    <p class="odds-result-percent" data-result-percent></p>
    <p data-result-assumption></p>
    <div data-entry-mix-result hidden>
      <h3>Free and purchase-associated entry comparison</h3>
      <dl>
        <div><dt>Combined current-pool odds</dt><dd data-mix-combined></dd></div>
        <div><dt>Free-only odds in the same current pool</dt><dd data-mix-free-current></dd></div>
        <div><dt>No-purchase counterfactual</dt><dd data-mix-no-purchase></dd></div>
      </dl>
    </div>
    <p data-drawings-result hidden></p>
  </section>

  <noscript>
    <p class="odds-noscript">
      The calculator needs JavaScript to calculate a result. The methodology, examples, FAQ,
      disclosures, casino reviews, and related guides below remain available.
    </p>
  </noscript>
</section>
```

#### Step 4: Implement state, validation, safe rendering, and analytics

Add a processed `<script>` that imports Task 1. Never interpolate input text into HTML; all output assignments use `textContent`.

```ts
import {
  entryMixProbabilities,
  estimateProbabilityRange,
  estimatedEntryMixProbabilities,
  exactWinProbability,
  formatChance,
  repeatProbability,
  validateCalculatorInput,
  type OddsField,
  type ValidationIssue,
} from '../../lib/sweepstakesOdds';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sendEvent(name: string, params: Record<string, string | boolean>): void {
  try {
    window.gtag?.('event', name, params);
  } catch {
    // Analytics is optional and must never block calculation.
  }
}

function initialize(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-odds-form]')!;
  const pool = root.querySelector<HTMLInputElement>('#odds-pool')!;
  const poolLabel = root.querySelector<HTMLElement>('[data-pool-label]')!;
  const poolHint = root.querySelector<HTMLElement>('[data-pool-hint]')!;
  const estimatedToggle = root.querySelector<HTMLInputElement>('[data-estimated-toggle]')!;
  const entryMixToggle = root.querySelector<HTMLInputElement>('[data-entry-mix-toggle]')!;
  const drawingsToggle = root.querySelector<HTMLInputElement>('[data-drawings-toggle]')!;
  const opened = new Set<'entry_mix' | 'multiple_drawings'>();

  const fieldId: Record<OddsField, string> = {
    entries: 'odds-entries',
    pool: 'odds-pool',
    prizes: 'odds-prizes',
    freeEntries: 'odds-free-entries',
    drawings: 'odds-drawings',
  };

  function clearErrors(): void {
    root.querySelector<HTMLElement>('[data-error-summary]')!.hidden = true;
    root.querySelector<HTMLElement>('[data-error-list]')!.replaceChildren();
    root.querySelectorAll<HTMLElement>('[data-error-for]').forEach((node) => {
      node.hidden = true;
      node.textContent = '';
    });
    Object.values(fieldId).forEach((id) => {
      root.querySelector<HTMLElement>(`#${id}`)?.removeAttribute('aria-invalid');
    });
  }

  function showErrors(issues: ValidationIssue[]): void {
    clearErrors();
    const summary = root.querySelector<HTMLElement>('[data-error-summary]')!;
    const list = root.querySelector<HTMLUListElement>('[data-error-list]')!;
    for (const issue of issues) {
      const input = root.querySelector<HTMLElement>(`#${fieldId[issue.field]}`);
      const inline = root.querySelector<HTMLElement>(`[data-error-for="${issue.field}"]`);
      input?.setAttribute('aria-invalid', 'true');
      if (inline) {
        inline.textContent = `Error: ${issue.message}`;
        inline.hidden = false;
      }
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${fieldId[issue.field]}`;
      link.textContent = issue.message;
      item.append(link);
      list.append(item);
    }
    summary.hidden = false;
    summary.focus();
  }

  function setAdvanced(
    toggle: HTMLInputElement,
    selector: string,
    option: 'entry_mix' | 'multiple_drawings',
  ): void {
    const fields = root.querySelector<HTMLElement>(selector)!;
    fields.hidden = !toggle.checked;
    fields.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
      input.disabled = !toggle.checked;
    });
    if (toggle.checked && !opened.has(option)) {
      opened.add(option);
      sendEvent('odds_options_opened', { option_name: option });
    }
    clearErrors();
  }

  estimatedToggle.addEventListener('change', () => {
    pool.value = '';
    poolLabel.textContent = estimatedToggle.checked
      ? 'Your best estimate of total entries'
      : 'Total entries';
    poolHint.textContent = estimatedToggle.checked
      ? 'Include your entries; the calculator applies stated 0.8× and 1.25× assumptions.'
      : 'Include your entries in the drawing total.';
    clearErrors();
  });
  entryMixToggle.addEventListener('change', () =>
    setAdvanced(entryMixToggle, '[data-entry-mix-fields]', 'entry_mix'));
  drawingsToggle.addEventListener('change', () =>
    setAdvanced(drawingsToggle, '[data-drawings-fields]', 'multiple_drawings'));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const result = validateCalculatorInput({
      poolMode: estimatedToggle.checked ? 'estimated' : 'known',
      entries: String(data.get('entries') ?? ''),
      pool: String(data.get('pool') ?? ''),
      prizes: String(data.get('prizes') ?? ''),
      entryMixActive: entryMixToggle.checked,
      freeEntries: entryMixToggle.checked ? String(data.get('freeEntries') ?? '') : undefined,
      multipleDrawingsActive: drawingsToggle.checked,
      drawings: drawingsToggle.checked ? String(data.get('drawings') ?? '') : undefined,
    });
    if (!result.ok) {
      showErrors(result.issues);
      return;
    }
    clearErrors();

    const scenario = result.value;
    const resultRegion = root.querySelector<HTMLElement>('[data-result]')!;
    const heading = root.querySelector<HTMLElement>('[data-result-heading]')!;
    const percent = root.querySelector<HTMLElement>('[data-result-percent]')!;
    const assumption = root.querySelector<HTMLElement>('[data-result-assumption]')!;
    let singleProbability: number;

    if (scenario.poolMode === 'known') {
      singleProbability = exactWinProbability({
        entries: scenario.entries,
        totalEntries: scenario.pool,
        prizes: scenario.prizes,
      });
      const display = formatChance(singleProbability);
      heading.textContent = display.headline.startsWith('No chance') ||
        display.headline.startsWith('Certain')
        ? display.headline
        : `Your calculated chance is ${display.reciprocal}.`;
      percent.textContent = `Calculated probability: ${display.percent}.`;
      assumption.textContent =
        'Known-pool calculation: unique winning entries drawn without replacement.';
    } else {
      const range = estimateProbabilityRange({
        entries: scenario.entries,
        estimate: scenario.pool,
        prizes: scenario.prizes,
      });
      singleProbability = range.baseChance;
      const reciprocalOnly = (probability: number) =>
        formatChance(probability).reciprocal.replace(/^about /, '');
      if (scenario.entries === 0) {
        heading.textContent = 'No chance with zero entries.';
      } else if (range.worst === 1) {
        heading.textContent = 'Certain under these inputs (100%).';
      } else if (range.best === 1) {
        heading.textContent =
          `Your estimated chance ranges from certainty under the low-pool assumption to ` +
          `${reciprocalOnly(range.worst)} (base estimate: ` +
          `${range.baseChance === 1 ? 'certainty' : reciprocalOnly(range.baseChance)}).`;
      } else {
        heading.textContent =
          `Your estimated chance is about ${reciprocalOnly(range.best)}` +
          ` to ${reciprocalOnly(range.worst)}` +
          ` (base estimate: ${reciprocalOnly(range.baseChance)}).`;
      }
      percent.textContent =
        `Estimated probability range: ${formatChance(range.worst).percent} to ` +
        `${formatChance(range.best).percent}; base assumption ${formatChance(range.baseChance).percent}.`;
      assumption.textContent =
        'Estimate assumptions only: 0.8×, entered total, and 1.25× total entries. This is not a confidence interval or operator data.';
    }

    const mixRegion = root.querySelector<HTMLElement>('[data-entry-mix-result]')!;
    mixRegion.hidden = !scenario.entryMixActive;
    if (scenario.entryMixActive && scenario.freeEntries !== undefined) {
      const mix = scenario.poolMode === 'known'
        ? entryMixProbabilities({
            entries: scenario.entries,
            totalEntries: scenario.pool,
            prizes: scenario.prizes,
            freeEntries: scenario.freeEntries,
          })
        : estimatedEntryMixProbabilities({
            entries: scenario.entries,
            estimate: scenario.pool,
            prizes: scenario.prizes,
            freeEntries: scenario.freeEntries,
          }).base;
      root.querySelector<HTMLElement>('[data-mix-combined]')!.textContent =
        `${formatChance(mix.combined).reciprocal} (${formatChance(mix.combined).percent})`;
      root.querySelector<HTMLElement>('[data-mix-free-current]')!.textContent =
        `${formatChance(mix.freeOnlyCurrentPool).reciprocal} (${formatChance(mix.freeOnlyCurrentPool).percent})`;
      root.querySelector<HTMLElement>('[data-mix-no-purchase]')!.textContent =
        `${formatChance(mix.noPurchase).reciprocal} (${formatChance(mix.noPurchase).percent})`;
    }

    const drawingsResult = root.querySelector<HTMLElement>('[data-drawings-result]')!;
    drawingsResult.hidden = !scenario.multipleDrawingsActive;
    if (scenario.multipleDrawingsActive && scenario.drawings !== undefined) {
      const repeated = repeatProbability(singleProbability, scenario.drawings);
      drawingsResult.textContent =
        `Across the entered number of independent drawings: ${formatChance(repeated).reciprocal} ` +
        `(${formatChance(repeated).percent}). This requires a stable pool and probability; it does not apply if entries roll over or draws are linked.`;
    }

    resultRegion.hidden = false;
    heading.focus();
    sendEvent('odds_calculation_completed', {
      pool_mode: scenario.poolMode,
      entry_mix_active: scenario.entryMixActive,
      multiple_drawings_active: scenario.multipleDrawingsActive,
    });
  });
}

document.querySelectorAll<HTMLElement>('[data-odds-calculator]').forEach(initialize);
```

#### Step 5: Add scoped accessible styles

Add a scoped `<style>` with these minimum declarations; retain the existing site colors and avoid global selectors:

```css
.odds-calculator{border:1px solid #dbe3ee;border-radius:16px;background:#fff;padding:24px;margin:0 0 26px;box-shadow:0 4px 18px rgba(10,22,40,.08)}
.odds-intro,.odds-hint,.odds-assumption{color:#475569}
.odds-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.odds-field{min-width:0;border:0;padding:0;margin:0}
.odds-field label,.odds-field legend,.odds-option label{display:block;font-weight:800;color:#0a1628}
.odds-field input,.odds-option input[type="text"]{width:100%;min-height:44px;border:1px solid #94a3b8;border-radius:9px;padding:9px 11px;font:inherit;background:#fff;color:#0f172a}
.odds-field input:focus-visible,.odds-option input:focus-visible,.odds-submit:focus-visible,summary:focus-visible,.odds-mode-toggle input:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}
[aria-invalid="true"]{border-color:#b91c1c!important;box-shadow:0 0 0 1px #b91c1c}
.odds-field-error{color:#991b1b;font-weight:700}
.odds-error-summary{border:2px solid #b91c1c;border-radius:10px;background:#fef2f2;padding:14px 16px;margin:16px 0}
.odds-error-summary h3{margin:0 0 8px}.odds-error-summary ul{margin:0 0 0 20px}
.odds-mode-toggle{display:flex!important;align-items:center;gap:8px;min-height:44px;margin-top:8px;font-weight:600!important}
.odds-options{border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:12px 0;margin:18px 0}
.odds-options summary{min-height:44px;display:flex;align-items:center;font-weight:800;cursor:pointer}
.odds-option{padding:10px 0}.odds-option>label{display:flex;align-items:center;gap:10px;min-height:44px}
.odds-submit{min-height:48px;border:0;border-radius:10px;padding:10px 18px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0a1628;font:800 1rem 'Sora',sans-serif;cursor:pointer}
.odds-result{margin-top:22px;border-left:4px solid #10b981;background:#f0fdf4;border-radius:10px;padding:18px}
.odds-result h2{margin-top:0}.odds-result dl>div{padding:8px 0;border-top:1px solid #bbf7d0}
.odds-result dt{font-weight:800}.odds-result dd{margin:2px 0 0}
.odds-noscript{border-left:4px solid #1a56db;background:#eff6ff;padding:12px 14px}
@media(max-width:700px){.odds-grid{grid-template-columns:1fr}.odds-calculator{padding:18px}}
@media(prefers-reduced-motion:reduce){.odds-calculator *{scroll-behavior:auto!important;transition:none!important}}
```

#### Step 6: Run focused and broader gates

Run:

```bash
npm run verify:odds
npm run generate:pages
npm run build
```

Expected:
- focused verifier prints `verify-sweepstakes-odds: OK`
- page generator prints `Generated Astro pages...`
- Astro build exits `0`

#### Step 7: Suggested conventional commit

```bash
git add src/components/odds/OddsCalculator.astro scripts/verify-sweepstakes-odds.ts
git commit -m "feat: add accessible local odds calculator"
```

---

### Task 3: Server-Rendered Editorial Casino Recommendations

**Files:**
- Create: `src/components/odds/OddsCasinoRecommendations.astro`
- Modify: `scripts/verify-sweepstakes-odds.ts`

**Interfaces:**
- Consumes:
  - `partners: [AffiliatePartner, AffiliatePartner, AffiliatePartner]`
  - `Astro.locals.usState`
  - `shouldRenderAffiliateCta(partner, state): boolean`
  - `<AffiliateLink partner={partner} clickId="odds-calculator">`
- Produces a server-rendered `<section data-odds-recommendations>` with exactly three cards in input order, review links at `/reviews/<slug>/`, geo-aware CTA or text status, and fixed compliance copy.
- Emits `odds_casino_cta_clicked` only for a rendered affiliate CTA, with `{ casino_slug: string, placement: 'odds-calculator' }`.

#### Step 1: Add a failing component contract

Append:

```ts
const recommendationsSource = readFileSync(
  new URL('../src/components/odds/OddsCasinoRecommendations.astro', import.meta.url),
  'utf8',
);
assert.match(recommendationsSource, /AffiliateLink/);
assert.match(recommendationsSource, /clickId="odds-calculator"/);
assert.match(recommendationsSource, /editorially ranked casinos, not recommendations produced by your odds result/);
assert.match(recommendationsSource, /odds_casino_cta_clicked/);
assert.doesNotMatch(recommendationsSource, /Offer|AggregateRating|trackingLink/);
```

#### Step 2: Prove the component is absent

Run `npm run verify:odds`.

Expected: non-zero exit with `ENOENT` for `OddsCasinoRecommendations.astro`.

#### Step 3: Create the complete server component

```astro
---
import AffiliateLink from '../AffiliateLink.astro';
import type { AffiliatePartner } from '../../data/affiliates';
import { shouldRenderAffiliateCta } from '../../data/geo';

interface Props {
  partners: [AffiliatePartner, AffiliatePartner, AffiliatePartner];
}

const { partners } = Astro.props;
const state = Astro.locals.usState;
---
<section class="odds-recommendations" data-odds-recommendations
  aria-labelledby="odds-recommendations-title">
  <h2 id="odds-recommendations-title">Get more free entries at these sweepstakes casinos</h2>
  <p>
    These are editorially ranked casinos, not recommendations produced by your odds result.
    Calculator inputs never change this order.
  </p>
  <ol class="odds-casino-list">
    {partners.map((partner, index) => {
      const available = shouldRenderAffiliateCta(partner, state);
      return (
        <li class="odds-casino-card">
          <span class="odds-casino-rank">#{index + 1}</span>
          <div class="odds-casino-body">
            <h3><a href={`/reviews/${partner.slug}/`}>{partner.name}</a></h3>
            <p class:list={['odds-casino-status', { available, unavailable: !available }]}>
              {available ? 'Available in your location' : 'Not available in your location'}
            </p>
            <p>Read our editorial review for free-entry routes, eligibility, and official-rules context.</p>
          </div>
          <div class="odds-casino-actions">
            <a href={`/reviews/${partner.slug}/`}>Read review</a>
            <AffiliateLink
              partner={partner}
              label={`Visit ${partner.name}`}
              class="odds-casino-cta"
              clickId="odds-calculator"
              showUnavailableNote={false}
            />
          </div>
        </li>
      );
    })}
  </ol>
  <p class="odds-casino-disclosure">
    We may earn a referral fee when you use an affiliate link; this never affects rankings.
    See our <a href="/legal/affiliate-disclosure/">Affiliate Disclosure</a>.
    No purchase necessary. 18+ (21+ where required). Not available in all states.
    Check each operator’s official rules and <a href="/responsible-gaming/">play responsibly</a>.
  </p>
</section>

<style>
  .odds-recommendations{margin:8px 0 30px}
  .odds-casino-list{list-style:none;margin:16px 0;padding:0}
  .odds-casino-card{display:flex;align-items:center;gap:14px;padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:linear-gradient(165deg,#fafcff,#eef4ff);margin-bottom:12px}
  .odds-casino-rank{font-family:'Sora',sans-serif;font-weight:900;color:#1a56db;font-size:1.1rem;min-width:34px}
  .odds-casino-body{flex:1}.odds-casino-body h3{margin:0 0 3px}.odds-casino-body p{margin:0}
  .odds-casino-status{font-size:.78rem;font-weight:800}.odds-casino-status.available{color:#047857}.odds-casino-status.unavailable{color:#991b1b}
  .odds-casino-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}
  .odds-casino-actions :global(.odds-casino-cta){display:inline-block;min-height:44px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0a1628;font-weight:800;padding:10px 16px;border-radius:10px;text-decoration:none}
  .odds-casino-disclosure{font-size:.84rem;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px}
  @media(max-width:620px){.odds-casino-card{align-items:flex-start;flex-wrap:wrap}.odds-casino-actions{width:100%;justify-content:flex-start;padding-left:48px}}
</style>

<script>
  declare global {
    interface Window {
      gtag?: (...args: unknown[]) => void;
    }
  }
  document.querySelectorAll<HTMLElement>('[data-odds-recommendations]').forEach((root) => {
    root.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[data-affiliate]');
      if (!link) return;
      try {
        window.gtag?.('event', 'odds_casino_cta_clicked', {
          casino_slug: link.dataset.affiliate ?? '',
          placement: 'odds-calculator',
        });
      } catch {
        // Navigation remains independent from analytics.
      }
    });
  });
</script>
```

#### Step 4: Verify component contract and existing affiliate behavior

Run:

```bash
npm run verify:odds
npm run verify:availability
```

Expected:
- odds verifier prints `OK`
- availability verifier ends with `✅ ALL CHECKS PASSED`

#### Step 5: Suggested conventional commit

```bash
git add src/components/odds/OddsCasinoRecommendations.astro scripts/verify-sweepstakes-odds.ts
git commit -m "feat: add editorial odds casino cards"
```

---

### Task 4: SSR Calculator Route, Editorial Content, FAQ, and Schema

**Files:**
- Create: `src/routes/tools/sweepstakes-odds-calculator/index.astro`
- Modify: `scripts/verify-sweepstakes-odds.ts`

**Interfaces:**
- Consumes:
  - `await getEntry('comparisons', 'sweepstakes-casinos')`
  - first three `entry.data.partnerSlugs`
  - `getPartner(slug): AffiliatePartner | undefined`
  - `<OddsCalculator />`
  - `<OddsCasinoRecommendations partners={topPartners} />`
  - `faqPageNode(canonical, faq)`
  - `<ContentLayout mainEntityId={`${canonical}#app`} jsonLd={[webApplicationLd, faqLd]}>`
- Produces:
  - SSR route `/tools/sweepstakes-odds-calculator/`
  - `WebApplication` ID `https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#app`
  - `FAQPage` ID `https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#faq`
  - complete server-rendered article in the required order.
- If the comparison entry is absent, has fewer than three slugs, or any selected slug has no affiliate partner, throw during request/build; never substitute a hard-coded ranking.

#### Step 1: Add failing route assertions

Append:

```ts
const routeSource = readFileSync(
  new URL('../src/routes/tools/sweepstakes-odds-calculator/index.astro', import.meta.url),
  'utf8',
);
assert.match(routeSource, /export const prerender = false/);
assert.match(routeSource, /getEntry\('comparisons', 'sweepstakes-casinos'\)/);
assert.match(routeSource, /partnerSlugs\.slice\(0, 3\)/);
assert.match(routeSource, /applicationCategory: 'UtilitiesApplication'/);
assert.match(routeSource, /browserRequirements: 'Requires JavaScript'/);
assert.match(routeSource, /mainEntityId=\{`\$\{canonical\}#app`\}/);
assert.match(routeSource, /faqPageNode/);
assert.doesNotMatch(routeSource, /Offer|AggregateRating|expected winnings|real odds/i);
```

#### Step 2: Prove the route is absent

Run `npm run verify:odds`.

Expected: non-zero exit with `ENOENT` for the authored calculator route.

#### Step 3: Implement route frontmatter, ranking lookup, FAQ, and graph nodes

Use this exact frontmatter:

```astro
---
export const prerender = false;

import { getEntry } from 'astro:content';
import ContentLayout from '../../../layouts/ContentLayout.astro';
import OddsCalculator from '../../../components/odds/OddsCalculator.astro';
import OddsCasinoRecommendations from '../../../components/odds/OddsCasinoRecommendations.astro';
import { getPartner, type AffiliatePartner } from '../../../data/affiliates';
import { faqPageNode, ORG_ID } from '../../../lib/schema';

const ORIGIN = 'https://sweepstakeswiz.com';
const canonicalPath = '/tools/sweepstakes-odds-calculator/';
const canonical = `${ORIGIN}${canonicalPath}`;
const title = 'Sweepstakes Odds Calculator: Exact Odds & Multiple Prizes | SweepstakesWiz';
const description =
  'Calculate exact sweepstakes odds without replacement, estimate an unknown entry pool, compare free versus paid entries, and check multiple independent drawings.';

const ranking = await getEntry('comparisons', 'sweepstakes-casinos');
if (!ranking || ranking.data.draft) {
  throw new Error('Odds calculator requires the published sweepstakes-casinos comparison entry.');
}
const topSlugs = ranking.data.partnerSlugs.slice(0, 3);
if (topSlugs.length !== 3) {
  throw new Error('Odds calculator requires three ranked partner slugs.');
}
const resolvedPartners = topSlugs.map((slug) => getPartner(slug));
if (resolvedPartners.some((partner) => !partner)) {
  throw new Error(`Odds calculator ranking contains an unknown partner: ${topSlugs.join(', ')}`);
}
const topPartners = resolvedPartners as [AffiliatePartner, AffiliatePartner, AffiliatePartner];

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Tools', path: '/tools/' },
  { name: 'Sweepstakes Odds Calculator', path: canonicalPath },
];

const faq = [
  {
    q: 'How does this sweepstakes odds calculator work?',
    a: 'It calculates the chance that at least one of your entries is selected when a stated number of unique winning entries is drawn without replacement from a known total. It evaluates the exact combinatorial model numerically in log space; it does not run a simulation.',
  },
  {
    q: 'What if I do not know the total number of entries?',
    a: 'Enter your best estimate of the total, including your own entries. The calculator shows an estimated range using 0.8 times the estimate, the entered estimate, and 1.25 times the estimate. Those are transparent product assumptions, not a confidence interval or operator data.',
  },
  {
    q: 'How do multiple prizes change my odds?',
    a: 'More unique prizes increase the chance that at least one of your entries is selected, provided winners are drawn without replacement. The calculator rejects a prize count greater than the total number of entries.',
  },
  {
    q: 'How are free and purchase-associated entries compared?',
    a: 'The calculator shows combined odds in the current pool, free-only odds while leaving the current pool unchanged, and a no-purchase counterfactual that removes your purchase-associated entries from both your entry count and the pool total.',
  },
  {
    q: 'Can this calculator reveal an operator’s actual odds?',
    a: 'No. It can calculate exact odds only when the total entry pool and prize count are known. If an operator does not disclose the pool, the estimate mode remains an assumption and does not override the operator’s official rules.',
  },
  {
    q: 'Do more entries guarantee a win?',
    a: 'No. More entries can increase the calculated probability, but they do not guarantee a win unless the mathematical result is exactly 100 percent under the stated inputs and assumptions. The calculator does not recommend spending or compare purchase value.',
  },
];

const webApplicationLd = {
  '@type': 'WebApplication',
  '@id': `${canonical}#app`,
  name: 'SweepstakesWiz Sweepstakes Odds Calculator',
  url: canonical,
  description,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript',
  isAccessibleForFree: true,
  publisher: { '@id': ORG_ID },
};
const faqLd = faqPageNode(canonical, faq);
if (!faqLd) throw new Error('Odds calculator FAQ schema must not be empty.');
---
```

#### Step 4: Compose the calculator and recommendation block above the article

```astro
<ContentLayout
  title={title}
  description={description}
  canonicalPath={canonicalPath}
  breadcrumbs={breadcrumbs}
  heroTitle={'Sweepstakes <span class="accent">Odds Calculator</span>'}
  heroSubtitle="Calculate exact without-replacement odds, or explore a clearly labeled range when the total entry pool is unknown."
  pageType="WebPage"
  datePublished="2026-07-30"
  dateModified="2026-07-30"
  mainEntityId={`${canonical}#app`}
  jsonLd={[webApplicationLd, faqLd]}
>
  <OddsCalculator />
  <OddsCasinoRecommendations partners={topPartners} />
```

The recommendation component must immediately follow the calculator component so its server markup sits directly after the result container.

#### Step 5: Add all server-rendered editorial sections in required order

Continue the route with this complete content. Keep all links and the single `/best/sweepstakes-casinos/` occurrence exactly as shown:

```astro
  <section aria-labelledby="what-it-tells">
    <h2 id="what-it-tells">What this calculator tells you</h2>
    <p>
      The result is the probability of <strong>at least one win</strong> when a drawing selects
      unique winning entries without replacement. Enter your entries, the total entries including
      yours, and the number of prizes. The result does not predict who enters later, how an operator
      runs an undisclosed pool, or whether a prize is worth pursuing.
    </p>
    <p>
      Sweepstakes entries can come from daily rewards, promotions, a
      <a href="/guides/amoe-sweepstakes-casinos/">free AMOE route</a>, or purchase-associated
      bonuses. Learn how those balances fit the
      <a href="/guides/dual-currency-sweepstakes-model/">dual-currency model</a>.
    </p>
  </section>

  <section aria-labelledby="unknown-total">
    <h2 id="unknown-total">What to do when total entries are unknown</h2>
    <p>
      Select <strong>I don’t know the total</strong> and enter your best estimate of all entries,
      including yours. The tool calculates three assumptions: 80% of that estimate, the estimate
      itself, and 125% of it. The lower pool produces the better chance and appears first.
    </p>
    <p>
      This range is an estimate, not a confidence interval and not information supplied by an
      operator. SweepstakesWiz cannot disclose an unknown pool. Check the applicable operator’s
      official rules through reviews such as <a href="/reviews/mcluck/">McLuck</a>,
      <a href="/reviews/pulsz/">Pulsz</a>, or <a href="/reviews/crown-coins/">Crown Coins</a>.
    </p>
  </section>

  <section aria-labelledby="multiple-prizes">
    <h2 id="multiple-prizes">How multiple prizes change the result</h2>
    <p>
      If a drawing selects more than one unique winning entry, each selection creates another
      chance for one of your entries to be chosen. The exact model accounts for the shrinking pool
      after each winning entry is removed. It is not the same as multiplying a one-prize percentage
      and capping it at 100%.
    </p>
  </section>

  <section aria-labelledby="entry-types">
    <h2 id="entry-types">Free/AMOE entries versus purchase-associated entries</h2>
    <p>
      The expanded comparison answers three different questions. <strong>Combined current-pool
      odds</strong> use all your entries. <strong>Free-only odds in the same current pool</strong>
      count only your free entries but leave every existing entry in the denominator.
      <strong>No-purchase counterfactual odds</strong> remove your own purchase-associated entries
      from both your entry count and the pool.
    </p>
    <p>
      Keeping those definitions separate avoids pretending that purchase-associated entries vanish
      from your numerator while remaining in a hypothetical no-purchase pool. See
      <a href="/guides/sweeps-coins-explained/">how Sweeps Coins and free entry paths work</a> and
      current <a href="/bonuses/no-deposit/">no-deposit entry routes</a>.
    </p>
  </section>

  <section aria-labelledby="independent-drawings">
    <h2 id="independent-drawings">Multiple independent drawings</h2>
    <p>
      The repeated-drawings option calculates the chance of at least one win across independent
      drawings that each have the same single-drawing probability. It does not apply when entries
      roll over, the pool changes, or one drawing affects another.
    </p>
  </section>

  <section aria-labelledby="limitations">
    <h2 id="limitations">Assumptions and limitations</h2>
    <ul>
      <li>Winning entries are unique and drawn without replacement.</li>
      <li>The total includes your entries, and the prize count does not exceed the pool.</li>
      <li>Estimated pools are transparent assumptions rather than known operator odds.</li>
      <li>The calculator does not model leaderboards, tournaments, weighted entries, payout value, or spending efficiency.</li>
      <li>Results do not override eligibility, location, redemption, or drawing terms in official rules.</li>
    </ul>
    <p>
      Check current location rules in the <a href="/state-legality/">state legality hub</a> and
      <a href="/sweepstakes-tracker/">live legality tracker</a>. Calculations are informational,
      remain in your browser, and are not financial or legal advice.
    </p>
  </section>

  <section aria-labelledby="worked-examples">
    <h2 id="worked-examples">Worked examples</h2>
    <h3>Known pool: one entry, 5,000 total entries, 10 prizes</h3>
    <p>
      With one entry among 5,000 and 10 unique prizes, the exact probability is 0.2%, or
      <strong>1 in 500</strong>. This is not 1 in 250; the without-replacement expression gives the
      exact result for the stated drawing.
    </p>
    <h3>Estimated pool: best estimate of 5,000</h3>
    <p>
      With the same one entry and 10 prizes, estimate mode evaluates total-pool assumptions of
      4,000, 5,000, and 6,250. The displayed range is about <strong>1 in 400 to 1 in 625</strong>,
      with a base estimate of <strong>1 in 500</strong>.
    </p>
  </section>

  <details class="odds-methodology">
    <summary>How this works</summary>
    <div>
      <h2>Methodology and formulas</h2>
      <p>
        Let M be your entries, N the total entries, and K the number of unique prizes. The chance
        of at least one win is:
      </p>
      <p><code>p = 1 − C(N−M, K) / C(N, K)</code></p>
      <p>
        The implementation does not calculate factorials or raw combinations. It sums logarithms
        across the shorter equivalent product and returns <code>-expm1(logNoWin)</code>, which stays
        finite for large safe-integer pools.
      </p>
      <p>
        Estimate mode derives <code>max(M,K,floor(0.8E))</code>, <code>E</code>, and
        <code>ceil(1.25E)</code>. Repeated independent drawings use
        <code>1 − (1−p)^D</code>, evaluated as <code>-expm1(D × log1p(-p))</code>.
      </p>
      <p>
        Our casino cards use the existing editorial order and
        <a href="/how-we-rate/">published rating methodology</a>; your entries and calculated result
        never affect rankings. For the current full list, see
        <a href="/best/sweepstakes-casinos/">best sweepstakes casinos</a>.
      </p>
    </div>
  </details>

  <section aria-labelledby="calculator-faq">
    <h2 id="calculator-faq">Frequently asked questions</h2>
    {faq.map((item) => (
      <>
        <h3>{item.q}</h3>
        <p>{item.a}</p>
      </>
    ))}
  </section>

  <section aria-labelledby="related-odds-links">
    <h2 id="related-odds-links">Related tools and guides</h2>
    <ul>
      <li><a href="/tools/">All SweepstakesWiz tools</a></li>
      <li><a href="/guides/dual-currency-sweepstakes-model/">Dual-currency sweepstakes model</a></li>
      <li><a href="/guides/amoe-sweepstakes-casinos/">AMOE and mail-in entries</a></li>
      <li><a href="/guides/sweeps-coins-explained/">Sweeps Coins explained</a></li>
      <li><a href="/bonuses/no-deposit/">No-deposit and free Sweeps Coins routes</a></li>
    </ul>
  </section>

  <p class="odds-page-disclosure">
    Sweepstakes play only; no real-money gambling. No purchase necessary. 18+ (21+ where required).
    Not available in all states. We may earn referral fees; read the
    <a href="/legal/affiliate-disclosure/">Affiliate Disclosure</a>. If play stops being fun, visit
    <a href="/responsible-gaming/">Responsible Gaming</a> or call 1-800-GAMBLER.
  </p>

  <style>
    .odds-methodology{margin:24px 0;border:1px solid #cbd5e1;border-radius:12px;padding:0 16px}
    .odds-methodology summary{display:flex;align-items:center;min-height:48px;font-family:'Sora',sans-serif;font-weight:800;cursor:pointer}
    .odds-methodology summary:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}
    .odds-methodology code{overflow-wrap:anywhere}
    .odds-page-disclosure{font-size:.84rem!important;color:#64748b!important;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:26px}
  </style>
</ContentLayout>
```

#### Step 6: Verify schema construction and build

Run:

```bash
npm run verify:odds
npm run schema:verify
npm run generate:pages
test -f src/pages/tools/sweepstakes-odds-calculator/index.astro
npm run build
```

Expected:
- odds and schema verifiers pass
- generated calculator page exists
- Astro reports a successful server build with no unresolved `@id`

#### Step 7: Suggested conventional commit

```bash
git add src/routes/tools/sweepstakes-odds-calculator/index.astro scripts/verify-sweepstakes-odds.ts
git commit -m "feat: publish sweepstakes odds calculator page"
```

---

### Task 5: Tools Hub, Shared Chrome, Contextual Links, and Sitemap

**Files:**
- Create: `src/routes/tools/index.astro`
- Modify: `partials/nav.html:10-20`
- Modify: `partials/footer.html:24-31`
- Modify: `scripts/generate-astro-pages.mjs:237-276,289-362,411-442`
- Modify: `src/content/guides/dual-currency-sweepstakes-model.mdx:80-87`
- Modify: `src/content/guides/amoe-sweepstakes-casinos.mdx:43-46`
- Modify: `src/content/guides/sweeps-coins-explained.mdx:77-94`
- Modify: `src/routes/bonuses/no-deposit/index.astro:309-315`
- Modify: `reviews/mcluck.html:510-515`
- Modify: `reviews/pulsz.html:511-516`
- Modify: `reviews/crown-coins.html:459-465`
- Modify: `scripts/verify-sweepstakes-odds.ts`

**Interfaces:**
- Consumes `ContentLayout.astro`, the route-copy behavior of `copyAppRoutes()`, and `sourcePathsForUrl()`/`push()` in `writeSitemapAndRobots()`.
- Produces indexable `/tools/` and discoverable calculator links from nav, footer, relevant guides, no-deposit content, and three current top-ranked reviews.
- `sourcePathsForUrl('/tools/')` must resolve to `src/routes/tools/index.astro`.
- `sourcePathsForUrl('/tools/sweepstakes-odds-calculator/')` must resolve to `src/routes/tools/sweepstakes-odds-calculator/index.astro`.
- Every internal path introduced in this task either already exists in the repository or is created by Task 4/this task.

#### Step 1: Add failing integration-source assertions

Append:

```ts
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
```

#### Step 2: Prove the hub/integration is absent

Run `npm run verify:odds`.

Expected: non-zero exit with `ENOENT` for `src/routes/tools/index.astro`.

#### Step 3: Create the lightweight tools hub

```astro
---
export const prerender = true;

import ContentLayout from '../../layouts/ContentLayout.astro';

const canonicalPath = '/tools/';
const title = 'Free Sweepstakes Tools | SweepstakesWiz';
const description =
  'Use free SweepstakesWiz tools to calculate sweepstakes drawing odds with known or estimated entry pools.';
const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Tools', path: canonicalPath },
];
---
<ContentLayout
  title={title}
  description={description}
  canonicalPath={canonicalPath}
  breadcrumbs={breadcrumbs}
  heroTitle={'Free Sweepstakes <span class="accent">Tools</span>'}
  heroSubtitle="Transparent calculators and utilities for understanding sweepstakes entries and published drawing rules."
  pageType="CollectionPage"
  datePublished="2026-07-30"
  dateModified="2026-07-30"
>
  <p>
    These tools explain stated sweepstakes scenarios; they do not predict undisclosed entry pools,
    guarantee prizes, or recommend spending. Entered calculator values stay in your browser.
  </p>
  <section class="tools-grid" aria-labelledby="tools-list-title">
    <h2 id="tools-list-title">Available tools</h2>
    <a class="tool-card" href="/tools/sweepstakes-odds-calculator/">
      <strong>Sweepstakes odds calculator</strong>
      <span>
        Calculate exact without-replacement odds, explore a clearly labeled estimated pool,
        compare free-entry scenarios, and check multiple independent drawings.
      </span>
      <span aria-hidden="true">Use the calculator →</span>
    </a>
  </section>
  <p>
    Before entering any promotion, read the operator’s official rules and check
    <a href="/state-legality/">availability in your state</a>.
  </p>
  <style>
    .tools-grid{margin:20px 0 26px}.tool-card{display:flex;flex-direction:column;gap:8px;border:1px solid #dbe3ee;border-radius:14px;padding:20px;background:linear-gradient(165deg,#fafcff,#eef4ff);text-decoration:none}
    .tool-card strong{font-family:'Sora',sans-serif;font-size:1.15rem}.tool-card span{color:#475569}
    .tool-card:focus-visible{outline:3px solid #fbbf24;outline-offset:3px}
  </style>
</ContentLayout>
```

#### Step 4: Add shared nav and footer links

In `partials/nav.html`, add one link after `Guides`:

```html
<a href="/tools/">Tools</a>
```

In the footer `Guides` column, add after `All Guides`:

```html
<a href="/tools/">Free Tools</a>
```

#### Step 5: Add authored source mappings and sitemap entries

In `sourcePathsForUrl()` add:

```js
const routeExact = {
  '/report/': 'src/routes/report.astro',
  '/guides/': 'src/routes/guides/index.astro',
  '/tools/': 'src/routes/tools/index.astro',
  '/tools/sweepstakes-odds-calculator/':
    'src/routes/tools/sweepstakes-odds-calculator/index.astro',
  // retain every existing mapping
};
```

After the guides hub push block, add:

```js
if (existsSync(join(root, 'src', 'routes', 'tools', 'index.astro'))) {
  push('/tools/');
}
if (
  existsSync(
    join(root, 'src', 'routes', 'tools', 'sweepstakes-odds-calculator', 'index.astro'),
  )
) {
  push('/tools/sweepstakes-odds-calculator/');
}
```

In the `llms.txt` “Start here” string, add:

```js
`- [Sweepstakes odds calculator](${ORIGIN}/tools/sweepstakes-odds-calculator/)\n` +
```

#### Step 6: Add restrained contextual links

Make these exact content edits:

`src/content/guides/dual-currency-sweepstakes-model.mdx`, replace the “Use our live tools” lead with:

```md
Use our live tools — not guesswork:

- [Sweepstakes odds calculator](/tools/sweepstakes-odds-calculator/) — calculate a disclosed
  drawing exactly or label an unknown pool as an estimate
- [State legality hub](/state-legality/) — map + ban-wave table
- [Laws by state guide](/guides/sweepstakes-casino-laws-by-state/)
- [Legality tracker API](/sweepstakes-tracker/api/legality.json)
```

`src/content/guides/amoe-sweepstakes-casinos.mdx`, extend the existing “See also” line:

```md
See also: [Dual-currency model explained](/guides/dual-currency-sweepstakes-model/) ·
[Gold Coins vs Sweeps Coins](/guides/gold-coins-vs-sweeps-coins/) ·
[Compare free and purchase-associated entry odds](/tools/sweepstakes-odds-calculator/).
```

`src/content/guides/sweeps-coins-explained.mdx`, add after the methods table:

```md
If a promotion publishes its total entry pool and prize count, use the
[sweepstakes odds calculator](/tools/sweepstakes-odds-calculator/) to compare all of your entries
with a free-only or no-purchase scenario. If the pool is not disclosed, any result remains an estimate.
```

`src/routes/bonuses/no-deposit/index.astro`, add after the four-route list:

```astro
<p>
  When a promotion publishes its total entry pool and prize count, the
  <a href="/tools/sweepstakes-odds-calculator/">sweepstakes odds calculator</a> can compare combined
  entries, free-only entries in the current pool, and a no-purchase counterfactual. An undisclosed
  pool can only be estimated.
</p>
```

In the McLuck and Pulsz AMOE card descriptions, append:

```html
 If the drawing publishes a total pool and prize count, compare the scenario with our <a href="/tools/sweepstakes-odds-calculator/">sweepstakes odds calculator</a>; undisclosed pools remain estimates.
```

In `reviews/crown-coins.html`, append to the ongoing-promotion card description:

```html
 For published drawings, use our <a href="/tools/sweepstakes-odds-calculator/">sweepstakes odds calculator</a> and confirm the assumptions against Crown Coins&rsquo; official rules.
```

Do not add an affiliate URL or new offer value to any contextual link.

#### Step 7: Verify every internal destination

Run:

```bash
test -f src/routes/tools/index.astro
test -f src/routes/tools/sweepstakes-odds-calculator/index.astro
test -f src/content/guides/dual-currency-sweepstakes-model.mdx
test -f src/content/guides/amoe-sweepstakes-casinos.mdx
test -f src/content/guides/sweeps-coins-explained.mdx
test -f src/routes/bonuses/no-deposit/index.astro
test -f src/routes/state-legality/index.astro
test -f src/routes/sweepstakes-tracker/index.astro
test -f how-we-rate.html
test -f legal/affiliate-disclosure.html
test -f responsible-gaming.html
test -f src/content/comparisons/sweepstakes-casinos.mdx
test -f reviews/mcluck.html
test -f reviews/pulsz.html
test -f reviews/crown-coins.html
```

Expected: exit code `0` with no output.

#### Step 8: Generate routes and verify sitemap dates use source mappings

Run:

```bash
npm run verify:odds
npm run generate:pages
rg -n '<loc>https://sweepstakeswiz.com/tools/(</loc>|sweepstakes-odds-calculator/</loc>)' sitemap.xml
git log -1 --format=%cs -- src/routes/tools/index.astro
git log -1 --format=%cs -- src/routes/tools/sweepstakes-odds-calculator/index.astro
```

Expected:
- verifier passes
- sitemap contains exactly one `<loc>` for each tools URL
- after the task’s suggested commit is made, each `git log` date equals the corresponding sitemap `<lastmod>` rather than generator day fallback

#### Step 9: Run content and build gates

Run:

```bash
npm run content:lint
npm run methodology:check
npm run schema:verify
npm run build
```

Expected: all commands exit `0`; build regenerates the same two sitemap URLs.

#### Step 10: Suggested conventional commit

```bash
git add src/routes/tools/index.astro partials/nav.html partials/footer.html scripts/generate-astro-pages.mjs src/content/guides/dual-currency-sweepstakes-model.mdx src/content/guides/amoe-sweepstakes-casinos.mdx src/content/guides/sweeps-coins-explained.mdx src/routes/bonuses/no-deposit/index.astro reviews/mcluck.html reviews/pulsz.html reviews/crown-coins.html scripts/verify-sweepstakes-odds.ts sitemap.xml robots.txt llms.txt
git commit -m "feat: integrate sweepstakes tools across the site"
```

---

### Task 6: Integration, Accessibility, Privacy, Schema, Build, and Preview Acceptance

**Files:**
- Create: `scripts/verify-sweepstakes-odds-integration.ts`
- Modify: `package.json:9-34`
- Modify: `.github/workflows/ci.yml:24-36`
- Modify if an assertion exposes a defect: only files created or modified in Tasks 1–5

**Interfaces:**
- Consumes authored source, generated `src/pages/`, generated `sitemap.xml`, `package.json`, and existing repository commands.
- Produces `npm run verify:odds:integration`, which must be run after `npm run build` because it checks generated artifacts.
- Final `ci` order must run pure odds verification before build and integration verification after build.
- This task does not add a browser test dependency; keyboard, screen-reader, responsive, no-JS, network, and geo cases are explicit preview QA.

#### Step 1: Create a failing final acceptance verifier

Create `scripts/verify-sweepstakes-odds-integration.ts`:

```ts
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

assert.ok(pkg.scripts['verify:odds:integration'], 'package script verify:odds:integration');
assert.match(pkg.scripts.prebuild, /npm run verify:odds/);
assert.match(pkg.scripts.ci, /npm run verify:odds/);
assert.match(pkg.scripts.ci, /npm run build && npm run verify:odds:integration/);

for (const path of [
  'src/lib/sweepstakesOdds.ts',
  'src/components/odds/OddsCalculator.astro',
  'src/components/odds/OddsCasinoRecommendations.astro',
  'src/routes/tools/index.astro',
  'src/routes/tools/sweepstakes-odds-calculator/index.astro',
  'src/pages/tools/index.astro',
  'src/pages/tools/sweepstakes-odds-calculator/index.astro',
]) {
  assert.ok(existsSync(join(root, path)), `expected ${path}`);
}

const calculator = read('src/components/odds/OddsCalculator.astro');
assert.match(calculator, /<form\b/);
assert.match(calculator, /novalidate/);
assert.match(calculator, /aria-live="polite"/);
assert.match(calculator, /tabindex="-1"/);
assert.match(calculator, /<noscript>/);
assert.match(calculator, /preventDefault\(\)/);
assert.doesNotMatch(calculator, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML/);
for (const forbidden of [
  'entries:',
  'total_entries',
  'prizes:',
  'free_entries',
  'drawings:',
  'probability:',
  'reciprocal',
]) {
  const analyticsBlocks = [...calculator.matchAll(/sendEvent\(([\s\S]*?)\);/g)]
    .map((match) => match[1])
    .join('\n');
  assert.ok(!analyticsBlocks.includes(forbidden), `analytics excludes ${forbidden}`);
}

const recommendations = read('src/components/odds/OddsCasinoRecommendations.astro');
assert.match(recommendations, /AffiliateLink/);
assert.match(recommendations, /odds-calculator/);
assert.doesNotMatch(recommendations, /trackingLink|AggregateRating|Offer/);

const route = read('src/routes/tools/sweepstakes-odds-calculator/index.astro');
for (const id of ['#app', '#faq']) assert.ok(route.includes(id), `route contains ${id}`);
assert.ok(route.includes("'@type': 'WebApplication'"), 'route defines WebApplication');
assert.match(route, /faqPageNode\(canonical, faq\)/, 'route builds FAQPage through shared helper');
for (const forbidden of ['AggregateRating', "'@type': 'Offer'", "'@type': 'Review'"]) {
  assert.ok(!route.includes(forbidden), `route excludes ${forbidden}`);
}
assert.equal((route.match(/href="\/best\/sweepstakes-casinos\/"/g) ?? []).length, 1);

const ranking = read('src/content/comparisons/sweepstakes-casinos.mdx');
const firstThree = [...ranking.matchAll(/^  - ([a-z0-9-]+)$/gm)].slice(0, 3).map((m) => m[1]);
assert.deepEqual(firstThree, ['mcluck', 'pulsz', 'crown-coins']);
for (const slug of firstThree) {
  assert.ok(existsSync(join(root, `reviews/${slug}.html`)), `review exists for ${slug}`);
}

const sitemap = read('sitemap.xml');
for (const url of [
  'https://sweepstakeswiz.com/tools/',
  'https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/',
]) {
  assert.equal((sitemap.match(new RegExp(`<loc>${url}</loc>`, 'g')) ?? []).length, 1, url);
}

for (const path of [
  'partials/nav.html',
  'partials/footer.html',
  'src/content/guides/dual-currency-sweepstakes-model.mdx',
  'src/content/guides/amoe-sweepstakes-casinos.mdx',
  'src/content/guides/sweeps-coins-explained.mdx',
  'src/routes/bonuses/no-deposit/index.astro',
  'reviews/mcluck.html',
  'reviews/pulsz.html',
  'reviews/crown-coins.html',
]) {
  assert.match(read(path), /\/tools\/(?:sweepstakes-odds-calculator\/)?/, `${path} tools link`);
}

console.log('verify-sweepstakes-odds-integration: OK');
```

#### Step 2: Prove package/CI registration is missing

Run:

```bash
npx tsx scripts/verify-sweepstakes-odds-integration.ts
```

Expected: non-zero exit at `package script verify:odds:integration`.

#### Step 3: Register post-build verification

Add:

```json
"verify:odds:integration": "tsx scripts/verify-sweepstakes-odds-integration.ts"
```

Change `ci` so its tail is:

```json
"ci": "npm run verify:availability && npm run content:lint && npm run tracker:lint && npm run methodology:check && npm run verify:odds && npm run testing:verify && npm run testing:verify-overclaims && npm run build && npm run verify:odds:integration"
```

In `.github/workflows/ci.yml`, add after Build:

```yaml
      - name: Verify sweepstakes odds integration
        run: npm run verify:odds:integration
```

The build step generates `src/pages/` and `sitemap.xml`, so the new CI step must remain after it.

#### Step 4: Run all automated acceptance gates

Run in this order:

```bash
npm run content:lint
npm run methodology:check
npm run schema:verify
npm run verify:availability
npm run verify:odds
npm run build
npm run verify:odds:integration
npm run ci
```

Expected:
- every command exits `0`
- `verify-sweepstakes-odds: OK`
- `verify-sweepstakes-odds-integration: OK`
- availability ends with `✅ ALL CHECKS PASSED`
- Astro build succeeds
- `npm run ci` completes the post-build integration verifier

#### Step 5: Inspect generated schema and no-JS response in an eligible state

Start a preview with the existing middleware override:

```bash
PUBLIC_DEV_GEO_STATE=TX npm run preview -- --host 127.0.0.1
```

Expected: preview server reports a local URL and remains running.

In another terminal:

```bash
curl -fsS http://127.0.0.1:4321/tools/sweepstakes-odds-calculator/ -o /tmp/odds-tx.html
rg -n 'Sweepstakes Odds Calculator|How this works|Frequently asked questions|odds-noscript|data-affiliate="(mcluck|pulsz|crown-coins)"|#app|#faq' /tmp/odds-tx.html
```

Expected:
- article, methodology, FAQ, `<noscript>` notice, review cards, and three eligible affiliate anchors appear in server HTML
- one JSON-LD script contains `#webpage`, `#breadcrumb`, `#app`, and `#faq`
- no visitor-derived result appears

Repeat suppressed-state rendering:

```bash
curl -fsS -H 'x-vercel-ip-country: US' -H 'x-vercel-ip-country-region: CA' \
  http://127.0.0.1:4321/tools/sweepstakes-odds-calculator/ -o /tmp/odds-ca.html
rg -n 'Not available in your location|Read review' /tmp/odds-ca.html
if rg -n 'data-affiliate=' /tmp/odds-ca.html; then exit 1; fi
```

Expected: three review-first cards remain, all status text says unavailable, and no affiliate anchor is present.

#### Step 6: Perform keyboard and screen-reader-oriented QA

At desktop and mobile widths, execute this exact sequence:

1. Tab from the page header into `Your entries`, `Total entries`, `Number of prizes`, the unknown-total checkbox, `More options`, and `Calculate my odds`; confirm every focus indicator is visible.
2. Enter `1`, `5000`, `10`; activate the button with Enter; confirm focus moves to “Your calculated chance is 1 in 500.” and the next line reads `0.2%`.
3. Activate `I don’t know the total`; confirm the pool is cleared, its label becomes “Your best estimate of total entries,” stale errors disappear, and the other two base values remain unchanged.
4. Re-enter `5000`; submit; confirm “Your estimated chance is about 1 in 400 to 1 in 625 (base estimate: 1 in 500).”
5. Open `More options` with the keyboard, enable each option, verify each newly active field becomes focusable, and submit the `F=2, M=5, N=100, K=1` comparison.
6. Confirm the expanded comparison announces combined `5%`, free-only current pool `2%`, and no-purchase counterfactual approximately `2.06%`.
7. Close each advanced option; confirm it no longer participates in validation while the three base fields remain unchanged.
8. Submit empty and invalid values; confirm focus moves to the error summary, each summary link focuses its field, inline errors are associated through `aria-describedby`, and errors use the `Error:` text prefix in addition to red styling.
9. Recalculate; confirm the same result region is replaced rather than duplicated.
10. Open `How this works` using Enter and Space; confirm native expanded state and readable formulas.
11. At 200% zoom and 320 CSS-pixel width, confirm a single-column form, no clipped controls, practical 44px targets, and cards that reflow without horizontal page scrolling.
12. Enable reduced motion and confirm focus/result changes do not animate.

Expected: all twelve checks pass without pointer use.

#### Step 7: Perform privacy and analytics QA

In browser developer tools:

1. Clear the Network panel and GA data-layer inspection.
2. Enter distinctive values `123457`, `7654321`, `7`, `31`, and `4`.
3. Submit a valid scenario.
4. Search request URLs, payloads, request headers, console output, cookies, local storage, session storage, and `window.dataLayer` for every distinctive value and displayed probability/reciprocal.
5. Submit one invalid scenario.
6. Open each advanced option twice.
7. Click one eligible casino CTA.

Expected:
- no entered or derived number leaves the page or appears in logs/storage/data layer
- one successful submit emits one `odds_calculation_completed`
- invalid submit emits no completion event
- each option emits `odds_options_opened` once per page view with only `entry_mix` or `multiple_drawings`
- CTA emits `odds_casino_cta_clicked` with casino slug and `odds-calculator`
- blocking `window.gtag` or throwing from it does not block calculation or navigation

#### Step 8: Validate visible FAQ/schema parity and prohibited nodes

Parse the JSON-LD from `/tmp/odds-tx.html` with:

```bash
node - <<'NODE'
const fs = require('node:fs');
const html = fs.readFileSync('/tmp/odds-tx.html', 'utf8');
const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
if (blocks.length !== 1) throw new Error(`expected one JSON-LD block, got ${blocks.length}`);
const graph = JSON.parse(blocks[0][1])['@graph'];
const ids = new Set(graph.map((node) => node['@id']).filter(Boolean));
for (const id of [
  'https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#webpage',
  'https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#breadcrumb',
  'https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#app',
  'https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#faq',
]) {
  if (!ids.has(id)) throw new Error(`missing ${id}`);
}
const raw = JSON.stringify(graph);
for (const forbidden of ['Offer', 'Product', 'Review', 'AggregateRating']) {
  if (raw.includes(`"@type":"${forbidden}"`)) throw new Error(`forbidden ${forbidden}`);
}
const faq = graph.find((node) => node['@type'] === 'FAQPage');
for (const item of faq.mainEntity) {
  if (!html.includes(item.name) || !html.includes(item.acceptedAnswer.text)) {
    throw new Error(`FAQ parity failure: ${item.name}`);
  }
}
console.log('odds JSON-LD and visible FAQ parity: OK');
NODE
```

Expected: `odds JSON-LD and visible FAQ parity: OK`.

#### Step 9: Preview deployment QA

On a preview deployment, repeat at 390×844 and 1440×900:

- known `1/500` example
- estimated `1/400`–`1/625` example
- keyboard error recovery
- JavaScript-disabled article/FAQ/cards/review links
- one eligible location and one suppressed location
- CTA gateway navigation in the eligible location
- network/data-layer privacy inspection
- canonical, robots, consolidated JSON-LD, and sitemap URL checks

Expected: behavior matches local acceptance and both routes are indexable together.

#### Step 10: Suggested conventional commit

```bash
git add scripts/verify-sweepstakes-odds-integration.ts package.json .github/workflows/ci.yml
git commit -m "test: verify odds calculator integration"
```

---

## Writing-Plans Self-Review

### Spec coverage

- Exact log-space probability, short-product choice, numerical clamping boundary, large pools, estimate band, entry-mix definitions, repeated drawings, and adaptive display are implemented and deterministically verified in Task 1.
- Every specified invalid relationship and correction message is exercised in Task 1; Task 2 maps issues into a focused summary and inline associations.
- Three-field default, unknown-total mode, closed advanced controls, replace-in-place result, explicit-submit focus, no fabricated initial result, and no-JS notice are implemented in Task 2.
- Local-only calculations and the three coarse analytics events are separated across Tasks 2 and 3; Task 6 verifies that numeric inputs and outputs never enter network, storage, logs, or analytics.
- Current top-three ranking consumption, review-first cards, geo suppression, `<AffiliateLink>`, fixed placement, editorial disclaimer, affiliate/age/location/no-purchase/official-rules/responsible-play copy, and prohibited schema/claims are implemented in Tasks 3 and 4.
- Calculator route SSR, full editorial order, formulas, worked examples, visible FAQ, required internal links, official-rules caveat, compliance copy, and consolidated `WebApplication`/`FAQPage` graph are implemented in Task 4.
- Tools hub, shared nav/footer, required contextual spokes, route copying, sitemap inclusion, authored-source `lastmod`, and `llms.txt` discovery are implemented in Task 5.
- Existing required gates, new verifiers, generated HTML checks, keyboard/accessibility, responsive/reduced-motion, no-JS, privacy, geo, schema parity, and preview QA are covered in Task 6.
- Non-goals remain excluded: no tournament/leaderboard/weighted mode, simulation, operator scraping, uploads, saved/shared scenarios, accounts, payout/EV/spend recommendations, or calculator-driven ranking.

### Placeholder scan

The plan contains concrete paths, public signatures, code, commands, expected outcomes, fixed copy, analytics properties, schema IDs, and commit suggestions. It contains no deferred implementation markers, unspecified error handling, unnamed tests, or references to undefined neighboring-task interfaces.

### Type and signature consistency

- Task 2 imports only exports defined in Task 1 and uses `EstimatedProbabilityRange.baseChance`, not the numeric `base` pool.
- Task 3 accepts the exact three-element `AffiliatePartner` tuple produced by Task 4.
- Task 4 passes `mainEntityId={`${canonical}#app`}` matching the `WebApplication['@id']`.
- Field names in `ValidationIssue`, DOM IDs, error selectors, raw form names, and Task 6 assertions are consistent.
- Analytics property names remain coarse and fixed: `pool_mode`, `entry_mix_active`, `multiple_drawings_active`, `option_name`, `casino_slug`, and `placement`.
- Sitemap source mappings point to authored route files, not generated `src/pages/`.

## Human Judgment Remaining

- Editorial/legal review should confirm the final wording around “free/AMOE,” purchase-associated entries, 18+/21+, and the no-purchase counterfactual before publication.
- Preview QA must confirm actual eligible and suppressed geo behavior on Vercel; local `PUBLIC_DEV_GEO_STATE` and request headers verify the code path but not Vercel’s production header delivery.
- The three recommended casinos are data-driven. If editorial staff changes `partnerSlugs` before release, acceptance should expect the new first three rather than the July 30 snapshot used by the integration assertion; update that assertion in the same ranking change.

## Execution Handoff

Plan execution should be tracked in beads and performed task-by-task with either:

1. **Subagent-Driven (recommended):** use `superpowers:subagent-driven-development`, one fresh worker and two-stage review per task.
2. **Inline Execution:** use `superpowers:executing-plans`, execute in batches with review checkpoints.
