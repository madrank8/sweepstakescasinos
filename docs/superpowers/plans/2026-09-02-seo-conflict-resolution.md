# SEO Conflict Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the 25 editor-score conflicts, four signup-offer conflicts, six tracker/site-policy differences plus the Card Crush intersection, 29 missing operator verification dates, and re-evaluate the two deferred commercial hubs — without inventing facts.

**Architecture:** Canonicalize each review's `/100` score and retire legacy `/5` rating authority; resolve offer conflicts from official operator sources captured as dated evidence; document legal-policy differences for counsel without changing CTA policy; stamp operator verification dates only when every available decision-critical field is verified against an official source; re-run hub approval gates with the updated data.

**Tech Stack:** Astro 7 + Vercel SSR, TypeScript, tsx, existing `src/data/operators.ts` canonical model, `src/lib/availability.ts` facade, `scripts/seo/audit-core.ts` deterministic audits, `scripts/verify-operator-consistency.ts` validator.

## Global Constraints

- No fabricated facts, scores, offers, payout times, legal conclusions, credentials, or social profiles.
- No mass redirects, URL changes, affiliate tracking changes, or canonical rewrites without explicit evidence.
- Tracker legal display, affiliate commercial availability, and site CTA policy remain three distinct authorities; no authority overwrites another.
- Content writing uses GLM 5.2 only; the agent captures official source URLs and dates and verifies GLM-drafted notes before canonicalizing.
- Every change ships with focused tests and small conventional commits; `npm run ci` must pass before push.
- Generated `src/pages/` is never authored; `reviews/*.html` and `src/routes/` remain the authored sources.
- Every legacy `index.html` provenance label is `index.html#historical-homepage-snapshot-not-served`.

## Spec reference

Full design: `docs/superpowers/specs/2026-09-02-seo-conflict-resolution-design.md`. Phases A–F in the spec map to Tasks 1–8 below.

---

## Task 1: Canonicalize the 25 unresolved editor scores

**Files:**
- Modify: `src/data/operators.ts` (`SCORE_100`, `CONFLICTING_SCORES`, `LEGACY_REVIEW_JSON_LD_SCORES`, `scoreFact`)
- Modify: `scripts/verify-operator-consistency.test.ts` (the `mcluck` unresolved assertion)

**Interfaces:**
- Consumes: `REVIEW_SOURCE_DATES` and `sourceFor(slug)` from `src/data/operators.ts`.
- Produces: `OPERATORS` where every `editorScore100.status === 'verified'` with a 0–100 value and review provenance; `CONFLICTING_SCORES` and `LEGACY_REVIEW_JSON_LD_SCORES` remain only as evidence in the audit, not as canonical sources.

- [ ] **Step 1: Write the failing test**

In `scripts/verify-operator-consistency.test.ts`, replace the `mcluck` unresolved assertion block (around line 95–105) with:

```typescript
assert.equal(getOperator('mcluck')?.editorScore100.status, 'verified');
assert.equal(verifiedValue(getOperator('mcluck')!.editorScore100), 88);
assert.equal(getOperator('american-luck')?.editorScore100.status, 'verified');
assert.equal(verifiedValue(getOperator('american-luck')!.editorScore100), 72);
assert.ok(
  OPERATORS.every((operator) => operator.editorScore100.status === 'verified'),
  'all 29 editor scores must be verified after canonicalization',
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-operator-consistency.test.ts`
Expected: FAIL with `mcluck editorScore100 status must be 'verified'` (currently `'unresolved'`).

- [ ] **Step 3: Move the 25 conflicting scores into `SCORE_100`**

In `src/data/operators.ts`, merge the 25 review `/100` values from `CONFLICTING_SCORES[*][0]` into `SCORE_100` (keeping the four existing entries). Delete `CONFLICTING_SCORES` and `LEGACY_REVIEW_JSON_LD_SCORES`. Update `scoreFact` to:

```typescript
function scoreFact(slug: string): CanonicalFact<number> {
  if (slug in SCORE_100) return verified(SCORE_100[slug], slug);
  return missing('No explicit /100 editorial score is supported.');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/verify-operator-consistency.test.ts`
Expected: PASS.

- [ ] **Step 5: Run operator and schema gates**

Run: `npm run operator:verify && npm run schema:verify && npm run schema:check`
Expected: All pass; 29 operators validated; 115 built pages validated.

- [ ] **Step 6: Commit**

```bash
git add src/data/operators.ts scripts/verify-operator-consistency.test.ts
git commit -m "fix: canonicalize 25 unresolved editor scores from review /100"
```

## Task 2: Regenerate deterministic audits after score canonicalization

**Files:**
- Modify: `docs/seo/operator-data-conflicts.md` (regenerate)
- Modify: `docs/seo/schema-audit.md` (regenerate)
- Modify: `docs/seo/internal-link-map.md` (regenerate)
- Modify: `scripts/seo/audit.test.ts` (add resolved-score count assertion)

- [ ] **Step 1: Write the failing test**

In `scripts/seo/audit.test.ts`, add:

```typescript
const conflicts = readFileSync(resolve(root, 'docs/seo/operator-data-conflicts.md'), 'utf8');
const unresolvedScores = (conflicts.match(/^\| [a-z0-9-]+ \| editorial score \|.*\| UNRESOLVED \|$/gm) ?? []).length;
assert.equal(unresolvedScores, 0, 'no editorial score conflicts may remain unresolved');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/seo/audit.test.ts`
Expected: FAIL (current file has 25 UNRESOLVED score rows).

- [ ] **Step 3: Regenerate the audit files**

Run: `npm run seo:audit` to regenerate all `docs/seo/*.md` files from the updated canonical data.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/seo/audit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/seo/operator-data-conflicts.md docs/seo/schema-audit.md docs/seo/internal-link-map.md scripts/seo/audit.test.ts
git commit -m "docs: regenerate audits after score canonicalization"
```

## Task 3: Resolve the four signup-offer conflicts from official sources

**Files:**
- Modify: `src/data/operators.ts` (`CONFLICTING_OFFERS`, `signupFact`, add `VERIFIED_OFFERS`)
- Modify: `src/routes/bonuses/no-deposit/index.astro` (verified offers render)
- Modify: `docs/seo/operator-data-conflicts.md` (regenerate)

**Interfaces:**
- Consumes: official operator promotion/terms page URLs and capture dates.
- Produces: `signupOffer` with `status: 'verified'` and provenance `source = <official URL>`, `verifiedOn = <capture date>` for resolved operators; `unresolved` with documented evidence gap for others.

- [ ] **Step 1: Fetch official promotion pages for the four operators**

For each of `crown-coins`, `hello-millions`, `spinblitz`, `spree`, use WebFetch to retrieve the operator's official promotion/terms page. Record the exact offer amount text, the URL, and today's date (2026-09-02). If the page is unavailable or ambiguous, document the evidence gap and leave the field `unresolved`.

- [ ] **Step 2: Write the failing test**

In `scripts/verify-operator-consistency.test.ts`, add:

```typescript
for (const slug of ['crown-coins', 'hello-millions', 'spinblitz', 'spree']) {
  const offer = getOperator(slug)!.signupOffer;
  if (offer.status === 'verified') {
    const provenance = offer.provenance[0];
    assert.ok(provenance.source.startsWith('http'), `${slug} verified offer provenance must be an official URL`);
    assert.ok(provenance.verifiedOn, `${slug} verified offer must have a capture date`);
  } else {
    assert.equal(offer.status, 'unresolved', `${slug} offer must be verified or explicitly unresolved`);
  }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx tsx scripts/verify-operator-consistency.test.ts`
Expected: FAIL (currently `unresolved` without official-source provenance).

- [ ] **Step 4: Update `signupFact` to accept official-source provenance**

In `src/data/operators.ts`, add a `VERIFIED_OFFERS` record for each resolved operator from Step 1. Update `signupFact` to check `VERIFIED_OFFERS` first, returning a `verified` fact with the official URL and capture date. Keep the `CONFLICTING_OFFERS` branch for unresolved operators with an added note about the official-source gap.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx scripts/verify-operator-consistency.test.ts`
Expected: PASS.

- [ ] **Step 6: Regenerate audits and commit**

Run: `npm run seo:audit`, then:

```bash
git add src/data/operators.ts scripts/verify-operator-consistency.test.ts docs/seo/operator-data-conflicts.md
git commit -m "fix: resolve signup offers from official operator sources"
```

## Task 4: Document state/legal-policy differences for counsel

**Files:**
- Create: `docs/seo/legal-review-briefs.md`
- Modify: `scripts/seo/audit-core.ts` (add brief-coverage gate)
- Modify: `scripts/seo/audit.test.ts` (assert brief coverage)

- [ ] **Step 1: Write the failing test**

In `scripts/seo/audit.test.ts`, add:

```typescript
const briefs = readFileSync(resolve(root, 'docs/seo/legal-review-briefs.md'), 'utf8');
const warnings = reconcileAvailabilityAuthorities().warnings;
for (const warning of warnings) {
  const subject = warning.subject ?? warning.kind;
  assert.match(briefs, new RegExp(`## ${subject}`, 'i'), `legal brief must cover ${subject}`));
}
assert.match(briefs, /## Card Crush commercial\/site policy intersection/i);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/seo/audit.test.ts`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Write the legal-review briefs**

Create `docs/seo/legal-review-briefs.md` with one `## <Subject>` section per warning from `state-legality-conflicts.md` (CA, FL, IN, ME, MS, TN) plus a `## Card Crush commercial/site policy intersection` section. Each brief states: tracker status, site CTA policy, enacted statute citation from `KEY_LEGISLATION` where available, and the precise policy question for counsel. Do not answer the question.

- [ ] **Step 4: Add the brief-coverage gate to `audit-core.ts`**

In `scripts/seo/audit-core.ts`, add a `legalBriefCoverage` function that reads `docs/seo/legal-review-briefs.md` and asserts every `state-legality-conflicts.md` warning subject has a brief. Wire it into `auditSummary`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx scripts/seo/audit.test.ts && npm run seo:audit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/seo/legal-review-briefs.md scripts/seo/audit-core.ts scripts/seo/audit.test.ts
git commit -m "docs: add legal review briefs for state-policy differences"
```

## Task 5: Stamp operator verification dates from official sources

**Files:**
- Modify: `src/data/operators.ts` (`makeRecord`, `lastVerifiedDate`)
- Modify: `docs/seo/operator-data-conflicts.md` (regenerate)
- Modify: `docs/seo/implementation-report.md` (update counts)

- [ ] **Step 1: Verify decision-critical fields against official sources for each operator**

For each of the 29 operators, check every decision-critical field (name, operator, launch date, signup offer, daily offer, redemption minima, timing, payment methods, game count) against the operator's official website. Record the URL and capture date for each verified field. An operator qualifies for `lastVerifiedDate` only when every available field is verified; fields with no official source remain `missing` and disqualify the stamp.

- [ ] **Step 2: Write the failing test**

In `scripts/verify-operator-consistency.test.ts`, add:

```typescript
for (const operator of OPERATORS) {
  const date = operator.lastVerifiedDate;
  if (date.status === 'verified') {
    const verifiedOn = date.provenance[0].verifiedOn;
    assert.ok(verifiedOn && isRealDate(verifiedOn), `${operator.slug} verified date must be a real date`);
    for (const field of CANONICAL_OPERATOR_FIELDS) {
      if (field === 'lastVerifiedDate' || field === 'name' || field === 'operatorName') continue;
      const fact = operator[field];
      if (fact.status === 'unresolved') {
        assert.fail(`${operator.slug}: lastVerifiedDate verified despite ${field} being unresolved`);
      }
    }
  } else {
    assert.equal(date.status, 'missing', `${operator.slug} verification date must be verified or explicitly missing`);
  }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx tsx scripts/verify-operator-consistency.test.ts`
Expected: FAIL (currently all 29 are `missing`).

- [ ] **Step 4: Stamp verification dates for qualifying operators**

In `src/data/operators.ts`, add a `VERIFIED_DATES` record mapping slugs to `{ verifiedOn: '<date>' }` for each operator that passed the Step 1 verification pass. Update `makeRecord` to set `lastVerifiedDate` from `VERIFIED_DATES` when present; keep `missing` with documented reason otherwise.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx scripts/verify-operator-consistency.test.ts`
Expected: PASS.

- [ ] **Step 6: Regenerate audits and commit**

Run: `npm run seo:audit`, then:

```bash
git add src/data/operators.ts scripts/verify-operator-consistency.test.ts docs/seo/operator-data-conflicts.md docs/seo/implementation-report.md
git commit -m "fix: stamp operator verification dates from official sources"
```

## Task 6: Re-evaluate deferred commercial hubs

**Files:**
- Modify: `docs/seo/commercial-hub-plan.md` (regenerate)
- Create: a hub route under `src/routes/` only if a candidate passes

- [ ] **Step 1: Write the failing test**

In `scripts/seo/audit.test.ts`, add an assertion that `commercial-hub-plan.md` reflects the updated verification-date counts from Task 5:

```typescript
const hubPlan = readFileSync(resolve(root, 'docs/seo/commercial-hub-plan.md'), 'utf8');
assert.match(hubPlan, /lastVerifiedDate.*\d+\/29/, 'hub plan must report the current verification-date count');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/seo/audit.test.ts`
Expected: FAIL (hub plan still reports 0/29).

- [ ] **Step 3: Regenerate the hub plan**

Run: `npm run seo:audit` to regenerate `docs/seo/commercial-hub-plan.md` with the updated verification-date counts. If a candidate now passes every gate, build the hub route under `src/routes/` with canonical data and add it to the sitemap. If gates still fail, keep the hub deferred and verify the plan documents the updated evidence.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/seo/audit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/seo/commercial-hub-plan.md scripts/seo/audit.test.ts
git commit -m "docs: re-evaluate deferred hubs with updated verification dates"
```

## Task 7: Final QA and report update

**Files:**
- Modify: `docs/seo/implementation-report.md`
- Create: `.superpowers/sdd/task-8-report.md`

- [ ] **Step 1: Run full CI**

Run: `npm run ci`
Expected: exit 0; all gates pass including rendered crawl and geo crawl.

- [ ] **Step 2: Update the implementation report**

Update `docs/seo/implementation-report.md` §5 ("Issues intentionally not changed") to move resolved items out of that section and into §1 ("Changes made"). Update §6 ("Items requiring human factual or legal review") to remove resolved items and keep only the remaining legal-policy briefs for counsel. Update §8 ("Tests performed") with the fresh CI counts.

- [ ] **Step 3: Commit**

```bash
git add docs/seo/implementation-report.md .superpowers/sdd/task-8-report.md
git commit -m "docs: update implementation report after conflict resolution"
```

## Self-Review

**Spec coverage:** Phase A → Task 1; Phase B → Task 3; Phase C → Task 4; Phase D → Task 5; Phase E → Task 6; Phase F → Task 7. Task 2 covers audit regeneration required by Task 1. All spec phases covered.

**Placeholder scan:** No TBD/TODO. Step 1 of Task 3 and Task 5 requires fetching official sources at execution time; the plan documents the capture-and-verify pattern but cannot pre-fill the URLs since they are discovered during execution.

**Type consistency:** `VERIFIED_OFFERS` and `VERIFIED_DATES` are new records in `operators.ts` consumed by `signupFact` and `makeRecord` respectively; both return `CanonicalFact<T>` consistent with the existing type.
