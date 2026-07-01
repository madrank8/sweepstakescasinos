# Sweepstakes Wiz — Site Audit

**Date:** 2026-06-30  
**Scope:** Full codebase audit — compliance, trust, SEO, performance, architecture  
**Build status:** ✅ Passes on Node ≥ 22.12 (`npm run ci` with `verify:availability` + `testing:verify` + `build`)

---

## Executive summary

The **compliance architecture for the 13 affiliate partners is production-ready**: Gemified gateway, geo middleware, CTA suppression, and automated verification all pass. SEO foundations (schema, sitemap, robots, llms.txt) are strong.

The biggest gaps are:

1. **Editorial trust** — 14 reviews still contain unverified hands-on claims; only Crown Coins (1/28) has applied first-party testing.
2. **Compliance holes** — 15 non-partner brands have `/bonuses/` CTAs that bypass geo suppression entirely.
3. **Data bug** — `bonuses/rolla.html` redirects to a WOW Vegas affiliate URL.

Fix the Rolla redirect immediately. Then either soften overclaims or accelerate the testing rollout before the next deploy.

---

## What's working well

| Area | Status | Notes |
|------|--------|-------|
| Build pipeline | ✅ | `generate:pages` → Astro SSR build completes cleanly |
| 13 affiliate partners | ✅ | Gateway, geo middleware, CTA suppression verified by `verify:availability` |
| SEO foundation | ✅ | Per-page Review/FAQ/Breadcrumb schema; auto `sitemap.xml`; AI-crawler-friendly `robots.txt` + `llms.txt` |
| Testing pipeline | ✅ | Scaffold → verify → apply workflow designed; Crown Coins pilot proves end-to-end |
| E-E-A-T pages | ✅ | Author, how-we-rate, editorial policy, affiliate disclosure indexed |
| CI | ✅ | GitHub Actions on Node 22: availability + testing verify + build |

---

## Critical — fix before publishing

### 1. Unverified hands-on claims (14 reviews)

Only **Crown Coins** (1/28) has applied first-party testing. **14 brands** are flagged `overclaimFlag: true` in `src/data/testingBrands.ts` but still carry language like:

| Brand | Example overclaim language |
|-------|---------------------------|
| Rolla | "14-Day Live Review", "14-day hands-on test" |
| Big Pirate | "We tested… hands-on" |
| Sweepico | "Full hands-on expert review — everything tested and verified" |
| Splash Coins | "Payouts Tested" title/claims |
| Acebet, Casino Click, DexyPlay, FreeSpin | "We tested" in meta descriptions |
| WOW Vegas, Sweet Sweeps, Crown Coins (pre-apply body) | Specific payout-speed claims presented as verified |

**Risk:** E-E-A-T / FTC exposure — editorial claims presented as first-party testing without evidence.

**Fix options:**

```bash
# Option A: Soften overclaims on all flagged brands now
npm run testing:apply -- --soften-overclaims --slug rolla
# Repeat per brand, or add a batch script

# Option B: Complete testing for Batch 1 partners first
npm run testing:scaffold
# Testers fill evidence/testing-results.csv, then:
npm run testing:apply -- --slug mcluck
```

**Also:** Crown Coins pilot PNGs in `testing/crown-coins/` are **smoke-test placeholders** per `evidence/README.md`. Replace with real redacted screenshots before publishing.

---

### 2. Non-partner pages bypass geo compliance (15 brands)

These reviews link to `/bonuses/{slug}/` but are **static prerendered** — no geo suppression in CA, NY, WA, etc.:

```
acebet, big-pirate, dexyplay, freespin, high5, jackpot-go, jackpota,
lucky-bunny, mega-bonanza, rolla, spinfinite, splash-coins, sweepico,
sweet-sweeps, wow-vegas
```

**Why:** SSR/geo only activates when HTML contains a **partner** slug (`isAffiliatePage()` in `scripts/generate-astro-pages.mjs`). Non-partners skip that path and render as `prerender = true`.

Each non-partner also has a **static bonus interstitial** under `bonuses/{slug}.html` with a raw third-party tracking URL — outside the Gemified gateway chokepoint in `src/lib/bonusGateway.ts`.

**Fix:** Either:

- Remove `/bonuses/` CTAs from non-partner reviews (info-only editorial), **or**
- Route all bonus clicks through a generic gateway that checks `SITE_BANNED_STATES` before any redirect, **or**
- Extend SSR + suppression to any page containing `/bonuses/` links regardless of partner status

---

### 3. Wrong affiliate redirect on Rolla bonus page

`bonuses/rolla.html` meta-refreshes to a **WOW Vegas** URL:

```
url=https://wlwowvegas.adsrv.eacdn.com/C.ashx?btag=a_1983b_21c_&affid=436&siteid=1983&adid=21&c=mega
```

Users clicking "Claim Bonus" on the Rolla review land on the wrong operator. Likely a mirror copy-paste error.

**Action:** Audit all 15 non-partner `bonuses/*.html` interstitials for correct destination URLs.

---

## High priority — compliance & trust

### 4. Incomplete testing anchor markers

| Review | Markers present | Missing |
|--------|-----------------|---------|
| Most reviews (26/28) | 6/6 | — |
| `reviews/rolla.html` | 4/6 | `testing:meta`, `testing:faq-produced` |
| `reviews/sweepico.html` | 3/6 | `testing:meta`, `testing:payout-tested`, `testing:faq-produced` |

**Fix:** Run `npm run testing:anchors` on incomplete reviews before applying results.

---

### 5. Card Crush is effectively info-only everywhere

Partner allowlist = **CA + NY only** (`availableOnlyInStates`), but both are in `SITE_BANNED_STATES` (`src/data/geo.ts`). CTAs never render in any jurisdiction.

`verify:availability` flags this:

> Card Crush: available in 2 state(s) but ALL are site-banned → CTA never renders (info-only everywhere).

**Action:** Editorial copy on the Card Crush review and state pages should reflect info-only status.

---

### 6. CI doesn't enforce overclaim cleanup

`testing:verify` passes with 1/28 complete and no requirement that overclaim-flagged reviews be softened. The gate is soft by design (CSV optional).

**Recommendation:** Add a CI step that fails if overclaim-flagged review HTML still matches patterns in `OVERCLAIM_PATTERNS` (`src/lib/testingFragments.ts`), e.g.:

```bash
# Proposed — not yet implemented
npm run testing:verify-overclaims
```

---

## Medium priority — architecture & maintainability

### 7. Missing `scripts/verify-content.ts`

Referenced in `src/content.config.ts` for MDX `partnerSlug` validation at author time. File does not exist.

**Impact:** Low today (`src/content/reviews/` is empty). Will matter when MDX review migration starts.

---

### 8. README is stale

`README.md` still references:

- Domain: `sweepstakescasinoslist.com` (actual: `sweepstakeswiz.com`)
- `build.format: "preserve"` (actual: `directory`)
- Primary workflow via `astro:dev` (actual: hybrid SSR with `output: 'server'`)

---

### 9. State hub coverage: 4/51

MDX state pages exist only for **CA, FL, NY, TX** (`src/content/states/`). Broader coverage planned in `.planning/STATE-HUB-PLAN.md`.

---

### 10. MDX review migration not started

- `src/content.config.ts` defines a `reviews` collection schema
- `src/content/reviews/` is empty (`.gitkeep` only)
- All 28 reviews remain monolithic HTML (~1,500–2,000 lines each with duplicated inline CSS)

---

## Performance & polish

### 11. `@vercel/analytics` installed but unused

Listed in `package.json` dependencies; never imported in `src/`. Wire into Astro layout or remove.

---

### 12. Per-review inline CSS duplication

Each of 28 reviews embeds a full themed `<style>` block. No shared review CSS bundle — hurts cache efficiency and increases HTML weight.

---

### 13. No image optimization

- Homepage: mix of JPEG and WebP logos; no `srcset`
- No Astro `<Image>` component or CDN transforms
- Testing gallery uses `loading="lazy"` (good) but not all images have explicit dimensions

---

### 14. `partials/include.js` adds extra requests

Homepage and trust pages fetch nav + footer via `fetch()` with `cache: 'no-cache'` — two requests on every page load. Review pages inline chrome at build time; homepage does not.

**Fix:** Inline nav/footer at build time for homepage and trust pages.

---

### 15. Duplicate / dead font preconnect

Homepage loads mirrored fonts from `/_external/fonts.googleapis.com/` but still has `preconnect` to `fonts.googleapis.com` and duplicate stylesheet links.

---

### 16. Local dev Node version mismatch

- `package.json` engines: `>=22.12`
- Default shell may be Node 20 (Astro 7 refuses to build)
- CI uses Node 22 ✅

**Fix:** Add `.nvmrc` with `22`.

---

## Testing rollout status

Generated from `npm run testing:status` on 2026-06-30:

| Status | Count | Brands |
|--------|-------|--------|
| ✅ Hands-on complete | 1 | crown-coins |
| ○ Pending | 27 | All others |

**Batch breakdown:**

- **Batch 1 (partners, priority):** crown-coins ✓, casino-click, spinblitz, mcluck, pulsz, hello-millions, legendz, playfame, spree, thrillzz, zula, roxymoxy, card-crush
- **Batch 2 (non-partners + overclaims):** rolla, wow-vegas, sweet-sweeps, splash-coins, sweepico, big-pirate, dexyplay, freespin, acebet, high5, jackpot-go
- **Batch 3:** mega-bonanza, spinfinite, jackpota, lucky-bunny

---

## Affiliate partner vs non-partner matrix

### 13 partners (SSR + geo-gated)

```
mcluck, pulsz, casino-click, spinblitz, hello-millions, crown-coins,
legendz, playfame, spree, thrillzz, zula, roxymoxy, card-crush
```

- Bonus gateway: `src/pages/bonuses/[slug].astro` (SSR)
- Static interstitials skipped at build for partner slugs
- CTA suppression via `prepareSsrAffiliateHtml()` + `Astro.locals.usState`

### 15 non-partners (static, ungated)

See §2 above. Static `bonuses/{slug}.html` interstitials still generated and served.

---

## Recommended action order

| Priority | Action | Effort | Owner |
|----------|--------|--------|-------|
| 🔴 P0 | Fix `bonuses/rolla.html` redirect | 5 min | Dev |
| 🔴 P0 | Soften overclaims on 14 flagged reviews | 1–2 hrs | Dev/editorial |
| 🔴 P0 | Replace Crown Coins placeholder screenshots | Tester task | Testing team |
| 🟠 P1 | Geo-gate or strip CTAs on 15 non-partners | 2–4 hrs | Dev |
| 🟠 P1 | Roll out Batch 1 partner testing | Tester sprint | Testing team |
| 🟠 P1 | Complete testing anchors (rolla, sweepico) | 30 min | Dev |
| 🟡 P2 | Add CI overclaim gate | 1 hr | Dev |
| 🟡 P2 | Add `.nvmrc`, fix README | 30 min | Dev |
| 🟡 P2 | Inline nav/footer at build; wire Vercel Analytics | 2 hrs | Dev |
| 🟢 P3 | State hub expansion (46 remaining states) | Ongoing | Content |
| 🟢 P3 | MDX review migration | Ongoing | Dev/content |
| 🟢 P3 | Shared review CSS bundle | 2–4 hrs | Dev |

---

## Verification commands

```bash
# Full CI gate (requires Node ≥ 22.12)
npm run ci

# Individual checks
npm run verify:availability   # Affiliate data + geo matrix
npm run testing:status        # Testing rollout progress
npm run testing:verify        # CSV + evidence validation

# Build (requires Node 22+)
nvm use 22
npm run build
```

---

## Related docs

- `.planning/TESTING-TEAM-BRIEF.md` — Tester protocol
- `.planning/STATE-HUB-PLAN.md` — State page expansion
- `.planning/SWEEPSTAKESWIZ-REBRAND-PLAN.md` — Domain rebrand
- `.planning/GOOGLE-LLM-READINESS-PLAN.md` — AEO/LLM crawler strategy
- `evidence/README.md` — Evidence storage and apply workflow

---

*Audit performed 2026-06-30. Re-run after major changes to reviews, affiliate data, or testing rollout.*
