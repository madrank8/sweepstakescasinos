# Google + LLM Readiness Plan

**Project:** Sweepstakes Casinos List (Astro / Vercel)  
**Created:** 2026-06-23  
**Status:** Planning — not started  
**Last updated:** 2026-06-23

---

## Project context (locked decisions)

| Item | Status |
|------|--------|
| **Build type** | New Astro build — **not** a mirror of old production |
| **Old site** | `https://sweepstakescasinoslist.com` is **not** the reference or target |
| **Deploy** | Connected to Vercel |
| **Content uniqueness** | **Current content is NOT unique** — treat as P0 content risk |
| **Source of truth** | This repo + what Vercel deploys |

---

## Executive summary

The site has usable raw material (reviews, partial FAQ schema, some affiliate disclosures, JSON-LD on many pages) but is **not launch-ready** for Google traffic or LLM citations.

**Core problem:** Non-unique, commodity content. Technical SEO on duplicate SERP-rehash pages will index clones faster, not earn rankings or citations.

**Secondary problems:** Infrastructure drift from old build, duplicate URL paths, missing AI-discovery layer.

| Area | Current state | Risk |
|------|---------------|------|
| Content originality | SERP-consensus rehash; template sameness | Information gain = 0; scaled-content risk |
| URL architecture | ~21 reviews at **two paths** | Duplicate content / cannibalization |
| Domain / canonicals | Mixed relative URLs; old domain in schema/sitemap | Indexation chaos |
| `robots.txt` | Sitemap → `classroom70x.com` | Wrong sitemap to Google |
| `llms.txt` | Missing | LLM crawlers lack site map + policy |
| Trust / compliance | Partial disclosures; key trust pages `noindex` | YMYL / FTC exposure |
| Build | Astro 7 needs Node ≥ 22.12 | Vercel OK; local Node 20 fails |

---

## Skill stack (MADRANKER arsenal)

Use these skills during execution — do not improvise generic SEO advice.

| Phase | Primary skills |
|-------|----------------|
| Orchestration | `website-orchestrator`, `classifier-os` |
| Single-page audit | `page-seo-aeo-audit`, `page-audit` |
| Uniqueness / quality | `content-score`, `content-consensus-mapper`, `algorithmic-authorship-gate`, `clutter-score-gate` |
| Content production | `content-brief-generator`, `seo-blog-generator`, `semantic-content-engine`, `ai-writer` |
| Schema | `schema-markup-generator` |
| LLM / AEO | `geo-aeo-layer`, `retrieval-arbitration-os` |
| Compliance | `affiliate-compliance-igaming`, `ai-disclosure-pipeline`, `reputation-abuse-firewall` |
| Strategy | `topical-map-creation`, `serp-analyzer` |
| Measurement | `drift-detect`, `geo-aeo-layer` MEASURE mode |
| **Review production (project)** | `review-article` — `.cursor/skills/review-article/` (friend's skill; multimedia HTML reviews with Playwright screenshots, EEAT author, schema, interactive widgets) |

Wiki references: `information-gain`, `scaled-content-abuse-threshold`, `chunk-extractability`, `llms-txt`, `share-of-model`, `six-super-systems`.

---

## Execution order

```
Phase 0: Decisions
    ↓
Phase U: Uniqueness audit          ← P0 (content)
    ↓
Phase C: Content rebuild strategy  ← P0 (content)
    ↓
Phase R: Pilot rewrites (×3)
    ↓
Phase Q: Quality gates (pilots)
    ║
Phase 1: Technical P0              ← parallel after canonical path chosen
    ↓
Phase 2: IA + topical map
Phase 3: Compliance + trust
Phase 4: On-page SEO (batch)
Phase 5: Schema entity graph
Phase 6: AEO / LLM layer
Phase 7: Scale remaining pages
Phase 8: Launch + measure
```

**Rule:** Do not push for Google/LLM traffic until pilot pages pass uniqueness + quality gates.

---

## Phase 0 — Decisions (block everything else)

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Production domain | Vercel preview vs custom domain | Set `site` in `astro.config.mjs` + all absolute URLs to actual deploy domain |
| Canonical review path | `/sweepsreviews/` vs `/sweepstakes-casino/` | Pick **one**; 301 or remove the other (21 duplicate filenames today) |
| Promo path | `/sweepsbonus/` (22 pages) | Keep; link from reviews with `rel="nofollow sponsored"` |
| Trust pages | `how-we-rate`, `our-mission`, `responsible-gaming` currently `noindex` | **Index** methodology + responsible gaming for E-E-A-T |
| Brand entity | "SweepstakesCasinosList" vs "New Sweepstakes Casinos" | Unify publisher name across title, schema, footer |

**Deliverable:** `SITE-DECISIONS.md`

**Open questions:**
- [ ] Production domain?
- [ ] Canonical review folder?
- [ ] Index trust pages?
- [ ] Top 5 commercial review priorities?
- [ ] First-party test data available (accounts, redemptions, screenshots)?
- [ ] AI assistance disclosure level?

---

## Phase U — Uniqueness audit (P0)

**Goal:** Classify every page by uniqueness tier before rewriting.

### U.1 Mechanical dedup scan

- [ ] Hash/compare `sweepsreviews/` vs `sweepstakes-casino/` pairs (expect ~100% match on 21 reviews)
- [ ] Intra-template similarity across reviews (shared paragraphs, FAQ patterns)
- [ ] Promo pages (`sweepsbonus/`) — unique vs recycled from reviews

### U.2 SERP overlap scan (sample: homepage + 5 reviews)

For each URL vs top 3 competitors:

- [ ] % verbatim / near-verbatim overlap
- [ ] Facts on SERP without first-party proof on our page
- [ ] Sub-topics competitors cover that we don't

### U.3 Tier assignment

| Tier | Definition | Action |
|------|------------|--------|
| **T0 — Kill** | Exact duplicate of another URL on this site | 301 to canonical OR delete |
| **T1 — Commodity** | >70% SERP overlap, no first-party data | Full rewrite required |
| **T2 — Partial** | Some unique sections | Surgical rewrite + original blocks |
| **T3 — Keep** | Genuine first-party testing | Light edit + schema/AEO only |

**Deliverable:** `UNIQUENESS-AUDIT.md`

---

## Phase C — Content rebuild strategy (P0)

### What makes reviews actually unique (information gain)

| Asset | Example |
|-------|---------|
| Hands-on redemption log | "Redeemed 50 SC via Skrill on [date]; received in 14h" |
| Account screenshots | KYC flow, cashier limits, bonus credit |
| Structured test matrix | Redemption speed, min SC, methods, pass/fail |
| Same-tester comparison | "Crown Coins vs WOW Vegas tested same week" |
| State legality callout | Banned states with verification date |
| Methodology-linked scores | Score tied to named `how-we-rate` criteria |

### Scaled-content safe floors (per page)

Per Google scaled-content policy + wiki gates:

- **>30% net-new prose** vs current draft AND vs SERP consensus
- **≥1 section only we can write** (test log, comparison, original table)
- **≥3 attributable first-party citations** (test date, screenshot, methodology)
- Run `ai-disclosure-pipeline` — honest AI assistance disclosure
- **No** `dateModified` bumps without substantive edits (AEO veto V6)

### Production model

1. Define **3 master templates**: Review | Promo | Trust/editorial
2. **Pilot 3 pages** (homepage + 1 review + 1 promo)
3. **Gate pilots** before scaling (see Phase Q)
4. Batch rollout by commercial priority

### Duplicate paths

Until content is unique: **do not index both** `sweepsreviews/` and `sweepstakes-casino/`. Rewrite one copy only.

---

## Phase R — Pilot rewrites (×3)

Recommended pilots:

1. **Homepage** — unique hub angle, not another generic top-20 list
2. **Crown Coins review** — strong Trustpilot data; good schema baseline
3. **One promo page** — commercial compliance template

Each pilot must include at least one information-gain asset from Phase C.

---

## Phase Q — Quality gates (pilots must pass)

- [ ] `content-score` CES pass
- [ ] `algorithmic-authorship-gate` pass
- [ ] `geo-aeo-layer` AUDIT ≥ 80, **zero vetoes**
- [ ] `affiliate-compliance-igaming` pass
- [ ] SERP overlap **< 30%** vs top 3 competitors
- [ ] `clutter-score-gate` pass (homepage especially)

### AEO iGaming vetoes to avoid

| Veto | Issue |
|------|-------|
| I1 | Transactional language in AI-targeted answer blocks |
| I2 | "Win real money" / "gambling" on sweepstakes content |
| I3 | Missing state legality disclosure |
| I4 | Affiliate links without prominent FTC disclosure |

---

## Phase 1 — Technical P0 (after canonical path chosen)

### Crawl / index signals

- [ ] Fix `robots.txt` sitemap URL (`classroom70x.com` → production domain)
- [ ] Regenerate `sitemap.xml` from current inventory (dedupe, new domain)
- [ ] Auto-generate sitemap in `prebuild`
- [ ] Absolute canonicals on every indexable page
- [ ] Fix relative `og:url` values
- [ ] Pin `engines.node` ≥ 22.12 in `package.json`

### Duplicate content

- [ ] Resolve 21 shared review basenames between folders
- [ ] 301 non-canonical path via Vercel config
- [ ] Align cross-folder canonicals

### Astro / deploy

- [ ] Update `astro.config.mjs` `site` to production domain
- [ ] Verify `npm run build` → `dist/` on Node 22+
- [ ] Vercel: build command `npm run build`, output `dist/`

**Gate:** GSC URL inspection — homepage + 3 reviews return 200, correct canonical, no duplicate.

---

## Phase 2 — Information architecture

### Page inventory (~82 HTML sources → 78 Astro routes)

| Type | Count | Role |
|------|-------|------|
| Homepage | 1 | Hub |
| Casino reviews | ~21 (+ dupes) | Money pages |
| Promo codes | 22 | Commercial / long-tail |
| Editorial / trust | 6 (mostly noindex) | E-E-A-T |
| Misc | `sweepstakes/jackpota-promo-code` | Orphan risk |

### Topical map gaps

- [ ] Pillar: best sweepstakes casinos 2026
- [ ] State legality hub (CA / FL / NY / TX minimum)
- [ ] Brand vs brand comparison pages
- [ ] "How sweepstakes casinos work" explainer

**Deliverable:** topical map with node functions; no orphan promo pages.

---

## Phase 3 — Trust, compliance, YMYL

### FTC / affiliate

- [ ] Visible FTC disclosure above the fold on every money page
- [ ] `rel="nofollow sponsored"` on all affiliate CTAs
- [ ] Dedicated indexed Affiliate Disclosure page
- [ ] State legality + "no purchase necessary" where required

### Re-index trust pages

Currently `noindex` + `robots.txt` Disallow:

- `how-we-rate`, `our-mission`, `responsible-gaming`, `contact`, legal pages

- [ ] **Index:** `how-we-rate`, `responsible-gaming`, `our-mission`
- [ ] Keep `noindex`: contact, privacy, terms (optional)
- [ ] Remove `robots.txt` Disallow for indexed trust pages

### AI disclosure

- [ ] `ai-disclosure-pipeline` AUDIT
- [ ] Visible reviewer methodology + last-tested dates on reviews

---

## Phase 4 — On-page SEO (batch, post-pilot)

Per page (`page-seo-aeo-audit`):

- [ ] Title: brand + intent + year
- [ ] Unique meta description ≤ 160 chars
- [ ] Single H1; logical H2/H3
- [ ] Keyword hygiene (flag >10 exact-match per 1k words)
- [ ] Internal links: hub ↔ review ↔ promo
- [ ] Image alt, lazy loading
- [ ] Remove dead `SearchAction` schema on homepage

**Batch order:** Homepage → top 5 reviews → remaining reviews → promos → trust pages.

---

## Phase 5 — Schema & entity graph

- [ ] One `Organization` publisher with stable `@id`
- [ ] `WebSite` → `publisher` link
- [ ] Review schema aligned with visible ratings
- [ ] `FAQPage` only where FAQs are on-page
- [ ] `BreadcrumbList` with absolute URLs
- [ ] Real `dateModified` only after substantive edits
- [ ] Unify brand: publisher name, `author.url`, footer

**Gate:** Rich Results Test clean on 3 review URLs.

---

## Phase 6 — AEO / LLM citation layer

Order: **CONFIGURE → AUDIT → OPTIMIZE** (`geo-aeo-layer`).

### CONFIGURE

- [ ] `/llms.txt` — purpose, key pages, citation policy
- [ ] Optional `/llms-full.txt`
- [ ] AI crawler policy in `robots.txt` (recommend allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended)
- [ ] Link `llms.txt` from site

### AUDIT + OPTIMIZE (per page type)

- 40–60 word answer blocks after H2s
- Question-shaped headings
- Entity disambiguation on first mention
- Attribution-ready claims (source + date + link)
- Visible "Updated" + matching `dateModified`
- Verdict capsule, quick facts table, standardized FAQ

**Gate:** 3 pilots ≥ 80 CITATION-READY, zero vetoes.

---

## Phase 7 — Scale

- [ ] Roll pilot templates to remaining reviews (commercial priority order)
- [ ] Promo pages (lighter pass)
- [ ] Trust/editorial pages (unique, not boilerplate)

---

## Phase 8 — Launch + measure

### Pre-launch

- [ ] Lighthouse (homepage + 1 review)
- [ ] Mobile / CTA check
- [ ] Internal link validation post-redirect
- [ ] Submit sitemap in GSC

### Post-launch monitoring

| Tool | Purpose |
|------|---------|
| Google Search Console | Index, CTR, queries |
| `classifier-os` Quick Audit | Monthly super-system health |
| `geo-aeo-layer` MEASURE | Share of Model on target queries |
| `drift-detect` | Volatility after launch |

**SoM baseline queries:**

- best sweepstakes casinos 2026
- [brand] review
- [brand] promo code
- is [brand] legit
- fastest redemption sweepstakes casino

---

## Priority matrix

| Priority | Work |
|----------|------|
| **P0** | Uniqueness audit + kill internal dupes |
| **P0** | Pilot 3 rewrites with information gain |
| **P1** | Technical SEO (on canonical unique URLs only) |
| **P1** | Compliance + indexed trust pages (unique content) |
| **P2** | Schema + entity graph |
| **P2** | AEO layer (`llms.txt`, answer blocks) |
| **P3** | Scale remaining pages |
| **P3** | Share of Model measurement |

---

## First sprint checklist

1. [ ] Uniqueness audit — tier all pages; confirm internal dup %
2. [ ] Pick canonical path + production domain → `SITE-DECISIONS.md`
3. [ ] Rewrite 1 review with real information gain
4. [ ] Rewrite homepage with unique hub angle
5. [ ] Technical pass on those 2 URLs only
6. [ ] Gate check — then decide batch velocity

---

## Known repo issues (snapshot 2026-06-23)

- `astro.config.mjs`: `site` still points at old domain
- `robots.txt`: sitemap → `https://classroom70x.com/sitemap.xml`
- `sitemap.xml`: old domain URLs; duplicate entries (e.g. rolla-casino-review ×2)
- 21 reviews duplicated across `sweepsreviews/` and `sweepstakes-casino/`
- No `llms.txt`
- Trust pages: `noindex` + robots Disallow
- Brand split: "SweepstakesCasinosList" vs "New Sweepstakes Casinos"
- Node 20 local fails Astro 7 build (needs ≥ 22.12)
- `mirror-report.json`: stale crawl artifacts from old site — not authoritative

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-23 | Initial plan created |
| 2026-06-23 | Added: new build context (old site irrelevant) |
| 2026-06-23 | Added: content NOT unique — elevated to P0; reordered phases |
| 2026-06-23 | Installed project skill `review-article` from `review-article.skill` |
| 2026-06-23 | Pilot review live at `/pilot/crown-coins-review.html` (original `sweepsreviews/crown-coins-review.html` unchanged) |
