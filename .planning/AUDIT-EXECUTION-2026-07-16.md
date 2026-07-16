# Audit Execution Plan — 2026-07-16

> Synthesizes remaining work from the July 15 external audit (`~/Downloads/audit_report.md`) vs the live SweepstakesWiz codebase. Path corrections: real routes are `/states/[slug]/`, `/news/...`, `/author/ilija-milosevic/` (not audit’s `/casino/` or `/about/ilija-milosevic/`).

**Goal:** Close the highest-ROI unfinished P1 audit items that are code-ready now, without starting McLuck firsthand testing, wholesale overclaim rewrites, SweepDogs widgets, or full 50-state template expansion.

**Architecture:** Extend existing `@graph` helpers in `src/lib/schema.ts` + page chrome in `src/lib/pageChrome.ts` / review SSR pipeline. Ground dates in `src/data/geo.ts` verification notes and tracker freshness — never invent credentials or Wikidata IDs.

**Tech stack:** Astro 7, TypeScript, JSON-LD via `buildPageGraph`, static HTML reviews via `affiliateHtml` / `staticHtml`.

---

## Status matrix (audit §8 Actions)

| Action | Audit ask | Status | Evidence / next step |
| --- | --- | --- | --- |
| **8.1** llms.txt + CC-BY legality API | `/llms.txt`, JSON/CSV | **DONE** | `public/llms.txt`; `/sweepstakes-tracker/api/legality.json` + `.csv` + Dataset schema |
| **8.2** Connected 4-layer schema graph | Org/WebSite/@id + Review wiring | **DONE** (core) | `src/lib/schema.ts`, `pageChrome.ts`; AggregateRating nesting still follow reader-report gate |
| **8.3** FAQPage null-on-empty | Skip empty `mainEntity: []` | **DONE** (pass 1) | `faqPageNode()` in `schema.ts`; wired on news/guides/states/best |
| **8.4** Author Person E-E-A-T | Person + knowsAbout/sameAs | **DONE** (honest scope) | `/author/ilija-milosevic/#person`; no fake `hasCredential` / Wikidata |
| **8.5** State spokes + verification badges + Legislation | 50-state template, badges, Legislation nodes | **IMPROVED** (pass 3) | 8 MDX states on 5-section canonical; tracker-only states get same shell; badge mid-page anchors for chrome-light reviews |
| **8.6** Footer RG / NCPG / NPN / CCPA | Persistent compliance chrome | **DONE** (pass 2) | Trust ribbon + NCPG; CCPA “Do Not Sell” footer + `/legal/do-not-sell/` opt-out page |

---

## Pass 1 (committed `07ed468`) — Legislation / badges / FAQ hygiene

### P1-A — Legislation schema
- Add `legislationNode()` to `src/lib/schema.ts` using Schema.org `legislationLegalForce` (not audit’s nonstandard `legislationStatus`).
- Wire into legislation news (`src/routes/news/[slug].astro` + frontmatter) and state spokes when bills are known (`src/routes/states/[slug].astro`).
- Source facts only from existing news/source URLs (AB-831, S5935A, SB 555, SB 1235, A5447). No invented Q-ids.

### P1-B — Date-stamped legal-status badge on reviews
- Expose `SITE_LEGAL_STATUS_VERIFIED_ON` from `src/data/geo.ts` (`2026-07-09` — already documented as the SITE_BANNED_STATES check date).
- Inject “Legal status last verified: YYYY-MM-DD” on review HTML via SSR/static review pipelines; link to `/sweepstakes-tracker/` + `/state-legality/`.

### P1-C — Quick hardening
- `faqPageNode()` returns `null` when FAQ list empty; use on news/guides/states/best emitters.
- Trust ribbon: `1-800-GAMBLER` → `https://www.ncpgambling.org/`.

---

## Pass 2 (committed `b44d1b1`) — CCPA / Card Crush / non-partner geo / overclaim gate

| Item | Status | Evidence |
| --- | --- | --- |
| CCPA “Do Not Sell” footer + opt-out page | **DONE** | `legal/do-not-sell.html`; link in `partials/footer.html` + all review Legal columns via `update-review-chrome.mjs`; privacy policy cross-link |
| Card Crush info-only copy | **DONE** | `reviews/card-crush.html` — CTAs replaced with INFO ONLY; hero/verdict/restricted-box/pros/JSON-LD clarify sitewide info-only (CA/NY both site-banned) |
| Non-partner `/bonuses/` geo bypass (15 brands) | **DONE** | `editorialOutbound.ts` + `resolveBonusGateway` handles non-partners; `suppressAffiliateCtas` strips non-partner CTAs in banned/unknown regions; `generate-astro-pages.mjs` SSR-gates any page with `/bonuses/` CTAs and skips all static `bonuses/*.html` |
| CI overclaim gate | **DONE** | `npm run testing:verify-overclaims` (`scripts/verify-overclaims.ts`); wired into `package.json` `ci`. Flagged reviews already clean of `OVERCLAIM_PATTERNS` (soften was no-op) |

### Out of scope (unchanged)
- McLuck firsthand testing / evidence apply
- Softening narrative beyond pattern gate (flags remain for human testing priority)
- SweepDogs-style widgets / bonus estimators
- Expanding every state to PlayWithStakes 5-section depth
- Fake author credentials / Wikidata `subjectOf`
- Full cookie consent UI (opt-out page is request-based, not a CMP)

---

## Pass 3 (this session) — State 5-section + badge polish + crawl interlinks

| Item | Status | Evidence |
| --- | --- | --- |
| 5-section canonical on 8 MDX state spokes | **DONE** | Quick answer → Regulatory specifics → Operators → Practical guidance → FAQs (template); Texas reordered to match |
| Tracker-only state shell aligned | **DONE** | `src/routes/states/[slug].astro` emits same section order for non-MDX states |
| Legality badge mid-page for chrome-light reviews | **DONE** | `legalStatusBadge.ts` fallbacks: restricted-box → author-eeat → verdict-box → answer-capsule → offer-card → main → body; CSS contrast polish |
| `/guides/are-sweepstakes-casinos-legit/` discovery | **DONE** | Already in `sitemap.xml`; footer Guides col; guides hub “next”; state-legality intro; how-to-redeem; RoxyMoxy compare block |
| RoxyMoxy cluster interlinks | **DONE** | Title/meta already strong; reciprocal compare links from Splash Coins + Spree; footer Top Reviews (site + 15 review footers); legit guide link on review |

### Still out of scope
- McLuck / partner firsthand testing evidence
- Clearing `overclaimFlag` without evidence
- SweepDogs widgets
- Full CMP / cookie-consent UI (skipped — larger than this pass)
- Inventing 50 new deep state guides

---

## Remaining backlog

| Priority | Item | Notes |
| --- | --- | --- |
| P1 | McLuck / partner firsthand testing evidence | Needs human auth/tester — do not start in agents |
| P1 | Clear or re-test `overclaimFlag` after real evidence | Gate enforces language; flags still mark testing priority |
| P2 | Dataset schema polish on state-legality hub if gaps remain | Mostly done on tracker |
| P3 | AI citation tracking table | Competitor feature; not required |
| P3 | Cookie consent CMP UI | Optional beyond CCPA request page |
| P3 | Remaining review footers without Top Reviews col | 13 chrome-light reviews still lack sf-col Top Reviews; SSR badge now anchors on verdict-box |

---

## Verification

```bash
npm run verify:availability
npm run testing:verify-overclaims
npm run schema:verify
npm run content:lint
npm run tracker:lint
# Optional if time: npm run build
```
