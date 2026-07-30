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
