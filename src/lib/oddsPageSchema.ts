import {
  AUTHOR_ID,
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
/** Calendar dates used for freshness gates and sitemap comparisons. */
export const ODDS_DATE_PUBLISHED = '2026-07-30';
export const ODDS_DATE_MODIFIED = '2026-08-02';
/** Timezone ISO forms emitted on WebPage / rich-result eligibility. */
export const ODDS_DATE_PUBLISHED_ISO = `${ODDS_DATE_PUBLISHED}T00:00:00Z`;
export const ODDS_DATE_MODIFIED_ISO = `${ODDS_DATE_MODIFIED}T00:00:00Z`;
export const ODDS_MAIN_ENTITY_ID = `${ODDS_CANONICAL}#app`;
export const ODDS_PRIMARY_IMAGE_ID = `${ODDS_CANONICAL}#primaryimage`;
export const ODDS_HOWTO_ID = `${ODDS_CANONICAL}#howto`;
export const ODDS_PRIMARY_IMAGE_PATH =
  '/images/tools/sweepstakes-odds-calculator-og.webp';
export const ODDS_PRIMARY_IMAGE_URL = `https://sweepstakeswiz.com${ODDS_PRIMARY_IMAGE_PATH}`;
export const ODDS_AUTHOR_ID = AUTHOR_ID;

export const ODDS_BREADCRUMBS: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'Tools', path: '/tools/' },
  { name: 'Sweepstakes Odds Calculator', path: ODDS_CANONICAL_PATH },
];

export const ODDS_HOWTO_STEPS = [
  {
    name: 'Choose Known total or Estimate',
    text: 'Select Known total when the promotion publishes the full entry pool. Select Estimate when you need a labeled low / base / high pool-size range.',
  },
  {
    name: 'Enter your entries, pool, and prizes',
    text: 'Add how many entries you hold, the known or estimated total entries including yours, and how many unique prizes will be drawn.',
  },
  {
    name: 'Optionally open More options',
    text: 'Compare free versus purchase-associated entries or model repeated independent drawings when those details apply.',
  },
  {
    name: 'Calculate and read the billboard result',
    text: 'Submit to see the exact or estimated chance under your inputs, plus assumptions. Results stay in your browser and do not override official rules.',
  },
] as const;

export const ODDS_FAQ: FaqItem[] = [
  {
    q: 'How do I calculate my chances of winning a sweepstakes?',
    a: 'Enter your entries, the total entries including yours, and the number of unique prizes. This calculator returns the probability that at least one of your entries is selected when winners are drawn without replacement. It evaluates the exact combinatorial model numerically in log space; it does not run a simulation.',
  },
  {
    q: 'What if I do not know the total number of entries?',
    a: 'Choose Estimate and enter your best estimate of the total, including your own entries. The calculator shows an estimated range using 0.8 times the estimate, the entered estimate, and 1.25 times the estimate. Those are transparent product assumptions, not a confidence interval or operator data.',
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

export const ODDS_FEATURE_LIST = [
  'Exact without-replacement win probability',
  'Unknown pool estimate range (0.8× / 1× / 1.25×)',
  'Free vs purchase-associated entry comparison',
  'Repeated independent drawings',
  'Client-side only — inputs are not submitted to a server',
] as const;

export const ODDS_PRIMARY_IMAGE: Record<string, unknown> = {
  '@type': 'ImageObject',
  '@id': ODDS_PRIMARY_IMAGE_ID,
  url: ODDS_PRIMARY_IMAGE_URL,
  width: 1200,
  height: 630,
  caption: 'SweepstakesWiz sweepstakes odds calculator workstation',
  inLanguage: 'en-US',
};

export const ODDS_WEB_APPLICATION: Record<string, unknown> = {
  '@type': 'WebApplication',
  '@id': ODDS_MAIN_ENTITY_ID,
  name: 'SweepstakesWiz Sweepstakes Odds Calculator',
  url: ODDS_CANONICAL,
  description: ODDS_DESCRIPTION,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  browserRequirements:
    'Requires JavaScript. Calculations run locally in the browser.',
  isAccessibleForFree: true,
  inLanguage: 'en-US',
  offers: {
    '@type': 'Offer',
    price: 0,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  featureList: [...ODDS_FEATURE_LIST],
  screenshot: { '@id': ODDS_PRIMARY_IMAGE_ID },
  image: { '@id': ODDS_PRIMARY_IMAGE_ID },
  author: { '@id': AUTHOR_ID },
  creator: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
  about: [
    {
      '@type': 'Thing',
      name: 'Sweepstakes odds',
      sameAs: 'https://en.wikipedia.org/wiki/Sweepstake',
    },
    {
      '@type': 'Thing',
      name: 'Hypergeometric distribution',
      sameAs: 'https://www.wikidata.org/wiki/Q204434',
    },
  ],
  mentions: [
    { '@type': 'Thing', name: 'Alternate method of entry' },
    { '@type': 'Thing', name: 'Prize draw without replacement' },
  ],
};

export const ODDS_HOWTO: Record<string, unknown> = {
  '@type': 'HowTo',
  '@id': ODDS_HOWTO_ID,
  name: 'How to use the SweepstakesWiz odds calculator',
  description:
    'Calculate exact or estimated sweepstakes win probability with known or unknown entry pools.',
  inLanguage: 'en-US',
  totalTime: 'PT2M',
  image: { '@id': ODDS_PRIMARY_IMAGE_ID },
  tool: { '@id': ODDS_MAIN_ENTITY_ID },
  step: ODDS_HOWTO_STEPS.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
    url: `${ODDS_CANONICAL}#howto-step-${index + 1}`,
  })),
};

const faqSchema = faqPageNode(ODDS_CANONICAL, ODDS_FAQ);
if (!faqSchema) throw new Error('Odds calculator FAQ schema must not be empty.');

// Addressable FAQ questions for cleaner @id graphs (AI extraction hygiene).
faqSchema.mainEntity = ODDS_FAQ.map((item, index) => ({
  '@type': 'Question',
  '@id': `${ODDS_CANONICAL}#faq-${index + 1}`,
  name: item.q,
  acceptedAnswer: {
    '@type': 'Answer',
    text: item.a,
  },
}));

export const ODDS_SCHEMA_NODES: Record<string, unknown>[] = [
  ODDS_PRIMARY_IMAGE,
  ODDS_WEB_APPLICATION,
  ODDS_HOWTO,
  faqSchema,
];

export function buildOddsPageGraph(): Record<string, unknown> {
  return buildPageGraph({
    url: ODDS_CANONICAL,
    pageType: 'WebPage',
    title: ODDS_TITLE,
    description: ODDS_DESCRIPTION,
    breadcrumbs: ODDS_BREADCRUMBS,
    datePublished: ODDS_DATE_PUBLISHED_ISO,
    dateModified: ODDS_DATE_MODIFIED_ISO,
    mainEntityId: ODDS_MAIN_ENTITY_ID,
    authorId: AUTHOR_ID,
    primaryImageId: ODDS_PRIMARY_IMAGE_ID,
    nodes: ODDS_SCHEMA_NODES,
  });
}
