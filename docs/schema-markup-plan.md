# Schema Markup Plan — sweepstakeswiz.com

> Research + implementation plan for site-wide JSON-LD. Built on the schema-markup-generator skill
> (Koray EAV framework, @id entity graph, GEO/AI layer), a repo audit (commit `0fc9b9d`), and
> July 2026 web research. Companion to `docs/topical-map.md`.
> Status: Phases 1–4 IMPLEMENTED 2026-07-07 (see §7). Phases 5–6 pending. Last updated: 2026-07-07.

---

## 1. Current-State Audit

### What exists (verified in repo)

| Location | Schema present | Quality |
|---|---|---|
| Site-wide (`src/lib/pageChrome.ts` → `ORG_GRAPH`) | Organization + WebSite in one `@graph`, stable `@id`s (`/#organization`, `/#website`), `founder` → author `@id`, `knowsAbout` (5 topics), `alternateName`, logo | Good foundation. Thin authority layer |
| Review pages (static HTML, e.g. `reviews/mcluck.html`) | `Review` (itemReviewed = brand `Organization` with `parentOrganization` + operator address), author Person inline, `reviewRating`, dense `reviewBody`; + `FAQPage` (7 Qs); + `BreadcrumbList` | Strong content. Weak graph wiring |
| Homepage (`index.html`) | `ItemList` + `FAQPage` + breadcrumb | No `CollectionPage` wrapper |
| Author (`author/ilija-milosevic.html`) | `ProfilePage` → `Person` with `@id`, `knowsAbout`, `worksFor` → org `@id`, sameAs (LinkedIn) | Best page on the site |
| Guides (`src/routes/guides/[slug].astro`) | `Article` + optional `FAQPage` via `jsonLd` prop; breadcrumb via layout | Missing required + GEO props |
| States, best hub, bonuses, trust/legal pages | Breadcrumb only (via layout) or nothing | Gap |

### Gap list (scored against the 36-point audit framework)

**Critical**
1. **No `WebPage` node on any page.** The graph jumps Org → WebSite → (nothing) → content. Every page needs a `WebPage` (correct subtype) with `isPartOf` → `#website`, `breadcrumb` → `#breadcrumb`, `dateModified`.
2. **Guide `Article` fails Google's required-property list** — no `image`, no `datePublished` (only `dateModified`, date-only, no timezone). Not rich-result eligible today.
3. **Entities defined inline instead of `@id`-referenced.** Review pages re-declare author Person and publisher Org inline; guide Articles inline the publisher. One entity = one definition = `@id` refs everywhere else.
4. **Brand entities have no stable `@id`.** `itemReviewed` Organization is anonymous — it can't be referenced from the best-of hub, state pages, or versus pages. This is the single biggest structural miss for a comparison site.

**High**
5. `Organization` authority layer thin: `sameAs` = YouTube only; missing `subjectOf`, `areaServed`, `foundingDate`, `publishingPrinciples`, `contactPoint`, `knowsAbout` too short vs. the topical map.
6. Money pages (`/best/…`) have **no** `CollectionPage` + `ItemList` — the pages that most need machine-readable comparison data have the least.
7. State pages have no content entity — no `Article`, no `about` linking to the state entity (Wikidata), nothing an AI can attribute.
8. `Article.author` on guides duplicates the Person inline rather than shipping the full Person node in the graph (Google reads page-by-page — the full Person must be ON the page).
9. No `about`/`mentions` entity linking anywhere; no `wordCount`; no `citation`.

**Medium**
10. Multiple separate `<script>` blocks per page instead of one consolidated `@graph` (works, since same-page `@id` refs resolve across blocks, but harder to maintain/validate).
11. Trust pages not typed: `about.html` → `AboutPage`, `contact.html` → `ContactPage`, `how-we-rate.html`/`editorial-policy.html` → `WebPage` + referenced from Org via `publishingPrinciples`.
12. Review pages lack `positiveNotes`/`negativeNotes` (pros/cons — visible on page, extractable by LLMs).

### What is correct and must NOT change
- `Review` → `itemReviewed: Organization` **is Google-supported** for sites reviewing *other* organizations (third-party reviews). This is exactly our case — keep the pattern. Self-serving review rules only bar reviewing yourself.
- `AggregateRating` is absent — correct. It stays **gated until ≥10 moderated reader reports per brand** (existing pipeline rule). Never emit it from editorial ratings alone.
- `parentOrganization` + registered operator address inside `itemReviewed` — keep; it's an operator-transparency signal few competitors ship.
- Honest `reviewBody` matching visible content — keep (rhubarb / content-schema parity).

---

## 2. Research Findings (July 2026)

1. **FAQ rich results are fully dead** (deprecated May 7, 2026; Search Console reporting removed June 2026; API field removed Aug 2026). FAQPage markup remains valid schema.org and is still worth keeping **for LLM/AI extraction only** — RedClaw's March 2026 study of 200 iGaming SERPs found pages with valid FAQPage cited **2.7×** more often in AI Overviews. Keep ours; expect zero SERP feature.
2. **Organization completeness drives AI citations**: same study — Organization schema carrying license/operator info + `sameAs` correlated with **3.4×** more AI Overview citations. Google's own AI guidance (May 2026): no special "AI schema" exists; the wins come from entity disambiguation + rich-result eligibility.
3. **Jan 2026 deprecations** (do not implement): Sitelinks SearchBox, Q&A, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement, Vehicle Listing, Practice Problems, Dataset (general search). Our ORG_GRAPH already correctly omits SearchAction.
4. **HowTo**: desktop rich results deprecated, but the sequential structure is the most AI-extractable format — use on procedural guides (how-to-redeem) for LLM surface only.
5. **Koray (semantic SEO) integration** — schema is the machine-readable expression of the topical map's Entity-Attribute-Value triples:
   - Central entity **"sweepstakes casino"** and each brand entity must carry consistent attributes (operator, launch year, welcome offer, redemption minimums, state availability) — in schema where a property exists, in visible text always. **Schema-content consistency is the trust signal**; any claim in JSON-LD absent from the page erodes entity confidence.
   - `Organization.knowsAbout` must mirror the topical map's clusters (core + outer), not a generic topic list.
   - `Article.about` = the page's macro-context entity; `mentions` = supplementary entities. Both link to Wikidata where an entry exists.
   - Category/hub pages are structured signals connecting entity → attributes → predicates ("best", "legal in", "bonus") — `CollectionPage` + typed `ItemList` is the schema mirror of that.
   - The `@id` graph mirrors the hub-and-spoke internal linking; breadcrumbs mirror the cluster hierarchy.
6. **Google API leak alignment**: `siteAuthority` ← Org completeness + sameAs breadth; `contentEffort` ← Article depth (wordCount, dateModified, about); `rhubarb` ← rating markup must match visible ratings; `anchorMismatch` ← breadcrumbs must match real URL structure.

---

## 3. Target Architecture

### 3.1 @id Registry (permanent — never change once shipped)

| Entity | @id |
|---|---|
| Publisher Org | `https://sweepstakeswiz.com/#organization` (exists) |
| WebSite | `https://sweepstakeswiz.com/#website` (exists) |
| Author Person | `https://sweepstakeswiz.com/author/ilija-milosevic/#person` (exists) |
| Logo | `https://sweepstakeswiz.com/#logo` (exists) |
| Per-page WebPage | `<page-url>#webpage` (new) |
| Per-page Breadcrumb | `<page-url>#breadcrumb` (new — currently no @id) |
| Per-review Review | `https://sweepstakeswiz.com/reviews/<slug>/#review` (new) |
| **Casino brand entity** | `https://sweepstakeswiz.com/reviews/<slug>/#brand` (new — canonical home = its review page) |
| Per-guide Article | `https://sweepstakeswiz.com/guides/<slug>/#article` (new) |
| Rating methodology | `https://sweepstakeswiz.com/how-we-rate/#methodology` (new, WebPage) |

The **brand entity** rule is the centerpiece: each of the 13+ partner brands (and funnel brands
like Stake.us, Chumba) is defined ONCE — full Organization node with operator, address,
`foundingDate`, `sameAs` (official site, Trustpilot, app stores), `areaServed` — on its review
page. Every other page that mentions the brand (best-of hub, state pages, bonuses, versus)
re-ships that same node (Google reads page-by-page) with the **same @id**, generated from one
source of truth in `src/data/`.

### 3.2 Per-page schema stacks

Every page = **Foundation** (identical, template-injected) + **Content layer** (per page type).

**Foundation (all pages):** full Organization (upgraded, §3.3) + WebSite + WebPage-subtype node + BreadcrumbList (with @id) + full author Person node on any page that credits him.

| Page type | WebPage subtype | Content layer |
|---|---|---|
| Homepage | `WebPage` | `ItemList` of top brand `@id` refs + `FAQPage` (keep) |
| Best-of hub `/best/…` | `CollectionPage` | `ItemList` (`itemListOrder: Descending`, `numberOfItems`) of `ListItem` → per-brand `Review` snippets (`itemReviewed` → brand node, editorial `reviewRating`, `positiveNotes`/`negativeNotes`, `url` → full review) |
| Brand review `/reviews/<slug>/` | `ItemPage` | `Review` (@id, author/publisher as @id refs, pros/cons) + full **brand Organization** node + `FAQPage` |
| Guide `/guides/<slug>/` | `WebPage` (or `FAQPage` subtype) | `Article` — fixed: `image`, `datePublished`+`dateModified` (ISO 8601 + TZ), `wordCount`, `about`/`mentions` (Wikidata), `author`/`publisher` as @id refs, `citation` for primary sources (state statutes, AG opinions) + `FAQPage` + `HowTo` on procedural guides |
| State page `/states/<slug>/` | `WebPage` | `Article` with `about` → the state (Wikidata Q-id) + "sweepstakes casino"; `spatialCoverage` → `State`; brand `@id` refs for available partners; `FAQPage`. **Banned states: informational Article only — no Offer-like markup, no brand ItemList** (schema mirrors geo-suppression) |
| Bonus pages `/bonuses/…` | `ItemPage`/`CollectionPage` | `Article` + `FAQPage` + brand refs. **No `Offer`/`Product` schema** — sweeps bonuses aren't purchasable products; Offer markup invites price rich results we can't honor + compliance risk |
| Versus/alternatives | `WebPage` | `Article` + both brand nodes + `FAQPage` |
| Author page | `ProfilePage` (exists) | Person — add more `sameAs`, `subjectOf` (only real interviews/features), `hasCredential` only if real |
| About | `AboutPage` | Org ref + founder Person |
| Contact | `ContactPage` | Org `contactPoint` |
| How-we-rate / editorial policy | `WebPage` | Referenced by `Organization.publishingPrinciples` |
| Responsible gaming, legal/* | `WebPage` | Foundation only |

### 3.3 Organization upgrade (site-wide, in `pageChrome.ts`)

Add to the existing node — **only values that are true and verifiable**:
- `foundingDate`, `areaServed: { "@type": "Country", "name": "United States" }`
- `publishingPrinciples` → `/editorial-policy.html`; consider `correctionsPolicy`/`ethicsPolicy` if we later type Org as `NewsMediaOrganization` (not required now)
- `contactPoint` (email from contact page)
- `knowsAbout` expanded to mirror topical-map clusters: sweepstakes casinos, Gold Coins/Sweeps Coins mechanics, sweeps coin redemption, US sweepstakes law by state, sweepstakes casino bonuses & promo codes, responsible gaming, social casino game providers
- `sameAs`: YouTube (exists) + every real profile as created (X, LinkedIn company page). **Wikidata/KGMID: aspirational — add when they exist, never fabricate**
- `subjectOf`: only when real third-party coverage exists (empty today — leave out until earned)
- `NOT`: `currenciesAccepted`/`paymentAccepted` (we are a media site, not a casino), `hasMemberProgram` (no program), fake credentials

### 3.4 FAQPage policy (post-deprecation)
Keep on reviews, guides, states — for cross-LLM extraction, not rich results. Rules: every Q&A visible on page; answers 50–200 words, front-loaded; ≤10 per page; questions phrased as real queries (PAA-style, per topical map).

---

## 4. Compliance Guardrails (YMYL — non-negotiable)

1. **AggregateRating stays gated**: emitted only by `aggregate-reader-reports` output when a brand has ≥10 moderated reports, `itemReviewed` → brand `@id`, and the aggregate is visibly rendered on the review page. Editorial `reviewRating` (single Review) is fine and separate.
2. **No experience claims in schema** that `lint-experience-claims` would block in prose — `reviewBody` stays "editorial analysis" framing (current McLuck copy is the model).
3. **Banned states (CA, NY, MT, CT, NV, NJ, LA, MI, ID, WA)**: state-page schema is informational `Article` only. No brand ItemLists, no anything that reads as an offer. Schema must never leak monetization the page geo-suppresses.
4. **Schema-content parity everywhere** (Google guideline + Koray consistency + leak `rhubarb`): no rating, pro/con, FAQ, or availability claim in JSON-LD that isn't rendered on the page. `verify:availability` data is the single source for any state-availability statement in schema.
5. No `ClaimReview` (deprecated + YMYL-radioactive), no fabricated `subjectOf`/`sameAs`/Q-ids/credentials.

---

## 5. Implementation Plan (Astro)

**New module: `src/lib/schema.ts`** — single builder producing ONE consolidated `@graph` per page:
`buildGraph({ pageType, url, title, description, datePublished, dateModified, breadcrumbs, content })`
- Emits foundation + content layer; validates internally (every `@id` ref resolves within the emitted graph; required props present per type; ISO 8601 + TZ dates).
- `src/data/affiliates.ts` extended with per-brand schema fields (operator legal name, operator address, foundingDate, official URL, Trustpilot URL, app-store URLs, restricted states) → generates the canonical brand nodes. One source of truth for review pages AND hub ItemLists.

**Phases** (aligned to `docs/launch-roadmap.md`):

| Phase | Scope | Effort |
|---|---|---|
| 1 | `schema.ts` + upgrade `ORG_GRAPH` (authority layer) + add `WebPage` node + breadcrumb `@id` in `ContentLayout.astro` | Small; unblocks everything |
| 2 | Guides: fix `Article` (image, dates, wordCount, about/mentions, @id refs, citation); add `HowTo` to how-to-redeem | Medium |
| 3 | Reviews (static HTML, 28 files): migration script (pattern: `scripts/apply-review-eeat.mjs`) — add `@id`s, swap inline author/publisher for refs + append full Person node, add brand-node fields from `affiliates.ts`, add `positiveNotes`/`negativeNotes` | Medium — scripted, not manual |
| 4 | Money pages: `CollectionPage` + `ItemList` on `/best/` hub + homepage `ItemList` refactor to brand `@id` refs | High value |
| 5 | States (rolling, with the 10–15/mo content rollout): `Article` + `about`(state Q-id, verified) + `spatialCoverage`; banned-state variant | Ongoing |
| 6 | Trust pages subtypes + `publishingPrinciples` wiring; reader-reports `AggregateRating` emitter (behind the ≥10 gate) | Small |

**Build gate — `scripts/verify-schema.ts`** (add to `prebuild` alongside existing lints):
- JSON parses; every `@id` reference resolves on-page; no deprecated types (SearchAction, ClaimReview, Q&A…); required props per type; `AggregateRating` present ⇒ reader-report count ≥10 for that brand; banned-state pages contain no brand ItemList/Review nodes; dates ISO 8601.

**Validation workflow**: Rich Results Test (review, breadcrumb, article eligibility) + Schema.org validator on: 1 review, 1 guide, `/best/` hub, 1 legal state, 1 banned state, homepage, author. Re-run after each phase. Monitor GSC enhancement reports (Review snippets, Breadcrumbs).

---

## 7. Implementation Log (2026-07-07 — Phases 1–4 + build gate)

**Shipped:**
- `src/lib/schema.ts` — single graph builder (`buildPageGraph`): foundation (Organization + WebSite + typed WebPage + BreadcrumbList with @ids) + content nodes in ONE consolidated `@graph`; auto-appends the full author Person / brand Organization nodes when referenced; throws on unresolved internal @id refs and non-ISO dates.
- `src/data/brandEntities.ts` — canonical brand entity data (operator legal name + registered address, transcribed from the review pages) for the 13 partners; `brandEntityId()` = `/reviews/<slug>/#brand`.
- `src/lib/pageChrome.ts` — ORG_GRAPH now sources nodes from `schema.ts` with the §3.3 authority upgrade (`areaServed`, `publishingPrinciples`, `contactPoint`, expanded `knowsAbout`) + ships the full author Person site-wide; new `injectWebPageSchema()` adds a per-page WebPage node (from canonical/title/description) to every static HTML page.
- `src/layouts/ContentLayout.astro` — emits the consolidated graph via `buildPageGraph` (new props: `pageType`, `datePublished`, `dateModified`, `mainEntityId`).
- Guides (`src/routes/guides/[slug].astro` + frontmatter) — Article fixed: `image`, `datePublished`/`dateModified` (ISO + TZ), `wordCount`, `about`/`mentions`, `citation` (legit guide: CA AB-831 + ZwillGen), author/publisher as @id refs; `HowTo` (5 steps) on how-to-redeem. Guides hub → CollectionPage + ItemList.
- Reviews — `scripts/apply-review-schema.mjs` migrated all 28 static files: Review @id, itemReviewed → brand node @id (full brand Organization on-page), author/publisher @id refs, `positiveNotes`/`negativeNotes` from the visible pros/cons; FAQPage + BreadcrumbList @ids; **removed 3 legacy AggregateRating blocks** (rolla, sweepico, big-pirate — violated the ≥10-reports gate); **rebuilt rolla's invalid FAQPage** from the visible FAQ.
- Money pages — `/best/<slug>` = CollectionPage + ranked ItemList (13 brand @id refs + full brand nodes, SSR-verified); homepage ItemList → brand @id refs + brand nodes in one @graph.
- States (partial Phase 5 pull-forward) — Article with `about` + `spatialCoverage: State` + brand `mentions` (available states only; banned-state pages verified brand-free); Wikidata Q-ids still deferred (open item 1).
- Build gate — `scripts/verify-schema.ts` in `prebuild` (`npm run schema:verify`): parse, banned types, required props, @id resolution, AggregateRating gate, ISO dates. 36 static pages green; full build green; @id resolution verified on built output (guides, states, reviews, hub, homepage SSR).

**Still open:** Phase 5 rolling state content, Phase 6 trust-page subtypes (`AboutPage`/`ContactPage`) + reader-reports AggregateRating emitter, plus §6 open items.

---

## 6. Open Items (need Niro / verification)

1. **Wikidata Q-ids** for `about` entities (sweepstakes, virtual currency, each US state) — verify on wikidata.org before shipping; never guess Q-ids.
2. Real social profiles for Org `sameAs` beyond YouTube — create X/LinkedIn company page if planned (each strengthens entity resolution).
3. Author `subjectOf`: any real podcast/interview/press links for Ilija? Only real ones.
4. Confirm `foundingDate` for Sweepstakes Wiz and per-brand launch years (brand nodes).
5. Decide whether homepage FAQ stays (7 Qs) — fine for LLMs, but ensure all visible after any redesign.
