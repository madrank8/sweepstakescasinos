# Crown Coins — De-Duplication & Index-Readiness Plan

Status: PLAN (no destructive action taken yet — awaiting canonical decision)
Owner: editorial + dev
Updated: 2026-06-24

## Problem
Three Crown Coins review pages exist on one domain — a duplication / cannibalization
risk and a `scaled-content-abuse` signal if more than one is indexed:

1. `sweepsreviews/crown-coins-review.html` — current production review (gold template).
2. `sweepsreviews/crown-coins-review-pilot.html` — pilot rewrite (currently `noindex,follow`).
3. `sweepstakes-casino/crown-coins-review.html` — legacy duplicate (older blue template).

Only ONE Crown Coins review should be indexable. The pilot's `noindex` currently
contains the risk, but it must be resolved before any index flip.

## Decision needed (canonical target)
Pick the single indexable Crown Coins URL:
- **Option A (recommended):** keep `sweepsreviews/crown-coins-review.html` as canonical;
  fold the best pilot improvements (author EEAT, AI disclosure, calculator, methodology)
  back into it; retire the pilot.
- **Option B:** promote the pilot to production (rename pilot → `crown-coins-review.html`,
  flip to `index,follow`), archive the old one.
- **Option C:** keep both as distinct intents (NOT recommended — same entity, same query
  set → cannibalization).

## Execution steps (once canonical chosen)
1. **Canonical tags:** every non-canonical Crown Coins page gets
   `<link rel="canonical" href="<canonical-url>">` pointing at the chosen winner.
2. **Legacy duplicate** (`sweepstakes-casino/crown-coins-review.html`):
   - Preferred: 301 redirect → canonical (add to host redirect config / Vercel `redirects`).
   - Interim (static site): `<meta http-equiv="refresh">` + canonical (pattern already used
     by `sweepsreviews/our-mission.html`).
3. **Pilot:** keep `noindex,follow` until its content is either merged into the canonical
   (Option A) or it becomes the canonical (Option B). Never have two `index` Crown Coins pages.
4. **Internal links:** point all internal "Crown Coins review" links (footer, hub,
   `sweepsbonus/crown-coins-promo-code.html`) at the single canonical URL.
5. **Sitemap:** ensure only the canonical Crown Coins URL is in `sitemap.xml`
   (also fix the stale domain noted in the readiness plan).
6. **Verify:** after deploy, `curl -I` each non-canonical URL → expect redirect/canonical;
   confirm only one Crown Coins URL is `index`.

## Related
- `.planning/GOOGLE-LLM-READINESS-PLAN.md` (uniqueness P0, robots/sitemap domain fixes)
- Wiki: `syntheses/crown-coins-pilot-audit.md`, `[[scaled-content-abuse-threshold]]`
