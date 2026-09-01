# Task 1 Report: Reproducible SEO Audit and Immediate Safety

## Status

COMPLETE. Task 1 audit tooling, claim gates, factual reports, supported content
neutralization, prototype noindex protection, and README corrections are
implemented. The audit command is deterministic and read-only: it renders
reports in memory/stdout and does not mutate sources or committed reports.

## Commits

- `0a5e2cf test: define reproducible SEO audit contract`
- `4dfeaa8 feat: add reproducible SEO audit gates`
- `f32f6c5 fix: neutralize unsupported testing implications`
- `a4d1fe2 docs: record SEO audit conflicts and coverage`
- `49640ad chore: refresh generated SEO outputs`
- `68e0b8f feat: inventory operator facts across hubs`

## TDD red/green evidence

### Red

- After `0a5e2cf`, `npm run seo:audit:test` failed with
  `ERR_MODULE_NOT_FOUND` for `scripts/seo/audit-core`; the contract existed
  before its implementation.
- Subsequent focused red runs exposed a schema-report template error
  (`TypeError: 100 is not a function`), a false missing-target result for
  mirrored static assets, and absent hub inventory
  (`Cannot read properties of undefined (reading 'some')`).

### Green

- `npm run seo:audit:test` exits 0 and reports:
  `29 reviews, 28 homepage cards, 60 claim matches`.
- Claim-policy fixtures prove that undocumented standalone `Tested` and
  `we tested` are blocked, while documented `Tested` and explicitly attributed
  `independently RNG-tested` language pass.
- `npm run seo:audit`, `npm run content:lint`, and
  `npm run testing:verify-overclaims` all exit 0.

## Report coverage

- Operator inventory: 29 review files, 28 homepage cards, 10 comparison rows,
  and 47 hub facts; 29 conflicts are cited without selecting winners.
- Testing claims: 60 occurrences with path, line, column, phrase, surface,
  classification, basis, and context: 0 `DOCUMENTED_FIRST_HAND`, 49
  `THIRD_PARTY_OR_READER_DATA`, 0 `UNSUPPORTED`, and 11 `AMBIGUOUS`.
- Technical inventory: 102 authored routes and 1,557 internal-link
  occurrences; 0 missing targets and 1 orphan candidate.
- Schema parity: all 29 reviews using the existing visible-score helper; 23
  source mismatches documented.
- State/CTA reconciliation: 51 tracker jurisdictions, 13 affiliate
  authorities, and 7 manual-review differences.
- All eight required reports are committed under `docs/seo/`.
- Known Jackpota and JackpotGo score conflicts are present as `UNRESOLVED`.
- The prototype source emits `noindex, nofollow`.

## Full CI result

`npm run ci` completed with exit code 0 on 2026-08-31. It passed availability,
SEO audit tests and audit gate, claim/tracker/methodology/odds/testing gates,
Astro build, built-schema validation (114 indexable pages), and odds
integration.

Non-failing CI notices: no `src/content/reviews/**/*.mdx` files matched, and
reader aggregation skipped because Supabase credentials were unavailable while
retaining the existing empty generated data.

## Self-review

- Compared the final branch diff against
  `origin/cursor/seo-coherence-5d71`; no beads, instruction, attached-plan, or
  controller-progress files were changed.
- Authored/generated boundaries remain explicit. Authored HTML and
  `src/routes/` are audited as sources; `src/pages/` is excluded. Generated
  sitemap/LLM outputs were refreshed through the existing generator.
- No redirects, URLs, affiliate tracking, legal statuses, or canonical winners
  were changed.
- No factual or legal conflict was silently resolved. Conflict rows use
  `UNRESOLVED` or `MANUAL_REVIEW` with exact cited path/value pairs.
- Build-stamped freshness is documented for Phase 2/3 and was not replaced with
  another synthetic date.

## Concerns

- The 29 operator conflicts, 23 source-schema mismatches, and 7 authority
  differences remain intentionally unresolved pending source or policy review.
- Legal-page sitemap/noindex policy and clean-URL/canonical strategy remain
  mixed and require a human decision.
- Eleven testing-phrase occurrences are classified `AMBIGUOUS`; they are
  questions, negations, or policy language, not evidence of first-hand testing.
- `/best/` is the sole detected orphan candidate.
- There are no documented first-hand testing rows, and reader aggregates remain
  empty; future first-hand claims must not publish until their evidence passes
  the existing validation path.

## Task 1 Review Fix Evidence

### Status and root cause

The critical Rolla finding is fixed. The original detector used a literal
phrase alternation and did not recognize first-person testing grammar such as
`our own tests`, a generic `our test`, numbered `test 1` labels, or `we ran
checks`. Its broad same-line attribution and question checks could also mask an
explicit first-person claim when published/third-party text or a preceding FAQ
question appeared nearby.

`scripts/seo/claim-policy.ts` now detects grammatical first-person noun and
action families, localizes question/negation handling to the matched
occurrence, prioritizes explicit first-person claims over unrelated attribution,
and retains directly attributed operator, laboratory, third-party, and reader
uses.

`reviews/rolla.html` no longer contains the unsupported payout-test sentence,
the three unsubstantiated support timings, `our own tests`, or `Our result`.
Published Rolla timelines and explicitly attributed player/Trustpilot
information remain. `about.html` now describes an evidence requirement as
editorial policy rather than making an unsupported operational promise.

### Tests and red evidence

Test file: `scripts/seo/audit.test.ts`.

Added evidence-less fixtures for:

- `our own tests`
- generic `our test`
- numbered `test 1`
- `we ran checks`
- `we conducted ... tests`
- first-person claims mixed with published and third-party wording
- first-person answers adjacent to FAQ questions

Added passing fixtures for documented first-hand evidence, operator/laboratory
attribution, domain-based third-party attribution, explicit negation, and
reader reports. Added a real-file regression that confirms Rolla remains in the
overclaim-gated brand set and its authored HTML contains none of the identified
first-hand forms. The softener regression verifies that unsupported own-test
sentences are removed without deleting the following attributed information.

Red outcomes observed before production/content fixes:

- `npm run seo:audit:test` failed on `Our own tests cleared...` with `0 !== 1`.
- After the detector fix but before Rolla content softening,
  `npm run content:lint` failed with 11 unsupported occurrences, including all
  six Rolla source/schema occurrences.
- `npm run testing:verify-overclaims` failed Rolla with six hits.
- `npm run seo:audit` failed with 11 unsupported claims.
- Regression runs also exposed and then fixed false positives caused by the
  period in `Deadspin.com`, explicit negation, and attributed reader language.

### Green commands and outcomes

- `npm run seo:audit:test`: exit 0; 29 reviews, 28 homepage cards, 60 matched
  claims.
- `npm run content:lint`: exit 0; no unsupported first-hand claims.
- `npm run testing:verify-overclaims`: exit 0; all 14 flagged reviews,
  including Rolla, pass.
- `npm run seo:audit`: exit 0; 60 claims classified as 0
  `DOCUMENTED_FIRST_HAND`, 56 `THIRD_PARTY_OR_READER_DATA`, 0 `UNSUPPORTED`,
  and 4 `AMBIGUOUS`.
- `npm run ci`: exit 0 on 2026-08-31; all gates, build, 114-page built-schema
  validation, and integration checks pass.
- The committed `docs/seo/testing-claims-audit.md` exactly matches
  `seo:audit -- --report testing-claims-audit.md`.

Non-failing CI notices remain unchanged: no review MDX files match the content
glob, and reader aggregation skips without Supabase credentials while retaining
the empty generated data.

### Review-fix commits

- `67269ae test: expose first-hand claim bypasses`
- `93aa60a test: cover attributed and FAQ claim masking`
- `7f8775c fix: detect grammatical first-hand claims`
- `6498106 test: preserve attributed and negated claims`
- `0b265bb fix: retain attributed testing context`
- `c663f57 test: require safe own-test softening`
- `f71e838 fix: safely remove unsupported own-test sentences`
- `5810a34 fix: remove unsupported Rolla testing claims`
- `96e0112 test: assert clean Rolla source directly`
- `c88c0a9 fix: classify attributed negations consistently`
- `ff96065 docs: refresh testing claim classifications`

### Remaining concerns after review fix

- Four matched phrases remain `AMBIGUOUS`; they are policy/question language,
  not first-hand result claims.
- The previously documented 29 operator conflicts, 23 source-schema
  mismatches, 7 authority differences, legal sitemap/noindex policy, and
  URL/canonical policy remain intentionally unresolved.
- First-hand testing evidence and reader aggregates remain empty.
