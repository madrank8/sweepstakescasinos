# Task 6 Acceptance Report

Status: **DONE_WITH_CONCERNS**

Branch: `feat/sweepstakes-odds-calculator`  
Task base: `011ec9cf2b47b555064d82a6fc59de032ec6170e`  
Implementation commit: `a9e158c18b882fd0c7e361efb1fb87f7b9c1cf83` (`test: verify odds calculator integration`)  
Push: intentionally not performed.

## Files

- Added `scripts/verify-sweepstakes-odds-integration.ts`.
- Updated `package.json` with `verify:odds:integration` and the required post-build `ci` tail.
- Updated `.github/workflows/ci.yml` with a post-Build integration step.
- Updated `src/components/odds/OddsCalculator.astro` after keyboard QA exposed a prior-task tab-order defect.
- Updated `partials/trust.css` after 320px QA exposed a prior-task global-nav overflow.
- Added this report.
- No beads, SDD brief/spec/plan, git configuration, dependency, ranking, compliance, or feature-scope files were changed.

## Deterministic integration coverage

The post-build verifier now checks:

- exact package and CI command order, including the workflow step after Build;
- generated route existence and exact authored/generated route equality;
- generated calculator/recommendation/editorial section order;
- no-JS notice and retained editorial fallback copy;
- keyboard order, focus/error semantics, local-only calculation constraints, and reduced-motion CSS;
- exactly the three approved custom odds events and no numeric analytics properties;
- data-driven top-three ranking and review retention;
- one consolidated JSON-LD source, `#webpage`, `#breadcrumb`, `#app`, and `#faq`;
- shared visible FAQ/schema data, six FAQ pairs, and prohibited `Offer`, `Product`, `Review`, and `AggregateRating` nodes;
- exact one-time sitemap URL entries and authored-source Git `lastmod` dates;
- required tools links and the narrow-mobile navigation constraint.

## TDD evidence

### Registration red

Command:

```text
npx tsx scripts/verify-sweepstakes-odds-integration.ts
```

Exit `1`, expected failure:

```text
AssertionError [ERR_ASSERTION]: package script verify:odds:integration
+ actual - expected

+ undefined
- 'tsx scripts/verify-sweepstakes-odds-integration.ts'
```

After package and CI wiring:

```text
> tsx scripts/verify-sweepstakes-odds-integration.ts
verify-sweepstakes-odds-integration: OK
```

### Keyboard-order defect red/green

Browser observation before the fix:

```text
odds-entries → odds-pool → unknown-total checkbox → odds-prizes → More options → submit
```

The new verifier assertion then failed:

```text
AssertionError [ERR_ASSERTION]: keyboard order includes data-estimated-toggle
```

After the smallest markup/CSS reorder:

```text
odds-entries → odds-pool → odds-prizes → unknown-total checkbox → More options → submit
verify-sweepstakes-odds-integration: OK
```

### 320px overflow defect red/green

Before:

```json
{"viewport":320,"client":320,"scroll":356,"noHorizontalScroll":false}
```

The verifier then failed on the missing narrow-nav constraint. After constraining the inline-sized brand assets:

```json
{"viewport":320,"client":320,"scroll":320,"noHorizontalScroll":true,"grid":"196px","minTargets":[44,44,48,44,44,91]}
```

The verifier returned `verify-sweepstakes-odds-integration: OK`.

## Final automated gates

Executed in the required order:

```text
npm run content:lint
npm run methodology:check
npm run schema:verify
npm run verify:availability
npm run verify:odds
npm run build
npm run verify:odds:integration
npm run ci
```

The chained command exited `0`. Full captured output: `/tmp/task-6-final-gates.log`.

Exact terminal success output:

```text
✅ No unlabeled first-party (Class B) claims found.
✅ All 4 criteria (weights total 100%) match on every surface.
[verify-schema] OK — 36 static pages validated.
verify-schema-helpers: OK
✅ ALL CHECKS PASSED
verify-sweepstakes-odds: OK
[build] Complete!
verify-sweepstakes-odds-integration: OK
```

The final `npm run ci` also exited `0` and ended with:

```text
[build] Complete!

> sweepstakes-casinos-list-astro@1.0.0 verify:odds:integration
> tsx scripts/verify-sweepstakes-odds-integration.ts

verify-sweepstakes-odds-integration: OK
```

Observed non-failing existing messages:

```text
[WARN] [glob-loader] No files found matching "**/*.mdx" in directory "src/content/reviews"
[reader-reports] No Supabase creds — skipping aggregation (existing data file kept).
Note: evidence/testing-results.csv not found (optional until tests begin).
```

## Server HTML, geo, and schema

The required `npm run preview -- --host 127.0.0.1` command was attempted with `PUBLIC_DEV_GEO_STATE=TX` and exited `1`:

```text
[preview] The @astrojs/vercel adapter does not support the preview command.
```

Local behavioral QA therefore used the repository's generated Astro development server:

```text
PUBLIC_DEV_GEO_STATE=TX npm run astro:dev -- --host 127.0.0.1
astro v7.0.0 ready
Local http://127.0.0.1:4321/
```

Eligible and header-suppressed server responses were captured as `/tmp/odds-tx.html` and `/tmp/odds-ca.html`. The exact validation output was:

```text
eligible server HTML: 3 CTAs, editorial/no-JS retained, result hidden
suppressed server HTML: 0 CTAs, 3 reviews retained
odds JSON-LD: 1 block, 4 unique required IDs, 6 FAQ pairs, prohibited nodes absent
```

The graph contained exactly one each of:

- `https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#webpage`
- `https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#breadcrumb`
- `https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#app`
- `https://sweepstakeswiz.com/tools/sweepstakes-odds-calculator/#faq`

Every FAQ schema question/answer was found in visible HTML. No `Offer`, `Product`, `Review`, or `AggregateRating` type appeared.

## Browser and accessibility QA

All browser work used the mandated gstack `/browse` binary. Rendered content was treated as untrusted.

### Desktop keyboard sequence

- Every required control showed `rgb(251, 191, 36) solid 3px` focus outline.
- Final order: entries, pool, prizes, unknown-total, More options, submit.
- Known case:

```json
{"values":["1","5000","10"],"heading":"Your calculated chance is 1 in 500.","percent":"Calculated probability: 0.2%.","focused":true,"resultCount":1}
```

- Estimated toggle cleared only the pool, retained entries/prizes, changed the label, cleared stale state, and produced:

```text
Your estimated chance is about 1 in 400 to 1 in 625 (base estimate: 1 in 500).
Estimated probability range: 0.16% to 0.25%; base assumption 0.2%.
```

- Advanced keyboard case `F=2, M=5, N=100, K=1`, five drawings:

```text
Combined: 1 in 20 (5%)
Free-only current pool: 1 in 50 (2%)
No-purchase counterfactual: 1 in 48.5 (2.06%)
Five drawings: about 1 in 4.42 (22.6%)
```

- Closing both options disabled their fields; empty advanced values no longer participated in validation; base `5,100,1` remained unchanged.
- Empty submit focused the summary, produced three linked inline `Error:` messages, retained `aria-describedby`, and set `aria-invalid=true`.
- Activating the first summary link focused `#odds-entries`.
- Relational invalid case produced:

```text
Error: Total entries must include your entries, so it can’t be smaller than your entries.
Error: The number of prizes can’t be greater than the total entries.
```

- Recalculation retained one result region and replaced its content.
- `How this works` opened with Enter, closed/reopened with Space, and exposed the stated formula.

### Mobile keyboard sequence

At `390×844`, known, estimated, advanced, error-focus, and recalculation flows were repeated without pointer input:

```json
{"known":"Your calculated chance is 1 in 500.","percent":"Calculated probability: 0.2%.","focused":true,"noOverflow":true}
{"estimated":"Your estimated chance is about 1 in 400 to 1 in 625 (base estimate: 1 in 500).","focused":true,"noOverflow":true}
{"advanced":["1 in 20 (5%)","1 in 50 (2%)","1 in 48.5 (2.06%)"],"focused":true}
{"errorFocused":true,"errorPrefixes":true}
{"recalculated":"Your calculated chance is 1 in 20.","resultRegions":1}
```

### Responsive and geo

- `320×844`: one-column calculator, no horizontal page scroll after the fix, required controls at least 44px.
- `390×844`: one-column calculator, no horizontal page scroll.
- `1440×900`: three-column base form, no horizontal page scroll.
- CA browser response at `390×844`: `0` affiliate CTAs, `3` unavailable statuses, `3` review actions, editorial content retained.
- Console checks returned `(no console errors)`.
- Network checks showed normal page assets and existing GA requests, with no calculator input or result values.

### Screenshots read and visually checked

- `/tmp/task-6-desktop.png`
- `/tmp/task-6-390.png`
- `/tmp/task-6-320.png` (pre-fix overflow evidence)
- `/tmp/task-6-320-fixed.png`
- `/tmp/task-6-ca-suppressed-390.png`
- `/tmp/task-6-mobile-result.png`
- `/tmp/task-6-200-percent-zoom.png` (attempted CSS-zoom probe; not accepted as browser-zoom evidence)

## Privacy and analytics

Distinctive values: `123457`, `7654321`, `7`, `31`, `4`. Displayed derived values included `1 in 9.29`, `10.8%`, `1 in 35,300`, `0.00283%`, `1 in 34,700`, `0.00288%`, and repeated-drawing `36.6%`.

Observed custom event list:

```json
[
  ["event","odds_options_opened",{"option_name":"entry_mix"}],
  ["event","odds_options_opened",{"option_name":"multiple_drawings"}],
  ["event","odds_calculation_completed",{"pool_mode":"known","entry_mix_active":true,"multiple_drawings_active":true}],
  ["event","odds_casino_cta_clicked",{"casino_slug":"mcluck","placement":"odds-calculator"}]
]
```

- Each advanced option was opened, closed, and reopened; each emitted once per page view.
- One valid submit emitted one completion event.
- A following invalid submit left the completion count at one and focused the error summary.
- CTA activation emitted the approved slug/placement event.
- Source verification proves only `odds_calculation_completed`, `odds_options_opened`, and `odds_casino_cta_clicked` custom odds event names exist.
- No entered or derived value appeared in custom events, request URLs, console, cookies, local storage, session storage, or `window.dataLayer`.
- Existing GTM automatic events (`gtm.formInteract`, `gtm.formSubmit`, etc.) were present in `dataLayer`; they contained element metadata but no entered field values or calculated outputs.
- Local and session storage were `{}`. Cookies contained only existing `_ga` identifiers.
- With `window.gtag` forced to throw, calculation still returned `1 in 500`, same-document CTA navigation completed, and the console had no uncaught error.

## Acceptance matrix and self-review

- Post-build verifier and CI wiring: pass.
- Required command order and final `npm run ci`: pass.
- Generated component/editorial order: pass.
- No-JS/editorial server HTML: pass.
- Eligible/suppressed local geo responses: pass.
- Review retention and CTA suppression: pass.
- Consolidated schema IDs, FAQ parity, prohibited nodes: pass.
- Sitemap exact counts and authored lastmod: pass.
- Known, estimated, advanced, invalid, focus, recalculation flows: pass at desktop and 390px.
- 320/390/desktop responsive layouts: pass after the narrow-nav fix.
- Privacy and approved custom analytics: pass.
- Analytics failure isolation: pass.
- No browser-testing dependency: pass.
- Ranking/compliance remain data-driven and scope unchanged: pass.
- `git diff --check`: pass.
- Full diff review found only Task 6 files plus the two smallest QA-exposed prior-task fixes.

## Remaining concerns / external acceptance

1. No remote preview deployment was available: the branch has no upstream and the worktree has no `.vercel/project.json`; no deployment was created because the task did not authorize one. Remote `390×844` / `1440×900`, Vercel geo-header delivery, and remote gateway checks remain external acceptance.
2. The Vercel adapter rejects `astro preview`, so browser QA ran against generated Astro dev output rather than the built adapter artifact.
3. gstack denied `Emulation.setScriptExecutionDisabled`, `Emulation.setPageScaleFactor`, and `Emulation.setEmulatedMedia`. Browser-level JavaScript-disabled, actual 200% browser zoom, and emulated reduced-motion runs remain unexecuted. Server HTML proves no-JS content, standard 320px proves narrow reflow, and the verifier proves the reduced-motion CSS contract.
4. The build retains its pre-existing empty `src/content/reviews` glob warning.

## Review Fix 1

Status: **DONE_WITH_CONCERNS**
Implementation commit: `0ec31c1` (`fix: strengthen odds acceptance verifier`)

### Red/green evidence

Focused assertions were added before each implementation change:

```text
npm run verify:odds:integration
AssertionError: CI checkout must fetch full Git history for authoritative authored-source lastmod

npm run verify:odds:integration
AssertionError: expected src/lib/oddsPageSchema.ts

npm run verify:odds:integration
AssertionError: generated calculator route exactly matches authored route
```

The extraction also correctly exposed one stale Task 1-5 source assertion:

```text
npm run build
AssertionError: input did not match /applicationCategory: 'UtilitiesApplication'/
```

That assertion now executes against the shared production schema nodes instead of route source text.
Final exact success endings:

```text
npm run verify:odds
verify-sweepstakes-odds: OK

npm run build
[build] Complete!

npm run verify:odds:integration
verify-sweepstakes-odds-integration: OK

npm run ci
[build] Complete!
verify-sweepstakes-odds-integration: OK
```

All four final commands exited `0`.

### Changed files

- `.github/workflows/ci.yml`: checkout now uses `fetch-depth: 0`.
- `src/lib/oddsPageSchema.ts`: shared production metadata, FAQ, WebApplication nodes, and executable full-page graph factory.
- `src/routes/tools/sweepstakes-odds-calculator/index.astro`: consumes the shared page/schema inputs for layout, visible FAQ, and JSON-LD.
- `scripts/verify-sweepstakes-odds.ts`: preserves the pure verifier coverage through the shared production schema path.
- `scripts/verify-sweepstakes-odds-integration.ts`: verifies full Git history, actual graph output, both generated-route byte contracts, form structure, parsed authored links, dynamic rankings, and authored-source sitemap dates.

### Self-review

- The graph verifier counts each required type independently, asserts its exact canonical ID, verifies `WebPage.mainEntity`, resolves every internal fragment reference, compares FAQ graph output to the same data rendered visibly, and rejects prohibited types and visitor-derived fields/fixtures.
- The route must import and consume the verified module; duplicated dead schema/FAQ fixtures cannot satisfy the source contracts.
- Link checks parse HTML `href` attributes (and authored MDX link destinations) and require exactly one expected tools destination, so comments or unrelated text cannot pass.
- Ranking slugs are parsed from current `partnerSlugs`; review paths, partner resolution, ordering, and route consumption are verified without expected slug literals.
- The verifier rejects shallow repositories before sitemap assertions and reports missing per-source history explicitly; CI provides full history.
- `git diff --check`, focused verification, build, and complete CI passed. No dependencies, beads, SDD ledgers/briefs, compliance data, or ranking data changed.

The existing external concerns remain unchanged: no remote preview was available; the Vercel adapter does not support local `astro preview`; and true JavaScript-disabled, browser-level 200% zoom, and emulated reduced-motion modes remain external acceptance.
