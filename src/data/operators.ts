/**
 * Canonical editorial/operator facts.
 *
 * Commercial relationships and restrictions belong in affiliates.ts. Schema
 * identity URLs and profile links belong in brandEntities.ts. A value is
 * renderable only when its status is `verified`; unresolved audit conflicts
 * deliberately remain non-renderable.
 */

export interface FactProvenance {
  source: string;
  publishedOn?: string;
  verifiedOn?: string;
}

export interface ConflictingFactSource {
  value: string;
  provenance: FactProvenance;
}

export type CanonicalFact<T> =
  | { status: 'verified'; value: T; provenance: FactProvenance[] }
  | { status: 'unresolved'; reason: string; sources: ConflictingFactSource[] }
  | { status: 'missing'; reason: string };

export interface RedemptionMinimum {
  amount: number;
  currency: 'SC' | 'MC' | 'Diamond';
}

export interface ExternalRating {
  sourceName: string;
  value: number;
  scale: number;
  sourceUrl: string;
  asOf: string;
}

export const CANONICAL_OPERATOR_FIELDS = [
  'name',
  'operatorName',
  'launchDate',
  'signupOffer',
  'dailyOffer',
  'cashRedemptionMinimum',
  'giftCardRedemptionMinimum',
  'publishedRedemptionTiming',
  'paymentMethods',
  'gameCount',
  'externalRatings',
  'editorScore100',
  'lastVerifiedDate',
] as const;

export type CanonicalOperatorField = (typeof CANONICAL_OPERATOR_FIELDS)[number];

export interface OperatorRecord {
  slug: string;
  name: CanonicalFact<string>;
  operatorName: CanonicalFact<string>;
  launchDate: CanonicalFact<string>;
  signupOffer: CanonicalFact<string>;
  dailyOffer: CanonicalFact<string>;
  cashRedemptionMinimum: CanonicalFact<RedemptionMinimum>;
  giftCardRedemptionMinimum: CanonicalFact<RedemptionMinimum>;
  publishedRedemptionTiming: CanonicalFact<string>;
  paymentMethods: CanonicalFact<string[]>;
  gameCount: CanonicalFact<number>;
  externalRatings: CanonicalFact<ExternalRating[]>;
  editorScore100: CanonicalFact<number>;
  lastVerifiedDate: CanonicalFact<string>;
}

interface OperatorSeed {
  slug: string;
  name: string;
  operatorName: string;
  launchDate?: string;
  signupOffer?: string;
  dailyOffer?: string;
  cashRedemptionMinimum?: RedemptionMinimum;
  giftCardRedemptionMinimum?: RedemptionMinimum;
  publishedRedemptionTiming?: string;
  paymentMethods?: string[];
  gameCount?: number;
  externalRatings?: ExternalRating[];
}

const PUBLISHED_ON = '2026-05-20';
const sourceFor = (slug: string): FactProvenance => ({
  source: `reviews/${slug}.html`,
  publishedOn: PUBLISHED_ON,
});
const verified = <T>(value: T, slug: string): CanonicalFact<T> => ({
  status: 'verified',
  value,
  provenance: [sourceFor(slug)],
});
const missing = <T>(reason: string): CanonicalFact<T> => ({ status: 'missing', reason });

const SIGNUP_OFFERS: Record<string, string> = {
  acebet: '1 Free SC + 100% match up to 1,000 SC',
  'big-pirate': '20,000 GC + 2 Diamonds + 2 Rum',
  'card-crush': '2 Mystery Coins + 5 Cards',
  'casino-click': '100,000 GC + 2 SC',
  dexyplay: '350,000 GC + up to 88 SC + 65 free plays',
  freespin: '200,000 GC + 20 free spins on Gorilla',
  high5: '5 SC + 250 GC + 600 Diamonds',
  'jackpot-go': '10,000 GC + 0.6 SC',
  jackpota: '7,500 GC + 2.5 SC + 75 SC spins',
  legendz: '500 GC + 3 SC',
  'lucky-bunny': '550,000 FC + 5 SC',
  mcluck: '7,500 GC + 2.5 SC',
  'mega-bonanza': '7,500 GC + 2.5 SC',
  playfame: '7,500 GC + 2.5 SC',
  pulsz: '5,000 GC + 2.3 SC',
  rolla: '500,000 GC + 10 SC + $10 coin pack',
  roxymoxy: '50,000 GC + 2.5 SC',
  spinfinite: '3,000 GC + 200% first-purchase boost',
  'splash-coins': '150,000 GC + 2 SC',
  sweepico: '125,000 GC + 2 SC',
  'sweet-sweeps': '7,500 GC + 2 SC',
  thrillzz: '3,000 GC + 3 SC',
  'wow-vegas': '250,000 WOW Coins + 5 SC',
  zula: 'Up to 120,000 GC + 10 SC',
};

const SCORE_100: Record<string, number> = {
  'american-luck': 72,
  legendz: 84,
  playfame: 86,
  roxymoxy: 80,
};

const CONFLICTING_SCORES: Record<string, [number, number]> = {
  acebet: [88, 4.6],
  'big-pirate': [79, 4.7],
  'card-crush': [82, 4.2],
  'casino-click': [72, 4.7],
  'crown-coins': [91, 4.8],
  dexyplay: [87, 4.8],
  freespin: [82, 4.9],
  'hello-millions': [85, 4.6],
  high5: [88, 4.9],
  'jackpot-go': [85, 4.5],
  jackpota: [86, 4.7],
  'lucky-bunny': [74, 4.9],
  mcluck: [88, 4.5],
  'mega-bonanza': [82, 4.5],
  pulsz: [88, 4.5],
  rolla: [92, 5],
  spinblitz: [87, 4.6],
  spinfinite: [80, 4.5],
  'splash-coins': [83, 4.9],
  spree: [83, 4.6],
  sweepico: [85, 4.6],
  'sweet-sweeps': [90, 4.7],
  thrillzz: [85, 4.3],
  'wow-vegas': [91, 4.8],
  zula: [87, 4.4],
};

const CONFLICTING_OFFERS: Record<string, string[]> = {
  'crown-coins': ['100,000 Crown Coins + 2 SC No Deposit', '100,000 CC + 2 SC'],
  'hello-millions': ['7,500 GC + 2.5 SC Promo Code', '15,000 GC + 2.5 SC'],
  spinblitz: ['7,500 GC + 2.5 SC Promo Code', '7,500 GC + 2.5 SC'],
  spree: ['25,000 GC + 2.5 SC Instant Reg', '25,000 GC + 2.5 SC'],
};

const seeds: OperatorSeed[] = [
  {
    slug: 'acebet',
    name: 'Acebet Sweepstakes Casino',
    operatorName: 'Trey Mark Services Limited',
    launchDate: '2025-12',
    dailyOffer: '1 SC + 1,000 GC when the balance is zero',
    cashRedemptionMinimum: { amount: 50, currency: 'SC' },
    publishedRedemptionTiming: 'Crypto: 24–48 hours; bank transfer: 2–7 business days',
    paymentMethods: ['cryptocurrency', 'bank transfer'],
    gameCount: 2000,
  },
  { slug: 'american-luck', name: 'American Luck', operatorName: 'SGSE LLC', cashRedemptionMinimum: { amount: 50, currency: 'SC' }, paymentMethods: ['ACH'], gameCount: 1500 },
  { slug: 'big-pirate', name: 'Big Pirate Sweepstakes Casino', operatorName: 'Rafflefy Limited', launchDate: '2025-11', cashRedemptionMinimum: { amount: 50, currency: 'Diamond' }, publishedRedemptionTiming: 'Bank transfer: 1–3 business days', paymentMethods: ['bank transfer'], gameCount: 1500, externalRatings: [{ sourceName: 'Trustpilot', value: 2.7, scale: 5, sourceUrl: 'https://www.trustpilot.com/review/bigpirate.com', asOf: PUBLISHED_ON }] },
  { slug: 'card-crush', name: 'Card Crush', operatorName: 'Vision NL Limited', cashRedemptionMinimum: { amount: 75, currency: 'MC' }, giftCardRedemptionMinimum: { amount: 10, currency: 'MC' } },
  { slug: 'casino-click', name: 'Casino Click Sweepstakes Casino', operatorName: 'Click Entertainment LLC', dailyOffer: 'Daily scratch card up to 5 SC', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, gameCount: 1000 },
  { slug: 'crown-coins', name: 'Crown Coins Sweepstakes Casino', operatorName: 'Sunflower Limited', dailyOffer: 'Daily login bonuses', cashRedemptionMinimum: { amount: 100, currency: 'SC' } },
  { slug: 'dexyplay', name: 'DexyPlay Sweepstakes Casino', operatorName: 'UTech Solutions LLC', launchDate: '2026-01', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, publishedRedemptionTiming: 'PayPal, ACH, and push-to-card: 3–4 business days', paymentMethods: ['PayPal', 'ACH', 'push-to-card'], gameCount: 1600 },
  { slug: 'freespin', name: 'FreeSpin Sweepstakes Casino', operatorName: 'Free Spin', launchDate: '2025-07', dailyOffer: 'Fun Zone daily Pick-A-Box up to 5 SC', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, publishedRedemptionTiming: 'Cryptocurrency: under 24 hours; bank wire: 2–7 business days', paymentMethods: ['cryptocurrency', 'bank wire', 'e-gift card'], gameCount: 1000, externalRatings: [{ sourceName: 'Trustpilot', value: 2.4, scale: 5, sourceUrl: 'https://www.trustpilot.com/review/www.freespin.com', asOf: PUBLISHED_ON }] },
  { slug: 'hello-millions', name: 'Hello Millions Sweepstakes Casino', operatorName: 'B-Two Operations Limited', dailyOffer: 'Daily bonuses', giftCardRedemptionMinimum: { amount: 10, currency: 'SC' } },
  { slug: 'high5', name: 'High 5 Casino', operatorName: 'High 5 Entertainment LLC', launchDate: '2012', dailyOffer: 'Daily bonuses', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, giftCardRedemptionMinimum: { amount: 50, currency: 'SC' }, publishedRedemptionTiming: 'Cash: 3–10 business days', gameCount: 1750, externalRatings: [{ sourceName: 'Trustpilot', value: 4.3, scale: 5, sourceUrl: 'https://www.trustpilot.com/review/high5casino.com', asOf: PUBLISHED_ON }] },
  { slug: 'jackpot-go', name: 'JackpotGo Casino', operatorName: 'Hiwingo Limited', launchDate: '2024', dailyOffer: 'Gold Coin faucet every 10 minutes', publishedRedemptionTiming: 'Bank transfer and Venmo: within 3 business days', paymentMethods: ['bank transfer', 'Venmo'], gameCount: 550, externalRatings: [{ sourceName: 'Trustpilot', value: 4.7, scale: 5, sourceUrl: 'https://www.trustpilot.com/review/jackpotgo.com', asOf: PUBLISHED_ON }] },
  { slug: 'jackpota', name: 'Jackpota Sweepstakes Casino', operatorName: 'Silver Social Operations Limited / B2Services OU', launchDate: '2024-03', cashRedemptionMinimum: { amount: 75, currency: 'SC' }, giftCardRedemptionMinimum: { amount: 10, currency: 'SC' }, publishedRedemptionTiming: 'Gift cards: 2 business days; cash: 3–10 business days', paymentMethods: ['Prizeout gift card', 'bank transfer'], gameCount: 1600 },
  { slug: 'legendz', name: 'Legendz Sweepstakes Casino', operatorName: 'Platinum Panther Ltd.', dailyOffer: 'Daily rewards', giftCardRedemptionMinimum: { amount: 50, currency: 'SC' }, cashRedemptionMinimum: { amount: 100, currency: 'SC' }, paymentMethods: ['Prizeout gift card', 'Skrill', 'bank transfer'] },
  { slug: 'lucky-bunny', name: 'Lucky Bunny Sweepstakes Casino', operatorName: 'Optivara LLC', launchDate: '2026-03', dailyOffer: 'Daily spin wheel up to 5 SC', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, publishedRedemptionTiming: 'Bank transfer: up to 30 days', paymentMethods: ['bank transfer'], gameCount: 4000 },
  { slug: 'mcluck', name: 'McLuck Sweepstakes Casino', operatorName: 'B-Two Operations Limited', dailyOffer: 'Daily login rewards', giftCardRedemptionMinimum: { amount: 10, currency: 'SC' } },
  { slug: 'mega-bonanza', name: 'Mega Bonanza Sweepstakes Casino', operatorName: 'B2 Services OU / LuminaryPlay Operations', launchDate: '2024', cashRedemptionMinimum: { amount: 75, currency: 'SC' }, giftCardRedemptionMinimum: { amount: 10, currency: 'SC' }, publishedRedemptionTiming: 'Gift cards: instant; bank transfer: 3–5 business days', paymentMethods: ['Prizeout gift card', 'bank transfer'], gameCount: 1200 },
  { slug: 'playfame', name: 'PlayFame Sweepstakes Casino', operatorName: 'PlayFame Operations Limited', dailyOffer: 'Daily login rewards + daily jackpots', giftCardRedemptionMinimum: { amount: 10, currency: 'SC' }, paymentMethods: ['gift card', 'bank transfer'] },
  { slug: 'pulsz', name: 'Pulsz Sweepstakes Casino', operatorName: 'Yellow Social Interactive Limited', dailyOffer: 'Daily login rewards', giftCardRedemptionMinimum: { amount: 10, currency: 'SC' } },
  { slug: 'rolla', name: 'Rolla Sweepstakes Casino', operatorName: 'MW Services Limited', launchDate: '2025-04', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, giftCardRedemptionMinimum: { amount: 50, currency: 'SC' }, publishedRedemptionTiming: 'Repeat redemptions: 1–3 business days', paymentMethods: ['Trustly', 'Skrill', 'Prizeout gift card'], gameCount: 2000 },
  { slug: 'roxymoxy', name: 'RoxyMoxy Sweepstakes Casino', operatorName: 'Rainforest LTD', dailyOffer: 'Daily login bonus', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, paymentMethods: ['bank transfer'], gameCount: 40 },
  { slug: 'spinblitz', name: 'SpinBlitz Sweepstakes Casino', operatorName: 'B-Two Operations Limited', dailyOffer: 'Daily login SC' },
  { slug: 'spinfinite', name: 'Spinfinite Sweepstakes Casino', operatorName: 'Forever Winning LLC', launchDate: '2025-01', dailyOffer: 'Daily Mystery Bonus', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, giftCardRedemptionMinimum: { amount: 10, currency: 'SC' }, publishedRedemptionTiming: 'Gift cards: instant; bank transfer: 3–10 business days', paymentMethods: ['gift card', 'bank transfer'], gameCount: 400 },
  { slug: 'splash-coins', name: 'Splash Coins Sweepstakes Casino', operatorName: 'Interactive Studios Inc', launchDate: '2025-06', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, publishedRedemptionTiming: 'Skrill: often under 24 hours; push-to-card and ACH: 2–3 business days', paymentMethods: ['Skrill', 'push-to-card', 'ACH'], gameCount: 375 },
  { slug: 'spree', name: 'Spree Sweepstakes Casino', operatorName: 'Play Spree Ltd', dailyOffer: 'Promotional drops', giftCardRedemptionMinimum: { amount: 10, currency: 'SC' }, publishedRedemptionTiming: 'Gift cards: about 48 hours' },
  { slug: 'sweepico', name: 'Sweepico Sweepstakes Casino', operatorName: 'UTech Solutions LLC', launchDate: '2025-12', cashRedemptionMinimum: { amount: 100, currency: 'SC' }, publishedRedemptionTiming: 'Push-to-card: about 3 business days; ACH: up to 10 business days', paymentMethods: ['push-to-card', 'ACH'], gameCount: 1000 },
  { slug: 'sweet-sweeps', name: 'Sweet Sweeps Sweepstakes Casino', operatorName: 'Inimitable Solutions Limited', launchDate: '2025-07', cashRedemptionMinimum: { amount: 60, currency: 'SC' }, publishedRedemptionTiming: 'Debit card: often 15–20 minutes; USDC: instant; bank transfer: 3–7 days', paymentMethods: ['debit card', 'USDC on Solana', 'bank transfer'], gameCount: 1400 },
  { slug: 'thrillzz', name: 'Thrillzz', operatorName: 'Thrillzz Inc.', dailyOffer: 'Daily rewards', cashRedemptionMinimum: { amount: 50, currency: 'SC' }, publishedRedemptionTiming: 'Cash: 1–3 business days', paymentMethods: ['bank transfer', 'PayPal', 'Skrill'] },
  { slug: 'wow-vegas', name: 'WOW Vegas Sweepstakes Casino', operatorName: 'MW Services Limited', launchDate: '2022', cashRedemptionMinimum: { amount: 50, currency: 'SC' }, giftCardRedemptionMinimum: { amount: 25, currency: 'SC' }, publishedRedemptionTiming: 'Skrill and Prizeout: under 24 hours; MassPay: 1–2 days; Trustly: 3–5 days', paymentMethods: ['Skrill', 'Prizeout gift card', 'MassPay', 'Trustly'], gameCount: 1870 },
  { slug: 'zula', name: 'Zula Casino', operatorName: 'SCPS LLC (Blazesoft)', dailyOffer: 'Daily login rewards', cashRedemptionMinimum: { amount: 50, currency: 'SC' } },
];

function scoreFact(slug: string): CanonicalFact<number> {
  if (slug in SCORE_100) return verified(SCORE_100[slug], slug);
  const conflict = CONFLICTING_SCORES[slug];
  if (!conflict) return missing('No explicit /100 editorial score is supported.');
  return {
    status: 'unresolved',
    reason: 'Authored review and homepage score surfaces disagree.',
    sources: [
      { value: `${conflict[0]}/100`, provenance: sourceFor(slug) },
      { value: `${conflict[1]}/5`, provenance: { source: 'index.html', publishedOn: PUBLISHED_ON } },
    ],
  };
}

function signupFact(slug: string): CanonicalFact<string> {
  const conflict = CONFLICTING_OFFERS[slug];
  if (conflict) {
    return {
      status: 'unresolved',
      reason: 'Published offer surfaces use different wording or amounts.',
      sources: conflict.map((value, index) => ({
        value,
        provenance: {
          source: index === 0 ? 'index.html' : 'src/routes/bonuses/no-deposit/index.astro',
          publishedOn: PUBLISHED_ON,
        },
      })),
    };
  }
  return SIGNUP_OFFERS[slug]
    ? {
        status: 'verified',
        value: SIGNUP_OFFERS[slug],
        provenance: [{ source: 'index.html', publishedOn: PUBLISHED_ON }],
      }
    : missing('No non-conflicting signup offer has been selected.');
}

function makeRecord(seed: OperatorSeed): OperatorRecord {
  const fact = <K extends keyof OperatorSeed>(
    key: K,
    reason: string,
  ): CanonicalFact<NonNullable<OperatorSeed[K]>> =>
    seed[key] === undefined
      ? missing(reason)
      : verified(seed[key] as NonNullable<OperatorSeed[K]>, seed.slug);
  return {
    slug: seed.slug,
    name: verified(seed.name, seed.slug),
    operatorName: verified(seed.operatorName, seed.slug),
    launchDate: fact('launchDate', 'No non-conflicting launch date is canonical.'),
    signupOffer: signupFact(seed.slug),
    dailyOffer: fact('dailyOffer', 'No non-conflicting daily offer is canonical.'),
    cashRedemptionMinimum: fact('cashRedemptionMinimum', 'No non-conflicting cash minimum is canonical.'),
    giftCardRedemptionMinimum: fact('giftCardRedemptionMinimum', 'No non-conflicting gift-card minimum is canonical.'),
    publishedRedemptionTiming: fact('publishedRedemptionTiming', 'No non-conflicting published timing is canonical.'),
    paymentMethods: fact('paymentMethods', 'No non-conflicting payment-method list is canonical.'),
    gameCount: fact('gameCount', 'No non-conflicting game count is canonical.'),
    externalRatings: fact('externalRatings', 'No complete external rating with source, scale, URL, and date is canonical.'),
    editorScore100: scoreFact(seed.slug),
    lastVerifiedDate: missing('A review publication date is not treated as a fact-verification date.'),
  };
}

export const OPERATORS: OperatorRecord[] = seeds.map(makeRecord);

const OPERATORS_BY_SLUG = new Map(OPERATORS.map((operator) => [operator.slug, operator]));

export function getOperator(slug: string): OperatorRecord | undefined {
  return OPERATORS_BY_SLUG.get(slug);
}

export function verifiedValue<T>(fact: CanonicalFact<T>): T | undefined {
  return fact.status === 'verified' ? fact.value : undefined;
}
