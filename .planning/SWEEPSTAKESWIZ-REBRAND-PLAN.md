# Sweepstakes Wiz — Rebrand + Domain Launch Plan

**Project:** Sweepstakes Wiz (Astro / Vercel)
**Created:** 2026-06-29
**Status:** Planning — ready to execute
**Supersedes Phase 0 "Production domain" decision in** `GOOGLE-LLM-READINESS-PLAN.md`

---

## Locked decisions

| Item | Decision |
|------|----------|
| **Production domain** | `https://sweepstakeswiz.com` (apex canonical) |
| **Brand name** | **Sweepstakes Wiz** (full rebrand from "Sweepstakes Casinos List") |
| **alternateName (schema)** | `SweepstakesWiz.com` |
| **Migration type** | **Fresh start** — no live old domain to 301; no GSC change-of-address |
| **Old strings to retire** | `sweepstakeslist.vercel.app`, "Sweepstakes Casinos List", "SweepstakesCasinosList(.com)", "New Sweepstakes Casinos" (stale alt) |

**Scope measured in source (excl. build artifacts):**
- `sweepstakeslist.vercel.app` → **302 occ / 57 files** (domain swap — mechanical)
- "Sweepstakes Casinos List" → 74 occ / 33 files (brand-name swap — context-aware)
- "SweepstakesCasinosList" → 58 occ / 35 files
- "sweepstakescasinoslist" → 14 occ / 13 files (incl. logo filename)
- "New Sweepstakes Casinos" → 49 occ / 22 files (stale alt-name → kill)

---

## Brand identity (the "Wiz" angle)

| Element | Value |
|---------|-------|
| Name | Sweepstakes Wiz |
| Wordmark (nav) | `★ Sweepstakes` *Wiz* (reuse existing `.nav-brand`/`.star` styling) |
| Domain display | sweepstakeswiz.com |
| Positioning | The expert ("wiz") who *tests* sweeps casinos — leans into existing E-E-A-T author Ilija Milosevic and the hands-on redemption-testing differentiation already in the readiness plan |
| Tagline options | "We test sweeps casinos so you don't have to." / "The expert guide to US sweepstakes casinos." |
| Voice | Authoritative, tested-not-guessed, compliance-first (21+, no real-money, 1-800-GAMBLER ribbon stays) |

> Keyword-equity rule: "Sweepstakes Casinos List" was doing double duty as both a **brand** and a **keyword phrase**. On rebrand we keep the *keyword* and drop the *brand*: proper-noun brand uses → "Sweepstakes Wiz"; descriptive uses → lowercase generic ("our sweepstakes casino rankings", "the sweepstakes casino list below") so we don't lose topical relevance or look like the entity renamed mid-sentence.

---

## Phase A — Single source of truth (do FIRST)

Today the origin/brand is duplicated in `astro.config.mjs`, `src/lib/pageChrome.ts`, and `scripts/generate-astro-pages.mjs`, plus hardcoded in ~57 HTML files. Centralize so future moves are one-line.

- [ ] **A1.** Create `src/data/site.ts`:
  ```ts
  export const SITE = {
    origin: 'https://sweepstakeswiz.com',
    name: 'Sweepstakes Wiz',
    altName: 'SweepstakesWiz.com',
    logo: '/sweepstakeslogo/sweepstakeswiz.png',
    author: 'Ilija Milosevic',
    authorSlug: 'ilija-milosevic',
  } as const;
  ```
- [ ] **A2.** Refactor `pageChrome.ts` `ORIGIN`/`ORG_GRAPH` and `generate-astro-pages.mjs` `ORIGIN` to import from `SITE`.
- [ ] **A3.** Set `astro.config.mjs` `site: SITE.origin` (or the literal `https://sweepstakeswiz.com`).

---

## Phase B — Domain swap (mechanical, 302 refs)

These are canonicals, `og:url`, schema `url`/`@id`, breadcrumb items, sitemap, robots — all SHOULD be absolute, so swap the host only.

- [ ] **B1.** Scripted replace `https://sweepstakeslist.vercel.app` → `https://sweepstakeswiz.com` across source (`*.html`, `*.mdx`, `*.ts`, `*.mjs`, `*.js`, `*.xml`, `*.txt`), excluding `node_modules/dist/.vercel/.astro/output`.
- [ ] **B2.** Confirm internal *navigation* links are already root-relative (they are: nav, ribbon, footer use `/...`) — no change needed, domain-independent. ✅
- [ ] **B3.** Regenerate `sitemap.xml` + `robots.txt` via `npm run generate:pages` (ORIGIN now from `SITE`).
- [ ] **B4.** Grep gate: `0` residual `sweepstakeslist.vercel.app` in source.

---

## Phase C — Brand-name rebrand (context-aware)

Order matters: most-specific → least, to avoid partial clobbering.

- [ ] **C1.** `SweepstakesCasinosList.com` / `SweepstakesCasinosList` → `Sweepstakes Wiz` (wordmark, `alternateName`, OG).
- [ ] **C2.** "New Sweepstakes Casinos" (stale schema alt/brand) → remove or → "Sweepstakes Wiz".
- [ ] **C3.** "Sweepstakes Casinos List" as **brand** (title suffix, `og:site_name`, `meta author`, schema `name`, nav, footer ©) → "Sweepstakes Wiz".
- [ ] **C4.** "Sweepstakes Casinos List" as **descriptive phrase** in body copy → lowercase generic rewrite (keyword kept, brand implication removed). Manual review of the ~33 files.
- [ ] **C5.** `pageChrome.ts` `ORG_GRAPH`: `name`→Sweepstakes Wiz, `alternateName`→SweepstakesWiz.com, `logo.caption`→Sweepstakes Wiz, logo `url`→new asset.
- [ ] **C6.** Page titles/descriptions: rework so brand = "Sweepstakes Wiz", intent keyword "sweepstakes casinos" retained. Title template: `<Topic> | Sweepstakes Wiz`.

---

## Phase D — Assets

- [ ] **D1.** New logo `sweepstakeslogo/sweepstakeswiz.png` (square, ≥512px, used in schema `logo` + OG). Until a designed mark exists, a clean text-mark placeholder is acceptable.
- [ ] **D2.** OG/Twitter image refreshed with "Sweepstakes Wiz" (replaces `sweepstakescasinoslist.jpg` references in `og:image`/`twitter:image`).
- [ ] **D3.** Favicon set for new brand.
- [ ] **D4.** (Optional) Delete/rename old `sweepstakescasinoslist.jpg` once unreferenced.

---

## Phase E — Internal linking model (explicit ask)

Current nav/footer/ribbon links are clean and relative. Layer in a deliberate link graph so authority flows hub → money pages:

- [ ] **E1. Hubs → spokes.** Homepage + `/best/` best-of hub link to each review and each state page; reviews link back up to the hub (breadcrumb already does part of this).
- [ ] **E2. Review ↔ review.** Each review gets a "Compare with similar" block (3–5 contextual links to peer reviews / brand-vs-brand comparison pages).
- [ ] **E3. Review → bonus.** Review CTAs point to `/bonuses/<slug>/` (SSR geo gateway) with `rel="nofollow sponsored"` (compliance requirement, also keeps PageRank on editorial pages).
- [ ] **E4. State hub.** `/states/*` interlink to the legality hub and to brand reviews available in that state.
- [ ] **E5. Trust cluster.** `how-we-rate`, `editorial-policy`, `responsible-gaming`, `author/ilija-milosevic` cross-link from every money page (the trust ribbon already injects responsible-gaming + affiliate-disclosure + author sitewide). ✅
- [ ] **E6. Orphan sweep.** After rebrand, crawl `dist/` for pages with 0 inbound internal links; wire them into a hub.
- [ ] **E7. Breadcrumbs.** Ensure `BreadcrumbList` items use new absolute domain (covered by Phase B) and reflect real link paths.

---

## Phase F — SEO / discovery layer

- [ ] **F1. Canonicals** absolute + new domain on every indexable page (Phase B).
- [ ] **F2. `robots.txt`** sitemap line → `https://sweepstakeswiz.com/sitemap.xml`; keep `Disallow: /bonuses/`.
- [ ] **F3. `sitemap.xml`** regenerated, new domain, no dupes (generator already dedupes; verify).
- [ ] **F4. `llms.txt`** — still missing. Add `/llms.txt` (brand, purpose, key pages, citation policy, no-real-money framing) + optional AI-crawler allow policy in robots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended). Closes Phase 6 CONFIGURE of the readiness plan.
- [ ] **F5. Schema** Organization/WebSite reflect new name + `@id` rooted at new origin (Phase C5). Run Rich Results Test on homepage + 3 reviews.
- [ ] **F6. Social** `og:site_name`, `og:image`, `twitter:*` rebranded (Phase C/D).

---

## Phase G — Vercel domain config

- [ ] **G1.** Add `sweepstakeswiz.com` (+ `www`) as domains on the Vercel project; set **apex as primary**, `www → apex` 308 (or vice-versa — pick one canonical host).
- [ ] **G2.** DNS: apex A/ALIAS + `www` CNAME per Vercel instructions; verify SSL issued.
- [ ] **G3.** (Optional) `vercel.json` for any host-canonicalization redirects if not handled by dashboard.
- [ ] **G4.** Confirm SSR middleware (geo-suppression) still runs on the custom domain.

---

## Phase H — QA + launch

- [ ] **H1.** `npm run build` clean on Node ≥ 22.12.
- [ ] **H2.** Residual-string gates = 0 for: `sweepstakeslist.vercel.app`, `SweepstakesCasinosList`, "New Sweepstakes Casinos", brand-use "Sweepstakes Casinos List".
- [ ] **H3.** Spot-check rendered `dist/` head on homepage + 1 review + 1 bonus gateway: title, canonical, og:url, schema name all = Sweepstakes Wiz / sweepstakeswiz.com.
- [ ] **H4.** Internal-link validation (no links to old host; no 404s post-rebrand).
- [ ] **H5.** Lighthouse on homepage + 1 review.
- [ ] **H6.** Deploy to production domain.
- [ ] **H7.** GSC: add `sweepstakeswiz.com` property, verify, submit sitemap. (Fresh start — **no** change-of-address.)
- [ ] **H8.** Bing Webmaster Tools: add + submit sitemap.

---

## Execution order (dependency-aware)

```
A (source of truth)
  ↓
B (domain swap)  →  C (brand swap)  →  D (assets)
  ↓
E (internal links)  +  F (SEO/discovery)   [parallel]
  ↓
G (Vercel domain) → H (QA + launch)
```

## Suggested commits
1. `chore: centralize site/brand config (SITE) `
2. `chore: swap origin to sweepstakeswiz.com (canonicals, schema, sitemap, robots)`
3. `feat: rebrand publisher entity to Sweepstakes Wiz`
4. `assets: Sweepstakes Wiz logo, OG image, favicon`
5. `feat: internal-link model (hub↔review↔bonus, related-reviews)`
6. `feat: add llms.txt + AI-crawler policy`
7. `chore: Vercel domain + launch QA`
