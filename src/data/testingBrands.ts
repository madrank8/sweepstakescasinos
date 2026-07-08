/**
 * First-party testing brand registry — derived from `.planning/TESTING-TEAM-BRIEF.md` §4b.
 * Partner flags cross-checked against `src/data/affiliates.ts` (13 partners).
 */

export interface TestingBrand {
  slug: string;
  name: string;
  batch: 1 | 2 | 3;
  isPartner: boolean;
  overclaimFlag: boolean;
  claimsToVerify: string;
  reviewPath: string;
}

export const TESTING_BRANDS: TestingBrand[] = [
  {
    slug: 'american-luck',
    name: 'American Luck',
    batch: 3,
    isPartner: false,
    overclaimFlag: false,
    claimsToVerify:
      'Per published terms: operated by SGSE LLC (Wilmington, DE); excluded states ID/MI/WA; min 50 SC cash redemption via ACH; 1x playthrough on gameplay-won SC; KYC (photo ID + household bill + bank statement) 24h–5 days; cash arrives up to 7 business days; 1,500+ games; advertised 70,000 GC + 6 SC no-purchase welcome package.',
    reviewPath: 'reviews/american-luck.html',
  },
  {
    slug: 'rolla',
    name: 'Rolla',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      '14-day hands-on test; Our test redemption #1 (Prizeout) cleared in 2 business days; Trustly bank 3 days; redemptions 1–3 business days; Skrill same/next day; gift cards from 50 SC, cash from 100 SC; 2.9% purchase fee.',
    reviewPath: 'reviews/rolla.html',
  },
  {
    slug: 'wow-vegas',
    name: 'WOW Vegas',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'Skrill under 24hrs; Prizeout gift cards within 24hrs from 25 SC; MassPay 1–2 days; Trustly 3–5 days; Elite VIP same-day; min Skrill 50 SC; $10,000 daily limit.',
    reviewPath: 'reviews/wow-vegas.html',
  },
  {
    slug: 'crown-coins',
    name: 'Crown Coins',
    batch: 1,
    isPartner: true,
    overclaimFlag: true,
    claimsToVerify:
      'Skrill payouts under 24hrs; all five sources we verified; Dynasty VIP 6% coinback.',
    reviewPath: 'reviews/crown-coins.html',
  },
  {
    slug: 'sweet-sweeps',
    name: 'Sweet Sweeps',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'Debit (Visa/MC) payouts often 15–20 minutes; fastest verified debit-card payouts; USDC on Solana instant; bank 3–7 days; min 60 SC; Veriff KYC clears in minutes.',
    reviewPath: 'reviews/sweet-sweeps.html',
  },
  {
    slug: 'splash-coins',
    name: 'Splash Coins',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'Title Payouts Tested; Skrill often under 24hrs; 1–3 business days cash; Push-to-Card/ACH 2–3 days; min 100 SC; zero purchase fees.',
    reviewPath: 'reviews/splash-coins.html',
  },
  {
    slug: 'sweepico',
    name: 'Sweepico',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'Full hands-on expert review — everything tested and verified; push-to-card payouts; VIP program.',
    reviewPath: 'reviews/sweepico.html',
  },
  {
    slug: 'big-pirate',
    name: 'Big Pirate',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'We tested the platform hands-on; all five sources we verified; 3-currency system; Claw Machine; 1,500+ games; payout speed.',
    reviewPath: 'reviews/big-pirate.html',
  },
  {
    slug: 'dexyplay',
    name: 'DexyPlay',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'We tested DexyPlay; PayPal / ACH / push-to-card all process in 3–4 business days; min $100 (100 SC); purchase required before first redemption; 24-level VIP.',
    reviewPath: 'reviews/dexyplay.html',
  },
  {
    slug: 'freespin',
    name: 'FreeSpin',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'We tested FreeSpin.com; crypto redemptions under 24hrs; Fun Zone daily pick-a-box up to 5 SC; KYC friction explained honestly.',
    reviewPath: 'reviews/freespin.html',
  },
  {
    slug: 'casino-click',
    name: 'Casino Click',
    batch: 1,
    isPartner: true,
    overclaimFlag: true,
    claimsToVerify:
      'We tested Casino Click; Bitcoin payouts; daily scratch card up to 5 SC; Trustpilot 2.5/5.',
    reviewPath: 'reviews/casino-click.html',
  },
  {
    slug: 'acebet',
    name: 'Acebet',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'Hands-on Acebet.cc review tested and verified; crypto payouts in 24–48hrs; 7.5 SC mail-in; promo code ACEBET.',
    reviewPath: 'reviews/acebet.html',
  },
  {
    slug: 'high5',
    name: 'High 5',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'Title Tested; cash redemptions 3–10 business days; 100 SC cash minimum; three-currency (Diamonds); iOS/Android apps; operating since 2012.',
    reviewPath: 'reviews/high5.html',
  },
  {
    slug: 'jackpot-go',
    name: 'JackpotGo',
    batch: 2,
    isPartner: false,
    overclaimFlag: true,
    claimsToVerify:
      'Venmo Fast Payment in minutes; standard bank/Venmo within 3 business days; free GC faucet every 10 min.',
    reviewPath: 'reviews/jackpot-go.html',
  },
  {
    slug: 'spinblitz',
    name: 'SpinBlitz',
    batch: 1,
    isPartner: true,
    overclaimFlag: true,
    claimsToVerify:
      'Gift card payouts 24–48hrs from 10 SC; Blitz Jackpot 50K SC; 1,500+ games; live dealer.',
    reviewPath: 'reviews/spinblitz.html',
  },
  {
    slug: 'mcluck',
    name: 'McLuck',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify:
      'No-code 7,500 GC + 2.5 SC; Skrill e-wallet payouts; 10 SC gift cards; McJackpots; iOS/Android.',
    reviewPath: 'reviews/mcluck.html',
  },
  {
    slug: 'pulsz',
    name: 'Pulsz',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify:
      'No-code 5,000 GC + 2.3 SC; Skrill / ACH / wire payouts; 10 SC gift cards; Pulse 8; iOS/Android.',
    reviewPath: 'reviews/pulsz.html',
  },
  {
    slug: 'hello-millions',
    name: 'HelloMillions',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify:
      'No-code welcome; gift-card & cash payout speed; 10 SC gift cards; real phone support line; 1,500+ games.',
    reviewPath: 'reviews/hello-millions.html',
  },
  {
    slug: 'legendz',
    name: 'Legendz',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify:
      'No-code 500 GC + 3 SC; Prizeout gift cards from 50 SC, Skrill/bank cash from 100 SC; 500+ games + social sportsbook.',
    reviewPath: 'reviews/legendz.html',
  },
  {
    slug: 'playfame',
    name: 'PlayFame',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify:
      '7,500 GC + 2.5 SC; 10 SC gift cards, bank-transfer cash payouts; dedicated iOS app.',
    reviewPath: 'reviews/playfame.html',
  },
  {
    slug: 'spree',
    name: 'Spree',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify: '10 SC gift cards in 48hrs; SpreePotz jackpots; Sit-and-Spin; 800+ games.',
    reviewPath: 'reviews/spree.html',
  },
  {
    slug: 'thrillzz',
    name: 'Thrillzz',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify:
      'Social sportsbook; 50 SC ($50) redemptions via bank/PayPal/Skrill in 1–3 days; native iOS/Android apps.',
    reviewPath: 'reviews/thrillzz.html',
  },
  {
    slug: 'zula',
    name: 'Zula Casino',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify:
      'No-code up to 120,000 GC + 10 SC; Skrill & bank cash redemptions from 50 SC; 2,000+ games; iOS/Android.',
    reviewPath: 'reviews/zula.html',
  },
  {
    slug: 'roxymoxy',
    name: 'RoxyMoxy',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify:
      'No-code 50,000 GC + 2.5 SC; bank-transfer redemptions from 100 SC; 40+ slots; browser-only.',
    reviewPath: 'reviews/roxymoxy.html',
  },
  {
    slug: 'card-crush',
    name: 'Card Crush',
    batch: 1,
    isPartner: true,
    overclaimFlag: false,
    claimsToVerify:
      'RPG card-battle; Mystery Coins (1 MC = $1); cash from 75 MC, gift cards from 10 MC; 1× playthrough; available ONLY in CA & NY; 21+.',
    reviewPath: 'reviews/card-crush.html',
  },
  {
    slug: 'mega-bonanza',
    name: 'Mega Bonanza',
    batch: 3,
    isPartner: false,
    overclaimFlag: false,
    claimsToVerify:
      'Instant Prizeout from 10 SC; code SWEEPSKINGS; 1,200+ games; 4.0/5 Trustpilot.',
    reviewPath: 'reviews/mega-bonanza.html',
  },
  {
    slug: 'spinfinite',
    name: 'Spinfinite',
    batch: 3,
    isPartner: false,
    overclaimFlag: false,
    claimsToVerify:
      'Power Pass 90 SC for $24/mo; instant gift cards from 10 SC; 3 SC mail-in; Android app.',
    reviewPath: 'reviews/spinfinite.html',
  },
  {
    slug: 'jackpota',
    name: 'Jackpota',
    batch: 3,
    isPartner: false,
    overclaimFlag: false,
    claimsToVerify:
      'Gift cards in 2 days from 10 SC; 80K GC + 40 SC first-buy; 1,600+ games; live dealer.',
    reviewPath: 'reviews/jackpota.html',
  },
  {
    slug: 'lucky-bunny',
    name: 'Lucky Bunny',
    batch: 3,
    isPartner: false,
    overclaimFlag: false,
    claimsToVerify:
      'Code SWEEPSKINGS 550K FC + 5 SC; 4,000+ games; daily wheel up to 5 SC; 12-tier VIP.',
    reviewPath: 'reviews/lucky-bunny.html',
  },
];

export const TESTING_BRAND_BY_SLUG = new Map(TESTING_BRANDS.map((b) => [b.slug, b]));

export const TESTING_CSV_HEADER =
  'brand_slug,date_tested,tester_state,could_test,welcome_credited,promo_code_needed,redemption_method,min_redemption,request_timestamp,payout_timestamp,hours_to_payout,kyc_docs,kyc_hours,support_channel,support_first_response,support_resolved,games_ok,state_availability_ok,evidence_files,notes';
