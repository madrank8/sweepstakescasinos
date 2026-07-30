import {
  buildPageGraph,
  faqPageNode,
  ORG_ID,
  type Crumb,
  type FaqItem,
} from './schema';

export const ODDS_CANONICAL_PATH = '/tools/sweepstakes-odds-calculator/';
export const ODDS_CANONICAL = `https://sweepstakeswiz.com${ODDS_CANONICAL_PATH}`;
export const ODDS_TITLE =
  'Sweepstakes Odds Calculator: Exact Odds & Multiple Prizes | SweepstakesWiz';
export const ODDS_DESCRIPTION =
  'Calculate exact sweepstakes odds without replacement, estimate an unknown entry pool, compare free versus paid entries, and check multiple independent drawings.';
export const ODDS_DATE_PUBLISHED = '2026-07-30';
export const ODDS_DATE_MODIFIED = '2026-07-30';
export const ODDS_MAIN_ENTITY_ID = `${ODDS_CANONICAL}#app`;

export const ODDS_BREADCRUMBS: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'Tools', path: '/tools/' },
  { name: 'Sweepstakes Odds Calculator', path: ODDS_CANONICAL_PATH },
];

export const ODDS_FAQ: FaqItem[] = [
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

export const ODDS_WEB_APPLICATION: Record<string, unknown> = {
  '@type': 'WebApplication',
  '@id': ODDS_MAIN_ENTITY_ID,
  name: 'SweepstakesWiz Sweepstakes Odds Calculator',
  url: ODDS_CANONICAL,
  description: ODDS_DESCRIPTION,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript',
  isAccessibleForFree: true,
  publisher: { '@id': ORG_ID },
};

const faqSchema = faqPageNode(ODDS_CANONICAL, ODDS_FAQ);
if (!faqSchema) throw new Error('Odds calculator FAQ schema must not be empty.');

export const ODDS_SCHEMA_NODES: Record<string, unknown>[] = [
  ODDS_WEB_APPLICATION,
  faqSchema,
];

export function buildOddsPageGraph(): Record<string, unknown> {
  return buildPageGraph({
    url: ODDS_CANONICAL,
    pageType: 'WebPage',
    title: ODDS_TITLE,
    description: ODDS_DESCRIPTION,
    breadcrumbs: ODDS_BREADCRUMBS,
    datePublished: ODDS_DATE_PUBLISHED,
    dateModified: ODDS_DATE_MODIFIED,
    mainEntityId: ODDS_MAIN_ENTITY_ID,
    nodes: ODDS_SCHEMA_NODES,
  });
}
