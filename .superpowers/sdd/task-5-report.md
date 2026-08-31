# Task 5 Report: Commercial Hubs and Internal-Link Graph

## Status

COMPLETE. Task 5 is implemented and verified on `cursor/seo-coherence-5d71`. No new route was created, no sitemap/source mapping was changed, and nothing was pushed.

## Commits

- `ff04864` — `feat: add deterministic contextual link graph`
- `a64f363` — `feat: defer unsupported commercial hubs`
- `1714410` — `test: add rendered internal-link crawl`
- `7e6c63e` — `docs: record deterministic commercial link audit`
- `4cbea9e` — `chore: run internal-link checks in ci`
- `65f8013` — `fix: preserve editorial bonus hub links`
- `bc429ba` — `fix: avoid redirecting internal research links`

## TDD red/green evidence

1. Review graph RED: `npx tsx scripts/verify-internal-links.test.ts` failed with `ERR_MODULE_NOT_FOUND` for `src/lib/internalLinks`.
   GREEN: the focused suite passed with `29 reviews, 12 Texas review links`.
2. Article, hub-gate, and crawl RED:
   - missing `contextualLinksForArticle` export;
   - missing `evaluateCommercialHubCandidates` export;
   - missing `rendered-link-crawl` module.
   GREEN: internal-link, SEO audit, and rendered-crawl unit suites all passed.
3. Sitemap parsing RED: the crawl test failed because `parseSitemapPaths` did not exist.
   GREEN: the parser test passed with both `/` and `/reviews/example/`.
4. Deterministic report RED: audit tests failed until generated reports included review-block counts, redirect-only orphan handling, and explicit hub deferrals.
   GREEN: `seo audit tests: OK — 29 reviews, 4 homepage cards, 57 claim matches`.
5. Integration RED: the first full CI run failed the pre-existing SSR idempotence assertion. Root-cause tracing showed the second SSR pass mistook the editorial `/bonuses/no-deposit/` hub link for an affiliate gateway CTA and suppressed it.
   GREEN: `/bonuses/no-deposit/` is explicitly preserved as editorial navigation; operator, availability, internal-link, and final full CI suites pass.
6. Live crawl RED: the first rendered crawl found mirrored font assets misclassified as pages and three source links to redirect-only `/states/`.
   GREEN: mirrored assets are excluded and those links now target `/state-legality/`; the final crawl has no failures.

## Hub gate decisions

No candidate passed every approval gate.

- **DEFER — Fastest payout sweepstakes casinos.**
  - Canonical coverage fails: 17/29 records have verified timing text, but 0/29 have a normalized comparable payout-duration metric.
  - Freshness fails: 0/29 have a verified `lastVerifiedDate`.
  - Distinct intent, competing URL, internal-link source, and review-conversion gates otherwise pass.
- **DEFER — Most free Sweeps Coins.**
  - Canonical coverage fails: 24/29 records have a verified signup offer.
  - Freshness fails: 0/29 have a verified `lastVerifiedDate`.
  - Distinct-intent and competing-URL gates fail because `/bonuses/no-deposit/` already serves this intent.
  - Internal-link source and review-conversion gates pass.

No thin page, filter permutation, payout superlative, or bonus superlative route was created.

## Link-selector rules and counts

- All 29 legacy reviews receive one idempotent contextual-navigation block through both static and SSR pipelines.
- The deterministic audit selects 169 review destinations before nearby-link de-duplication.
- Each review can receive up to two alternatives, labeled “Related review”; no “better” claim is made.
- Similarity uses only verified canonical relationships:
  - same operator identity: weight 8;
  - exact cash or gift-card minimum: weight 4;
  - shared redemption mode: weight 1;
  - overlapping payment methods: weight 1 each;
  - same verified launch year: weight 1.
- Ties use slug ascending. Affiliate CPA, deal model, tracking URL, and input/source order are absent from selection.
- State review links filter on the existing availability facade and sort by canonical review label, then slug. The Texas fixture returns 12 links even when affiliate CPA and source order are reversed.
- Known-state reviews link to `/states/<slug>/`; unknown region links to `/state-legality/` with availability-context wording and no legality implication.
- Every state template links `/reviews/`, `/best/sweepstakes-casinos/`, `/state-legality/`, and eligible reviews when available.
- Guide and news article templates link their parent/topic hub plus a context-appropriate commercial or state destination.
- Redirect-only `/best/` is excluded from content-orphan findings.

## Test, CI, and crawl summary

- Focused tests:
  - `npm run verify:internal-links` — PASS
  - `npm run operator:test` — PASS
  - `npm run verify:availability` — PASS
  - `npm run seo:audit:test` — PASS
- Deterministic SEO audit — PASS:
  - 103 authored routes;
  - 1,479 authored internal-link occurrences;
  - 0 missing targets;
  - 0 content-orphan candidates.
- Final `npm run ci` — PASS:
  - all availability, operator, content, tracker, methodology, odds, schema, and overclaim gates passed;
  - build succeeded;
  - 115 indexable built pages passed rendered schema validation.
- Final rendered crawl — PASS:
  - 123 fetched/rendered pages;
  - 6,055 internal link occurrences;
  - 0 missing targets;
  - 0 unintended redirects;
  - 0 duplicate contextual-block destinations;
  - 0 hierarchy failures;
  - 0 important commercial pages without inbound links.

## Self-review

- Confirmed all four requested SEO documents exactly match deterministic audit output.
- Confirmed source review content is preserved and block injection is idempotent.
- Confirmed both static and SSR review rendering behavior.
- Confirmed no route, redirect, canonical, affiliate tracking, ranking evidence, or legal conclusion was changed.
- Confirmed sitemap and route-source mappings remain unchanged because no route changed.
- Did not edit the attached brief/plan, beads, instructions, progress/controller ledger, or the pre-existing untracked `.playwright-mcp/` directory.

## Concerns

- `lastVerifiedDate` remains missing for all 29 operators, so freshness-dependent commercial superlatives must remain deferred.
- Canonical payout timings are prose, not normalized comparable durations.
- The audit still reports 23 source schema-score mismatches tied to existing unresolved score records; Task 5 does not resolve or rank from them.
- First-party testing evidence remains at 0 CSV rows, and all 29 testing brands remain pending.
- CI has no Supabase credentials, so reader-report aggregation correctly retained the existing generated data.
- Astro continues to warn that `src/content/reviews` has no MDX files; the 29 legacy HTML reviews are intentionally rendered through the static/SSR compatibility pipelines.
