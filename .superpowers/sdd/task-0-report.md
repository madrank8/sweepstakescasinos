# Task 0 Report

## Status

DONE

## Commits

- `3feb548b9a303c96697fa633bfac820b04eef308` — test: cover sitewide JSON-LD gap fill
- `26f7c97a5813197108f89eddf7c37a6b4b6e34e5` — feat: consolidate sitewide JSON-LD graphs
- `91edd18c18229680001c8966422bda75436aaf69` — test: verify JSON-LD across built pages
- `0e5788a252af8c65c4a730c0a6a74afa1dfcc0b0` — docs: recover JSON-LD gap-fill design and plan
- `631912a49da692e668f3379c7c071ee84726b739` — chore: refresh state schema sitemap dates
- `aef27c93e5d858989b4a5b1cfe09b6dd49edf228` — test: verify deploy-isolated schema rendering
- `d7b8ae0890c65a68fd587980fe3d0fe85bb3287f` — fix: bundle generated publisher logo dimensions
- `9c737d9c1109677866c2204dc46c755edfef6d23` — docs: clarify generated logo metadata
- The final report is committed in the commit containing this file.

## Red/green evidence

### RED: initial focused contract

Command:

```bash
npx tsx scripts/verify-schema-helpers.ts
```

Outcome: exit `1`, failing at
`current-page breadcrumb must omit item`. This was the expected first missing
behavior before production changes.

### GREEN: focused helpers

Command:

```bash
npm run schema:verify
```

Outcome: exit `0`; the static verifier validated 36 source pages and
`verify-schema-helpers: OK` covered consolidation, safe serialization,
editorial `/100` ratings, breadcrumb shape, PNG dimensions, Wikidata coverage,
aggregate gating, and idempotence.

### RED: deploy-isolated SSR assets

Command:

```bash
npm run schema:check
```

after changing the acceptance verifier to execute SSR output with the deployed
function directory as its working directory.

Outcome: exit `1` with
`[schema] Unable to read publisher logo dimensions`. This exposed a real
serverless-only defect: the first implementation read the source PNG at request
time, but that file was not bundled into the function.

### GREEN: deploy-isolated static and SSR output

Command:

```bash
npm run schema:verify && npm run build && npm run schema:check
```

Outcome: exit `0`; the route generator read PNG IHDR metadata into a bundled
generated module, Astro built successfully, and the post-build gate validated
all 114 indexable sitemap pages while SSR ran from the isolated function
directory.

## Full CI

Command:

```bash
npm run ci
```

Outcome: exit `0`.

- availability and affiliate/geo checks passed;
- content, tracker, methodology, odds, testing-evidence, and overclaim gates passed;
- Astro server/static build passed;
- `verify-schema-built` validated 114 indexable built pages;
- odds integration verification passed.

## Self-review and concerns

Self-review confirmed:

- legacy JSON-LD content nodes are retained while foundation and known brand
  identities are canonicalized;
- one safely serialized `@graph` is emitted on both root-HTML and native routes;
- Review ratings use only visible verdict `/100` values and are removed without
  one;
- the final breadcrumb omits `item`;
- all 51 Wikidata IDs match live English entity labels and state Articles use
  their entity IRIs;
- the empty approved-reader aggregate emits no `AggregateRating`;
- the verifier covers static and SSR sitemap URLs, duplicate/unresolved IDs,
  score parity, safe literals, tracking parameters, breadcrumb shape, and
  aggregate gating;
- no prohibited controller ledger, beads, instruction, or plan artifact was
  edited; no push was performed.

No blocking concerns. CI logs retain two expected repository/environment notes:
the unused `src/content/reviews` MDX collection is empty, and local CI has no
Supabase credentials, so the committed empty reader-report aggregate remains
unchanged.
