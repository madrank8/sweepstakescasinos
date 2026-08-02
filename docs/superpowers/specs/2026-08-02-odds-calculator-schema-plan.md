# Odds Calculator Schema Plan — Beat US Top 3

> Status: **Implemented** (HowTo + screenshot + free Offer; no AggregateRating)  
> Date: 2026-08-02  
> Issue: `sw-ax6`  
> Skills: `schema-markup-generator` v2.4 (audit + generate), site `docs/schema-markup-plan.md`, Obsidian SEO wiki operating rules  
> Query researched (DataForSEO, US desktop): `sweepstakes odds calculator`  
> Decisions: (1) ALL schema+HowTo (2) dedicated calculator screenshot (3) no AggregateRating

---

## 1. SERP context (United States)

| Rank | URL | Schema posture (live extract) |
|---|---|---|
| **1** | [sweepsy.com/odds/](https://www.sweepsy.com/odds/) | Yoast `@graph`: `WebPage` + primary `ImageObject` + `BreadcrumbList` + `WebSite` + `Organization`. **No tool type. No FAQ schema.** Has timezone `datePublished` / `dateModified`. Keeps deprecated `SearchAction`. |
| **2** | [competitionshowroom.com/odds-calculator](https://www.competitionshowroom.com/odds-calculator) | **4 disconnected scripts** (no `@id` graph). Org + WebSite + Breadcrumb + **FAQPage (7 Qs)**. UK prize-comp framing. **No WebApplication / SoftwareApplication.** |
| **3** | [playwithstakes.com/tools/sweepstakes-odds-calculator/](https://playwithstakes.com/tools/sweepstakes-odds-calculator/) | Rank Math `@graph`: Org + WebSite + WebPage + Breadcrumb + Person + **`Article`** (tool mis-typed as article) + separate **FAQPage (7 Qs)**. Timezone dates + `keywords`. **No WebApplication.** Cited in AI Overview for this query. |
| **Us** | [sweepstakeswiz.com/tools/sweepstakes-odds-calculator/](https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/) | Single `@graph`: Org + WebSite + WebPage + Breadcrumb + **`WebApplication`** + **FAQPage (6 Qs)** + author Person. Already the only top-page-style competitor with a true tool type. |

**AI Overview today** cites PlayWithStakes + Competition Showroom (and a YouTube explainer). Sweepsy ranks #1 organically with thinner schema. Opportunity: keep tool-correct typing **and** match/exceed their FAQ + freshness + extractable procedure signals without lying with Article/rating spam.

---

## 2. Current SweepstakesWiz audit (skill 36-point lens)

Source: `src/lib/oddsPageSchema.ts` + `buildPageGraph()` in `src/lib/schema.ts`.

### Already winning vs top 3
- Consolidated **one `@graph`** with stable `@id`s (Sweepsy/PlayWithStakes yes; Competition Showroom no).
- Correct **tool** typing: `WebApplication` (`#app`) as `WebPage.mainEntity` — none of the top 3 do this.
- Visible FAQ ↔ `FAQPage` parity (6 Qs).
- Foundation chain Org → WebSite → WebPage → Breadcrumb.
- Real author Person (`Ilija Milosevic`) with `sameAs` / `knowsAbout` (not a faceless “Editorial” blob).

### Gaps to close to be clearly best

| Priority | Gap | Why it matters |
|---|---|---|
| P0 | `WebApplication` missing Google **free `Offer`** (`price: 0`, `priceCurrency: USD`) | Required for Software App rich-result *eligibility path*. Still **do not** invent `aggregateRating` / fake `Review`. |
| P0 | Dates are date-only (`2026-07-30`) and **stale after UI redesign** | Top 3 ship timezone ISO; AI/freshness prefer recent `dateModified`. |
| P0 | Thin app node: no `featureList`, `screenshot`/`image`, `inLanguage`, `creator`/`author`, `about`/`mentions` | Competitors win AI Overview with denser extractable facts even when mistyped as Article. |
| P1 | No procedural `HowTo` while page/editorial explains usage | HowTo rich results are dead; structure remains highly AI-extractable. Must match **visible** steps. |
| P1 | `WebPage` lacks `author`, `primaryImageOfPage`, `about` | PlayWithStakes links author + Article; Sweepsy has primary image. |
| P2 | FAQ answers not `@id`-addressable Question nodes | Nice for graph hygiene; optional. |
| P2 | Org `knowsAbout` omits odds/probability language | Site-wide topical signal; optional scoped add if editorial map allows. |
| **Do not** | `Article` as main content type for the tool | PlayWithStakes pattern — wrong entity, content-schema stretch. |
| **Do not** | `AggregateRating` / self-star spam on the app | No moderated tool-review corpus; violates site rating gate + rhubarb risk. |
| **Do not** | `Product`/`Offer` on editorial casino cards | Affiliate CTAs ≠ sellable products; geo-suppression breaks parity. |
| **Do not** | Promise FAQ rich results | FAQPage retired for SERP visuals May 7, 2026 — keep for LLM extraction only. |

**Rough score today vs “best” target:** ~72/100 applicable → target **90+** after P0/P1 (stars still N/A without real reviews).

---

## 3. Target schema stack (this page only)

Keep foundation from `buildPageGraph()`. Upgrade content nodes as follows.

### 3.1 `@id` registry (locked)

| Entity | `@id` |
|---|---|
| Organization | `https://sweepstakeswiz.com/#organization` |
| WebSite | `https://sweepstakeswiz.com/#website` |
| Author Person | `https://sweepstakeswiz.com/author/ilija-milosevic/#person` |
| WebPage | `…/tools/sweepstakes-odds-calculator/#webpage` |
| BreadcrumbList | `…/tools/sweepstakes-odds-calculator/#breadcrumb` |
| WebApplication (mainEntity) | `…/tools/sweepstakes-odds-calculator/#app` |
| FAQPage | `…/tools/sweepstakes-odds-calculator/#faq` |
| HowTo (new) | `…/tools/sweepstakes-odds-calculator/#howto` |
| Primary image (new) | `…/tools/sweepstakes-odds-calculator/#primaryimage` |

### 3.2 `WebApplication` (enrich — still `mainEntity`)

Required / high-value fields to add (all must be true on-page):

```json
{
  "@type": "WebApplication",
  "@id": "https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#app",
  "name": "SweepstakesWiz Sweepstakes Odds Calculator",
  "url": "https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/",
  "description": "<existing honest description>",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any",
  "browserRequirements": "Requires JavaScript. Calculations run locally in the browser.",
  "isAccessibleForFree": true,
  "inLanguage": "en-US",
  "offers": {
    "@type": "Offer",
    "price": 0,
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "featureList": [
    "Exact without-replacement win probability",
    "Unknown pool estimate range (0.8× / 1× / 1.25×)",
    "Free vs purchase-associated entry comparison",
    "Repeated independent drawings",
    "Client-side only — inputs are not submitted to a server"
  ],
  "screenshot": { "@id": "…#primaryimage" },
  "image": { "@id": "…#primaryimage" },
  "author": { "@id": "https://sweepstakeswiz.com/author/ilija-milosevic/#person" },
  "creator": { "@id": "https://sweepstakeswiz.com/#organization" },
  "publisher": { "@id": "https://sweepstakeswiz.com/#organization" },
  "about": [
    { "@type": "Thing", "name": "Sweepstakes odds", "sameAs": "https://en.wikipedia.org/wiki/Sweepstake" },
    { "@type": "Thing", "name": "Hypergeometric distribution", "sameAs": "https://www.wikidata.org/wiki/Q204434" }
  ],
  "mentions": [
    { "@type": "Thing", "name": "Alternate method of entry" },
    { "@type": "Thing", "name": "Prize draw without replacement" }
  ]
}
```

**Rich results honesty:** Google Software App docs still require **Offer + (aggregateRating OR review)** for the rich result. We ship **Offer only** until a real, moderated review corpus exists. That is still ahead of top 3 (who ship neither) and avoids spam.

### 3.3 `WebPage` upgrades

Via `buildPageGraph` options / node patches:
- `datePublished` / `dateModified` → ISO 8601 **with timezone** (e.g. `2026-07-30T00:00:00+00:00` / current redesign date).
- Bump `ODDS_DATE_MODIFIED` to the UI-redesign ship day (or derive from git lastmod of route + calculator components — preferred long-term).
- `author`: `{ "@id": AUTHOR_ID }` on the WebPage node (extend `buildPageGraph` or odds-specific override).
- `primaryImageOfPage`: `{ "@id": "…#primaryimage" }`.
- Keep `mainEntity` → `#app` (not FAQ, not Article).

### 3.4 `ImageObject` `#primaryimage`

Use a real OG/screenshot asset that depicts the calculator UI (create/export one 1200×630 if missing). Properties: `url`, `width`, `height`, `caption`.

### 3.5 `FAQPage` (keep for AI — no SERP promise)

- Keep 6 visible FAQs in sync with JSON-LD (existing verifier contract).
- Optional: give each Question a stable `@id` (`#faq-1` …) for cleaner graphs.
- Align 1–2 FAQ titles with US PAA language where truthful:
  - “How do I calculate my chances of winning a raffle/sweepstakes?”
  - “What are my odds of winning a sweepstakes?”
  without inventing claims (“anything better than 1% is solid”) like PlayWithStakes.

### 3.6 `HowTo` (new — AI extraction)

Only if the page shows a clear 3–5 step block (add a short “How to use this calculator” section if missing):

1. Choose Known total or Estimate  
2. Enter your entries, pool (or estimate), and prizes  
3. Optionally open More options (free/paid, drawings)  
4. Calculate and read the billboard result + assumptions  

`HowTo` `@id` `#howto`; WebPage may `hasPart` → `#howto`. **No** HowTo rich-result expectation.

### 3.7 Explicitly out of scope for v1 of this plan

- Casino recommendation `ItemList` / `Product` / `Offer` markup  
- `AggregateRating` on the app  
- Co-typing the tool as `Article`  
- Site-wide Org `sameAs` Wikidata expansion (track under site schema plan Phases 5–6)

---

## 4. Entity graph (target)

```
Organization (#organization)
  ↑ publisher/creator
WebSite (#website)
  ↑ isPartOf
WebPage (#webpage)
  ├─ breadcrumb → BreadcrumbList
  ├─ author → Person (#person)
  ├─ primaryImageOfPage → ImageObject (#primaryimage)
  ├─ mainEntity → WebApplication (#app)
  │                 ├─ offers Offer(price:0 USD)
  │                 ├─ featureList[]
  │                 ├─ about/mentions Things (+ Wikidata where solid)
  │                 └─ screenshot → #primaryimage
  ├─ hasPart → HowTo (#howto)          [if visible steps ship]
  └─ (FAQ remains sibling node #faq with Question[])
```

---

## 5. Implementation plan (after approval)

1. **Content parity prep**  
   - Confirm/add visible How-to steps + primary image asset.  
   - Refresh FAQ copy for PAA overlap without compliance regressions.

2. **Code** (`src/lib/oddsPageSchema.ts`, maybe small `buildPageGraph` hook for WebPage `author` / `primaryImageOfPage`)  
   - Enrich `ODDS_WEB_APPLICATION`.  
   - Timezone dates + bump `dateModified`.  
   - Add `#primaryimage` + optional `#howto`.  
   - Keep single `@graph` emission.

3. **Verifiers**  
   - Extend `verify-sweepstakes-odds*.ts`: Offer price 0, featureList length, timezone dates, HowTo↔visible steps, no AggregateRating, mainEntity still `#app`.

4. **Validate**  
   - [Rich Results Test](https://search.google.com/test/rich-results) (expect Software App **partial** without rating/review).  
   - [Schema.org Validator](https://validator.schema.org).  
   - Confirm FAQ/HowTo still match visible DOM.

5. **Ship**  
   - Commit + push; re-test live JSON-LD; optional GSC URL inspection.

---

## 6. Success criteria (“best” definition)

| Criterion | Target |
|---|---|
| Tool typing | Only US top result with complete `WebApplication` + free Offer |
| Graph quality | Single `@graph`, all `@id`s resolve, author on page |
| Freshness | Timezone `dateModified` ≥ last meaningful page change |
| AI extractability | FAQ + HowTo + featureList + about/mentions present and visible |
| Compliance | No fake ratings, no Product spam on affiliates, FAQ not sold as rich result |
| Vs AI Overview peers | Match/exceed PlayWithStakes FAQ density + add correct tool entity they lack |

---

## 7. Decision needed

Approve this plan to implement as specified, or revise:

1. **Ship HowTo in the same PR** (needs a short visible steps section) vs **schema-only first** (Offer + featureList + image + dates + about).  
2. **Primary image source:** dedicated calculator OG screenshot vs reuse existing site OG.  
3. Confirm **no AggregateRating** until real tool reviews exist (recommended).
