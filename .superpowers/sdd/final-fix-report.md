# Final integration fix report

## Scope

- Fix base: `7d6152b20c08ac28c3b3738b2bfe8edf3809c902`
- Branch: `feat/jsonld-gapfill`
- Applied only the whole-sprint review fixes listed in `final-fix-brief.md`.
- Preserved all pre-existing protected and unrelated dirty files.

## RED evidence

Both focused verifiers were strengthened before any production file was changed.

1. `npx tsx scripts/verify-priority-seo-technical.ts`
   - Exit: `1`
   - Expected failure: `dexyplay entity name must match its review #brand`
   - Actual `DexyPlay`; expected source value `DexyPlay Sweepstakes Casino`.
2. `npx tsx scripts/verify-priority-seo-content.ts`
   - Exit: `1`
   - Expected failure: `Big Pirate <title> must retain Payout Speed discovery intent`.
3. After adding the explicit newest-tier assertion, the technical verifier was run again before production edits:
   - Exit: `1`
   - Same expected DexyPlay source-name mismatch.

## Changes

- `scripts/verify-priority-seo-technical.ts`
  - Parses the canonical `#brand` node from DexyPlay, Sweepico, WOW Vegas, and Big Pirate review JSON-LD.
  - Compares canonical entity name, official URL, operator name, and exact source-published operator-address specificity.
  - Structurally verifies American Luck remains a July 2026 recent addition and DexyPlay is the September 2026 newest addition.
  - Structurally verifies `/new/` title, description, H1, dates, visible update label, JSON-LD captions, and figure captions without raw occurrence counting.
- `scripts/verify-priority-seo-content.ts`
  - Checks DexyPlay's actual hero byline for the explicit September update and absence of the bare May date.
  - Guards Big Pirate's review, bonus, payout-speed, and Claw Machine discovery terms.
  - Adds word boundaries to the flexible stale source-count regex.
  - Preserves all prior canonical, JSON-LD, promo-removal, longevity-removal, and date checks.
- `src/routes/new/index.astro`
  - Restores American Luck to `Added July 2026` and the recent tier.
  - Marks DexyPlay `Added September 2026` and the newest tier.
  - Adds September 2026 freshness to the page title and H1 while retaining historical `DATE_PUBLISHED` and September `DATE_MODIFIED`.
- `src/data/brandEntities.ts`
  - Matches all four review-page canonical brand names.
  - Removes DexyPlay and Sweepico operator addresses because their review nodes publish none.
  - Limits WOW Vegas operator address to Gibraltar locality/country.
  - Preserves verified operator names and official URLs.
- `reviews/dexyplay.html`
  - Changes the visible author line to `Updated September 8, 2026`.
- `reviews/big-pirate.html`
  - Keeps `Big Pirate Casino Review` and `Bonus` priority while restoring `Payout Speed` in the title.
  - Retains `Claw Machine` naturally in H1 and social surfaces.
  - Does not restore `legit test`, `tested`, or `everything verified`.

## GREEN evidence

- `npx tsx scripts/verify-priority-seo-technical.ts` — exit `0`, `verify-priority-seo-technical: OK`
- `npx tsx scripts/verify-priority-seo-content.ts` — exit `0`, `verify-priority-seo-content: OK`
- `npm run content:lint` — exit `0`, no unlabeled first-party claims
- `npm run tracker:lint` — exit `0`, tracker hub affiliate-free
- `npm run testing:verify-overclaims` — exit `0`, all 14 flagged reviews passed
- `npm run schema:verify` — exit `0`, 36 static pages and schema helpers passed
- `npm run verify:availability` — exit `0`, all checks passed
- `git diff --check` — exit `0`

## Self-review

- Confirmed the diff changes only the six approved implementation/verifier files plus this report.
- Confirmed review-page canonical URLs, historical publication dates, operator names, and official URLs remain unchanged.
- Confirmed no source suppressions, generated pages, public assets, crawl controls, gateways, affiliate/state-law data, no-deposit page, DexyPlay sponsored CTA, or Big Pirate Sweepsy reference were changed.
- The edit hook surfaced pre-existing visual-style findings in files touched for copy-only changes. They are outside this brief; no suppression or unrelated design edit was added.

## Concerns

- None in the scoped fix. Pre-existing unrelated working-tree changes remain present and unmodified.
