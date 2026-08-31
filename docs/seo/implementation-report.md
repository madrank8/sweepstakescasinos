# SEO Implementation Report

Evidence snapshot: `cursor/seo-coherence-5d71` at `b3d3af4`, verified on
2026-08-31 before this report commit.

## 1. Changes made

The cumulative implementation replaces several implicit or duplicated SEO
decisions with typed, evidence-gated paths:

- Every indexable page emits one parseable JSON-LD document with an `@graph`,
  canonical publisher/site/author/page entities, one breadcrumb, and
  page-specific content entities. Review ratings are emitted only for the four
  verified canonical editor scores. Empty reader data emits no
  `AggregateRating`.
- A canonical operator inventory covers all 29 existing reviews. Every fact is
  `verified`, `unresolved`, or `missing` and verified values retain provenance.
  Conflicting editor scores and offers are not silently selected.
- Review rendering is standardized across the two static and 27 SSR review
  paths. Each review has a canonical fact summary, evidence-gated answer
  blocks, disclosure, contextual navigation, and visible/FAQ-schema parity.
- Tracker legal display, affiliate commercial availability, and site CTA
  policy remain separate authorities behind one availability facade. Page CTA
  rendering and the bonus gateway fail closed for unknown or site-suppressed
  regions.
- The root page is now an authored decision-support page. The new `/reviews/`
  directory lists all 29 reviews alphabetically. Current commercial hubs use
  canonical facts without affiliate economics as ranking inputs.
- Deterministic contextual links connect reviews, state pages, guide/news
  articles, and commercial parents. The built crawl checks missing targets,
  internal error responses, redirects, duplicate contextual links, hierarchy,
  and important-page inbound links.
- Reproducible audits document operator conflicts, testing claims, schema
  parity, state-authority differences, internal links, cannibalisation,
  commercial-hub gates, and redemption-index publication state.
- A pure redemption-index model and synthetic fixtures define publication
  thresholds. Production remains non-publishable because no approved
  first-party rows or reader aggregates exist.

No existing review URL was removed. Affiliate tracking destinations remain
behind `/bonuses/<slug>/`; raw Gemified destinations are not rendered into page
or schema HTML.

## 2. Files and components changed

The implementation is concentrated in these areas:

- `src/data/operators.ts`, `src/data/brandEntities.ts`,
  `src/data/site.ts`, `src/data/trackerReconcile.ts`, and
  `src/data/usStates.ts`: canonical editorial facts, entity identity, publisher
  facts, and authority reconciliation.
- `src/lib/schema.ts`, `src/lib/operatorFactsHtml.ts`,
  `src/lib/pageChrome.ts`, `src/lib/staticHtml.js`, and
  `src/lib/affiliateHtml.ts`: graph consolidation and idempotent static/SSR
  review decoration.
- `src/lib/availability.ts`, `src/lib/availabilityViews.ts`,
  `src/lib/bonusGateway.ts`, and `src/components/AffiliateLink.astro`:
  geo-aware display and gateway decisions.
- `src/lib/homepage.ts`, `src/lib/internalLinks.ts`, and
  `src/lib/redemptionIndex.ts`: evidence-gated selectors, deterministic link
  selection, and unpublished redemption assessment.
- `src/routes/index.astro`, `src/routes/reviews/index.astro`,
  `src/routes/states/[slug].astro`, and the existing best, new, no-deposit,
  state-legality, guide, news, tool, and tracker route templates: authored
  surfaces and shared consumers.
- `scripts/verify-*.ts` and `scripts/seo/*.ts`: focused contracts,
  deterministic audits, built-schema verification, and rendered/geo crawl.
- `docs/seo/*.md`: deterministic audits, decision records, methodology, and
  this final report.
- `package.json` and `scripts/generate-astro-pages.mjs`: CI ordering, generated
  route ownership, and sitemap/robots generation.

The generated `src/pages/` tree remains generator-owned. Legacy
`reviews/*.html` files remain authored source inputs.

## 3. New data models

- `CanonicalFact<T>` and `OperatorRecord` distinguish verified, unresolved,
  and missing operator facts and keep field-level provenance.
- Brand/entity records separate schema identity and official profile URLs from
  editorial facts and commercial relationships.
- `AvailabilityFacade` keeps tracker status, partner availability, and site CTA
  policy distinct while exposing one fail-closed presentation decision.
- Homepage recommendation/comparison view models apply deterministic evidence
  thresholds and tie-breaks without CPA or tracking data.
- Contextual-link selectors use canonical relationships and authored-body
  exclusions, with slug ordering for deterministic ties.
- The redemption assessment model validates approved records, freshness,
  coherent method/minimum/currency cohorts, minimum sample size, and minimum
  operator coverage before any ranking can publish.
- Shared publisher, author, reader-rating threshold, and legal-status view
  models remove duplicated trust and schema decisions.

## 4. URLs materially changed

- `/` is materially changed from the legacy inventory-led root to an authored
  answer, four verified editor picks, a 12-row decision table, methodology,
  legality guidance, FAQ, and specialist-hub navigation.
- `/reviews/` is the only new indexable route. It is a complete alphabetical
  directory with CollectionPage, ItemList, and breadcrumb entities.
- All 29 existing `/reviews/<slug>/` URLs now receive the shared canonical fact
  summary, score suppression/parity, evidence-gated answers, disclosure,
  availability context, and deterministic related navigation. Their authored
  URLs remain unchanged.
- `/best/sweepstakes-casinos/`, `/new/`, `/bonuses/no-deposit/`, and
  `/state-legality/` now consume canonical facts or the availability facade.
  No deferred superlative hub was created.
- All `/states/<slug>/` pages use tracker freshness for legal display, separate
  offer/site-policy wording, canonical state identity, and parent/review links.
  Authored state MDX remains distinct from tracker-only state fallback content.
- Guide and news article surfaces now receive body-aware contextual parent and
  commercial/state links. Generated sitemap metadata was refreshed for two
  guide sources changed by that work.

`/best/` remains a deliberate redirect to
`/best/sweepstakes-casinos/`. Existing bonus gateway paths and outbound
destinations remain functional.

## 5. Issues intentionally not changed

- 25 editor scores remain unresolved and numeric first-party aggregate
  presentation is suppressed for those reviews.
- Four signup offers remain unresolved: Crown Coins, Hello Millions,
  SpinBlitz, and Spree.
- Six tracker/site-policy differences remain unresolved: California, Florida,
  Indiana, Maine, Mississippi, and Tennessee. Neither authority overwrites the
  other.
- Card Crush remains a documented commercial/site-policy intersection:
  affiliate availability is CA/NY while site policy suppresses both. This is
  not treated as a legal conclusion.
- All 29 operator verification dates remain missing. Review publication or
  modification dates are not substituted.
- First-party testing has zero production rows. Reader aggregates contain zero
  operators, so the redemption index is non-publishable and no
  `AggregateRating` is emitted.
- “Fastest payout sweepstakes casinos” and “Most free Sweeps Coins” remain
  deferred because their documented approval gates do not pass.
- The source audit still records 23 legacy source score/schema mismatches.
  Rendered output suppresses or aligns ratings, but the underlying conflicts
  remain available for editorial review.
- Legal-page sitemap/noindex policy and the mixed clean-source/generated-route
  strategy remain explicit policy decisions rather than guessed changes.

## 6. Items requiring human factual or legal review

- Resolve each editor-score and signup-offer conflict against cited source
  evidence before changing canonical status.
- Supply qualifying operator verification dates and review the source
  provenance for missing launch, offer, redemption, payment, game-count, and
  external-rating fields.
- Decide the six tracker/site-policy differences and the Card Crush policy
  intersection with legal/compliance owners. Current labels are descriptive,
  not legal advice.
- Review legal-page indexation policy and any future change to tracker legal
  classifications.
- Approve first-party testing records and reader reports through their existing
  evidence workflows before publishing testing results, payout observations,
  medians, rankings, or aggregate ratings.
- Confirm author credentials and official social/profile identities with the
  person or account owner before extending existing entity records.

The automated gates found zero unsupported first-hand claim matches and no
emitted aggregate rating. That is evidence about repository output, not an
independent legal or factual certification of every authored statement.

## 7. Before and after architecture

Before:

1. Operator facts and scores were repeated across legacy reviews, the
   homepage, comparison content, and hubs.
2. Static and SSR transforms made related schema, score, and CTA decisions in
   separate paths.
3. Tracker, partner, and site policy could be consumed directly without a
   shared reconciliation boundary.
4. JSON-LD blocks and identities were consolidated inconsistently.
5. Internal links were largely authored ad hoc; the homepage acted as the
   practical review inventory.
6. Testing/redemption claims lacked one deterministic repository-wide audit
   and publication gate.

After:

1. Typed canonical facts and provenance feed selectors and review summaries.
2. One idempotent decoration sequence serves both review pipelines before
   JSON-LD graph consolidation.
3. The availability facade is the shared decision boundary while preserving
   all three authorities.
4. Every indexable route emits one graph with stable same-origin identities.
5. Authored `/` and `/reviews/` have distinct intents; deterministic link
   selectors and a post-build crawl enforce graph integrity.
6. Claim audits, review QA, built-schema checks, and an evidence-gated
   redemption model fail closed when facts are absent or conflicted.

## 8. Tests performed

Fresh `npm run ci` exited 0.

- Availability: 51 jurisdictions, 13 partners, six tracker/site-policy
  differences, and the Card Crush intersection validated.
- SEO audit: 29 reviews, four homepage operators, 10 comparison operators, 46
  hub facts, 57 testing-claim matches, 103 authored routes, 1,478 authored
  internal links, zero missing source targets, and zero orphan candidates.
- Testing claims: 0 documented first-hand, 53 third-party/reader, 0
  unsupported, and 4 ambiguous limitation/question/policy matches.
- Review QA: 29 sources/renders, two static and 27 SSR, 29 unique titles, 29
  fact summaries, 108 answer blocks, 29 disclosures/contextual blocks, 29 FAQ
  pages, and zero QA or FAQ/schema errors.
- Canonical facts: 29 operators validated. Production redemption evidence:
  zero testing rows, zero reader-aggregate operators, non-publishable status,
  no public results route, and zero aggregate ratings.
- Build: Astro/Vercel output completed; 36 static schema sources and 115
  indexable built pages passed schema validation.
- Rendered crawl: 123 pages, 6,054 internal links, zero missing targets,
  unintended redirects, duplicate contextual destinations, hierarchy failures,
  missing important inbound links, or geo failures.
- Built geo crawl: 31 routes in unknown, Texas, and California modes (93
  renders).

Additional built-output browser evidence:

- All 115 sitemap pages returned 200 with one H1, a self-canonical, indexable
  robots state, exactly one parseable JSON-LD graph, trailing-slash-consistent
  internal page links, server-rendered critical content, no raw Gemified URL,
  and no checked FAQ-question or review-rating parity error. The matrix found
  102 FAQ pages with 414 schema questions, 29 Review pages with four emitted
  verified ratings, and zero AggregateRating nodes.
- A 29-page desktop browser matrix covered the homepage and reviews directory,
  every indexable commercial hub, 10 mixed static/SSR and
  resolved/unresolved reviews, two authored and two tracker-only state pages,
  trust/entity pages, the tools/calculator surfaces, and guide/news parents.
  It found zero console warnings/errors, page errors, overflow, or invariant
  failures.
- Six representative pages at a 375 × 812 viewport had no document-level
  horizontal overflow.
- Gateway checks confirmed Texas redirects for eligible McLuck and Rolla
  destinations, California/unknown blocking, Card Crush blocking in CA and TX,
  preservation of `valid_123`, and complete removal of malicious or overlong
  click IDs.

No reproducible production regression was found, so Task 7 made no code change
and required no red/green defect cycle. The Astro development server used by a
preliminary check did not serve `/partials/nav.html`, while the built Vercel
output did; final browser acceptance therefore used the deployment artifact.

## 9. Remaining recommended work

1. Complete the human factual/legal review items above, then update canonical
   facts and provenance through focused red/green tests.
2. Populate and approve first-party and reader evidence before reconsidering
   redemption rankings or aggregate ratings.
3. Normalize comparable payout-duration data and add verified freshness before
   reconsidering the deferred payout hub.
4. Resolve the four offer conflicts and freshness gaps before introducing any
   offer superlative; retain `/bonuses/no-deposit/` for the existing intent.
5. Decide legal indexation and tracker/site-policy differences explicitly.
6. Investigate the local Astro development-server partial-HTML discrepancy if
   development-server parity is a project requirement; production built output
   and the deployment-oriented gates are unaffected by the observed behavior.

