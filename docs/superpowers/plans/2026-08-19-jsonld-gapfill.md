# Sitewide JSON-LD Gap-Fill Implementation Plan

> Status: Recovered and executed  
> Design: `docs/superpowers/specs/2026-08-19-jsonld-gapfill-design.md`  
> Issue: `sw-fbz`

**Goal:** Consolidate every indexable legacy and native page into one safe,
resolvable JSON-LD graph while retaining existing content schema.

**Architecture:** Keep `src/lib/schema.ts` as the graph and identity source of
truth. Normalize root HTML in `src/lib/pageChrome.ts`; render native routes
through `ContentLayout.astro`; validate static and SSR artifacts from the Vercel
build output.

## 1. Establish focused failing coverage

Modify `scripts/verify-schema-helpers.ts` first.

1. Assert the final breadcrumb omits `item`.
2. Specify the safe serializer API and escaping behavior.
3. Assert source and copied-public PNG dimension lookup.
4. Assert exhaustive state-to-Wikidata coverage and stable IRIs.
5. Specify the ten-report aggregate-rating boundary.
6. Exercise multi-block legacy consolidation, content preservation,
   `/100` rating normalization, no-score removal, and idempotence.
7. Run `npx tsx scripts/verify-schema-helpers.ts` and confirm failure on the
   current-page breadcrumb assertion before changing production code.

Suggested commit: `test: cover sitewide JSON-LD gap fill`

## 2. Implement shared graph helpers

Modify:

- `src/lib/schema.ts`
- `src/lib/pngDimensions.ts`
- `src/lib/brandAggregateRating.ts`
- `src/data/usStates.ts`

Steps:

1. Add `serializeJsonLd()` with HTML-safe character escaping.
2. Read publisher logo dimensions from the PNG.
3. Remove `item` from the final breadcrumb.
4. Add reader-report aggregate gating and attach only eligible brand ratings.
5. Add the verified 51-jurisdiction Wikidata mapping and IRI helper.

## 3. Consolidate legacy and native output

Modify:

- `src/lib/pageChrome.ts`
- `src/layouts/ContentLayout.astro`
- `src/routes/states/[slug].astro`

Steps:

1. Parse and flatten all legacy JSON-LD blocks.
2. Preserve content nodes while replacing superseded foundation and known
   brand definitions.
3. Parse only visible verdict `/100` scores for Review schema.
4. Build and inject one marked graph; make a marked document a no-op.
5. Use the shared serializer in the native layout.
6. Add the canonical state entity to state Article `about` and legislation
   jurisdiction.
7. Run `npm run schema:verify`; expect both schema verifiers to pass.

Suggested commit: `feat: consolidate sitewide JSON-LD graphs`

## 4. Add post-build acceptance

Create `scripts/verify-schema-built.ts` and modify `package.json`.

1. Read all indexable URLs from the built sitemap.
2. Read prerendered files from `.vercel/output/static`.
3. Render non-prerendered URLs through the built Vercel handler.
4. Enforce graph count, parsing, stable IDs, reference resolution, rating
   parity, safe serialization, clean URLs, breadcrumb shape, and aggregate
   gating.
5. Register `schema:check` after `build` in `npm run ci`.
6. Run `npm run build && npm run schema:check`; expect every sitemap URL to
   pass.

Suggested commit: `test: verify JSON-LD across built pages`

## 5. Final verification

Run:

```bash
npm run schema:verify
npm run build
npm run schema:check
npm run ci
```

Confirm generated sitemap changes reflect the modified shared state route.
Review the final diff for invented facts, rating-scale conversion, duplicate
IDs, unsafe literals, tracking parameters, and changes outside Task 0.
