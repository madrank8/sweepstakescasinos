# Sitewide JSON-LD Gap-Fill Design

> Status: Approved design, recovered and implemented  
> Date: 2026-08-19  
> Issue: `sw-fbz`

## Goal

Every indexable URL must render exactly one parseable
`<script type="application/ld+json">` containing one `@graph`. The graph joins
the canonical site foundation to page-specific content without changing the
visible page, affiliate routing, geo suppression, or existing content claims.

## Rendering surfaces

The site has two schema paths:

1. Root-authored legacy HTML is wrapped by generated Astro routes. Static pages
   pass through `getStaticHtml()` and affiliate pages pass through
   `prepareSsrAffiliateHtml()`. Both use `decorateChrome()`.
2. Native Astro and MDX routes render through `ContentLayout.astro`.

Legacy HTML therefore consolidates schema in `src/lib/pageChrome.ts`; native
routes build the same foundation through `buildPageGraph()` in
`src/lib/schema.ts`. Both paths serialize through `serializeJsonLd()`.

## Canonical graph

Stable identities remain:

- publisher: `https://sweepstakeswiz.com/#organization`
- publisher logo: `https://sweepstakeswiz.com/#logo`
- website: `https://sweepstakeswiz.com/#website`
- author: `https://sweepstakeswiz.com/author/ilija-milosevic/#person`
- page: `<canonical>#webpage`
- breadcrumbs: `<canonical>#breadcrumb`
- brand: `https://sweepstakeswiz.com/reviews/<slug>/#brand`

`buildPageGraph()` owns foundation definitions and resolves author and known
brand references on-page. The publisher logo dimensions come from the PNG IHDR,
using either the copied `public/` asset or its source-tree location. The final
breadcrumb `ListItem` has no `item`, because it represents the current page.

## Legacy consolidation

`consolidateJsonLd()`:

1. reads every legacy JSON-LD block and flattens existing graphs;
2. derives canonical URL, title, description, page type, main entity, and
   breadcrumbs from the document;
3. removes superseded foundation and known-brand definitions;
4. preserves content entities such as Review, FAQPage, ItemList, and images;
5. normalizes review rating data from visible editorial content;
6. builds one canonical graph and replaces every old block with one safely
   serialized block.

The marker makes repeated decoration a byte-for-byte no-op.

## Rating and aggregate rules

Review rich data uses only the score visibly presented in the verdict component
as `<number>/100`. It emits that value with `bestRating: 100` and
`worstRating: 0`. If no verdict `/100` exists, `reviewRating` is removed; a
visible or legacy five-star value is never converted.

Brand `AggregateRating` is generated only from approved reader-report
aggregates with at least ten reports and a non-null average. The committed empty
dataset produces no aggregate rating.

## State entities

`src/data/usStates.ts` contains an exhaustive mapping for all 50 states and the
District of Columbia. The 51 Q-ids were checked against Wikidata's entity API.
`stateWikidataIri()` returns the canonical entity IRI, and every state Article
uses that state entity in `about`. The same IRI identifies legislation
jurisdiction even when fallback tracker rows have no Wikidata value.

## Safety and acceptance

The shared serializer escapes `<`, U+2028, and U+2029. After each build,
`scripts/verify-schema-built.ts` reads static output and invokes the built
server handler for SSR sitemap URLs. It checks:

- one parseable graph per indexable page;
- required foundation IDs and resolvable same-origin references;
- no duplicate definitions;
- visible-score and Review parity;
- safe script serialization and tracking-free schema URLs;
- final-breadcrumb shape;
- reader-report aggregate gating.

The gate runs immediately after `npm run build` in `npm run ci`.
