# Direct-Competitor Analysis + Content Strategy to Outperform — 2026-07

**Site:** Sweepstakes Wiz (`https://sweepstakeswiz.com`) · **Author of plan:** SEO agent
**Created:** 2026-07-08 · **Status:** Strategy — research complete, execution not started
**Data:** Live Ahrefs MCP (DR) + DataForSEO Labs (domain/keyword/SERP/backlinks) + our GSC baseline.
**Raw metrics:** [`competitor-data/2026-07-08-competitor-metrics.md`](competitor-data/2026-07-08-competitor-metrics.md)
**Anchors:** [`GSC-INSIGHTS-2026-07-08.md`](GSC-INSIGHTS-2026-07-08.md) · [`gsc-baselines/2026-07-08.md`](gsc-baselines/2026-07-08.md) · [`SEO-CONTENT-PIPELINE.md`](SEO-CONTENT-PIPELINE.md) · [`STATE-PAGE-TEMPLATE.md`](STATE-PAGE-TEMPLATE.md) · [`STATE-HUB-PLAN.md`](STATE-HUB-PLAN.md)

> **Wiki + skill grounding.** Read `WIKI-SCHEMA.md` + `index.md` first (done). This plan applies
> [[gap-analysis]], [[topical-authority]], [[information-gain]], [[query-fan-out]],
> [[chunk-extractability]], [[scaled-content-abuse-threshold]], [[share-of-model]] and the skills
> `competitor-content-consensus` / `serp-consensus-analyser`, `modern-topical-mapper`,
> `content-brief-generator`, `geo-aeo-layer`, `algorithmic-authorship-gate`, `seo-blog-generator`.
> `[ESTIMATED]` marks any figure without a live pull. Money: DataForSEO = dollars, Ahrefs = cents
> (no Ahrefs money pulled).

---

## TL;DR — the one-paragraph thesis

The niche is **declining across the board** (−18% to −96% YoY on every commercial term) because of the
2025–26 state bans, so winning is about **taking share, not riding growth.** Our primary direct
competitor **SweepsKings** (DR 63, ~128.6k organic visits/mo, ~8,170 keywords) wins on **breadth**:
~350 review/alternative URLs, a live **no-deposit tracker**, a **"new casinos" freshness hub**, a
**news** section, and a **community forum** — all monetized and all built on a **large but spammy
backlink base** (spam score 50; 95% nofollow; TLDs dominated by `.online/.xyz/.site`). We have the
opposite profile: **depth and trust** (28 rigorous reviews, honest tiered evidence, moderated reader
reports, server-side geo-enforcement, connected `@graph` schema, a YouTube channel) but **near-zero
breadth and zero commercial-hub rankings** (DR 0, ~5 clicks). The play is **not** to out-spam them on
thin reviews. It is to (1) **build the 5 high-value format hubs they monetize that we completely lack**
(new-casinos hub, no-deposit/free-SC tracker, brand-alternatives cluster, payout-speed guide, promo hub),
(2) **selectively expand brand coverage to trending/new operators** where navigational demand is huge and
difficulty is tiny (their #1 page — "american luck casino" — is SV **90,500 at KD 3**, a brand we don't
even cover), and (3) **weaponize E-E-A-T + AEO/GEO** to win the AI-Overview / PAA citations that thin,
spam-linked competitors cannot defend — while their weak, spammy link profile means we can outrank them
per-page with a handful of genuinely earned links.

---

## 1. Competitor landscape

**Confirmed via the live `best sweepstakes casinos` SERP (US, 2026-07-08)** — these are the sites that
actually rank for our target head term (excluding the casinos themselves, Reddit, YouTube, Trustpilot,
and parasite/big-media placements like deadspin.com and al.com).

| Competitor | Type | DR | ~Organic KW | ~Organic traffic/mo (ETV) | Positioning / notable strength |
|---|---|---|---|---|---|
| **sweepskings.com** ⭐ | Pure-play sweeps review/affiliate | **63** | 8,170 | **~128,576** | **Primary rival.** #2 for head term. ~350 review URLs; no-deposit tracker; "new casinos" hub; news; forum. Breadth + freshness. |
| lines.com | Gambling media, deep sweeps vertical | 56 | 55,229 | ~525,985 | Owns **"highest payout"** + per-state pages + no-deposit. Heavy FAQ schema. |
| thelines.com | Betting media (separate domain) | 61 | 28,644 | ~356,175 | #7 head term; strong "list of" hub, detailed reviews. |
| pokerlistings.com | Poker/gambling media | 71 | 10,738 | ~316,318 | #5 head term; authority domain, long-form sweeps guide + reviews. |
| vegasinsider.com | Sports/casino media | 71 | 78,564 | ~1,600,748 | Owns the **50-state legality hub** (map + badges). Sheer authority. |
| slotsfan.com | Small pure-play sweeps | 32 | 1,474 | ~6,432 | #10 head term. Our closest **size peer**; beatable. |
| gammasweep.com | Tiny/new pure-play | [n/a] | 64 | ~139 | Ranked **#8 with essentially one strong blog post** — proof a low-DR newcomer can crack page 1. |
| **sweepstakeswiz.com (us)** | Pure-play sweeps review | **0** | ~0 (DFS) | ~0 (5 GSC clicks) | Depth/trust moat; **zero footprint** — T-0. |

*ETV = DataForSEO modeled organic clicks/mo, US; directional not GA truth. `gamble-usa.com`,
`sweepedia.com`, `sweepstakescasino.com` were validated and **dropped** — negligible/no sweeps footprint.*

### Read on SweepsKings specifically

- **Scale is the moat.** Review sitemap ≈ **357 URLs**. Top-100 traffic pages alone touch **45+ distinct
  brands**, most of which we don't cover. WordPress + `wpgrim` sitemap generator; affiliate links cloaked
  through `/goto/` (disallowed in robots).
- **Their traffic is brand-navigational + freshness.** #1 page: `/reviews/american-luck/` for
  "american luck casino" — **SV 90,500, KD 3, navigational**. A whole **"new sweepstakes casinos"**
  cluster (SV 12,100 + 8,100 + 1,600 + long tail) feeds `/sweepstakes-casinos/new/`. They rank #1 for
  their own brand and for "list of sweepstakes casinos" (SV 12,100).
- **Format arsenal we lack:** `/similar/{brand}/` alternatives pages, `/no-deposit/` tracker, `/new/`
  hub, `/news/` (e.g. *"luckybird.io declared closed"* — capturing "did X shut down" intent), and a
  `/topic/` **forum** (UGC / real-experience signals we approximate only via reader reports).
- **The exploitable weakness — their links.** 97,580 backlinks / 4,958 referring domains looks scary,
  but **spam score 50**, **84,165 of 88,228 referring pages are nofollow**, and the TLD mix is
  `.online / .xyz / .site / .website / .space` — a classic low-quality/PBN footprint. DR 63 is
  **volume-inflated, not editorially earned.** Per-page, a handful of *real* editorial links + genuine
  E-E-A-T can beat them, and they carry ongoing algorithmic risk from that profile.

---

## 2. Their topical coverage & content formats

What page types/clusters the field runs, and who owns each (so we attack where the ROI is highest).

| Cluster / format | Who's strong | What it targets | We have? |
|---|---|---|---|
| **Individual brand reviews** (`/reviews/{brand}/`) | **SweepsKings** (~350), thelines, pokerlistings | Brand navigational ("{brand} casino", "{brand} review", "is {brand} legit") — **huge, low-KD** | ✅ 28 only |
| **"New sweepstakes casinos" hub** | **SweepsKings** (`/new/`) | "new/newest sweepstakes/sweeps/social casinos (2026)" — SV 12,100+8,100+1,600 | ❌ **none** |
| **Money list hub** | thelines, sweepskings, pokerlistings | "list of / best sweepstakes casinos" (SV 12,100 / 4,400) | ⚠️ `/best/` at pos ~156 |
| **No-deposit / free-SC bonus tracker** | SweepsKings (`/no-deposit/`), lines, legalsportsreport | "sweepstakes casino no deposit bonus" (2,900), "free sweeps coins" (880) | ❌ **none** (only per-brand `/bonuses/` gateway) |
| **Brand alternatives** (`/similar/{brand}/`) | **SweepsKings** | "{brand} alternatives", "casinos like {brand}", "stake us alternatives" | ❌ **none** |
| **Highest / fastest payout guide** | **lines.com** (PAA winner) | "highest payout" / "fastest payout sweepstakes casino" (260, +24% QoQ) | ❌ **none** |
| **Promo-code hub** | sweepskings, lines | "sweepstakes casino promo codes" (170) | ⚠️ per-brand only |
| **"Is X legit / how it works" guides** | all | "how do sweepstakes casinos work" (90, KD 11), "are sweepstakes casinos legit" | ✅ guides (one **not indexed**) |
| **Currency guides** (GC vs SC, redeem) | all | "sweeps coins", "gold coins vs sweeps coins", "redeem sweeps coins" | ✅ strong |
| **State legality hub + state pages** | **vegasinsider** (hub), lines (states) | "sweepstakes casino legality by state", "is sweepstakes legal in {state}" | ✅ hub + 4 states (see STATE-HUB-PLAN) |
| **News / operator status** (`/news/`) | **SweepsKings** | "did {brand} shut down", ban news, launches | ❌ **none** |
| **Community forum** (`/topic/`) | **SweepsKings** | UGC, long-tail, real-experience/E-E-A-T | ⚠️ reader reports (better-quality proxy) |
| **App/download** | sweepskings, lines | "sweepstakes casino apps" (390, KD 12) | ❌ **none** |

**Where they're strong:** breadth of brand reviews, freshness (new-casino + news), commercial trackers
(no-deposit/promo/payout), and — for the media players — raw domain authority. **Where the field is
thin (our opening):** genuine first-hand evidence, compliance/trust, disambiguation, and defensible
AI-citation structure. SweepsKings' reviews read as templated affiliate copy ("X is a legal, legit
social casino because free coins are provided…") — exactly the [[information-gain]] = 0 pattern Google's
scaled-content policy targets.

---

## 3. Gap analysis

Cross-checked against our inventory (28 `reviews/*.html`; guides `what-are` / `sweeps-coins-explained`
/ `gold-coins-vs-sweeps-coins` / `how-to-redeem` / `are-…-legit`; states CA/FL/NY/TX; `/best/`;
`/state-legality/`; one comparison) and GSC reality (everything pos 30–160, no commercial-hub rankings).

### (a) Content gaps — clusters/pages we lack entirely

| Gap | Evidence | Priority |
|---|---|---|
| **"New sweepstakes casinos" cluster + hub** | SV 12,100 / 8,100 / 1,600; SweepsKings ranks top; we have nothing | **P0** |
| **Brand reviews for trending/new operators** | Their #1 = american-luck (SV 90,500, KD 3); 45+ brands uncovered | **P0** |
| **Highest/fastest-payout guide** | lines owns the PAA; "fastest payout" +24% QoQ | **P1** |
| **No-deposit / free-SC bonus tracker** | SV 2,900 + 880; commercial→transactional | **P1** |
| **Brand-alternatives cluster** | "stake us / chumba / mcluck alternatives", "casinos like chumba" — low KD | **P1** |
| **"Social casino / social casinos list"** | SV 49,500 (KD 6!) + 3,600 — adjacent, huge, easy | **P1** |
| **Promo-code hub** | SV 170 + long tail; we only have per-brand gateways | **P2** |
| **News / operator-status** | "did {brand} shut down", ban news; freshness + [[query-fan-out]] | **P2** |
| **Sweepstakes casino apps** | SV 390, KD 12 | **P2** |

### (b) Format gaps — page types/mechanics we don't run

1. **Live, dated bonus tracker** (no-deposit + free-SC) — a maintained table with "last verified"
   dates, not static per-brand pages. This is a *format* moat if we keep it genuinely current.
2. **Comparison matrices** — brand-vs-brand and "alternatives to X" tables (we have one generic
   comparison MDX; competitors run dozens of scoped matrices).
3. **A freshness surface** — `/new/` hub + light `/news/` feed give recurring crawl + "new/2026"
   query capture; we ship static clusters with no freshness engine.
4. **Structured payout data table** — RTP/redemption-speed/method matrix (we have per-brand reader
   reports but no aggregated, sortable payout comparison).

### (c) Coverage-depth gaps — pages we have but under-serve

- **Money hub `/best/sweepstakes-casinos/` is invisible (pos ~156).** It targets "best" (4,400) but
  ignores the **bigger** "list of sweepstakes casinos" (12,100) — needs a title/intent widen, internal
  links from every review, and depth.
- **Core guide `/guides/what-are-sweepstakes-casinos/` at pos ~134** despite low KD — authority/
  interlink problem, not a content problem.
- **`/guides/are-sweepstakes-casinos-legit/` is NOT indexed** (unknown to Google) — a P0 crawl fix,
  and it maps to real demand ("are sweepstakes casinos legit").
- **Existing reviews rank pos 47–88** — depth + E-E-A-T + schema climb needed (already the GSC-insights
  recommendation; competitor intel reinforces it).

> **Reconciling with GSC-INSIGHTS.** That doc correctly said *"no new-review brand gaps"* — relative to
> our **own already-indexed brands.** Competitor intel widens the frame: the *market's* brand-review
> universe is ~10× ours, and brand navigational terms are the biggest, cheapest wins in the niche. Both
> are true: **rank the 28 we have AND expand coverage to high-demand uncovered brands.**

---

## 4. Our edge to weaponize

We will not win by copying SweepsKings' 350 thin pages — Google's scaled-content policy
([[scaled-content-abuse-threshold]]) and their own spammy link risk make that a losing imitation.
We win by pairing the **formats they monetize** with **moats they structurally cannot copy:**

1. **Honest tiered-evidence + moderated reader reports = real Experience (E-E-A-T).** Competitors assert
   "we tested" with zero proof; we ship moderated first-hand reader reports (Supabase) + cited
   third-party sources and *refuse* fabricated hands-on claims (enforced by `content:lint`). This is
   genuine [[information-gain]] — the exact axis AI Overviews and Google reward and thin affiliates fail.
2. **Server-side geo-enforcement = unique trust signal.** We actually *suppress* offers in banned states
   (CA/NY/etc.) at the server, and explain why. No competitor does this; it's a defensible YMYL trust
   differentiator to feature prominently on hubs, state pages, and reviews.
3. **State template at scale + self-hosted flags + connected `@graph`.** We can spin compliant,
   schema-complete state and brand pages faster and cleaner than WordPress affiliates — without tripping
   scaled-content signals, because each carries state/brand-specific research + our geo data.
4. **AEO/GEO structural advantage.** Apply `geo-aeo-layer`: 40–60-word answer capsules after
   question-shaped H2s, entity disambiguation, attribution-ready dated claims, FAQPage — to win
   PAA/AI-Overview citations ([[chunk-extractability]], [[share-of-model]]). The live SERP already shows
   AI Overviews + PAA on our terms; thin competitors can't produce clean citation units.
5. **Algorithmic-authorship de-fingerprinting.** Our vendored FDS/R45 gates (`npm run seo:score`) keep a
   large cluster from reading as templated sameness — the risk that makes SweepsKings' 350-page library
   fragile. We ship breadth *without* the fingerprint.
6. **Their backlink weakness is our opening.** DR 63 on a 95%-nofollow, `.online/.xyz` base means
   **per-page** rankings are winnable with a few genuinely earned editorial links + superior on-page
   trust. Off-page is secondary to content here.

---

## 5. Prioritized content roadmap

Clusters → concrete pages/briefs. Volumes/KD/intent are **live DataForSEO** (US) unless `[ESTIMATED]`.
Every page runs the [`SEO-CONTENT-PIPELINE.md`](SEO-CONTENT-PIPELINE.md) Workflow-B gates
(live SERP+PAA → consensus close → de-fingerprint → build lint → `seo:score` FDS/R45) and, where
commercial, `affiliate-compliance-igaming` + geo rules. Effort: S ≤ half-day, M ≈ 1–2 days, L ≈ 3+ days.

### Phase 1 — Next 30 days (P0: fix foundation + plant the highest-ROI hubs)

| # | Page / cluster | Primary kw (SV / KD / intent) | Secondaries | Type | Our angle / information-gain | Tier · Effort |
|---|---|---|---|---|---|---|
| 1 | **Index + widen `/best/sweepstakes-casinos/`** | list of sweepstakes casinos (12,100 / 34 / comm) + best sweepstakes casinos (4,400 / 32) | top/usa/2026/online variants | Money hub | Methodology-scored ranking tied to `/how-we-rate/`; reader-report data + geo-availability column no rival has | **P0 · M** |
| 2 | **Crawl-fix `/guides/are-sweepstakes-casinos-legit/`** | are sweepstakes casinos legit ([ESTIMATED] ~1–2k) | is X legit, safe? | Guide | Already built, **unindexed** — sitemap + internal links + request indexing | **P0 · S** |
| 3 | **New-casinos hub** `/sweepstakes-casinos/new/` (or `/new/`) | new sweepstakes casinos (12,100 / 32 / comm) | new sweeps/social casinos, newest, 2026 (8,100 + 1,600) | Hub (freshness) | Dated "added {date}" table + honest "unverified/new operator" flags + geo status; monthly refresh engine | **P0 · M** |
| 4 | **Brand reviews — batch A (trending/new, uncovered)** | e.g. american luck casino (90,500 / 3 / nav) + 4–6 more high-demand uncovered brands | "{brand} review / legit / promo / no deposit" | Reviews | Info-first, compliant (info-only where not a partner); reader-report slots; tiered evidence | **P0 · L** |
| 5 | **RoxyMoxy cluster push** (title/meta + interlink) | roxymoxy + brand cluster (GSC pos 17–29) | promo code, no deposit | Review opt | Closest page to page-1 per GSC; fastest first clicks | **P0 · S** |

### Phase 2 — 31–60 days (P1: commercial trackers + alternatives + adjacent volume)

| # | Page / cluster | Primary kw (SV / KD / intent) | Type | Our angle | Tier · Effort |
|---|---|---|---|---|---|
| 6 | **No-deposit / free-SC tracker** `/bonuses/no-deposit/` | sweepstakes casino no deposit bonus (2,900 / comm) + no deposit sweepstakes casino (480) + free sweeps coins (880) | Tracker | Live, dated, "verified {date}" table; geo-gated CTAs only where legal; value-explainer capsules (PAA is value-obsessed) | **P1 · M** |
| 7 | **Brand-alternatives cluster** `/alternatives/{brand}/` | stake us alternatives (390), chumba casino alternatives (210), sweepstakes casinos like chumba (210), mcluck alternatives (30, +100% MoM) | Comparison | Scoped matrices; "why we recommend/avoid" tied to methodology; honest for banned brands | **P1 · M** |
| 8 | **Highest/fastest-payout guide** `/guides/fastest-payout-sweepstakes-casinos/` | fastest payout (260, +24% QoQ) + highest payout ([ESTIMATED]) | Guide + table | Sortable redemption-speed/method matrix from reader reports — real data lines.com asserts without proof | **P1 · M** |
| 9 | **Social-casino explainer + list** `/guides/social-casinos/` | social casino (49,500 / **KD 6** / info) + social casinos list (3,600 / 30) | Guide/hub | Disambiguate social vs sweepstakes (GC-only vs dual-currency); huge low-KD adjacent term | **P1 · L** |
| 10 | **Brand reviews — batch B** + interlink pass on existing 28 | brand navigational long tail | Reviews | Depth/E-E-A-T/schema climb for pos 47–88 pages (GSC C1/C2) | **P1 · L** |

### Phase 3 — 61–90 days (P2: freshness engine, promo hub, apps, moat pages)

| # | Page / cluster | Primary kw (SV / KD / intent) | Type | Our angle | Tier · Effort |
|---|---|---|---|---|---|
| 11 | **Promo-code hub** `/bonuses/promo-codes/` | sweepstakes casino promo codes (170 / comm) + per-brand tail | Hub | Aggregated, dated, geo-gated; single source of truth vs scattered per-brand pages | **P2 · M** |
| 12 | **News / operator-status feed** `/news/` | "did {brand} shut down", ban/launch news ([ESTIMATED]) | News | Freshness + [[query-fan-out]]; cite primary sources; pairs with state-legality moat | **P2 · M** |
| 13 | **Apps guide** `/guides/sweepstakes-casino-apps/` | sweepstakes casino apps (390 / 12 / comm) | Guide | iOS/Android availability + honest "web-only" flags | **P2 · S** |
| 14 | **State expansion batch 2** (OH, IL, PA, GA, NC; WA, MI, NJ, CT) | "is sweepstakes legal in {state}" | State pages | Per STATE-HUB-PLAN; geo-enforcement + primary-source law | **P2 · L** |
| 15 | **How-it-works depth pass** | how do sweepstakes casinos work (90 / 11 / info) | Guide | AEO capsules; feed AI Overviews | **P2 · S** |

**Tie to existing topical map:** Phases here extend, not replace, `STATE-HUB-PLAN.md` (state cluster) and
the `SEO-CONTENT-PIPELINE.md` process. The **new** pillars this competitor analysis adds are the
**commercial/freshness clusters** (new-casinos, no-deposit/promo trackers, alternatives, payout, social-
casino, apps) that the old topical map under-weighted relative to what actually drives competitor traffic.

---

## 6. Off-page / authority notes (secondary to content)

- **Don't chase their volume — beat their quality.** SweepsKings' 4,958 referring domains are ~95%
  nofollow on `.online/.xyz/.site` TLDs (spam score 50). We need **editorially earned** links, not a PBN.
- **Link targets to pursue** [ESTIMATED — validate with Ahrefs `site-explorer-*backlinks` / DataForSEO
  `backlinks_domain_intersection` before outreach]: gambling-news/legal sources that link the media
  players (legalsportsreport, gamingamerica, covers, state-law explainers) — pitchable with our
  **unique geo-enforcement + state-law research** as a citable reference asset.
- **Digital PR angle that fits our moat:** publish an original, dated **"state ban tracker"** and
  **reader-reported payout-speed dataset** — the kind of primary data journalists/legal sites cite
  (earns real links + AI citations at once).
- **Cheap wins:** brand/entity consistency (Organization `@id`, `sameAs` incl. YouTube), reclaim/earn
  mentions where our brands are discussed (Reddit ranks top-3 — engage authentically, don't spam).
- **Budget note:** off-page is a Phase 2–3 concern; per-page we can already outrank SweepsKings on
  content + trust alone given their weak profile.

---

## 7. Measurement (vs the 2026-07-08 baseline)

Track against [`gsc-baselines/2026-07-08.md`](gsc-baselines/2026-07-08.md) (5 clicks / 1,969 impr /
pos 47.4). Re-baseline monthly.

**GSC (primary):**
- Impressions/clicks/avg-position for each new cluster's primary kw (new-casinos, no-deposit, alternatives,
  payout, social-casino, list-of, best-of) + the target brand terms in review batches A/B.
- Page-level: `/best/` climbing from pos ~156; `/guides/what-are-…` from ~134; RoxyMoxy cluster
  into page 1; new hubs indexed within 2 weeks (URL Inspection).
- Coverage: confirm `/guides/are-…-legit/` + Pulsz/WOW Vegas reviews get indexed (0-impression watchlist).

**Ahrefs / DataForSEO (secondary):**
- Our DR (0 → track), referring domains (0 → track *quality*, not count).
- Organic keyword count + ETV vs the 2026-07-08 competitor snapshot; specifically, keywords where we
  and SweepsKings both rank (share-of-SERP).
- Re-pull SweepsKings domain overview quarterly to watch for algorithmic correction of their spam links.

**AEO / GEO ([[share-of-model]]):**
- `geo-aeo-layer` MEASURE Share-of-Model on: "best/list of sweepstakes casinos", "new sweepstakes
  casinos", "sweepstakes casino no deposit bonus", "is {brand} legit", "{brand} alternatives" across
  ChatGPT / Perplexity / Google AI Mode. Baseline now (≈0), track citation appearances.
- FAQ/Review/Breadcrumb rich-result validity on every new page (Rich Results Test).

**Quality gates (every page, non-negotiable):** `npm run build` Class-A lint + methodology check →
`npm run seo:score` FDS HEALTHY (≥80) + R45 PROVENANCE-OK; SERP overlap <30% vs top-3;
zero AEO iGaming vetoes; primary-source citations on legal/payout claims.

---

## Appendix — the 5–8 "outperform" moves (ranked)

1. **Own "new sweepstakes casinos" (12,100+8,100+1,600).** SweepsKings' freshness hub has no honest-
   evidence rival. A dated, geo-aware `/new/` hub + monthly refresh beats their template. *Why we win:*
   commercial intent + freshness + our trust flags; KD 17–32 is reachable.
2. **Expand brand reviews to high-demand uncovered operators (american-luck 90,500 @ KD 3, +others).**
   Brand navigational is the niche's biggest, cheapest traffic. *Why we win:* KD is tiny; our schema +
   reader-report + geo model out-trusts their templated copy.
3. **Build the no-deposit / free-SC tracker (2,900 + 880).** *Why we win:* a genuinely maintained,
   "verified {date}" table + value-answer capsules (PAA is value-obsessed) vs their static list; geo-gated
   CTAs add compliance trust.
4. **Rescue + widen the money hub to "list of sweepstakes casinos" (12,100).** *Why we win:* we already
   have the page (just invisible at pos 156); internal-link equity + methodology depth + availability
   column flips it — 3× the volume of "best".
5. **Brand-alternatives cluster (stake us / chumba / mcluck alternatives).** *Why we win:* low KD, low
   competition, SweepsKings' `/similar/` pages are thin; scoped honest matrices + "why avoid in banned
   states" is unique.
6. **Highest/fastest-payout guide with a real payout dataset.** *Why we win:* lines.com asserts payout
   claims without proof; our reader-reported redemption-speed data is defensible information-gain and
   AI-citable; "fastest payout" is +24% QoQ.
7. **Win the AI-Overview / PAA layer via `geo-aeo-layer`.** *Why we win:* AI Overviews + PAA already show
   on our terms; clean 40–60-word capsules + dated attribution + FAQPage beat thin affiliates for
   citation share ([[share-of-model]]).
8. **"Social casino / social casinos list" (49,500 @ KD 6 + 3,600).** *Why we win:* massive, adjacent,
   low-difficulty; a clean disambiguation guide (social vs sweepstakes) captures top-of-funnel we ignore.

---

## Changelog
| Date | Change |
|------|--------|
| 2026-07-08 | Initial strategy created from live Ahrefs DR + DataForSEO Labs + GSC baseline. |
