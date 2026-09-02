# Operator Data Conflicts

Source snapshot: repository authored sources. Generated deterministically without a runtime date.

Coverage: **29 authored reviews**, **12 homepage cards**, **10 comparison rows**, and **46 relevant hub facts**.

The audit reports canonical resolution status but never resolves a conflict itself. Values remain exactly as authored or captured from the cited official source.

`src/data/operators.ts` records unresolved conflicts and verified canonical selections; canonical selectors omit unresolved values. Every `index.html` score source is a historical homepage snapshot that is not served. Verified canonical values retain field-level provenance, while affiliate restrictions and schema identity remain in their separate data modules.

| Operator | Field | Exact source values | Status |
|---|---|---|---|
| acebet | editorial score | `src/routes/index.astro` = `88/100 (4.4/5)`<br>`reviews/acebet.html` = `88/100 (4.4/5)`<br>`reviews/acebet.html JSON-LD Review.reviewRating` = `4.5/5`<br>`index.html` = `4.6/5`<br>`reviews/acebet.html#review-jsonld` = `4.5/5` | RESOLVED |
| big-pirate | editorial score | `src/routes/index.astro` = `79/100 (3.95/5)`<br>`reviews/big-pirate.html` = `79/100 (3.95/5)`<br>`reviews/big-pirate.html JSON-LD Review.reviewRating` = `4.1/5`<br>`index.html` = `4.7/5`<br>`reviews/big-pirate.html#review-jsonld` = `4.1/5` | RESOLVED |
| card-crush | editorial score | `reviews/card-crush.html` = `82/100 (4.1/5)`<br>`reviews/card-crush.html JSON-LD Review.reviewRating` = `4.2/5`<br>`index.html` = `4.2/5`<br>`reviews/card-crush.html#review-jsonld` = `4.2/5` | RESOLVED |
| casino-click | editorial score | `reviews/casino-click.html` = `72/100 (3.6/5)`<br>`reviews/casino-click.html JSON-LD Review.reviewRating` = `3.8/5`<br>`index.html` = `4.7/5`<br>`reviews/casino-click.html#review-jsonld` = `3.8/5` | RESOLVED |
| crown-coins | editorial score | `reviews/crown-coins.html` = `91/100 (4.55/5)`<br>`reviews/crown-coins.html JSON-LD Review.reviewRating` = `4.6/5`<br>`index.html` = `4.8/5`<br>`reviews/crown-coins.html#review-jsonld` = `4.6/5` | RESOLVED |
| crown-coins | welcome offer | `src/data/operators.ts#crown-coins.signupOffer.sources[0] (index.html#historical-homepage-snapshot-not-served)` = `100,000 Crown Coins + 2 SC No Deposit`<br>`src/data/operators.ts#crown-coins.signupOffer.sources[1] (reviews/crown-coins.html)` = `100,000 CC + 2 SC`<br>`src/data/operators.ts#crown-coins.signupOffer.sources[2] (https://help.crowncoinscasino.com/en/articles/12808804-how-to-get-free-bonus-coins; captured 2026-09-02)` = `Official page describes bonus routes but does not state a signup-offer amount.`<br>`reviews/crown-coins.html` = `100,000 CC + 2 SC`<br>`src/routes/bonuses/no-deposit/index.astro` = `Details omitted because canonical offer sources conflict` | UNRESOLVED |
| dexyplay | editorial score | `src/routes/index.astro` = `87/100 (4.35/5)`<br>`reviews/dexyplay.html` = `87/100 (4.35/5)`<br>`reviews/dexyplay.html JSON-LD Review.reviewRating` = `4.5/5`<br>`index.html` = `4.8/5`<br>`reviews/dexyplay.html#review-jsonld` = `4.5/5` | RESOLVED |
| freespin | editorial score | `src/routes/index.astro` = `82/100 (4.1/5)`<br>`reviews/freespin.html` = `82/100 (4.1/5)`<br>`reviews/freespin.html JSON-LD Review.reviewRating` = `4.3/5`<br>`index.html` = `4.9/5`<br>`reviews/freespin.html#review-jsonld` = `4.3/5` | RESOLVED |
| hello-millions | editorial score | `reviews/hello-millions.html` = `85/100 (4.25/5)`<br>`reviews/hello-millions.html JSON-LD Review.reviewRating` = `4.2/5`<br>`index.html` = `4.6/5`<br>`reviews/hello-millions.html#review-jsonld` = `4.2/5` | RESOLVED |
| hello-millions | welcome offer | `src/data/operators.ts#hello-millions.signupOffer` = `GC 7,500 + FREE SC 2.5`<br>`https://www.hellomillions.com/about (captured 2026-09-02)` = `GC 7,500 + FREE SC 2.5`<br>`src/routes/bonuses/no-deposit/index.astro` = `GC 7,500 + FREE SC 2.5` | RESOLVED |
| high5 | editorial score | `src/routes/index.astro` = `88/100 (4.4/5)`<br>`reviews/high5.html` = `88/100 (4.4/5)`<br>`reviews/high5.html JSON-LD Review.reviewRating` = `4.3/5`<br>`index.html` = `4.9/5`<br>`reviews/high5.html#review-jsonld` = `4.3/5` | RESOLVED |
| jackpot-go | editorial score | `src/routes/index.astro` = `85/100 (4.25/5)`<br>`reviews/jackpot-go.html` = `85/100 (4.25/5)`<br>`reviews/jackpot-go.html JSON-LD Review.reviewRating` = `4.4/5`<br>`index.html` = `4.5/5`<br>`reviews/jackpot-go.html#review-jsonld` = `4.4/5` | RESOLVED |
| jackpota | editorial score | `src/routes/index.astro` = `86/100 (4.3/5)`<br>`reviews/jackpota.html` = `86/100 (4.3/5)`<br>`reviews/jackpota.html JSON-LD Review.reviewRating` = `4.3/5`<br>`index.html` = `4.7/5`<br>`reviews/jackpota.html#review-jsonld` = `4.3/5` | RESOLVED |
| lucky-bunny | editorial score | `src/routes/index.astro` = `74/100 (3.7/5)`<br>`reviews/lucky-bunny.html` = `74/100 (3.7/5)`<br>`reviews/lucky-bunny.html JSON-LD Review.reviewRating` = `3.9/5`<br>`index.html` = `4.9/5`<br>`reviews/lucky-bunny.html#review-jsonld` = `3.9/5` | RESOLVED |
| mcluck | editorial score | `reviews/mcluck.html` = `88/100 (4.4/5)`<br>`reviews/mcluck.html JSON-LD Review.reviewRating` = `4.5/5`<br>`index.html` = `4.5/5`<br>`reviews/mcluck.html#review-jsonld` = `4.5/5` | RESOLVED |
| mega-bonanza | editorial score | `src/routes/index.astro` = `82/100 (4.1/5)`<br>`reviews/mega-bonanza.html` = `82/100 (4.1/5)`<br>`reviews/mega-bonanza.html JSON-LD Review.reviewRating` = `4/5`<br>`index.html` = `4.5/5`<br>`reviews/mega-bonanza.html#review-jsonld` = `4/5` | RESOLVED |
| pulsz | editorial score | `reviews/pulsz.html` = `88/100 (4.4/5)`<br>`reviews/pulsz.html JSON-LD Review.reviewRating` = `4.5/5`<br>`index.html` = `4.5/5`<br>`reviews/pulsz.html#review-jsonld` = `4.5/5` | RESOLVED |
| rolla | editorial score | `src/routes/index.astro` = `92/100 (4.6/5)`<br>`reviews/rolla.html` = `92/100 (4.6/5)`<br>`reviews/rolla.html JSON-LD Review.reviewRating` = `4.7/5`<br>`index.html` = `5/5`<br>`reviews/rolla.html#review-jsonld` = `4.7/5` | RESOLVED |
| spinblitz | editorial score | `reviews/spinblitz.html` = `87/100 (4.35/5)`<br>`reviews/spinblitz.html JSON-LD Review.reviewRating` = `4.4/5`<br>`index.html` = `4.6/5`<br>`reviews/spinblitz.html#review-jsonld` = `4.4/5` | RESOLVED |
| spinblitz | welcome offer | `src/data/operators.ts#spinblitz.signupOffer.sources[0] (index.html#historical-homepage-snapshot-not-served)` = `7,500 GC + 2.5 SC Promo Code`<br>`src/data/operators.ts#spinblitz.signupOffer.sources[1] (reviews/spinblitz.html)` = `7,500 GC + 2.5 SC`<br>`src/data/operators.ts#spinblitz.signupOffer.sources[2] (https://support.spinblitz.com/api/v2/help_center/en-us/articles/38181733505565.json; captured 2026-09-02)` = `Official page says promotions have individual reward details but does not state a signup-offer amount.`<br>`reviews/spinblitz.html` = `7,500 GC + 2.5 SC`<br>`src/routes/bonuses/no-deposit/index.astro` = `Details omitted because canonical offer sources conflict` | UNRESOLVED |
| spinfinite | editorial score | `src/routes/index.astro` = `80/100 (4/5)`<br>`reviews/spinfinite.html` = `80/100 (4/5)`<br>`reviews/spinfinite.html JSON-LD Review.reviewRating` = `4.1/5`<br>`index.html` = `4.5/5`<br>`reviews/spinfinite.html#review-jsonld` = `4.1/5` | RESOLVED |
| splash-coins | editorial score | `src/routes/index.astro` = `83/100 (4.15/5)`<br>`reviews/splash-coins.html` = `83/100 (4.15/5)`<br>`reviews/splash-coins.html JSON-LD Review.reviewRating` = `4.3/5`<br>`index.html` = `4.9/5`<br>`reviews/splash-coins.html#review-jsonld` = `4.3/5` | RESOLVED |
| spree | editorial score | `reviews/spree.html` = `83/100 (4.15/5)`<br>`reviews/spree.html JSON-LD Review.reviewRating` = `4/5`<br>`index.html` = `4.6/5`<br>`reviews/spree.html#review-jsonld` = `4/5` | RESOLVED |
| spree | welcome offer | `src/data/operators.ts#spree.signupOffer` = `25,000 Gold Coins and 2.5 Spree Coins`<br>`https://support.spree.com/api/v2/help_center/en-us/articles/37595439875730.json (captured 2026-09-02)` = `25,000 Gold Coins and 2.5 Spree Coins`<br>`src/routes/bonuses/no-deposit/index.astro` = `25,000 Gold Coins and 2.5 Spree Coins` | RESOLVED |
| sweepico | editorial score | `reviews/sweepico.html` = `85/100 (4.25/5)`<br>`reviews/sweepico.html JSON-LD Review.reviewRating` = `4.4/5`<br>`index.html` = `4.6/5`<br>`reviews/sweepico.html#review-jsonld` = `4.4/5` | RESOLVED |
| sweet-sweeps | editorial score | `reviews/sweet-sweeps.html` = `90/100 (4.5/5)`<br>`reviews/sweet-sweeps.html JSON-LD Review.reviewRating` = `4.5/5`<br>`index.html` = `4.7/5`<br>`reviews/sweet-sweeps.html#review-jsonld` = `4.5/5` | RESOLVED |
| thrillzz | editorial score | `reviews/thrillzz.html` = `85/100 (4.25/5)`<br>`reviews/thrillzz.html JSON-LD Review.reviewRating` = `4.3/5`<br>`index.html` = `4.3/5`<br>`reviews/thrillzz.html#review-jsonld` = `4.3/5` | RESOLVED |
| wow-vegas | editorial score | `reviews/wow-vegas.html` = `91/100 (4.55/5)`<br>`reviews/wow-vegas.html JSON-LD Review.reviewRating` = `4.5/5`<br>`index.html` = `4.8/5`<br>`reviews/wow-vegas.html#review-jsonld` = `4.5/5` | RESOLVED |
| zula | editorial score | `reviews/zula.html` = `87/100 (4.35/5)`<br>`reviews/zula.html JSON-LD Review.reviewRating` = `4.4/5`<br>`index.html` = `4.4/5`<br>`reviews/zula.html#review-jsonld` = `4.4/5` | RESOLVED |

## Review inventory

- `reviews/acebet.html` — Acebet Casino Review — Redemption, Bonus & Payouts (2026)
- `reviews/american-luck.html` — American Luck Review 2026: Is It Legit? \| Sweepstakes Wiz
- `reviews/big-pirate.html` — Big Pirate Casino Review (2026): Legit, Payout Speed & Bonus
- `reviews/card-crush.html` — Card Crush Review (2026): Legit, Payouts — CA & NY Only
- `reviews/casino-click.html` — Casino Click Review (2026): Legit, Payout Speed & Daily 5 SC Bonus
- `reviews/crown-coins.html` — Crown Coins Review — Redemption, Bonus & Trustpilot (2026)
- `reviews/dexyplay.html` — DexyPlay Casino Review (2026): Legit, PayPal Payouts & Bonus
- `reviews/freespin.html` — FreeSpin Casino Review — Redemptions & Promo Codes (2026)
- `reviews/hello-millions.html` — Hello Millions Review (2026): Legit, Payouts & Phone Support
- `reviews/high5.html` — High 5 Casino Review 2026 — Redemption & Diamond Currency
- `reviews/jackpot-go.html` — Jackpot Go Casino Review 2026 — Payouts & Promo Codes
- `reviews/jackpota.html` — Jackpota Casino Review (2026): Legit, Payouts & Jackpots
- `reviews/legendz.html` — Legendz Casino Review (2026): Legit, Payout Speed & Sportsbook
- `reviews/lucky-bunny.html` — Lucky Bunny Casino Review 2026 — Redemptions, Bonus Codes
- `reviews/mcluck.html` — McLuck Review 2026 — Bonus, McJackpots, Payouts & Apps
- `reviews/mega-bonanza.html` — Mega Bonanza Review 2026 — Redemption & Bonuses
- `reviews/playfame.html` — PlayFame Casino Review (2026): Legit, Payouts, iOS App & Bonus
- `reviews/pulsz.html` — Pulsz Review 2026 — Bonus, Apps, Payouts & Trustpilot
- `reviews/rolla.html` — Rolla Casino Review — Redemption & Payout Speed Explained (2026)
- `reviews/roxymoxy.html` — RoxyMoxy Casino Review (2026): Legit, Payouts & Restricted States
- `reviews/spinblitz.html` — SpinBlitz Casino Review 2026 — Redemption & Jackpots
- `reviews/spinfinite.html` — Spinfinite Casino Review 2026 - Is it Legit?
- `reviews/splash-coins.html` — Splash Coins Casino Review 2026 — Redemption, Bonus Explained
- `reviews/spree.html` — Spree Casino Review 2026 — Redemption Speed & Jackpots
- `reviews/sweepico.html` — Sweepico Casino Review 2026 — Redemption & Bonuses
- `reviews/sweet-sweeps.html` — Sweet Sweeps Casino Review 2026 — Is it Legit?
- `reviews/thrillzz.html` — Thrillzz Review 2026 — Social Sportsbook, Bonus & Payouts
- `reviews/wow-vegas.html` — WOW Vegas Casino Review 2026 — Redemption Speed & Bonus
- `reviews/zula.html` — Zula Casino Review (2026): Legit, Payouts & 29K Trustpilot Reviews

## Homepage inventory

- `acebet` — `88/5`; offer `1 Free SC + 100% match up to 1,000 SC`
- `freespin` — `82/5`; offer `200,000 GC + 20 free spins on Gorilla`
- `lucky-bunny` — `74/5`; offer `550,000 FC + 5 SC`
- `spinfinite` — `80/5`; offer `3,000 GC + 200% first-purchase boost`
- `big-pirate` — `79/5`; offer `20,000 GC + 2 Diamonds + 2 Rum`
- `dexyplay` — `87/5`; offer `350,000 GC + up to 88 SC + 65 free plays`
- `high5` — `88/5`; offer `5 SC + 250 GC + 600 Diamonds`
- `jackpot-go` — `85/5`; offer `10,000 GC + 0.6 SC`
- `jackpota` — `86/5`; offer `7,500 GC + 2.5 SC + 75 SC spins`
- `mega-bonanza` — `82/5`; offer `7,500 GC + 2.5 SC`
- `rolla` — `92/5`; offer `500,000 GC + 10 SC + $10 coin pack`
- `splash-coins` — `83/5`; offer `150,000 GC + 2 SC`

## Relevant hub inventory

- `src/routes/bonuses/no-deposit/index.astro` — `casino-click` minimum redemption: `100 SC (cash)`
- `src/routes/bonuses/no-deposit/index.astro` — `casino-click` welcome offer: `100,000 GC + 2 SC`
- `src/routes/bonuses/no-deposit/index.astro` — `crown-coins` minimum redemption: `100 SC (cash)`
- `src/routes/bonuses/no-deposit/index.astro` — `crown-coins` welcome offer: `Details omitted because canonical offer sources conflict`
- `src/routes/bonuses/no-deposit/index.astro` — `hello-millions` minimum redemption: `10 SC (gift cards)`
- `src/routes/bonuses/no-deposit/index.astro` — `hello-millions` welcome offer: `GC 7,500 + FREE SC 2.5`
- `src/routes/bonuses/no-deposit/index.astro` — `legendz` minimum redemption: `50 SC (gift cards); 100 SC (cash)`
- `src/routes/bonuses/no-deposit/index.astro` — `legendz` welcome offer: `500 GC + 3 SC`
- `src/routes/bonuses/no-deposit/index.astro` — `mcluck` minimum redemption: `10 SC (gift cards)`
- `src/routes/bonuses/no-deposit/index.astro` — `mcluck` welcome offer: `7,500 GC + 2.5 SC`
- `src/routes/bonuses/no-deposit/index.astro` — `playfame` minimum redemption: `10 SC (gift cards)`
- `src/routes/bonuses/no-deposit/index.astro` — `playfame` welcome offer: `7,500 GC + 2.5 SC`
- `src/routes/bonuses/no-deposit/index.astro` — `pulsz` minimum redemption: `10 SC (gift cards)`
- `src/routes/bonuses/no-deposit/index.astro` — `pulsz` welcome offer: `5,000 GC + 2.3 SC`
- `src/routes/bonuses/no-deposit/index.astro` — `roxymoxy` minimum redemption: `100 SC (cash)`
- `src/routes/bonuses/no-deposit/index.astro` — `roxymoxy` welcome offer: `50,000 GC + 2.5 SC`
- `src/routes/bonuses/no-deposit/index.astro` — `spinblitz` welcome offer: `Details omitted because canonical offer sources conflict`
- `src/routes/bonuses/no-deposit/index.astro` — `spree` minimum redemption: `10 SC (gift cards)`
- `src/routes/bonuses/no-deposit/index.astro` — `spree` welcome offer: `25,000 Gold Coins and 2.5 Spree Coins`
- `src/routes/bonuses/no-deposit/index.astro` — `thrillzz` minimum redemption: `50 SC (cash)`
- `src/routes/bonuses/no-deposit/index.astro` — `thrillzz` welcome offer: `3,000 GC + 3 SC`
- `src/routes/bonuses/no-deposit/index.astro` — `zula` minimum redemption: `50 SC (cash)`
- `src/routes/bonuses/no-deposit/index.astro` — `zula` welcome offer: `Up to 120,000 GC + 10 SC`
- `src/routes/new/index.astro` — `american-luck` curated hub note: `Operated by SGSE LLC; cash redemptions from 50 SC; listed methods: ACH; published game count: 1,500.`
- `src/routes/new/index.astro` — `big-pirate` curated hub note: `Operated by Rafflefy Limited; published launch date November 2025; published signup offer: 20,000 GC + 2 Diamonds + 2 Rum; cash redemptions from 50 Diamond; published redemption estimate: Bank transfer: 1–3 business days; listed methods: bank transfer; published game count: 1,500.`
- `src/routes/new/index.astro` — `card-crush` curated hub note: `Operated by Vision NL Limited; published signup offer: 2 Mystery Coins + 5 Cards; gift-card redemptions from 10 MC; cash redemptions from 75 MC.`
- `src/routes/new/index.astro` — `jackpota` curated hub note: `Operated by Silver Social Operations Limited / B2Services OU; published launch date March 2024; published signup offer: 7,500 GC + 2.5 SC + 75 SC spins; gift-card redemptions from 10 SC; cash redemptions from 75 SC; published redemption estimate: Gift cards: 2 business days; cash: 3–10 business days; listed methods: Prizeout gift card, bank transfer; published game count: 1,600.`
- `src/routes/new/index.astro` — `legendz` curated hub note: `Operated by Platinum Panther Ltd.; published signup offer: 500 GC + 3 SC; published daily offer: Daily rewards; gift-card redemptions from 50 SC; cash redemptions from 100 SC; listed methods: Prizeout gift card, Skrill, bank transfer.`
- `src/routes/new/index.astro` — `playfame` curated hub note: `Operated by PlayFame Operations Limited; published signup offer: 7,500 GC + 2.5 SC; published daily offer: Daily login rewards + daily jackpots; gift-card redemptions from 10 SC; listed methods: gift card, bank transfer.`
- `src/routes/new/index.astro` — `roxymoxy` curated hub note: `Operated by Rainforest LTD; published signup offer: 50,000 GC + 2.5 SC; published daily offer: Daily login bonus; cash redemptions from 100 SC; listed methods: bank transfer; published game count: 40.`
- `src/routes/new/index.astro` — `spinfinite` curated hub note: `Operated by Forever Winning LLC; published launch date January 2025; published signup offer: 3,000 GC + 200% first-purchase boost; published daily offer: Daily Mystery Bonus; gift-card redemptions from 10 SC; cash redemptions from 100 SC; published redemption estimate: Gift cards: instant; bank transfer: 3–10 business days; listed methods: gift card, bank transfer; published game count: 400.`
- `src/routes/new/index.astro` — `spree` curated hub note: `Operated by Play Spree Ltd; published signup offer: 25,000 Gold Coins and 2.5 Spree Coins; published daily offer: Promotional drops; gift-card redemptions from 10 SC; published redemption estimate: Gift cards: about 48 hours.`
- `src/routes/new/index.astro` — `thrillzz` curated hub note: `Operated by Thrillzz Inc.; published signup offer: 3,000 GC + 3 SC; published daily offer: Daily rewards; cash redemptions from 50 SC; published redemption estimate: Cash: 1–3 business days; listed methods: bank transfer, PayPal, Skrill.`
- `src/routes/state-legality/index.astro` — `card-crush` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `casino-click` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `crown-coins` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `hello-millions` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `legendz` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `mcluck` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `playfame` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `pulsz` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `roxymoxy` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `spinblitz` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `spree` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `thrillzz` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
- `src/routes/state-legality/index.astro` — `zula` operator availability authority: `AFFILIATE_PARTNERS + tracker status + site CTA policy`
