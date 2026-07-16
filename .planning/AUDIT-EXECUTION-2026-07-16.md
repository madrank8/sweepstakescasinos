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
| **8.3** FAQPage null-on-empty | Skip empty `mainEntity: []` | **DONE** (this pass) | `faqPageNode()` in `schema.ts`; wired on news/guides/states/best |
| **8.4** Author Person E-E-A-T | Person + knowsAbout/sameAs | **DONE** (honest scope) | `/author/ilija-milosevic/#person`; no fake `hasCredential` / Wikidata |
| **8.5** State spokes + verification badges + Legislation | 50-state template, badges, Legislation nodes | **PARTIAL → improved** | Legislation on news + key state spokes; review badges via `SITE_LEGAL_STATUS_VERIFIED_ON`; full 5-section enrichment still deferred |
| **8.6** Footer RG / NCPG / NPN / CCPA | Persistent compliance chrome | **PARTIAL → improved** | Trust ribbon + state-legality hub link to NCPG; CCPA “Do Not Sell” still OPEN |

---

## This pass (implement now)

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

### Out of scope this pass
- McLuck firsthand testing / evidence apply
- Softening all 14 overclaim reviews
- SweepDogs-style widgets / bonus estimators
- Expanding every state to PlayWithStakes 5-section depth
- Fake author credentials / Wikidata `subjectOf`
- Full CCPA opt-out page + cookie consent UI

---

## Remaining backlog (after this pass)

| Priority | Item | Notes |
| --- | --- | --- |
| P1 | Soften or evidence-gate 14 overclaim reviews | `testing:apply --soften-overclaims` / McLuck batch |
| P1 | Non-partner `/bonuses/` geo bypass (15 brands) | SITE-AUDIT critical |
| P1 | Rolla bonus wrong redirect | SITE-AUDIT critical |
| P2 | CCPA “Do Not Sell” footer + consent | Audit §7.4 / 8.6 |
| P2 | Deeper state spoke template (operators CPT, practical guidance) | Audit 8.5 steps 1–2 |
| P2 | Dataset schema on state-legality hub if missing pieces | Mostly done on tracker |
| P3 | AI citation tracking table | Competitor feature; not required |

---

## Verification

```bash
npm run schema:verify
npx tsx scripts/verify-schema-helpers.ts
npm run content:lint
npm run tracker:lint
# Optional if time: npm run build
```

Do **not** commit/push unless explicitly asked.
