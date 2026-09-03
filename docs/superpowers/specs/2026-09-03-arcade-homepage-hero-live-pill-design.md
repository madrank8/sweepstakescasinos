# Arcade Homepage Hero Live-Pill Design

**Date:** 2026-09-03
**Status:** Awaiting spec review
**Approved mockup:** option A on the original arcade hero (visual companion `hero-honesty-ab.html`)
**Base:** `main`

## Goal

Remove the unverifiable green live-status pill from the original arcade homepage hero. Keep every other hero element exactly as it is.

## Why this slice is separate

The approved cut is subtractive: delete one claim. Trust-pill cuts, the list **Live & Verified** tag, H1 ranking language, scores, offers, filters, and FAQ stay for later mockup-gated specs. The 10-card fold already on `main` does not change.

## Constraints (binding)

- Do not restore `src/routes/index.astro`. `/` stays the generator-wrapped `index.html`.
- Do not edit generated `src/pages/`.
- Do not restyle nav, hero, cards, fold control, or Claim Bonus chrome.
- Do not write new marketing copy. This slice deletes copy; it does not replace it. GLM 5.2 is not needed.
- No fabricated facts.
- Keep the 10-card fold, 28 cards in the DOM, and ItemList `#toplist` unchanged.

## Approved behavior

Delete this element from `index.html` and do not replace it:

```html
<div class="hero-live"><span class="hero-live-dot"></span> All Sweepstakes Sites Active — Verified July 2026</div>
```

Keep, unchanged:

- Arcade nav
- H1 `Best Sweepstakes Casinos 2026` / `SC Bonus Guide`
- Cyan subtitle `Claim Your Free SC at the Best Sweepstakes Sites Right Now`
- Existing hero body paragraph
- All five trust pills: Legal in USA, No Purchase Needed, Fast Redemptions Only, Expert Verified 2026, 20+ Sweeps Sites
- Section heading **Live & Verified** (later spec)
- Fold: first 10 cards, gold **Show all 28 casinos**

Leave unused `.hero-live` / `.hero-live-dot` rules in `style.css`. Do not restyle the hero to close the gap; the remaining H1 already sits in `.hero-inner`.

## Architecture

One authored markup deletion on `index.html`. The generator still wraps `/` with `prepareSsrAffiliateHtml(..., 'homepage')`. No JS, CSS, schema, or fold changes.

## Testing

- Keep: `scripts/verify-homepage.test.ts` original hero landmark and `Best Sweepstakes Casinos 2026` title; 28-card fold contract.
- Add: homepage source must not contain `All Sweepstakes Sites Active` or `Verified July 2026`; must still contain all five trust-pill labels and `<header class="hero">`.
- `npm run ci` must pass.

## Files

- Modify: `index.html` — delete the `.hero-live` div only.
- Modify: `scripts/verify-homepage.test.ts` — assert the live-pill strings are gone and the five pills remain.
- Do not modify: `style.css`, fold markup/JS, `src/routes/`, generated `src/pages/`, operator data.

## Out of scope

- Trust-pill removals (option B)
- H1 / subtitle / body rewrite
- **Live & Verified** on the rankings heading
- Rank badges, scores, offers, filters/schema, FAQ
- Review-page `.hero-live-pip` / `.hero-live-badge` chrome

## Gate

The served `/` still looks like the original arcade homepage, including the fold. The green “All Sweepstakes Sites Active — Verified July 2026” pill is gone. No other hero copy is added or rewritten.
