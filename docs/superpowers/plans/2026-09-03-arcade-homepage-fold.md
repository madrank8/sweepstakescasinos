# Arcade Homepage 10-Card Fold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fold the live original arcade homepage grid so the first 10 ranked cards show on load and the other 18 stay in the same HTML behind a gold **Show all 28 casinos** button.

**Architecture:** Progressive enhancement on authored `index.html`. A head script adds `js-fold` to `<html>` before paint. CSS `.js-fold #casino-grid.fold-collapsed .fold-extra { display: none; }` hides cards 11–28 only when JS ran. The show-all control uses existing `.btn-claim` chrome. Filter chips still scan all 28 cards; any filter other than Complete List removes `fold-collapsed` so matches are not trapped.

**Tech Stack:** Authored `index.html` + `style.css`, Node `assert` tests via `tsx` (same pattern as `scripts/verify-homepage.test.ts`). No new runtime dependencies.

## Global Constraints

- Do not restore `src/routes/index.astro`. `/` stays the generator-wrapped `index.html`.
- Do not edit generated `src/pages/`.
- Do not restyle cards, nav, hero, or Claim Bonus chrome. The only new chrome is the show-all control under the grid, using the existing `.btn-claim` gold treatment.
- All 28 ranked cards stay in the DOM in current source order. American Luck stays off this page.
- ItemList `#toplist` stays 28 items. Hidden cards still carry `data-item-position` / `data-item-name` / `data-item-url`.
- Geo CTA suppression (`prepareSsrAffiliateHtml(..., 'homepage')`) still runs on every claim link.
- Showing 10 first must not add copy such as “Top 10,” “Best 10,” or a new ranked heading.
- No new marketing copy. Button labels are locked: **Show all 28 casinos** and **Show fewer**.
- No fabricated facts.
- Generated `src/pages/` is never authored.

## Spec reference

`docs/superpowers/specs/2026-09-03-arcade-homepage-fold-design.md`

## File map

| File | Responsibility |
|---|---|
| `scripts/verify-homepage-fold.test.ts` | Source + CSS + script contract tests for the fold |
| `package.json` | Run the fold test from `verify:homepage` |
| `index.html` | `fold-extra` on cards 11–28, `fold-collapsed` on the grid, head `js-fold` script, show-all control, fold IIFE |
| `style.css` | Fold visibility and Show fewer outline only |
| `scripts/verify-homepage.test.ts` | Unchanged 28-card / ItemList assertions must still pass |

Do not modify `src/routes/`, `src/pages/`, `src/lib/homepage.ts`, or operator canonical data.

---

### Task 1: Fold markup contract tests and markup

**Files:**
- Create: `scripts/verify-homepage-fold.test.ts`
- Modify: `package.json` (`verify:homepage` script)
- Modify: `index.html` (grid class, cards 11–28, show-all control, head script)

**Interfaces:**
- Consumes: existing 28 `<article class="card">` elements in `index.html` `#casino-grid`.
- Produces: cards 1–10 unchanged; cards 11–28 have class `fold-extra`; `#casino-grid` has class `fold-collapsed`; head script `document.documentElement.classList.add('js-fold')`; `#fold-toggle` and `#fold-count` after the grid.

- [ ] **Step 1: Write the failing test**

Create `scripts/verify-homepage-fold.test.ts`:

```typescript
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const homeSource = readFileSync(resolve(root, 'index.html'), 'utf8');
const cssSource = readFileSync(resolve(root, 'style.css'), 'utf8');

const cardOpenings = [...homeSource.matchAll(/<article\b([^>]*)>/g)]
  .map((match) => match[1])
  .filter((attrs) => /\bclass=["'][^"']*\bcard\b/.test(attrs));

assert.equal(cardOpenings.length, 28, 'fold must not drop ranked cards from the DOM');

for (let index = 0; index < 10; index += 1) {
  assert.doesNotMatch(
    cardOpenings[index],
    /\bfold-extra\b/,
    `card ${index + 1} must stay in the default fold`,
  );
}
for (let index = 10; index < 28; index += 1) {
  assert.match(
    cardOpenings[index],
    /\bfold-extra\b/,
    `card ${index + 1} must be fold-extra`,
  );
}

assert.match(
  homeSource,
  /<div class="grid fold-collapsed" id="casino-grid"/,
  'grid must start collapsed for js-fold CSS',
);
assert.match(
  homeSource,
  /document\.documentElement\.classList\.add\('js-fold'\)/,
  'head script must enable js-fold before paint',
);
assert.match(
  homeSource,
  /id="fold-toggle"[^>]*>Show all 28 casinos/,
  'gold show-all control must use the locked label',
);
assert.match(
  homeSource,
  /id="fold-count">Showing 10 of 28\. The other 18 stay on this page, just folded\./,
  'helper text must match the approved mockup',
);
assert.doesNotMatch(
  homeSource,
  /Top 10|Best 10|top ten/i,
  'the fold must not introduce a top-10 ranking claim',
);
assert.match(
  cardOpenings[0],
  /data-item-position="1"[^>]*data-item-name="McLuck"/,
);
assert.match(
  cardOpenings[9],
  /data-item-position="10"[^>]*data-item-name="Card Crush"/,
);
assert.match(
  cardOpenings[10],
  /data-item-position="11"[^>]*data-item-name="Spree"/,
);
assert.match(
  cardOpenings[27],
  /data-item-position="28"[^>]*data-item-name="Mega Bonanza"/,
);

assert.match(
  cssSource,
  /\.js-fold #casino-grid\.fold-collapsed \.fold-extra\s*\{\s*display:\s*none;/,
  'CSS must hide extras only when js-fold and collapsed',
);
assert.match(cssSource, /\.fold-more-wrap\s*\{[^}]*display:\s*none;/);
assert.match(cssSource, /\.js-fold \.fold-more-wrap\s*\{[^}]*display:\s*block;/);
assert.match(cssSource, /\.btn-claim\.fold-fewer\s*\{/);

assert.match(homeSource, /expanded=btn\.dataset\.f!=='all'/);
assert.match(homeSource, /grid\.classList\.toggle\('fold-collapsed', !expanded\)/);
assert.match(
  homeSource,
  /Showing all 28\. Click Show fewer to fold back to 10\./,
);
assert.match(
  homeSource,
  /if\(grid\) grid\.classList\.remove\('fold-collapsed'\)/,
  'missing toggle must uncollapse so cards stay visible',
);
```

- [ ] **Step 2: Wire the test into `verify:homepage`**

In `package.json`, change:

```json
"verify:homepage": "tsx scripts/verify-homepage.test.ts && tsx scripts/verify-homepage-fold.test.ts",
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx tsx scripts/verify-homepage-fold.test.ts`

Expected: FAIL on `grid must start collapsed for js-fold CSS` (or the first missing fold-extra assertion).

- [ ] **Step 4: Add head script, grid class, fold-extra, and show-all markup**

In `index.html` `<head>`, immediately after `<meta charset="UTF-8">`, add:

```html
<script>document.documentElement.classList.add('js-fold');</script>
```

Change the grid opening tag from:

```html
  <div class="grid" id="casino-grid" data-item-list="https://sweepstakeswiz.com/#toplist" data-item-list-order="https://schema.org/ItemListOrderDescending">
```

to:

```html
  <div class="grid fold-collapsed" id="casino-grid" data-item-list="https://sweepstakeswiz.com/#toplist" data-item-list-order="https://schema.org/ItemListOrderDescending">
```

For every `#casino-grid` article with `data-item-position="11"` through `"28"`, change `class="card fade-up"` to `class="card fade-up fold-extra"`. Do not add `fold-extra` to positions 1–10.

Immediately after the grid’s closing `</div>` (the one before `<section class="rate-sec" id="how-we-rate">`), insert:

```html
  <div class="fold-more-wrap" id="fold-wrap">
    <button class="btn-claim" id="fold-toggle" type="button" aria-expanded="false">Show all 28 casinos <span class="arr">→</span></button>
    <p class="fold-count" id="fold-count">Showing 10 of 28. The other 18 stay on this page, just folded.</p>
  </div>
```

- [ ] **Step 5: Commit markup (tests still fail on CSS/JS — that is Task 2/3)**

Do not commit yet if CSS/JS assertions already fail in the same file. Keep going to Task 2 in the same red cycle only if you split the test file. This plan keeps one test file; implement CSS and JS in Tasks 2 and 3 before expecting the full file to pass. After markup, re-run to confirm markup assertions now pass and CSS/JS assertions still fail.

Run: `npx tsx scripts/verify-homepage-fold.test.ts`

Expected: FAIL on the CSS selector assertion.

- [ ] **Step 6: Commit markup**

```bash
git add scripts/verify-homepage-fold.test.ts package.json index.html
git commit -m "test: add homepage fold markup contract"
```

If CSS/JS assertions still fail, include only the test file + package.json in this commit, then commit markup once those assertions are split. Preferred: leave the test file failing until CSS and JS land in the next two tasks, and commit the test file first:

```bash
git add scripts/verify-homepage-fold.test.ts package.json
git commit -m "test: fail homepage fold contract until markup, CSS, and JS land"
```

Then after markup:

```bash
git add index.html
git commit -m "feat: mark homepage cards 11-28 as fold extras"
```

---

### Task 2: Fold CSS

**Files:**
- Modify: `style.css` (append fold rules after `.fade-up.visible`, before RESPONSIVE)
- Modify: `index.html` cache query on `style.css?v=20260719` → `style.css?v=20260903`

**Interfaces:**
- Consumes: `js-fold` on `<html>`, `fold-collapsed` on `#casino-grid`, `fold-extra` on cards 11–28, `.fold-more-wrap` / `.fold-fewer`.
- Produces: extras hidden only with JS + collapsed grid; show-all control hidden without JS; Show fewer outline on `.btn-claim.fold-fewer`.

- [ ] **Step 1: Confirm CSS assertions are still failing**

Run: `npx tsx scripts/verify-homepage-fold.test.ts`

Expected: FAIL matching `CSS must hide extras only when js-fold and collapsed`.

- [ ] **Step 2: Add fold CSS**

In `style.css`, immediately after `.fade-up.visible{opacity:1;transform:none;}` insert:

```css

/* ══════════════════════
   HOMEPAGE FOLD
══════════════════════ */
.js-fold #casino-grid.fold-collapsed .fold-extra{display:none;}
.fold-more-wrap{display:none;margin:8px auto 32px;text-align:center;max-width:480px;padding:0 16px;}
.js-fold .fold-more-wrap{display:block;}
.fold-more-wrap .btn-claim{width:100%;}
.fold-count{margin-top:10px;font-size:.8rem;color:rgba(255,255,255,.48);}
.btn-claim.fold-fewer{
  background:transparent;
  color:var(--neon);
  border:1px solid rgba(249,224,0,.35);
  box-shadow:none;
}
.btn-claim.fold-fewer::after{display:none;}
```

Change `index.html` stylesheet href from `style.css?v=20260719` to `style.css?v=20260903`.

- [ ] **Step 3: Run tests**

Run: `npx tsx scripts/verify-homepage-fold.test.ts`

Expected: FAIL on the fold script assertions (`expanded=btn.dataset.f!=='all'`), CSS assertions pass.

- [ ] **Step 4: Commit**

```bash
git add style.css index.html
git commit -m "feat: hide folded homepage cards only when JS ran"
```

---

### Task 3: Fold script and filter auto-expand

**Files:**
- Modify: `index.html` (script block after the existing Filter IIFE)

**Interfaces:**
- Consumes: `#casino-grid`, `#fold-toggle`, `#fold-count`, `.fold-extra`, `.fb[data-f]`.
- Produces: `expanded=false` on load (grid keeps `fold-collapsed`); toggle flips expanded; `data-f` other than `all` sets `expanded=true`; Complete List sets `expanded=false`; missing toggle removes `fold-collapsed`.

- [ ] **Step 1: Confirm script assertions fail**

Run: `npx tsx scripts/verify-homepage-fold.test.ts`

Expected: FAIL matching `expanded=btn.dataset.f!=='all'`.

- [ ] **Step 2: Add the fold IIFE after the Filter block**

In `index.html`, immediately after the Filter `});` that closes `document.querySelectorAll('.fb')`, and before `// ── Fade-up on scroll ──`, insert:

```javascript
// ── Fold (progressive enhancement) ──
(function(){
  var grid=document.getElementById('casino-grid');
  var toggle=document.getElementById('fold-toggle');
  var count=document.getElementById('fold-count');
  var extras=document.querySelectorAll('#casino-grid > .fold-extra');
  if(!grid||!toggle||extras.length<1){
    if(grid) grid.classList.remove('fold-collapsed');
    return;
  }
  var expanded=false;
  function applyFold(){
    grid.classList.toggle('fold-collapsed', !expanded);
    toggle.innerHTML=expanded?'Show fewer':'Show all 28 casinos <span class="arr">→</span>';
    toggle.classList.toggle('fold-fewer', expanded);
    toggle.setAttribute('aria-expanded', expanded?'true':'false');
    if(count){
      count.textContent=expanded
        ?'Showing all 28. Click Show fewer to fold back to 10.'
        :'Showing 10 of 28. The other 18 stay on this page, just folded.';
    }
  }
  applyFold();
  toggle.addEventListener('click',function(){
    expanded=!expanded;
    applyFold();
  });
  document.querySelectorAll('.fb').forEach(function(btn){
    btn.addEventListener('click',function(){
      expanded=btn.dataset.f!=='all';
      applyFold();
    });
  });
})();
```

Do not change the existing filter loop that sets `card.style.display`. The fold listener runs in addition to it. Non-`all` filters auto-expand first (second listener), after the original listener has already set inline display. CSS `display:none` on `.fold-extra` only applies while `fold-collapsed` is present, so auto-expand lets the inline filter display win.

- [ ] **Step 3: Run fold + existing homepage tests**

Run:

```bash
npx tsx scripts/verify-homepage-fold.test.ts
npx tsx scripts/verify-homepage.test.ts
```

Expected: both PASS. Homepage test still counts 28 cards, McLuck `#1`, Mega Bonanza `#28`, no `src/routes/index.astro`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: toggle homepage fold and auto-expand on filters"
```

---

### Task 4: CI gate

**Files:** none besides whatever Task 3 left.

- [ ] **Step 1: Run homepage verifiers and SEO homepage inventory**

Run:

```bash
npm run verify:homepage
npx tsx scripts/seo/audit.test.ts
```

Expected: PASS, including the 28-operator toplist inventory.

- [ ] **Step 2: Run full CI**

Run: `npm run ci`

Expected: PASS.

- [ ] **Step 3: Commit only if CI required a tiny assertion tweak**

If CI passed with no extra edits, there is nothing to commit. If an audit regex needs a fold-neutral wording tweak, keep it factual (28 cards still in the DOM) and commit:

```bash
git add scripts/seo/audit.test.ts
git commit -m "test: keep 28-card homepage inventory with fold extras"
```

---

## Self-review

1. **Spec coverage:** default 10 visible / 18 in DOM — Task 1. Gold labels — Task 1 markup + Task 3 script. Filter auto-expand and Complete List re-collapse — Task 3. No-JS shows all 28 — Task 2 CSS requires `js-fold`. Missing toggle uncollapses — Task 3. No Top 10 copy — Task 1. ItemList 28 — existing `verify-homepage.test.ts` in Task 3. No `index.astro` — existing test.
2. **Placeholders:** none.
3. **Names:** `fold-extra`, `fold-collapsed`, `js-fold`, `fold-toggle`, `fold-count`, `fold-fewer` are used consistently across tasks.
