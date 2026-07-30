import {
  formatChance,
  type ChanceDisplay,
  type EstimatedProbabilityRange,
  type PoolMode,
} from './sweepstakesOdds';

export const ODDS_EVENT_CALCULATION_COMPLETED = 'odds_calculation_completed';
export const ODDS_EVENT_OPTIONS_OPENED = 'odds_options_opened';

export const CALCULATION_COMPLETED_PAYLOAD_KEYS = [
  'pool_mode',
  'entry_mix_active',
  'multiple_drawings_active',
] as const;

export const OPTIONS_OPENED_PAYLOAD_KEYS = ['option_name'] as const;

export const RESULT_INVALIDATING_INPUT_IDS = [
  'odds-entries',
  'odds-pool',
  'odds-prizes',
  'odds-free-entries',
  'odds-drawings',
] as const;

export interface EntryMixDisplayLabels {
  combined: string;
  freeCurrent: string;
  noPurchase: string;
  sectionNote: string | null;
}

export function entryMixDisplayLabels(poolMode: PoolMode): EntryMixDisplayLabels {
  if (poolMode === 'known') {
    return {
      combined: 'Combined current-pool odds',
      freeCurrent: 'Free-only odds in the same current pool',
      noPurchase: 'No-purchase counterfactual',
      sectionNote: null,
    };
  }
  return {
    combined: 'Combined odds at base pool estimate',
    freeCurrent: 'Free-only odds at base pool estimate',
    noPurchase: 'No-purchase counterfactual at base pool estimate',
    sectionNote:
      'Entry-mix comparison uses the base pool assumption (entered total), not low/high estimate bounds.',
  };
}

export function formatEntryMixValue(poolMode: PoolMode, reciprocal: string, percent: string): string {
  const value = `${reciprocal} (${percent})`;
  if (poolMode === 'known') {
    return value;
  }
  return `Estimated: ${value} — base pool assumption`;
}

export function formatEstimatedProbabilityRange(range: EstimatedProbabilityRange): string {
  return (
    `Estimated probability range: ${formatChance(range.best).percent} to ` +
    `${formatChance(range.worst).percent}; ` +
    `base assumption ${formatChance(range.baseChance).percent}.`
  );
}

export function formatKnownChanceHeadline(display: ChanceDisplay): string {
  switch (display.certainty) {
    case 'zero':
    case 'exact':
      return display.headline;
    case 'almost':
      return `Almost certain under these inputs (${display.percent}).`;
    case 'normal':
      return `Your calculated chance is ${display.reciprocal}.`;
  }
}

function estimatedChancePhrase(
  display: ChanceDisplay,
  position: 'best' | 'base' | 'worst',
): string {
  if (display.certainty === 'exact') {
    return position === 'best' ? 'certainty under the low-pool assumption' : 'certainty';
  }
  if (display.certainty === 'almost') {
    return position === 'best'
      ? 'almost certain under the low-pool assumption'
      : 'almost certain';
  }
  if (display.certainty === 'zero') return 'no chance';
  return display.reciprocal.replace(/^about /, '');
}

export function formatEstimatedChanceHeadline(range: EstimatedProbabilityRange): string {
  const best = formatChance(range.best);
  const base = formatChance(range.baseChance);
  const worst = formatChance(range.worst);
  if (best.certainty === 'zero') return best.headline;
  if (worst.certainty === 'exact') return worst.headline;
  return (
    `Your estimated chance ranges from ${estimatedChancePhrase(best, 'best')} to ` +
    `${estimatedChancePhrase(worst, 'worst')} ` +
    `(base estimate: ${estimatedChancePhrase(base, 'base')}).`
  );
}

export function formatDrawingsResult(
  poolMode: PoolMode,
  reciprocal: string,
  percent: string,
): string {
  const oddsPhrase = `${reciprocal} (${percent})`;
  const stability =
    'This requires a stable pool and probability; it does not apply if entries roll over or draws are linked.';
  if (poolMode === 'known') {
    return `Across the entered number of independent drawings: ${oddsPhrase}. ${stability}`;
  }
  return (
    `Across the entered number of independent drawings (estimated): ${oddsPhrase}. ` +
    `Uses the base pool assumption for single-drawing probability, not a measured current pool. ${stability}`
  );
}
