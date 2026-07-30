# Final Review Fix Report

Date: 2026-07-30  
Branch: `feat/sweepstakes-odds-calculator`  
Starting head: `fb34ba895572e441d8ad0637dbea36cf5065469e`

## Outcome

All Critical and Important findings were addressed. Low-risk Minor findings A, B, D, E, G, H, and J were fixed. Minor C was intentionally left unchanged because the approved requirement mandates field-level issues before cross-field issues. Minor F was deferred to avoid changing the broader CI execution model during a final correctness wave; command membership and relative ordering are now verified semantically. Minor I was documentation-only by instruction.

No push was performed. No beads files, git configuration, SDD brief, or SDD ledger were changed in the target worktree.

## Commits

- `23858e0` — `fix: cap odds calculations and honest formatting`
- `6ab57e0` — `fix: harden odds calculator accessibility and resilience`

## Findings Addressed

### Critical

1. **Calculation freeze**
   - Added a 1,000,000-iteration ceiling to the exact-product path.
   - `exactWinProbability` now throws a clear `RangeError` before an oversized product.
   - `validateCalculatorInput` now emits `calculation_too_large` with the deterministic instant-calculation message.
   - Validation covers known, estimated, and entry-mix scenarios while preserving billion-entry inputs when the shorter product is small.

2. **Native form query leakage**
   - The calculator form now uses `method="dialog"` with no `action`.
   - Source and integration verifiers assert both properties.
   - Browser QA verified controller-backed Enter/button calculations and cloned controller-free Enter/button submissions stayed on the same clean URL.

3. **False certainty formatting**
   - Literal certainty remains exclusive to `probability === 1`.
   - Near-certain values now return `Almost certain`, `>99.9%`, and `approximate: true`.
   - Regression coverage includes `0.9996` and `1 - 1e-12`.

### Important

4. **Reduced motion**
   - Added an html-level `scroll-behavior: auto !important` override in `partials/trust.css`.
   - Removed the ineffective component descendant rule.
   - Replaced minified-source pinning with semantic declaration checks.

5. **Hidden live-region writes**
   - Result and alert regions are unhidden before their announced content is populated.
   - Bounded function/callback extraction verifies operation order.

6. **Ranking-caused SSR failure**
   - Request-time ranking resolution now returns an `OddsRecommendationTuple` or `null`.
   - Recommendation cards and derived contextual review links are omitted when ranking data is unavailable.
   - Build verification enforces published, non-draft ranking data, at least three valid slugs, review existence, uniqueness, and partner resolution.

7. **Contextual review coupling**
   - Fixed nav/footer/guide/no-deposit obligations remain explicit.
   - Review-page coverage now scans all authored HTML reviews and requires at least three exact calculator links independently of ranking.

8. **Closed advanced errors**
   - `showErrors` opens each errored control’s ancestor `details` before moving focus to the summary.
   - Browser QA confirmed a closed advanced section reopened and exposed the invalid free-entry control.

9. **Opposite estimated bound order**
   - Added `formatEstimatedProbabilityRange`.
   - Reciprocal and percentage displays now both run best to worst.
   - The pinned example is `1 in 400 to 1 in 625` and `0.25% to 0.16%`.

10. **Estimated-mode semantics**
    - Added a stable toggle ID, `aria-controls="odds-pool"`, and programmatic instructions.
    - The dynamic pool hint is a polite status region that announces assumption changes.
    - Existing keyboard order remains verified.

11. **Verifier false confidence**
    - CI verification now checks command membership and relative order.
    - Function wiring checks use bounded body extraction.
    - Self-referential verifier-source checks were removed.
    - Reduced-motion and narrow-nav CSS checks inspect parsed declarations.
    - Positive analytics, privacy, schema, form-order, ranking, and generated-route contracts remain.

## Minor Triage

- **A — fixed:** dedicated percentage formatting preserves three significant digits down to the existing `<0.000001%` floor. `3.456e-8` renders as `0.00000346%`.
- **B — fixed:** integration verification enforces `ODDS_DATE_MODIFIED` equality with the calculator sitemap `lastmod`, without runtime git access.
- **C — intentionally unchanged:** approved ordering remains all field-level issues first, followed by cross-field issues.
- **D — fixed:** result invalidation listeners are wired through `RESULT_INVALIDATING_INPUT_IDS`.
- **E — fixed:** estimated entry-mix UI calculates the displayed base-pool comparison directly; the all-band helper remains available and tested.
- **F — deferred:** CI still has duplicated prebuild gates. The duplication is harmless, explicit, and outside the correctness fixes; changing execution ownership here would broaden release risk.
- **G — fixed:** shallow-history and authored-lastmod git failures now receive clear contextual wrapper messages.
- **H — fixed:** contextual operator review links derive from resolved `topPartners` and disappear with unavailable ranking data.
- **I — deferred by instruction:** no historical sitemap artifact architecture changes were attempted.
- **J — fixed:** the result heading is now `h3`, with CSS and verifier expectations updated.

## Red Evidence

1. `npm run verify:odds`
   - Exit 1.
   - `Missing expected exception: direct exact calculations above the product-iteration cap must fail fast`.

2. `npm run verify:odds`
   - Exit 1.
   - `SyntaxError: ... oddsCalculatorUi does not provide an export named 'formatEstimatedProbabilityRange'`.

3. `npm run verify:odds`
   - Exit 1.
   - Form contract expected `method="dialog"` but received `<form data-odds-form novalidate>`.

4. `npm run verify:odds:integration`
   - Exit 1.
   - Reduced-motion contract found the old component-scoped media rule.

5. `npm run verify:odds`
   - Exit 1.
   - Graceful-route contract found request-time `throw new Error` branches.

## Green Evidence

Focused:

- `npm run verify:odds` — `verify-sweepstakes-odds: OK`
- `npm run build` — exit 0, `[build] Complete!`
- `npm run verify:odds:integration` — `verify-sweepstakes-odds-integration: OK`

Final chained run after both commits:

- `npm run verify:odds` — exit 0
- `npm run build` — exit 0
- `npm run verify:odds:integration` — exit 0
- `npm run ci` — exit 0
- Overall elapsed time: 19.145s

The build emitted the existing warning that `src/content/reviews` contains no MDX files; authored review coverage is HTML-based and all gates passed.

## Browser Evidence

Local Astro dev server, Texas development geo, tested through mandated gstack browse:

- Form inspection: `{"method":"dialog","action":null}`.
- Normal Enter: result visible, `Your calculated chance is 1 in 500.`, `0.2%`, result heading focused, URL unchanged.
- Normal button: result visible, updated `about 1 in 250`, heading focused, URL unchanged.
- Estimated mode: live hint changed to the 0.8×/1.25× assumption; result displayed `1 in 400 to 1 in 625` and `0.25% to 0.16%`; heading focused.
- Invalid advanced input: previously closed `details` reopened, alert and inline error became visible, free-entry control was visible, error summary received focus.
- Controller-free cloned form, button: URL remained clean and unchanged; no action attribute.
- Controller-free cloned form, Enter: URL remained clean and unchanged; no network request.
- Console: no calculation errors.
- Storage: empty localStorage and sessionStorage.
- Network: no entered counts or derived probability appeared in URLs or requests. Existing Google Analytics page-view/form-start requests were observed without entered values.

## Remaining Concerns

- CI/prebuild gate duplication remains as documented in Minor F.
- Historical sitemap churn remains as documented in Minor I.
- The build’s pre-existing empty-MDX-review warning remains; HTML review pages are verified separately.

## Whole-Branch Re-review Fix

### Commit

- `24f2121` — `fix: close remaining odds review gaps`

### Files

- `src/lib/sweepstakesOdds.ts`
- `src/lib/oddsCalculatorUi.ts`
- `src/components/odds/OddsCalculator.astro`
- `scripts/verify-sweepstakes-odds.ts`
- `scripts/verify-sweepstakes-odds-integration.ts`

### Red Evidence

- `npm run verify:odds` exited 1: `oddsCalculatorUi` did not provide the new `formatEstimatedChanceHeadline` export.
- `npm run verify:odds:integration` exited 1 after the contract harness was corrected: `AssertionError: no-JS notice appears before the form`.

### Green Evidence

- `npm run verify:odds` — exit 0, `verify-sweepstakes-odds: OK`.
- `npm run build` — exit 0.
- `npm run verify:odds:integration` — exit 0, `verify-sweepstakes-odds-integration: OK`.
- `npm run ci` — exit 0.
- Ordering contracts now use a guarded `assertOrder`; a mutation assertion confirms deleting the before-statement fails.
- Date contracts preserve ISO validation, require `datePublished <= dateModified <= sitemap lastmod`, retain authored-source git checks, and prove a later git lastmod remains valid.

### Browser Evidence

Focused local QA used mandated gstack browse:

- Known near certainty, Enter: `Almost certain under these inputs (>99.9%).`.
- Estimated near certainty, button: `Your estimated chance ranges from almost certain under the low-pool assumption to 1 in 1.56 (base estimate: 1 in 1.25).`.
- Normal button: `Your calculated chance is 1 in 500.` with `0.2%`; result heading received focus.
- Server HTML: no-JS notice precedes the single form and retains its existing fallback copy.
- Advanced error: closed details reopened, alert and inline error appeared, stale result hid, and summary received focus.
- Privacy: URL stayed query-free, storage remained empty, and calculation submission produced no network requests.
- Console: no errors.

### Remaining Concerns

- Deferred by instruction: duplicated CI/prebuild work.
- Deferred by instruction: generated sitemap churn.
- Deferred: a committed-artifact lastmod assertion remains near-tautological; no change was made because improving it would destabilize generation without adding reliable independent evidence.
