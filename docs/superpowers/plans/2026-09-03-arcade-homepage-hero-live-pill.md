# Arcade Homepage Hero Live-Pill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the original arcade `.hero-live` chrome and pulsing dot; replace only the inner sentence with the GLM 5.2 line `Checked Against Official Operator Sites`.

**Architecture:** One authored text replacement on `index.html`. Tests in `scripts/verify-homepage.test.ts` lock the new sentence, forbid the old uptime/July claim, and keep the five trust pills. The generator still wraps `/` with `prepareSsrAffiliateHtml(..., 'homepage')`. No CSS, JS, schema, or fold changes.

**Tech Stack:** Authored `index.html`, Node `assert` via `tsx` (`scripts/verify-homepage.test.ts`). No new dependencies.

## Global Constraints

- Do not restore `src/routes/index.astro`. `/` stays the generator-wrapped `index.html`.
- Do not edit generated `src/pages/`.
- Do not restyle nav, hero, cards, fold control, Claim Bonus, or `.hero-live` / `.hero-live-dot`. Existing `text-transform: uppercase` and letter-spacing stay. Mobile wrap on this longer line is accepted; do not add CSS to prevent it.
- New marketing copy in this slice is the GLM 5.2 line `Checked Against Official Operator Sites`, verbatim. Do not rewrite it, shorten it, add a date, or substitute another model’s wording.
- No fabricated facts.
- Keep the 10-card fold, 28 cards in the DOM, and ItemList `#toplist` unchanged.

## Spec reference

`docs/superpowers/specs/2026-09-03-arcade-homepage-hero-live-pill-design.md`

## File map

| File | Responsibility |
|---|---|
| `scripts/verify-homepage.test.ts` | Lock new `.hero-live` sentence; forbid old strings; keep five trust pills |
| `index.html` | Replace the `.hero-live` text node only |
| `scripts/verify-homepage-fold.test.ts` | Unchanged 28-card fold contract must still pass |

Do not modify `style.css`, fold markup/JS, `src/routes/`, generated `src/pages/`, or operator data.

---

### Task 1: Failing homepage hero-pill contract

**Files:**
- Modify: `scripts/verify-homepage.test.ts` (after the existing `<header class="hero">` / title assertions around lines 229–239)

**Interfaces:**
- Consumes: `homeSource` already read from `index.html`.
- Produces: assertions that fail until Task 2 replaces the `.hero-live` text node.

- [ ] **Step 1: Write the failing test**

Insert this block in `scripts/verify-homepage.test.ts` immediately after the `Best Sweepstakes Casinos 2026` title assertion:

```typescript
assert.match(
  homeSource,
  /<div class="hero-live"><span class="hero-live-dot"><\/span> Checked Against Official Operator Sites<\/div>/,
  'hero live pill must keep chrome and the GLM source-check sentence',
);
assert.doesNotMatch(
  homeSource,
  /All Sweepstakes Sites Active/,
  'hero must not claim all sites are active',
);
assert.doesNotMatch(
  homeSource,
  /Verified July 2026/,
  'hero must not stamp an unverifiable July 2026 verification date',
);
assert.match(homeSource, /Legal in USA/, 'Legal in USA trust pill must remain');
assert.match(homeSource, /No Purchase Needed/, 'No Purchase Needed trust pill must remain');
assert.match(homeSource, /Fast Redemptions Only/, 'Fast Redemptions Only trust pill must remain');
assert.match(homeSource, /Expert Verified 2026/, 'Expert Verified 2026 trust pill must remain');
assert.match(homeSource, /20\+ Sweeps Sites/, '20+ Sweeps Sites trust pill must remain');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx tsx scripts/verify-homepage.test.ts
```

Expected: FAIL on the `.hero-live` match (current source still has `All Sweepstakes Sites Active — Verified July 2026`). Do not change `index.html` yet.

- [ ] **Step 3: Commit the failing test**

```bash
git add scripts/verify-homepage.test.ts
git commit -m "test: fail until homepage hero pill uses GLM source-check line"
```

---

### Task 2: Replace the hero-pill sentence

**Files:**
- Modify: `index.html` line 101 (`.hero-live` text node only)

**Interfaces:**
- Consumes: Task 1 assertions.
- Produces: exact markup `<div class="hero-live"><span class="hero-live-dot"></span> Checked Against Official Operator Sites</div>`

- [ ] **Step 1: Replace the text node**

In `index.html`, change only:

```html
    <div class="hero-live"><span class="hero-live-dot"></span> All Sweepstakes Sites Active — Verified July 2026</div>
```

to:

```html
    <div class="hero-live"><span class="hero-live-dot"></span> Checked Against Official Operator Sites</div>
```

Do not edit the wrapper, the dot span, H1, subtitle, body, trust pills, fold, or `style.css`.

- [ ] **Step 2: Run homepage tests to verify they pass**

Run:

```bash
npm run verify:homepage
```

Expected: PASS (`verify-homepage.test.ts` and `verify-homepage-fold.test.ts`).

- [ ] **Step 3: Commit the markup**

```bash
git add index.html
git commit -m "feat: replace homepage hero pill with GLM source-check line"
```

---

### Task 3: CI gate

**Files:** none besides whatever Task 2 left.

- [ ] **Step 1: Run full CI**

Run: `npm run ci`

Expected: PASS.

- [ ] **Step 2: Commit only if CI required a tiny assertion tweak**

If CI passed with no extra edits, there is nothing to commit.

---

## Self-review

1. **Spec coverage:** keep chrome — Task 2 leaves wrapper/dot. GLM sentence verbatim — Task 1 regex + Task 2 markup. Old uptime/July strings gone — Task 1 `doesNotMatch`. Five trust pills remain — Task 1. Fold/28/ItemList — existing tests in Task 2 `verify:homepage`. No CSS — file map. `npm run ci` — Task 3.
2. **Placeholders:** none.
3. **Names:** `.hero-live`, `.hero-live-dot`, and the exact GLM sentence are used consistently.
