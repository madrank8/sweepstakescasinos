# Commercial Hub Plan

Source snapshot: repository authored sources. Generated deterministically without a runtime date.

## Current factual shape

- Homepage: 28 operator cards at `/` from `index.html`.
- Comparison: 10 operator rows at `/best/sweepstakes-casinos/` from `src/content/comparisons/sweepstakes-casinos.mdx`.
- Affiliate authority: 13 partners in `src/data/affiliates.ts`; tracking and economics stay outside editorial facts.
- Geo authority: `src/data/geo.ts` remains the site-level CTA suppression layer.

## Phase 2/3 plan

1. Keep `/` as the primary “Best Sweepstakes Casinos” entry point unless a human URL/canonical decision changes that strategy.
2. Treat `/best/sweepstakes-casinos/` as deeper comparison coverage; remove field drift through the future canonical editorial operator model, not by copying affiliate data into content.
3. Preserve affiliate tracking, per-partner availability, and site-level suppression as separate authorities.
4. Resolve each `UNRESOLVED` or `MANUAL_REVIEW` row in `operator-data-conflicts.md` only against cited source evidence.

No ranking, offer, legal status, redirect, or canonical winner is asserted here.
