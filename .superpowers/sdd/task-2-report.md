# Task 2 Report: Canonical Operator Facts and Validation

## Status

COMPLETE. The repository now has a provenance-bearing canonical editorial
operator contract for all 29 review slugs, complete schema identity coverage,
conflict-safe canonical selectors, legacy-review injection in both rendering
pipelines, mandatory consistency gates, and native hub consumers.

## Commits

- `66a5bec` — `test: define canonical operator contract`
- `47050d8` — `feat: add canonical operator facts`
- `0d1e63a` — `feat: inject canonical facts into legacy reviews`
- `ced7192` — `test: require operator build integration`
- `939efeb` — `feat: consume canonical facts across hubs`
- `e149fcc` — `test: enforce canonical review ratings`
- `99bd69b` — `docs: record canonical conflict disposition`
- `b02e782` — `chore: refresh operator sitemap dates`
- `ddbcf46` — `test: expose unresolved score rendering`
- `0a6a0c2` — `fix: omit unresolved scores from rendered reviews`
- `4ff2006` — `test: validate rendered canonical score selectors`
- The report is committed in the commit containing this file.

## Red/green evidence

### Canonical contract

RED:

```text
npx tsx scripts/verify-operator-consistency.test.ts
ERR_MODULE_NOT_FOUND: Cannot find module '/workspace/src/data/operators'
```

GREEN:

```text
npm run operator:test && npm run operator:verify
verify-operator-consistency tests: OK — 29 records, markers, validation, rendering
[verify-operator-consistency] OK — 29 canonical operators validated.
```

### Build and hub integration

RED:

```text
npx tsx scripts/verify-operator-consistency.test.ts
AssertionError: prebuild did not match /operator:verify/
```

GREEN:

```text
npm run operator:test && npm run operator:verify
exit 0
```

The focused contract verifies `prebuild`/`ci`, canonical imports in `/new/`,
`/best/[slug]/`, and `/bonuses/no-deposit/`, and the absence of duplicated
signup literals in the no-deposit route.

### Conflict-safe rendering

RED:

```text
npm run operator:test
AssertionError: unresolved McLuck 88/100 remained in the marked verdict output
```

GREEN:

```text
npm run operator:test
verify-operator-consistency tests: OK — 29 records, markers, validation, rendering
```

The injector replaces the primary marked legacy score display with an explicit
unresolved state and emits neither a canonical score selector nor a Review
rating when the score conflict remains unresolved.

### Existing schema gates

The first schema regression run correctly exposed old assumptions that every
visible legacy `/100` value should become schema. Tests and the built gate now
require the generated `data-canonical-field="editorScore100"` selector instead.

```text
npm run schema:verify
[verify-schema] OK — 36 static pages validated.
verify-schema-helpers: OK

npm run schema:check
[verify-schema-built] OK — 114 indexable built pages validated.
```

## Data coverage by field/status

| Field | Verified | Unresolved | Missing |
|---|---:|---:|---:|
| name | 29 | 0 | 0 |
| operatorName | 29 | 0 | 0 |
| launchDate | 15 | 0 | 14 |
| signupOffer | 24 | 4 | 1 |
| dailyOffer | 18 | 0 | 11 |
| cashRedemptionMinimum | 22 | 0 | 7 |
| giftCardRedemptionMinimum | 13 | 0 | 16 |
| publishedRedemptionTiming | 17 | 0 | 12 |
| paymentMethods | 19 | 0 | 10 |
| gameCount | 18 | 0 | 11 |
| externalRatings | 4 | 0 | 25 |
| editorScore100 | 4 | 25 | 0 |
| lastVerifiedDate | 0 | 0 | 29 |

All verified values carry a source plus publication/verification date.
Third-party ratings independently carry source name, value, scale, URL, and
as-of date. Review publication dates were not relabeled as fact-verification
dates, so `lastVerifiedDate` remains explicitly missing.

## Integration surfaces

- `src/data/operators.ts`: editorial facts, explicit status, and provenance.
- `src/data/affiliates.ts`: unchanged commercial relationships and operator
  restrictions.
- `src/data/brandEntities.ts`: 29 schema identities, official URLs, richer
  existing `sameAs` values, operator identity, addresses, and provenance.
- `src/lib/operatorFactsHtml.ts`: idempotent declarative marker injector.
- `src/lib/staticHtml.js`: canonical injection before JSON-LD consolidation on
  static review builds.
- `src/lib/affiliateHtml.ts`: canonical injection before JSON-LD consolidation
  on SSR affiliate review renders.
- All 29 `reviews/*.html` files declare their operator and canonical fields.
- `/new/`, `/best/[slug]/`, and `/bonuses/no-deposit/` consume canonical names
  or facts; unresolved no-deposit values render as not canonicalized.
- `scripts/verify-operator-consistency.ts`: checks coverage, duplicates, scores,
  dates, provenance, external scales/URLs, state codes, unsupported
  superlatives, source identity parity, conflict disposition, markers, and
  rendered selectors.
- `prebuild` and `ci`: both require operator validation; CI also runs the
  focused operator contract.

## Full CI

```text
npm run ci
exit 0
```

All availability, SEO audit, operator, content, tracker, methodology, odds,
testing-evidence, overclaim, Astro build, 114-page built-schema, and odds
integration gates passed.

Non-failing environment notices were unchanged: the optional review MDX
collection is empty, and reader-report aggregation retained committed data
because local Supabase credentials are absent.

## Self-review

- Verified exactly 29 unique operator records, 29 unique authored review slugs,
  and 29 resolving brand identities.
- Confirmed the 29 existing operator conflicts remain in the audit and are not
  promoted to verified canonical fields.
- Confirmed five-star source values remain conflict evidence only and are never
  converted into `editorScore100`.
- Confirmed deterministic `operator-data-conflicts.md` and `schema-audit.md`
  output exactly matches the audit renderer.
- Confirmed generated and authored boundaries remain intact: review HTML stays
  authored, `src/pages/` remains generator-owned, and injection runs through the
  established static/SSR wrappers.
- Compared all changed paths to the starting branch. No `.beads`, attached
  brief/plan, instruction file, or controller ledger was edited.
- No push was performed.

## Concerns

- Twenty-five editorial scores and four signup offers remain intentionally
  unresolved. Their legacy source evidence remains available for audit, while
  canonical selectors and Review ratings omit those values.
- Fourteen launch dates, 25 complete third-party ratings, and all 29
  fact-verification dates remain explicitly missing because the repository does
  not provide sufficient non-conflicting evidence in the required shape.
- Legacy prose outside canonical selectors can still describe historical
  source values. The canonical panel and schema do not expose those values as
  resolved facts.
