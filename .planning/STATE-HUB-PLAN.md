# State Hub & CA/FL/NY Guide Batch — Research Plan

**Project:** Sweepstakes Wiz (`https://sweepstakeswiz.com`)  
**Created:** 2026-06-29  
**Status:** Planning — research complete, implementation not started  
**Scope:** State legality hub + California, Florida, New York state guides (no MDX creation in this phase)

---

## Wiki & skill grounding

This plan applies concepts from the Obsidian SEO wiki and MADRANKER skill stack:

| Concept / skill | Application here |
|-----------------|------------------|
| [[topical-authority]] | State legality is a **Core** cluster; hub + spokes prove entity coverage for US jurisdictions, sweepstakes law, and operator availability. |
| [[query-fan-out]] | Each state page covers fan-out branches in one pillar (legality verdict, dual-currency model, age, operator list, alternatives, FAQ) — not thin per-question URLs. |
| [[node-function-taxonomy]] | Hub = **Authority + Retrieval**; state guides = **Retrieval + Reinforcement**; FL guide also **Commercial** (affiliate CTAs allowed). CA/NY = **Retrieval only** (info-only suppression). |
| [[gap-analysis]] | SERP consensus mapped vs our geo-enforcement layer and Texas pilot. |
| [[information-gain]] | Differentiation must be provably ours: server-side geo suppression, `geo.ts` matrices, author testing — not restated Lines.com copy. |
| [[scaled-content-abuse-threshold]] | Batch must not ship 50 templated clones; hub index can be data-driven, guides must have state-specific legal research blocks. |
| [[chunk-extractability]] / `geo-aeo-layer` | 40–60 word answer capsules after question-shaped H2s; FAQPage schema where FAQs are on-page. |
| `topical-map-creation` (affiliate playbook) | Hub-spoke IA: pillar `/state-legality/` → state spokes → reviews → `/best/`. |
| `affiliate-compliance-igaming` | CA AB-831 / NY S5935A affiliate liability drives info-only posture; never promote dual-currency operators in banned states. |
| `content-brief-generator` | Each state guide gets a Sullivan-gated brief (`content_type: firsthand_review` or `infrastructure` for geo/compliance pages) before writing. |

**Research mode:** Manual (web search + page fetch). Volume/KD figures are **[ESTIMATED — no Ahrefs/DataForSEO pull in this session]**. SERP rankings characterized from June 2026 search results; treat as directional, not precise position data.

---

## 1. Executive recommendation

### Does a state hub make sense?

**Yes — with a hub-and-spoke architecture, not hub-only.**

**Evidence:**

1. **Hub queries** (`sweepstakes casino legality by state`, `sweepstakes casinos legal states`) are won by comprehensive **50-state index pages** — notably VegasInsider’s `/sweepstakes-casinos/legal-states/` (interactive map, status table, per-state deep sections) and secondary hubs from tech-insider.org, gamingamerica.com, track360.io. A single Texas spoke cannot capture hub intent.

2. **State queries** (`is sweepstakes legal in [state]`) are won by **dedicated state guides** — Lines.com (`/sweepstakes-casinos/states/{state}`), sweepedia.com, ibebet.com, rg.org — often alongside the hub pages. Google surfaces both page types; they serve different retrieval units ([[query-fan-out]] branches).

3. **Topical authority gap:** `GOOGLE-LLM-READINESS-PLAN.md` and `SWEEPSTAKESWIZ-REBRAND-PLAN.md` Phase E both flag state legality as a missing pillar. We have infrastructure (`geo.ts`, MDX collection, Texas pilot) but only one spoke and a hub missing the state grid.

4. **YMYL / compliance fit:** Our **server-side geo suppression** ([[information-gain]] asset competitors lack) makes a compliance-first legality hub a credible differentiator — especially for CA/NY where affiliate liability is statutory.

5. **AIO risk:** High for generic “is it legal?” answers ([[aio-risk-score]] likely **High** on hub; **Medium–High** on state pages). Mitigation: attribution-ready legal citations, visible update dates, and unique enforcement/geo data — not commodity verdict paragraphs.

### Proposed URL architecture

| URL | Role | Page type (`fn:`) | Notes |
|-----|------|-------------------|-------|
| `/state-legality/` | **Pillar hub** — 50-state index, legal framework, enforcement explainer | Authority + Retrieval | Evolve existing `state-legality.html` (or migrate to Astro route later) |
| `/states/texas/` | State guide (live) | Retrieval + Commercial | Benchmark; expand FAQ + AEO blocks |
| `/states/california/` | State guide (planned) | Retrieval | `legalStatus: info-only` |
| `/states/florida/` | State guide (planned) | Retrieval + Commercial | `legalStatus: available` |
| `/states/new-york/` | State guide (planned) | Retrieval | `legalStatus: info-only` |
| `/states/{slug}/` | Future spokes | Mixed | Slug = full state name kebab-case (`new-york`, not `ny`) — matches Texas |

**Do not** create alternate paths (`/california-sweepstakes-casinos/` etc.) — avoids cannibalization ([[cannibalization-review]]).

**Optional later:** `/guides/single-currency-sweepstakes/` cross-link from CA/NY guides (Lines.com ranks this; informational only for us in banned states).

---

## 2. Query map

### Hub cluster

| Priority | Primary keyword | Secondary / fan-out | Intent | Target URL |
|----------|-----------------|---------------------|--------|------------|
| P0 | sweepstakes casino legality by state | sweepstakes casinos legal states | Informational | `/state-legality/` |
| P1 | are sweepstakes casinos legal in the us | sweepstakes casino legal states 2026 | Informational | `/state-legality/` |
| P1 | sweepstakes casino banned states | states banning sweepstakes casinos 2026 | Informational | `/state-legality/` (tracker section) |
| P2 | sweepstakes casino state map | which states allow sweepstakes casinos | Informational | `/state-legality/` |

### California

| Priority | Primary keyword | Secondary / fan-out | Intent | Target URL |
|----------|-----------------|---------------------|--------|------------|
| P0 | is sweepstakes legal in california | are sweepstakes casinos legal in california | Informational | `/states/california/` |
| P0 | california sweepstakes casinos | sweepstakes casinos california 2026 | Mixed (post-ban) | `/states/california/` |
| P1 | california ab 831 sweepstakes | ab 831 sweepstakes casino ban | Informational | `/states/california/` |
| P1 | card crush california legal | single currency sweepstakes california | Informational | `/states/california/` (alternatives section — **no affiliate CTA**) |
| P2 | california social casino legal | gold coins only california | Informational | `/states/california/` |

### Florida

| Priority | Primary keyword | Secondary / fan-out | Intent | Target URL |
|----------|-----------------|---------------------|--------|------------|
| P0 | is sweepstakes legal in florida | are sweepstakes casinos legal in florida | Informational | `/states/florida/` |
| P0 | sweepstakes casinos florida | best sweepstakes casinos florida | Commercial | `/states/florida/` + `/best/` |
| P1 | florida sweepstakes casino law | florida statute 849.094 sweepstakes | Informational | `/states/florida/` |
| P1 | florida hb 189 sweepstakes | florida sweepstakes ban 2026 | Informational | `/states/florida/` (legislative status) |
| P2 | florida online casino legal | florida social casino | Informational | `/states/florida/` |

### New York

| Priority | Primary keyword | Secondary / fan-out | Intent | Target URL |
|----------|-----------------|---------------------|--------|------------|
| P0 | is sweepstakes legal in new york | are sweepstakes casinos legal in new york | Informational | `/states/new-york/` |
| P0 | new york sweepstakes casinos | sweepstakes casinos ny 2026 | Mixed | `/states/new-york/` |
| P1 | ny sb 5935a sweepstakes | new york sweepstakes casino ban | Informational | `/states/new-york/` |
| P1 | new york sweepstakes alternatives | legal online casinos new york | Informational | `/states/new-york/` |
| P2 | card crush new york | horseplay giddyup new york legal | Informational | `/states/new-york/` (alternatives — info only) |

### Texas (benchmark — existing)

| Primary | Secondary | URL |
|---------|-----------|-----|
| is sweepstakes legal in texas | sweepstakes casinos texas, texas online casino legal | `/states/texas/` |

**Confidence:** Keyword priority ordering is **[ESTIMATED]** from SERP result density, news recency (CA/NY bans), and population/commercial logic. Validate with Ahrefs in tool-assisted mode before production.

---

## 3. Competitive gap analysis

### Who ranks (June 2026 snapshot)

| Query cluster | Typical top rankers | Dominant format |
|---------------|---------------------|-----------------|
| Hub / by-state | VegasInsider, tech-insider.org, gamingamerica.com, track360.io | 50-state hub + table/map + long scroll |
| CA | Lines.com, rg.org, calbizjournal.com, VegasInsider hub section | State guide + ban explainer + alternatives |
| FL | Lines.com, sweepedia.com, ibebet.com, VegasInsider | State guide + operator list + legal cite |
| NY | Lines.com, rg.org, covers.com (news), VegasInsider | State guide + SB 5935A tracker + alternatives |
| TX | Lines.com, sweepedia.com, ibebet.com, RotoWire | State guide + operator roundup |

**SERP features observed [ESTIMATED]:** AI Overviews on several “is it legal” queries (synthesized ban/legal-gray answers); PAA boxes (“Can you still play…?”, “What replaced…?”); FAQ rich results on Lines.com state pages; news cards for CA/NY ban legislation; limited video.

**Page-type verdict:** **Hub + dedicated state pages both required.** Hub alone loses long-tail state intent; state pages alone lose “all states” and internal linking scale.

### Top 3 competitors — what they do that we don’t

| Competitor | Strength | Our gap |
|------------|----------|---------|
| **Lines.com** | Deep state URL program (`/sweepstakes-casinos/states/*`); geo-aware offerwall; SB/AB trackers; heavy FAQ schema; commercial CTAs in available states | No CA/FL/NY pages; hub lacks state grid; no tracker pages |
| **VegasInsider** | Massive 50-state hub with interactive map, status badges, per-state narrative blocks (~800 lines) | Our hub lists 10 banned states only + one Texas link |
| **rg.org / Covers (news)** | Primary-source legal citations, news freshness on ban bills | We cite laws in hub but lack state-level attribution blocks and dated legislative timelines |

### What we can differentiate

| Asset | Why it matters |
|-------|----------------|
| **Enforced geo-suppression** | Documented, server-side — not just editorial “check your state.” Unique trust signal for YMYL. |
| **`geo.ts` + partner matrices** | Auto-generated “available operators in {state}” lists tied to live affiliate data — with honest suppression in CA/NY. |
| **Compliance-first CA/NY posture** | Info-only in AB-831 / S5935A states while explaining *why* we don’t promote — contrasts with competitors pushing gray-area alternatives. |
| **Hands-on testing (Ilija Milosevic)** | Redemption logs, KYC screenshots on reviews linked from FL/TX guides ([[information-gain]]). |
| **Single author E-E-A-T** | Author byline + link to `/author/ilija-milosevic/` on every guide. |
| **Fail-closed unknown region** | Explain `SUPPRESS_WHEN_REGION_UNKNOWN` policy — transparency competitors skip. |

### What not to copy

- Lines.com’s aggressive Card Crush / single-currency promotion in CA/NY (regulatory fluidity; our site bans affiliate CTAs there anyway).
- VegasInsider’s 50-state boilerplate paragraphs (scaled-content risk per [[google-scaled-content-policy]]).
- “Florida Department of Agriculture regulates sweepstakes casinos” claim (Lines.com) — verify before citing; likely overstated. Use primary sources only.

---

## 4. Page templates & content spec (state guides)

Extend `src/content/states/texas.mdx` + `src/routes/states/[slug].astro`. Add optional `faq` to states schema (mirror guides collection) in a future implementation phase.

### Frontmatter (per `content.config.ts`)

```yaml
stateCode: CA | FL | NY
title: "Are Sweepstakes Casinos Legal in {State}? ({Year} Guide)"
description: ≤160 chars; verdict-first
legalStatus: info-only | available
updated: ISO date
draft: false
# future: faq: [{ q, a }]
```

### On-page structure

| # | Section | H1/H2 | AEO block | Required for |
|---|---------|-------|-----------|--------------|
| 0 | **Verdict capsule** | — (lead paragraph) | 40–60 words, declaration-first: legal status + effective date | All |
| 1 | H1 | `Are Sweepstakes Casinos Legal in {State}? ({Year} Guide)` | — | All |
| 2 | Quick facts table | — | Status, min age, affiliate offers on-site, # operators, key statute | All |
| 3 | How the model works | `Why sweepstakes casinos are different from real-money gambling` | 40–60 words on dual-currency / no purchase necessary | All (shorten on 2nd+ state via cross-link to hub) |
| 4 | **State law & enforcement** | `What {State} law says about sweepstakes casinos` | Cite statute + effective date + named source link | All — **primary information-gain section** |
| 5 | Operator availability | `Which sweepstakes casinos are available in {State}?` | Auto-list from template (reviews links only; no affiliate on page) | FL, TX; CA/NY get “info only” notice |
| 6 | Age & eligibility | `Who can play in {State}?` | 18+ vs 21+ per operator norms | All |
| 7 | Redemptions / limits | `Prizes and redemptions in {State}` | State-specific if known (e.g., FL $5k/mo cite — **verify primary source**) | FL, TX |
| 8 | Legislative outlook | `Is {State} likely to ban sweepstakes casinos?` | Dated timeline | FL (HB 189 failed Mar 2026); optional CA/NY |
| 9 | Legal alternatives | `Legal gaming options in {State}` | Lottery, tribal, sportsbook, ADW, gold-coin-only social | CA, NY (required); FL (brief) |
| 10 | FAQ | `Frequently asked questions` | 5–8 PAA-derived Q&As | All |
| 11 | Disclaimer + RG | — | Not legal advice; 1-800-GAMBLER | All |

### FAQ candidates (from PAA / SERP synthesis)

**California:** Is sweepstakes gambling legal in California after AB 831? · Can Californians still play sweepstakes casinos? · What is Card Crush and is it legal in CA? · Are social casinos with Gold Coins only legal? · Does AB 831 affect players or only operators?

**Florida:** Are sweepstakes casinos legal in Florida in 2026? · Did Florida ban sweepstakes casinos? · What is Florida Statute 849.094? · Can Florida players redeem Sweeps Coins for cash? · What happened to HB 189?

**New York:** Are sweepstakes casinos illegal in New York? · When did NY ban sweepstakes casinos? · Can NY players use Stake.us or McLuck? · What is SB 5935A? · Are players prosecuted or only operators?

**Texas (retrofit):** Mirror above pattern; add Penal Code Ch. 47 three-element test FAQ.

### Schema types

| Type | Where |
|------|-------|
| `BreadcrumbList` | Via `ContentLayout` (Home → State Legality → {State}) |
| `FAQPage` | State guides with on-page FAQ section |
| `WebPage` + `dateModified` | Match visible “Last updated” |
| `Organization` publisher | Sitewide graph |
| **Avoid** | `Article` with fabricated `author` ratings; `HowTo` for gambling signup |

### AEO iGaming vetoes (from readiness plan)

| Veto | Guardrail |
|------|-----------|
| I1 | No “sign up now” / transactional language in answer capsules |
| I2 | Say “redeem prizes” not “win real money gambling” |
| I3 | Every guide opens with legality verdict + disclaimer |
| I4 | No affiliate links on state pages; reviews linked editorially only |

### Internal links (each state guide)

**Out:** `/state-legality/` · `/how-we-rate/` · `/responsible-gaming/` · `/legal/affiliate-disclosure/` · `/author/ilija-milosevic/` · 3–5 `/reviews/{slug}/` (availability-filtered) · `/best/` (FL, TX only) · `/guides/what-are-sweepstakes-casinos/` (if indexed)

**In (after publish):** Hub state grid · Footer/nav (existing) · Review pages (“Available in your state” → state guide) · Homepage trust cluster

---

## 5. Hub page redesign spec (`/state-legality/`)

Evolve `state-legality.html` into a true **50-state pillar** without waiting for all spokes.

### New / expanded sections

1. **Hero** — Keep; update brand to Sweepstakes Wiz consistently.
2. **Verdict capsule** — “Sweepstakes casinos are available in most US states, but at least 10 states restrict dual-currency platforms as of 2026…” (40–60 words).
3. **Interactive-style state grid** (can be static HTML table at v1):
   - Columns: State · Site status · Operator availability · Guide link · Last reviewed
   - **Site status** sourced from `SITE_BANNED_STATES` in `geo.ts`:
     - `Info-only (affiliate suppressed)` — CA, NY, MT, CT, NV, NJ, LA, MI, ID, WA
     - `Offers shown` — all others (subject to per-partner rules)
   - **Operator availability** — count of `AFFILIATE_PARTNERS` passing `isPartnerAvailableInState` (computed at build time if migrated to Astro; manual v1 acceptable for launch batch)
   - **Guide link** — link if MDX exists; “Coming soon” otherwise
4. **How sweepstakes law works nationally** — existing content, tighten.
5. **2026 legislative tracker** — table: State · Bill · Status · Effective date (CA AB-831 ✓, NY S5935A ✓, FL HB 189 failed, IN/Oklahoma scheduled — cite track360.io / primary sources).
6. **Enforcement on this site** — existing geo section (strong differentiator — keep prominent).
7. **Detailed state guides** — card list linking to `/states/*/`; sorted by priority population.
8. **FAQ** — hub-level PAA: How many states allow sweepstakes casinos? · Which states banned them in 2026? · Is it legal to *play* vs *promote*?

### Data binding (implementation note for future phase)

```ts
// Pseudocode — build-time generation from existing modules
import { SITE_BANNED_STATES, isPartnerAvailableInState } from './geo';
import { US_STATES, ALL_US_STATE_CODES } from './usStates';
import { AFFILIATE_PARTNERS } from './affiliates';
```

Do **not** duplicate state lists in HTML — single source of truth prevents drift.

### Hub schema

- `FAQPage` if FAQ section added
- `BreadcrumbList`: Home → State Legality
- Consider `ItemList` for state guide links (only when ≥3 guides live)

---

## 6. IA / internal linking

```
                    ┌─────────────────┐
                    │    Homepage     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐  ┌───────────┐  ┌─────────────┐
       │ /best/ hub │  │/state-    │  │ /guides/    │
       └─────┬──────┘  │ legality/ │  └──────┬──────┘
             │         └─────┬─────┘         │
             │               │               │
             │         ┌─────┴─────┐         │
             │         ▼           ▼         │
             │    /states/ca   /states/fl  ...
             │         │           │
             └─────────┴───────────┘
                       │
                       ▼
                /reviews/{slug}/
                       │
                       ▼
                /bonuses/{slug}/  (geo-gated SSR; nofollow)
```

**Rules (Phase E rebrand plan):**

- Every state guide links up to hub + down to ≥3 reviews (where allowed).
- Every review mentions state hub (many already do — e.g. Pulsz, Crown Coins).
- FL/TX guides link to `/best/`; CA/NY do not (info-only).
- Breadcrumbs on all state pages (already in `[slug].astro`).
- Add hub link from `what-are-sweepstakes-casinos.mdx` (already present).
- Post-batch orphan sweep: ensure new states appear in sitemap + hub grid.

---

## 7. CA / FL / NY specifics

Cross-checked against `src/data/geo.ts` and `src/data/affiliates.ts` (June 2026 repo snapshot).

### California (CA)

| Dimension | Detail |
|-----------|--------|
| **Site geo layer** | `SITE_BANNED_STATES` — **info-only**, all affiliate CTAs suppressed |
| **Statute** | AB-831 (signed Oct 11, 2025; effective **Jan 1, 2026**) — bans dual-currency online sweepstakes games; liability extends to **media affiliates** |
| **Operator posture** | All 13 reviewed partners list CA in `restrictedStates` |
| **Player liability** | Statute targets operators/promoters; players not primary enforcement target (per rg.org synthesis — verify in bill text) |
| **Alternatives** | CA State Lottery; tribal casinos (in-person); gold-coin-only social (no SC redemption); Card Crush (single-currency — **we describe, do not promote**) |
| **Content angle** | Post-ban explainer + affiliate compliance story + “what we show CA visitors” |
| **legalStatus** | `info-only` |

### Florida (FL)

| Dimension | Detail |
|-----------|--------|
| **Site geo layer** | **Not** site-banned — affiliate CTAs allowed |
| **Operator posture** | FL absent from all partners’ `restrictedStates` — **all 13 partners available** (including Card Crush’s CA/NY-only model: Card Crush **not** available in FL) |
| **Legal posture** | Operates in gray area; promotional sweepstakes framework; **no 2026 ban enacted** (HB 189 / SB 1580 failed Mar 13, 2026) |
| **AG activity** | Subpoenas to operators reported (Uthmeier) — monitor |
| **Age** | 18+ typical; verify per operator (some competitors claim 21+ — document per brand terms) |
| **Content angle** | Commercial guide + legislative “status quo holds” freshness + operator list |
| **legalStatus** | `available` |

### New York (NY)

| Dimension | Detail |
|-----------|--------|
| **Site geo layer** | `SITE_BANNED_STATES` — **info-only** |
| **Statute** | S5935A / Ch. 605 (signed **Dec 5, 2025**; immediate effect) — bans dual-currency online sweepstakes games; affiliate liability |
| **Operator posture** | All 13 partners restrict NY; Card Crush is `availableOnlyInStates: ['CA','NY']` but site still suppresses affiliate CTAs in NY |
| **Enforcement** | AG cease-and-desist letters (Jun 2025, 26 operators cited in secondary sources) |
| **Alternatives** | NY Lottery; licensed sportsbooks; ADW (Horseplay, GiddyUp); contested single-currency platforms — **informational only** |
| **Content angle** | Enforcement timeline + SB 5935A plain-language summary + why we suppress offers |
| **legalStatus** | `info-only` |

### Texas (benchmark)

- `available`; template exists; retrofit FAQ + quick facts + legislative H2 when batch ships.

---

## 8. Rollout order & priority matrix

### Batch 1 (this plan): CA, FL, NY + hub upgrade

| Order | State | Rationale | Commercial value | Effort |
|-------|-------|-----------|------------------|--------|
| 1 | **Hub redesign** | Unlocks indexing for all state queries; links spokes | Trust / retrieval | Medium (HTML + data table) |
| 2 | **Florida** | 3rd-largest state; **full affiliate monetization**; failed ban = timely; all operators available | **High** | Medium (reuse TX shell + FL law research) |
| 3 | **California** | Largest ban-market search interest; AB-831 news cycle; compliance differentiator | Info-only (SEO/AEO) | High (statute depth, alternatives nuance) |
| 4 | **New York** | Large population; S5935A + AG enforcement story; pairs with CA legally | Info-only | High |
| 5 | **Texas retrofit** | Align benchmark with new template (FAQ, quick facts, AEO) | High | Low |

### Batch 2 (recommended next)

| Tier | States | Why |
|------|--------|-----|
| P1 available + large | Ohio, Illinois, Pennsylvania, Georgia, North Carolina | Population + commercial |
| P1 banned / complex | Washington, Michigan, New Jersey, Connecticut | Match `SITE_BANNED_STATES`; high “is it legal” intent |
| P2 | Indiana (Jul 2026 ban), Oklahoma (Nov 2026), Louisiana, Montana | Scheduled bans — tracker freshness |

### Priority matrix (population × intent × fit)

```
                    Commercial intent
                         ↑
           FL ●          │         TX ● (done)
                         │
    CA ●    NY ●         │    OH ●  IL ●
    (info)  (info)       │
                         │
    WA ● MI ● NJ ●       │
    (info)               │
                         └────────────────→ Restriction complexity
```

**CA/FL/NY over other states:** Explicitly named in readiness plan; FL monetizes; CA/NY capture highest post-ban query volume; all four (with TX) cover the largest US markets.

---

## 9. Effort estimate

| Work item | Template reuse | Net-new research | Writer hours [EST.] |
|-----------|----------------|------------------|---------------------|
| Hub redesign | 40% (existing copy) | 50-state data bind, tracker table | 4–6h |
| Florida guide | 70% (TX shell) | FL statute, HB 189 status, AG subpoenas | 3–4h |
| California guide | 50% | AB-831 deep dive, alternatives section, primary citations | 5–7h |
| New York guide | 50% | S5935A, AG letters, alternatives | 5–7h |
| Texas retrofit | 80% | FAQ + quick facts + schema | 1–2h |
| Schema/FAQ/AEO pass | — | geo-aeo-layer audit per page | 2–3h |
| Internal linking sweep | — | Reviews + hub + sitemap | 2h |
| **Total batch** | | | **~22–31h** |

**Per future state (after template stable):** 2–4h available states; 4–6h banned/complex states.

**Quality gates before publish (each page):**

- `content-score` / `algorithmic-authorship-gate`
- `geo-aeo-layer` AUDIT ≥ 80, zero iGaming vetoes
- `affiliate-compliance-igaming` pass
- SERP overlap < 30% vs top 3 (manual or content-consensus-mapper)
- Primary-source citation for every legal claim

---

## 10. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **YMYL / legal advice** | High | Prominent disclaimer; cite statutes; “verify with operator”; author credentials |
| **Stale law** | High | Visible `updated` date; quarterly tracker review; `dateModified` only on substantive edits |
| **Scaled-content / thin templates** | High | State-specific law sections mandatory; no 50-page batch with swapped state name only ([[scaled-content-abuse-threshold]]) |
| **AIO displacement** | Medium | Unique geo-enforcement + operator matrix; attribution-ready claims ([[share-of-model]]) |
| **Cannibalization hub vs states** | Medium | Hub targets plural/map queries; states target “{state} legal” — distinct titles/H1s |
| **Card Crush / single-currency promotion in CA/NY** | Medium | Describe neutrally; no affiliate CTA; note regulatory uncertainty |
| **Competitor factual errors** | Medium | Do not parrot Lines.com FL “Dept of Agriculture” claim without verification |
| **Card Crush in geo data** | Low | Partner exists for CA/NY only but site bans all affiliates there — template must respect `isStateBannedSitewide` over partner availability |

---

## 11. Success metrics

### Google Search Console (first 90 days post-index)

Track impressions/clicks/position for:

- `sweepstakes casino legality by state`
- `sweepstakes casinos legal states`
- `is sweepstakes legal in california / florida / new york / texas`
- `sweepstakes casinos {state}`
- `{state} ab 831` / `sb 5935a` / `florida sweepstakes ban`

### Rich results

- FAQ rich results on CA, FL, NY, TX URLs (Rich Results Test)
- Valid `BreadcrumbList` on all state pages

### AEO / LLM

- `geo-aeo-layer` MEASURE Share of Model on hub + 4 state queries (ChatGPT, Perplexity, Google AI Mode)
- Update `/llms.txt` when hub + batch live — add state hub + guide URLs under “Key pages” ([[llms-txt]])

### Business / compliance

- Zero affiliate CTA renders in CA/NY on state pages (manual geo QA via Vercel preview headers)
- Indexation: 5 new/updated URLs in sitemap; no orphan state guides

### Leading indicators (30 days)

- Hub grid live with ≥4 guide links
- Internal links from ≥10 review pages to relevant state guide
- Pilot page passes AEO audit ≥ 80

---

## 12. Implementation checklist (future phase — not in scope now)

- [ ] Content briefs: `california-brief.md`, `florida-brief.md`, `new-york-brief.md` via `content-brief-generator`
- [ ] MDX: `src/content/states/{california,florida,new-york}.mdx`
- [ ] Extend states schema with optional `faq[]` if not inlined in MDX
- [ ] Hub: 50-state table + tracker + FAQ
- [ ] Texas MDX retrofit
- [ ] Sitemap + `llms.txt` update
- [ ] GSC URL inspection after deploy

---

## Appendix A — SERP research notes (June 2026)

**Method:** WebSearch + fetched competitor pages. No Ahrefs MCP in this session.

| Query | Notable URLs | Format | Depth |
|-------|--------------|--------|-------|
| is sweepstakes legal in california | lines.com/states/california, rg.org, vegasinsider.com/legal-states | State guide + hub | AB-831 analysis, operator exit dates, alternatives |
| sweepstakes casinos california | Same + calbizjournal.com | News + guide | Ban timeline, market size stats |
| is sweepstakes legal in florida | lines.com/states/fl, sweepedia.com, ibebet.com | State guide + listicle | Statute cite, operator tables, HB 189 context |
| is sweepstakes legal in new york | lines.com/states/ny, rg.org | State guide | S5935A, AG enforcement, alternatives |
| is sweepstakes legal in texas | lines.com/states/tx, sweepedia.com | State guide | Penal Code 3-element test, operator list |
| sweepstakes casino legality by state | vegasinsider.com/legal-states, tech-insider.org | **Hub** dominates | 50-state table, map, long-form |

**SERP feature summary [ESTIMATED]:** AI Overviews present on several legality queries; PAA common; FAQ schema on Lines.com; Reddit/discussion less dominant than affiliate/editorial sites.

**Confidence:** **Medium** on page-type and competitor identification; **Low** on exact rankings and search volume.

---

## Appendix B — Related repo files

| File | Role |
|------|------|
| `state-legality.html` | Current hub (placeholder guides section) |
| `src/content/states/texas.mdx` | Only state guide |
| `src/routes/states/[slug].astro` | Template + partner list logic |
| `src/content.config.ts` | States collection schema |
| `src/data/geo.ts` | `SITE_BANNED_STATES`, suppression logic |
| `src/data/usStates.ts` | State names/codes |
| `src/data/affiliates.ts` | Per-partner `restrictedStates` |
| `.planning/GOOGLE-LLM-READINESS-PLAN.md` | Topical map gap (CA/FL/NY/TX) |
| `.planning/SWEEPSTAKESWIZ-REBRAND-PLAN.md` | Phase E interlinking |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-29 | Initial research plan created |
