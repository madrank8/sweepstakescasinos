# Task 6 Report: Review Standardization and Evidence-Gated Information Gain

## Status

COMPLETE on `cursor/seo-coherence-5d71`. All 29 legacy review URLs remain in
place and render through the existing 2 static / 27 SSR split. No redemption
results route or production result metric was created. Nothing was pushed.

The unrelated odds-calculator Task 6 report that previously occupied this path
is preserved at `.superpowers/sdd/odds-task-6-report.md`.

## Commits

- `3e35411` — `test: define review and redemption index contracts`
- `2c37dd0` — `feat: standardize evidence-gated review facts`
- `f7528c8` — `feat: add gated redemption index model`
- `52afcde` — `test: define complete review qa gate`
- `ce3f34d` — `feat: enforce complete review qa`
- `cca1fef` — `chore: gate redemption index publication in ci`
- `c384ce6` — `docs: record review and index audit state`
- `8a50972` — `test: require visible faq schema parity`
- `3168a71` — `fix: label operator fact verification explicitly`
- `5e61978` — `docs: add task 6 implementation report`
- The quality-rejection fix is committed in the commit containing this revision.

## TDD red/green evidence

1. Review summary RED: the focused operator suite failed because Acebet had no
   early canonical fact summary. GREEN: all 29 renders place one semantic
   summary after H1 and before the first H2.
2. Redemption model RED: the synthetic fixture suite failed with
   `ERR_MODULE_NOT_FOUND` for `src/lib/redemptionIndex`. GREEN: malformed,
   insufficient, mixed-approved, publishable, and empty-production fixtures
   pass.
3. Complete QA RED: the review QA module did not exist. Its first implementation
   then exposed 29 FAQ/schema differences, one alternate FAQ markup shape, one
   narrow-space normalization difference, and missing partner wording on the
   static Card Crush review. GREEN: 29 sources and 29 renders pass with zero QA
   errors and zero FAQ/schema mismatches.
4. Audit RED: deterministic report tests failed until the technical, testing,
   and schema renderers recorded review-QA and non-publishable index state.
   GREEN: all three committed reports exactly equal deterministic output.
5. Schema regression RED: the source schema-helper fixture retained a FAQPage
   without visible FAQ content. GREEN: the fixture now proves FAQPage mirrors
   visible questions and answers only.
6. Verification-label RED: all summaries failed the explicit
   `Operator facts verified` label assertion. GREEN: all 29 show that label and
   retain `Not verified` because no qualifying date exists.
7. Audit-snapshot RED: focused assertions failed because the audit date was
   passed inline and its snapshot semantics were undocumented. GREEN: audit
   callers pass the explicit snapshot input and the production evidence verifier
   accepts `REDEMPTION_INDEX_AS_OF`.

## Fact and answer coverage

Every review renders all 13 canonical fields with an explicit status, plus
legal-status source and visitor offer eligibility:

- 377 canonical field cells: 212 verified, 29 unresolved, 136 missing.
- Names and companies: 29/29 verified.
- Launch dates: 15 verified; 14 not verified.
- Signup offers: 24 verified; 4 unresolved; 1 missing.
- Daily offers: 18 verified; 11 missing.
- Cash minimums: 22 verified; 7 missing.
- Gift-card minimums: 13 verified; 16 missing.
- Published redemption estimates: 17 verified; 12 missing.
- Payment methods: 19 verified; 10 missing.
- Published game counts: 18 verified; 11 missing.
- Editor scores: 4 verified; 25 unresolved.
- Operator verification dates: 0 verified; 29 explicitly not verified.

The canonical gates produce 108 answer blocks:

- 28 redemption;
- 19 payment-method;
- 18 game-count;
- 15 company/launch;
- 28 offer.

Each block uses a question H2, names the operator in its first sentence, labels
published estimates as published rather than observed, and is omitted when its
required facts are unresolved. Answer blocks are not added to FAQPage schema.

## 29-review QA

`npm run verify:reviews` passed:

- 29 source reviews and 29 rendered reviews;
- 2 static and 27 SSR renders exercised;
- 29 unique titles, one H1 each, and 29 self-canonicals;
- 29 fact summaries and 108 gated answers;
- visible/schema score parity for 4 verified scores and suppression for 25
  unresolved scores;
- 29 disclosures and 29 deterministic contextual-navigation blocks;
- 29 visible FAQ sets mirrored by 29 FAQPage nodes;
- zero unsupported first-hand claims, false dates, authority-wording failures,
  contextual-link failures, or QA errors.

No authored `reviews/*.html` file changed; the shared static and SSR transforms
continue to render the existing source inventory.

## Redemption-index threshold behavior

The pure model accepts only explicitly approved records with a valid operator,
source, payout duration, method, positive minimum/currency, and non-future
freshness date no older than 180 days. It selects a coherent
method/minimum/currency cohort, requires 5 approved records per operator, and
requires 3 publishable operators before returning ranked medians.

Synthetic fixtures prove malformed records are rejected, four approved records
are insufficient, pending/rejected rows do not satisfy a sample, and three
five-record operator cohorts become publishable. Production remains:

```json
{
  "testingRows": 0,
  "readerAggregateOperators": 0,
  "status": "not-publishable",
  "reason": "no-approved-records",
  "publicResultsRoute": false,
  "aggregateRatings": 0
}
```

No fake production records were added. Existing testing and reader-report
collection/aggregation infrastructure is unchanged.

The audit date `2026-08-31` is an explicit deterministic snapshot input used to
keep committed documentation reproducible; it is not a future publication
default. Any future production evaluation must receive a current as-of date
explicitly.

## Browser matrix

Ten browser checks passed with HTTP 200, one H1, matching self-canonical, 13
canonical fact fields, gated question answers, disclosure, contextual links,
visible/FAQ schema count parity, no unsupported answer claim, and no horizontal
overflow:

| Review | Pipeline | Score state | Visitor mode | Answer blocks | Affiliate CTA result |
|---|---|---|---|---:|---|
| American Luck | static | verified | unknown | 3 | none/non-partner |
| Card Crush | static | unresolved | unknown | 2 | none/fail-closed |
| McLuck | SSR | unresolved | unknown | 2 | none/fail-closed |
| Legendz | SSR | verified | Texas | 3 | 3 shown |
| PlayFame | SSR | verified | California | 3 | 0 shown |
| RoxyMoxy | SSR | verified | Texas | 4 | 3 shown |
| Acebet | SSR | unresolved | unknown | 5 | none/non-partner |
| WOW Vegas | SSR | unresolved | Texas | 5 | 3 editorial gateway links |
| Zula | SSR | unresolved | Texas | 2 | 3 shown |
| Pulsz | SSR | unresolved | California | 2 | 0 shown |

Browser console: 0 errors and 0 warnings.

## Full CI and crawl

`npm run ci` exited 0. It included homepage, availability, internal-link,
deterministic audit, operator, review, redemption-index, content-claim, tracker,
methodology, odds, testing-evidence, build, built-schema, integration, and
rendered-crawl gates.

- Build: success.
- Built schema: 115 indexable pages validated.
- Rendered crawl: 123 pages and 6,054 internal links.
- Geo crawl: 31 routes across unknown, Texas, and California; 93 mode renders.
- Missing targets, unintended redirects, duplicate block links, hierarchy
  failures, missing important inbound links, and geo failures: 0.
- No redemption-index route exists in routes or sitemap, and built output
  contains no AggregateRating from empty reader data.

## Self-review

- Confirmed no review URL, canonical, affiliate tracker URL, legal authority,
  or authored `reviews/*.html` source changed.
- Confirmed deterministic alternatives retain Task 5 selection and wording;
  no “better” claim was introduced.
- Confirmed review publication/modification dates are not reused as operator
  verification dates.
- Confirmed the three updated SEO reports match deterministic renderer output.
- Confirmed no attached plan/brief, beads data, instructions, or controller
  ledger changed.
- Confirmed the pre-existing untracked `.playwright-mcp/` directory was not
  staged or edited intentionally.
- Confirmed `git diff --check` passes.

## Concerns

- Production evidence remains empty, so the index must remain non-publishable.
- All 29 operator verification dates remain missing.
- Twenty-five editor scores remain unresolved; their legacy numeric values stay
  suppressed from visible aggregate contexts and Review schema.
- The deterministic source audit still records 23 legacy source score
  mismatches. Rendered QA resolves them by canonical suppression/parity.
- Four testing-claim matches remain classified as explicit
  limitations/negations (`AMBIGUOUS`); unsupported matches are 0.
- CI has no Supabase credentials, so reader aggregation correctly retained the
  empty committed dataset.
- Astro continues to emit the existing non-failing warning that
  `src/content/reviews` has no MDX files.
