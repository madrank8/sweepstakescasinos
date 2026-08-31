# Task 3 Report: Availability, Legal Freshness, and Trust Consistency

## Status

COMPLETE. A typed availability facade now consumes, but does not merge, the
three existing authorities: tracker records for displayed legal status and
freshness, `geo.ts` for site CTA policy, and `affiliates.ts` for commercial
partner availability. All migrated CTA paths share the same fail-closed
decision, all 51 state routes reconcile, review summaries label each authority,
and missing verification dates remain missing.

## Commits

- `39b1629` — `test: define availability facade contract`
- `18ccaa6` — `feat: add three-authority availability facade`
- `e162b20` — `refactor: route availability consumers through facade`
- `677e488` — `test: distinguish review availability authorities`
- `6f6a0d9` — `feat: separate review availability summaries`
- `c900705` — `test: require state freshness schema parity`
- `31cd2b6` — `fix: ground state legal freshness in tracker`
- `927399d` — `test: require canonical trust fact consumers`
- `5159249` — `refactor: centralize publisher trust facts`
- `ba72478` — `test: prevent tracker correlation bypass`
- `6d7173f` — `refactor: delegate tracker correlation to facade`
- `c22fa78` — `chore: refresh availability sitemap date`
- `6722e2b` — `test: keep missing offer verification explicit`
- `6df15ef` — `fix: preserve missing offer verification dates`
- `3c4d429` — `test: prevent site policy legal wording`
- `b813678` — `fix: separate state offer and legal copy`
- The report is committed in the commit containing this file.

## Red/green evidence

### Facade and reconciliation

RED:

```text
npx tsx scripts/verify-availability.test.ts
ERR_MODULE_NOT_FOUND: Cannot find module '/workspace/src/lib/availability'
```

After the facade existed, the same contract remained red until every named
consumer migrated:

```text
AssertionError: src/components/AffiliateLink.astro must consume the facade
```

GREEN:

```text
npm run verify:availability
verify-availability tests: OK — 51 jurisdictions, 13 partners, unified CTA facade
51 jurisdictions and 13 partners reconcile without invalid references
six tracker/site-policy differences remain distinct
ALL CHECKS PASSED
```

### Review availability and freshness

RED:

```text
AssertionError: expected /Location unknown/
Legal status last verified: <time datetime="[object Object]">[object Object]</time>

AssertionError: expected /Affiliate offer availability: available/
```

Missing freshness also initially rendered `datetime="null"`, and state pages
initially preferred MDX publication metadata over tracker freshness.

GREEN:

```text
npm run schema:verify
[verify-schema] OK — 36 static pages validated.
verify-schema-helpers: OK

npm run operator:test
verify-operator-consistency tests: OK — 29 records, markers, validation, rendering
```

Review summaries now show tracker legal status/freshness, affiliate commercial
availability, and site CTA policy as separate lines. Unknown location remains
unknown. Missing tracker or operator verification dates render as unavailable
and never inherit build or page dates.

### Trust facts and wording

RED:

```text
TypeError: Cannot read properties of undefined (reading 'organization')
AssertionError: legacy tracker correlation helpers must delegate to the facade
AssertionError: expected /operator\.lastVerifiedDate/
AssertionError: expected /site CTA policy is separate from the tracker legal status/i
```

GREEN:

```text
npm run schema:verify
[verify-schema] OK — 36 static pages validated.
verify-schema-helpers: OK

npm run verify:availability
ALL CHECKS PASSED
```

`site.ts` now owns publisher name/alternate name/description, author identity
and description, contact facts, and stable publisher IDs. Shared schema,
layout, and injected trust-ribbon consumers use those facts.

## Consumers migrated

- `AffiliateLink.astro`
- partner and editorial bonus gateway decisions
- legacy/static-HTML CTA suppression through `affiliateHtml.ts`
- odds-calculator recommendation eligibility
- comparison hub cards
- no-deposit offer table and suppressed-state inventory
- all state-page operator lists and state CTA presentation
- state-legality hub counts/statuses
- tracker correlation compatibility helper
- SSR review availability summaries, with live tracker state passed by generated
  wrappers

Tracking URLs and the literal Gemified `&clickId=` behavior are unchanged.

## Reconciliation counts

- 51 unique jurisdictions covered; 0 missing and 0 invalid.
- 13 affiliate partners; all state references valid.
- 0 validation errors.
- 13 warnings: 6 tracker-vs-site-policy differences, 6 corresponding
  CTA/display disagreements, and 1 impossible commercial intersection.
- The six state differences are CA, FL, IN, ME, MS, and TN. No authority was
  selected as the resolution.
- Card Crush is commercially permitted by the affiliate authority only in CA
  and NY, while site policy suppresses both. It therefore has 0 CTA-eligible
  jurisdictions under current policy; the report explicitly says this is not a
  legal conclusion.
- `docs/seo/state-legality-conflicts.md` exactly matches deterministic renderer
  output.

## Full CI

```text
npm run ci
exit 0
```

All availability/reconciliation, SEO audit, operator, schema, content,
tracker-purity, methodology, odds, testing-evidence, Astro build, 114-page
built-schema, and odds integration gates passed.

The unchanged non-failing notices are that the optional review MDX collection
is empty and reader-report aggregation retained committed data because local
Supabase credentials are absent.

## Self-review

- Confirmed CTA decisions for allowed, site-suppressed, partner-restricted, and
  unknown regions across component, transformed HTML, gateway, hub, and odds
  paths.
- Confirmed unknown regions remain fail-closed and tracking parameters remain
  byte-for-byte compatible with the existing gateway convention.
- Confirmed state visible freshness and Article/WebPage `dateModified` use the
  same tracker value.
- Confirmed page publication metadata no longer substitutes for legal or
  operator verification.
- Confirmed the fallback snapshot uses its fixed repository snapshot timestamp,
  not build time.
- Confirmed no attached brief/plan, beads data, instructions, or controller
  ledger changed.
- `git diff --check 845cdee..HEAD` passed.
- No push was performed.

## Concerns

- The committed degraded tracker fallback is a snapshot dated 2026-07-12.
  Supabase data supersedes it when credentials are available; deployments using
  fallback should visibly be treated as degraded and re-verified.
- All 29 canonical operator `lastVerifiedDate` facts remain missing because the
  repository has no qualifying source dates. The no-deposit table now says
  “Verification unavailable” instead of borrowing its July publication date.
- The six tracker/site-policy differences and Card Crush commercial
  intersection remain review warnings, not guessed resolutions.
- The committed fallback has no tracker operator-availability rows. Validation
  supports those references and freshness fields when live rows are supplied,
  but deterministic offline reconciliation cannot compare absent rows.
