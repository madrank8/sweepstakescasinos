# Final Whole-Branch Review Fix Report

Date: 2026-08-31
Branch: `cursor/seo-coherence-5d71`
Baseline: `1fecd69`
Implementation snapshot before report commits: `a5cb2e8`

## Status

Implementation is complete. Final fresh full-branch verification will be
recorded below after the report files are committed. No push was performed.
No `.beads` data, attached plan/brief, instructions, or controller ledger was
edited.

## Critical and Important findings addressed

1. **Reproducible audits and conflicts**
   - Every deterministic audit in `docs/seo/*.md` has a byte-parity CI gate.
   - The four unresolved welcome offers remain unresolved and cite canonical
     source records, served review/hub evidence, and the explicitly historical,
     non-served `index.html` snapshot.
   - Deterministic audit counts and wording were regenerated after source edits.

2. **Comparison safety and ItemList parity**
   - `/best/sweepstakes-casinos/` is an operators-to-compare surface, not a
     ten-item ranking.
   - Unsupported McLuck winner/game-count copy and all settled presentations of
     the four conflicted offers were removed.
   - Visible list and ItemList schema share one view model. Built verification
     compares count, order semantics, positions, names, and URLs, including
     nested visible list markup.

3. **Reader-facing missing and unresolved facts**
   - Reviews retain machine-readable statuses but omit unresolved/missing rows.
   - Reader-visible internal governance strings were removed from reviews,
     homepage, directory, and no-deposit surfaces.
   - The homepage now shows 12 canonical-completeness decision-support entries.
     The four verified editor scores are supporting details only.

4. **Claim-policy hardening**
   - First-person test claims are not exempted by loose policy/terms words or
     trailing attribution.
   - Past-tense editor actions and About process/frequency claims have red
     fixtures.
   - Unsupported About history/frequency statements were rewritten as policies.

5. **Editor-score detector hardening**
   - First-party aggregate language such as “our reviewers”, “our verdict”, and
     “final rating” is detected.
   - A domain or external score exemption requires directly tied named
     third-party attribution.

6. **Production redemption evidence**
   - Real testing rows and reader aggregates are loaded by an adapter.
   - Invalid rows produce diagnostics; reader aggregates are not expanded into
     fabricated pseudo-records.
   - The explicit `2026-08-31` audit snapshot currently evaluates legitimate
     empty production evidence as non-publishable while synthetic publishable
     fixtures continue to enforce thresholds.

7. **Editorial outbound eligibility**
   - Partner, editorial-outbound, and no-outbound reviews use one availability
     view.
   - All 29 review wrappers are request-rendered because summary eligibility and
     contextual state links are geo-dependent even when no authored CTA exists.
   - The built crawl ties each review’s summary kind/reason/text and own gateway
     CTA presence to unknown, Texas, and California policy.

8. **`/new/` authority-safe facts**
   - Card Crush’s hard-coded CA/NY claim was removed.
   - Availability uses the shared facade and fact notes use canonical facts.
   - Hub-note drift is represented in deterministic operator audit output.

9. **No-deposit superlatives and freshness**
   - Freshness-gated selectors suppress unsupported winners.
   - Missing/conflicted cells use an em dash with “Details unavailable”.
   - Visible/schema `dateModified` is generated from the authored source date
     used by sitemap `lastmod`.

10. **Review information gain**
    - Canonical summaries follow the authored verdict.
    - Injected answer blocks are deduplicated against authored answers and
      limited to two; current all-review output contains 32.
    - Disclosure, category content, FAQ parity, and contextual navigation remain.

11. **Homepage primary set and cross-surface wording**
    - The primary set uses decision-fact completeness and stable slug tie-breaks,
      not affiliate economics or unresolved editor scores.
    - Homepage H1 and supporting copy use evidence-based comparison language.
    - Guide/state links no longer describe the comparison as ranked or expose
      CPA language.

## Red evidence

- `npm run seo:audit:test`
  - Initially failed because the audit core lacked `findAuditReportDrift`.
  - Later failed on committed deterministic report drift, proving the byte gate.
- `npm run operator:test`
  - Failed on first-party aggregate-score fixtures and unresolved rendered score
    leakage before attribution proximity was corrected.
- `npm run verify:homepage`
  - Failed while the decision-support selectors/presentation utilities were
    absent and again when evidence-based H1/link wording contracts found
    residual “Best”, “ranked comparison”, and CPA copy.
- `npm run verify:reviews`
  - Failed when answer blocks exceeded two, summaries preceded verdicts, and
    generated `american-luck.astro` remained `prerender = true`.
  - After the count contract changed, failed with `2 !== 0`, proving the QA
    still modeled two static reviews.
- `npm run verify:redemption-index`
  - Failed while the production evidence adapter module was absent.
- `npm run verify:availability`
  - Failed while editorial outbound availability was not exported through the
    shared view.
- `npm run verify:internal-links`
  - Failed with a missing `expectedReviewCtaEligibility` export.
- `npm run seo:crawl`
  - Failed with false Texas CTA expectations for `/`,
    `/best/sweepstakes-casinos/`, and the odds calculator.
  - Once route expectations used canonical views, it exposed build-frozen
    American Luck/Card Crush state summaries and contextual links.
- `npm run seo:audit:test`
  - Failed on stale internal-link bytes (`1447`, then `1446`) and stale ranked
    audit prose before deterministic snapshots were updated to 1,443 links.

## Green evidence

Focused gates:

- `npm run verify:homepage` — exit 0.
- `npm run verify:availability` — exit 0; 51 jurisdictions and 13 partners.
- `npm run verify:internal-links` — exit 0; all 29 review paths covered.
- `npm run seo:audit:test && npm run seo:audit` — exit 0; deterministic bytes
  match, 54 matched claims, zero unsupported claims, 103 routes, 1,443 links.
- `npm run operator:test && npm run operator:verify` — exit 0; 29 operators.
- `npm run verify:reviews` — exit 0; 29 request-rendered reviews, 32 answer
  blocks, 87 geo/outbound assertions, zero errors.
- `npm run verify:redemption-index` — exit 0; production remains legitimately
  non-publishable with zero adapted records.
- `npm run build && npm run seo:crawl` — exit 0; 123 pages, 6,016 rendered
  links, 32 geo routes × three modes, zero geo failures.

Representative browser checks:

- Homepage, comparison hub, and no-deposit hub returned 200 with one H1,
  expected visible ItemList counts (12, 10, 12), no governance/ranking copy,
  no document overflow, and zero console errors.
- Rolla: Texas summary eligible with three own CTAs; California and unknown
  summaries ineligible with zero own CTAs.
- Card Crush and American Luck: Texas summaries ineligible with zero own CTAs.

Final full verification: pending documentation commit.

## Commits

- `4540157` — `test: expose audit and claim safety gaps`
- `1cbfa56` — `test: define coordinated presentation and evidence contracts`
- `547c387` — `fix: harden claim attribution and editorial policy`
- `2add333` — `fix: align review facts with outbound policy`
- `d1d7398` — `fix: make comparison hubs evidence driven`
- `eddf59e` — `test: align canonical presentation contracts`
- `fb138da` — `fix: remove internal status copy from reviews directory`
- `509bffd` — `fix: adapt production redemption evidence`
- `e804278` — `fix: enforce deterministic seo audit parity`
- `c082bc2` — `test: align operator rendering assertions`
- `5973a82` — `fix: validate hidden canonical fact statuses`
- `1049962` — `test: verify canonical new-hub presentation`
- `c231a0a` — `docs: refresh deterministic seo audits`
- `197a6c0` — `fix: fail closed without editorial ranking data`
- `f1a998d` — `test: use configured odds card fixtures`
- `498db50` — `chore: refresh source-derived route freshness`
- `9fa86fc` — `fix: parse nested visible item lists`
- `ce5d2b8` — `fix: align geo crawl with outbound eligibility`
- `6d3bd7e` — `fix: render review availability per request`
- `041656f` — `docs: refresh deterministic link audit`
- `7e57620` — `docs: align audits with decision support model`
- `6cd9b7c` — `fix: remove unsupported comparison ranking copy`
- `218e4d8` — `docs: refresh audits after comparison copy`
- `a5cb2e8` — `chore: refresh comparison source freshness`

## Remaining concerns

- 25 editor scores and four signup offers still require human source resolution.
- Six tracker/site-policy differences and the Card Crush authority intersection
  require legal/compliance ownership; current output does not infer legality.
- All 29 canonical operator verification dates remain missing.
- Production first-party testing and reader aggregate inputs are empty, so no
  payout result, ranking, or AggregateRating is publishable.
- The source audit still records 23 legacy visible/schema score mismatches;
  rendered output suppresses or aligns them without guessing source truth.
- CI emits the existing non-failing empty `src/content/reviews` MDX warning.
