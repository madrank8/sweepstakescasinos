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

No ranking, offer, legal status, redirect, or canonical winner is asserted here.
