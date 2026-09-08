# Preview Fix Report: Homepage no-deposit hub SSR suppression

## Bug
Preview QA found that the homepage contextual link to `/bonuses/no-deposit/` did not render. Root cause: `src/lib/affiliateHtml.ts` treats every `/bonuses/<slug>/` anchor as an operator CTA. `shouldRenderBonusCta('no-deposit', ...)` finds no partner and no editorial-outbound record for that slug, so it returns `false`; the transform replaces the hub anchor with the geo-suppressed note.

The same link rendered correctly in `/new/` because that Astro route does not pass through the homepage SSR affiliate transform.

## Fix (test-first)

### 1. Extended `scripts/verify-priority-seo-technical.ts`
- Imported the real `suppressAffiliateCtas` from `../src/lib/affiliateHtml` and `UsStateCode` from `../data/usStates`.
- Added assertions that the `/bonuses/no-deposit/` anchor survives `suppressAffiliateCtas` for:
  - `null` / unknown region
  - `CA` (site-banned state)
  - `TX` (allowed state)
- Added a guard assertion that a real operator CTA (`/bonuses/mcluck/`) is still suppressed in `CA` so the fix cannot bypass legal gating.

### 2. Observed RED before production fix
```
$ npx tsx scripts/verify-priority-seo-technical.ts
AssertionError: Homepage no-deposit hub must survive suppressAffiliateCtas in state null
```

### 3. Root-cause fix in `src/lib/affiliateHtml.ts`
Added an explicit `EDITORIAL_BONUS_HUBS` set containing `no-deposit` and returned the matching anchor unchanged in `suppressAffiliateCtas`, before any partner lookup, geo check, or clickId stamping. Operator `/bonuses/<operator>/` paths are unchanged.

```ts
const EDITORIAL_BONUS_HUBS = new Set(['no-deposit']);

export function suppressAffiliateCtas(...) {
  return html.replace(BONUS_ANCHOR, (match, slug: string) => {
    if (EDITORIAL_BONUS_HUBS.has(slug)) return match;
    ...
  });
}
```

## GREEN evidence

```
$ npx tsx scripts/verify-priority-seo-technical.ts
verify-priority-seo-technical: OK

$ npm run verify:availability
✅ ALL CHECKS PASSED

$ npm run tracker:lint
[tracker:lint] OK — tracker hub is affiliate-free.

$ npm run build
... build complete

$ npm run schema:check
[schema:check] OK — 89 built pages validated.

$ git diff --check
(no output)
```

## Files changed
- `src/lib/affiliateHtml.ts` — classify `/bonuses/no-deposit/` as an editorial hub route so it bypasses operator CTA suppression/stamping.
- `scripts/verify-priority-seo-technical.ts` — assert the hub anchor survives the SSR transform and that operator CTAs remain suppressed in banned states.

## Protected/unrelated files
No protected dirty files were touched. No generated crawl files were edited by hand. No design suppressions were modified.

## Concerns
None.
