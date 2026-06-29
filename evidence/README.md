# First-Party Testing Evidence

Human testers: follow the full protocol in [`.planning/TESTING-TEAM-BRIEF.md`](../.planning/TESTING-TEAM-BRIEF.md).

## Quick start

1. Run `npm run testing:scaffold` to create per-brand folders and checklists (if not already present).
2. Pick a brand from [brands.json](./brands.json) — start with **Crown Coins** (pilot).
3. Complete the 9-step protocol; save screenshots in `evidence/{slug}/`.
4. Fill one row in `evidence/testing-results.csv` (copy from [testing-results.template.csv](./testing-results.template.csv)).
5. Run `npm run testing:verify` — fix any errors.
6. Owner runs `npm run testing:apply -- --slug {slug}` to update the review page.

## File naming

`<brand-slug>-<step>-<YYYYMMDD>.png` — e.g. `crown-coins-redeem-request-20260712.png`

## Privacy (mandatory)

Redact before sharing: full card/bank numbers (last 4 ok), Skrill/PayPal email, government ID, home address, DOB, SSN.

## Storage

| Location | Purpose | Git |
|----------|---------|-----|
| `evidence/{slug}/` | Raw tester artifacts | Ignored |
| `evidence/testing-results.csv` | Master results spreadsheet | Ignored |
| `public/testing/{slug}/` | Redacted screenshots for the live site | Committed at repo root `testing/{slug}/` (copied to public on build) |

## Deliverable

Zip and send to the site owner:

- Filled `testing-results.csv`
- All `evidence/{slug}/` folders for completed brands

## Editorial commands

```bash
npm run testing:scaffold   # Create brand folders + checklists
npm run testing:verify     # Validate CSV + evidence files
npm run testing:status     # Progress table only
npm run testing:apply -- --slug crown-coins --dry-run
npm run testing:apply -- --slug crown-coins
npm run testing:apply -- --soften-overclaims --slug rolla
```

## Pilot (Crown Coins)

See `.planning/crown-coins-handson-test-checklist.md` for the detailed capture log.

**Pipeline smoke test (2026-06-30):** Sample pilot data in `evidence/crown-coins/` validates the full workflow:

```bash
npm run testing:verify
npm run testing:apply -- --slug crown-coins --dry-run
npm run testing:apply -- --slug crown-coins
npm run generate:pages   # copies testing/ → public/testing/
```

Replace pilot PNGs with real redacted screenshots before publishing. `npm run build` requires Node ≥ 22.12.
