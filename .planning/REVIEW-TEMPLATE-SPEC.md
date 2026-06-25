# Canonical Review Page Template

**Reference file:** `sweepsreviews/crown-coins-review.html`  
**Live:** `https://sweepstakeslist.vercel.app/sweepsreviews/crown-coins-review.html`

## Rule

All `review-article` skill output must **fit this template**. Do not ship standalone review HTML from `output/review-articles/`. Duplicate the canonical file, preserve layout/CSS/JS/widgets, then rewrite copy and **add** sections only.

## Page anatomy (do not remove)

1. **Head** — title, meta, OG, Twitter, 3× JSON-LD (Review, FAQPage, BreadcrumbList), inline `<style>` (gold/royal theme)
2. **site-nav** — sticky nav + mobile toggle
3. **hero** — breadcrumb, tag-row, h1, hero-sub, 4-metric grid, hero-meta, hero-img-frame
4. **offer-zone** — offer-card (logo | body + chips | CTA column)
5. **page-wrap** — 2-col: article + sticky sidebar
6. **Article blocks (in order):**
   - verdict-box
   - h2 sections + prose
   - callout (good/warn)
   - payout-block (redemption matrix)
   - vip-feature
   - bonus-grid (4 cards)
   - games-grid
   - tp-block (Trustpilot)
   - src-tbl (source verification table)
   - pros-cons
   - jurisdiction / state callout
   - faq accordion
   - disclosure
7. **sidebar** — toc-panel + toc-nav + toc-cta
8. **sticky-bar** — bottom CTA bar (scroll-triggered)
9. **site-footer** — partials include
10. **Scripts** — nav toggle, FAQ accordion, sticky bar, TOC smooth scroll

## Skill additions (allowed, additive only)

- Author EEAT strip (extend hero-meta or insert after verdict-box)
- Redemption time estimator widget (new `.calc` block matching theme)
- Hands-on testing log / comparison infographic (new h2 + image, use existing `.callout` / `.payout-block` patterns)
- Extra FAQ items + FAQPage schema entries
- Updated `dateModified` when content substantively changes

## Pilot path convention

`sweepsreviews/<slug>-review-pilot.html` — skill test without replacing production review.

## Build

Mirrored HTML → `npm run generate:pages` → Astro route → Vercel `dist/`.
