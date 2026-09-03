# Arcade Homepage Hero Live-Pill Design

**Date:** 2026-09-03
**Status:** Awaiting spec review
**Approved mockup:** option 2 on `hero-pill-glm-copy.html` (original arcade hero, chrome unchanged)
**Approved copy:** GLM 5.2 line `Checked Against Official Operator Sites`
**Base:** `main`

## Goal

Keep the original arcade green live pill and pulsing dot. Replace only the inner sentence so it no longer claims uptime, a verification event, or July 2026.

## Why this slice is separate

The sentence is the honesty problem, not the chrome. Trust-pill cuts, the list **Live & Verified** tag, H1 ranking language, scores, offers, filters, and FAQ stay for later mockup-gated specs. The 10-card fold already on `main` does not change.

## Constraints (binding)

- Do not restore `src/routes/index.astro`. `/` stays the generator-wrapped `index.html`.
- Do not edit generated `src/pages/`.
- Do not restyle nav, hero, cards, fold control, Claim Bonus, or `.hero-live` / `.hero-live-dot`. Existing `text-transform: uppercase` and letter-spacing stay. Mobile wrap on this longer line is accepted; do not add CSS to prevent it.
- New marketing copy in this slice is the GLM 5.2 line below, verbatim. Do not rewrite it, shorten it, add a date, or substitute another model’s wording.
- No fabricated facts.
- Keep the 10-card fold, 28 cards in the DOM, and ItemList `#toplist` unchanged.

## What the approved sentence means

The 2026-09-02 `OFFICIAL_VERIFICATION_PASSES` entries are official-page fetches, not uptime checks and not a complete field-by-field audit. Many `verifiedFields` arrays are empty. `VERIFIED_DATES` is empty. The GLM line names that source check and must not be stretched in implementation or later copy to “verified,” “live,” “all sites active,” or a calendar date.

This slice does not claim that every homepage offer, score, or rank was confirmed against those official pages. Later honesty specs still own those surfaces.

## Approved behavior

In `index.html`, change only the text node inside the existing `.hero-live` div.

From:

```html
<div class="hero-live"><span class="hero-live-dot"></span> All Sweepstakes Sites Active — Verified July 2026</div>
```

To:

```html
<div class="hero-live"><span class="hero-live-dot"></span> Checked Against Official Operator Sites</div>
```

Keep, unchanged:

- The `.hero-live` wrapper and `.hero-live-dot` span
- Arcade nav
- H1 `Best Sweepstakes Casinos 2026` / `SC Bonus Guide`
- Cyan subtitle `Claim Your Free SC at the Best Sweepstakes Sites Right Now`
- Existing hero body paragraph
- All five trust pills: Legal in USA, No Purchase Needed, Fast Redemptions Only, Expert Verified 2026, 20+ Sweeps Sites
- Section heading **Live & Verified** (later spec)
- Fold: first 10 cards, gold **Show all 28 casinos**
- `style.css` `.hero-live` / `.hero-live-dot` / `pulse` rules

## Architecture

One authored text replacement on `index.html`. The generator still wraps `/` with `prepareSsrAffiliateHtml(..., 'homepage')`. No JS, CSS, schema, or fold changes.

## Testing

- Keep: `scripts/verify-homepage.test.ts` original hero landmark and `Best Sweepstakes Casinos 2026` title; 28-card fold contract in `scripts/verify-homepage-fold.test.ts`.
- Add: homepage source must contain the exact `.hero-live` markup with `Checked Against Official Operator Sites` and `.hero-live-dot`.
- Add: homepage source must not contain `All Sweepstakes Sites Active` or `Verified July 2026`.
- Keep asserting all five trust-pill labels and `<header class="hero">`.
- `npm run ci` must pass.

## Files

- Modify: `index.html` — replace the `.hero-live` text node only.
- Modify: `scripts/verify-homepage.test.ts` — assert the new sentence, the old sentence gone, chrome still present.
- Do not modify: `style.css`, fold markup/JS, `src/routes/`, generated `src/pages/`, operator data.

## Out of scope

- Deleting the pill
- Trust-pill removals
- H1 / subtitle / body rewrite
- **Live & Verified** on the rankings heading
- Rank badges, scores, offers, filters/schema, FAQ
- Review-page `.hero-live-pip` / `.hero-live-badge` chrome
- Styling the pill to avoid mobile wrap

## Gate

The served `/` still looks like the original arcade homepage, including the fold and the green pulsing pill. The pill reads **Checked Against Official Operator Sites** (uppercase in CSS). The old “All Sweepstakes Sites Active — Verified July 2026” sentence is gone. No other hero copy is added or rewritten.
