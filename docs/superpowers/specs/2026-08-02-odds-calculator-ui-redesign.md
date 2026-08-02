# Sweepstakes Odds Calculator UI Redesign

**Date:** 2026-08-02  
**Status:** Approved for ship (Sections 1–3 locked; remaining brainstorm gates skipped per user)  
**Epic:** `sw-gz0`

## Locked decisions

1. **Tone:** Premium + exciting high-energy promo (navy / gold SweepstakesWiz — not purple AI slop; no confetti or guaranteed-win urgency).
2. **Result moment:** Short charge → bold billboard (B+C blend). `prefers-reduced-motion: reduce` → instant billboard.
3. **Layout (Approach A):** Desktop split-panel — form left / billboard right. Mobile stacks form → billboard → editorial casinos.
4. **Hero:** Compressed (shorter padding + tighter subtitle).
5. **Pool mode:** Segmented control — **Known total** | **Estimate** (replaces checkbox).
6. **More options:** Collapsed `<details>` (entry mix + multiple drawings).
7. **Editorial top 3:** Same ranking as homepage — `comparisons/sweepstakes-casinos` → `partnerSlugs.slice(0, 3)`. Auto-adjusts when homepage order changes.
8. **Cards:** Visually similar to homepage (logo, rank, score/stars, offer, claim + review, accent chrome).
9. **Logos:** Each pick uses that partner’s real homepage `img.card-logo` path under `/sweepstakeslogo/…` — no initials placeholders.
10. **Preserve:** Exact math engine, `method="dialog"` privacy (no URL leak), a11y (labels, live regions, error summary), honest certainty copy, geo `AffiliateLink`, compliance copy, coarse analytics only, verifiers in `scripts/verify-sweepstakes-odds*.ts`.

## Non-goals

- Changing ranking methodology or inventing a calculator-specific brand list
- Altering probability formulas or estimate assumptions (0.8× / 1.25×)
- Adding new analytics events beyond the three approved coarse events
