# Commercial Hub Plan

Source snapshot: repository authored sources. Generated deterministically without a runtime date.

## Current factual shape

- Homepage: 4 supported ranked cards at `/` from `src/routes/index.astro`.
- Comparison: 10 operator rows at `/best/sweepstakes-casinos/` from `src/content/comparisons/sweepstakes-casinos.mdx`.
- Relevant authored hubs: 46 operator facts across the new-casino, no-deposit, and state-legality routes.
- Affiliate authority: 13 partners in `src/data/affiliates.ts`; tracking and economics stay outside editorial facts.
- Geo authority: `src/data/geo.ts` remains the site-level CTA suppression layer.

## Phase 2/3 plan

1. Keep `/` as the concise decision-support entry point with only the canonically supported ranked set.
2. Keep `/reviews/` as the complete alphabetical directory without “best” ordering.
3. Treat `/best/sweepstakes-casinos/` as deeper ranked comparison coverage.
4. Preserve affiliate tracking, per-partner availability, and site-level suppression as separate authorities.
5. Resolve each `UNRESOLVED` or `MANUAL_REVIEW` row in `operator-data-conflicts.md` only against cited source evidence.

## Candidate approval gates

A candidate is created only when every gate passes. Current freshness-dependent candidates are explicitly deferred; no thin route or filter permutation is created.

| Candidate | Gate | Status | Deterministic evidence |
|---|---|---|---|
| Fastest payout sweepstakes casinos | canonical field coverage | FAIL | 17/29 records have verified published timing text, but 0 have a normalized comparable payout-duration metric. |
| Fastest payout sweepstakes casinos | freshness | FAIL | 0/29 records have a verified lastVerifiedDate. |
| Fastest payout sweepstakes casinos | distinct intent | PASS | A ranked payout-speed decision page would be distinct from the redemption explainer. |
| Fastest payout sweepstakes casinos | competing URLs | PASS | No existing route ranks operators by a comparable payout-duration metric. |
| Fastest payout sweepstakes casinos | internal-link sources | PASS | Reviews, the redemption guide, and the main comparison could supply contextual links. |
| Fastest payout sweepstakes casinos | conversion action | PASS | The supported action would be reading operator reviews after comparing published terms. |
| Most free Sweeps Coins | canonical field coverage | FAIL | 24/29 records have a verified signup offer. |
| Most free Sweeps Coins | freshness | FAIL | 0/29 records have a verified lastVerifiedDate. |
| Most free Sweeps Coins | distinct intent | FAIL | The intent is already served by /bonuses/no-deposit/. |
| Most free Sweeps Coins | competing URLs | FAIL | /bonuses/no-deposit/ is the existing canonical no-purchase offer destination. |
| Most free Sweeps Coins | internal-link sources | PASS | Reviews, the AMOE guide, and the homepage can link to the existing destination. |
| Most free Sweeps Coins | conversion action | PASS | The supported action is comparing published offers and then reading a review. |

## Decisions

- **DEFER: Fastest payout sweepstakes casinos.** Unmet gates: canonical field coverage: 17/29 records have verified published timing text, but 0 have a normalized comparable payout-duration metric; freshness: 0/29 records have a verified lastVerifiedDate.
- **DEFER: Most free Sweeps Coins.** Unmet gates: canonical field coverage: 24/29 records have a verified signup offer; freshness: 0/29 records have a verified lastVerifiedDate; distinct intent: The intent is already served by /bonuses/no-deposit/; competing URLs: /bonuses/no-deposit/ is the existing canonical no-purchase offer destination.

No ranking, offer, legal status, redirect, or canonical winner is asserted here.
