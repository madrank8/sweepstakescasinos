# SweepstakesWiz Audit Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close HIGH/MEDIUM/LOW items from `~/Downloads/SweepstakesWiz-audit-fix-plan.md` against the live Astro SSR codebase without breaking geo-suppression, GA, or affiliate rankings.

**Architecture:** Source HTML (`index.html`, `reviews/*.html`, `partials/`) is wrapped by `scripts/generate-astro-pages.mjs` into Astro SSR/static pages. Geo CTAs are stripped in `src/lib/affiliateHtml.ts` via `src/middleware.ts`. Response headers/caching go in root `vercel.json` (already Astro-configured — **merge only**). Sitemap `lastmod` is generated in `writeSitemapAndRobots()`.

**Tech Stack:** Astro 7, `@astrojs/vercel` (`output: 'server'`), static HTML sources, Vercel headers, `cwebp`/`convert` for images.

## Global Constraints

- Do **not** modify geo middleware, `suppressAffiliateCtas`, `/bonuses/` gateway, GA measurement ID (`G-XR0EZ750YM`), affiliate bonus values, ratings, or rankings.
- Work T1 → T10 in order; each task independently shippable; commit per task.
- If a task’s assumptions don’t match the repo, stop and report (do not force).
- After each task, run its Verify commands before moving on.
- Locked decision **T2 = Option A:** expand homepage `#toplist` ItemList to all 28 visible cards.

### Audit → repo corrections (do not re-litigate)

| Audit | Reality |
| --- | --- |
| Plain static site | Astro SSR + generated `src/pages/` |
| Create `vercel.json` from scratch | Extend existing Astro `vercel.json` |
| OG 400×244 | File is already 1200×630; still ~892 KB — compress + fix meta width/height |
| GA `G-YS24XQPM4Y` | Canonical ID is `G-XR0EZ750YM` — leave it |
| T6 add `rel=sponsored` | Already on homepage CTAs + `AffiliateLink.astro` — verify only |
| T7b nav `<a>` without href | Homepage + `partials/nav.html` already have real hrefs — skip dropdown rewrite; do FAQ ARIA + emoji |
| T10 consent banner | `/legal/do-not-sell/` + cookie/privacy disclose GA — review only, no CMP |

---

## File map

| Path | Role |
| --- | --- |
| `vercel.json` | Framework config + security/cache headers |
| `index.html` | Homepage: schema, freshness copy, OG meta, FAQ ARIA, typo |
| `scripts/generate-astro-pages.mjs` | Sitemap `lastmod` generation |
| `sweepstakeslogo/*`, `public/sweepstakeslogo/*`, `favicon.ico` | Image assets (keep `public/` + root copies in sync) |
| `partials/footer.html` + review footers | Remove internal Privacy `nofollow` |
| `reviews/mcluck.html` (+ grep siblings) | H1 spacing around em dash / ampersand |
| `legal/cookie.html`, `legal/privacy.html`, `legal/do-not-sell.html` | T10 review evidence |

---

### Task 1: Security response headers

**Files:**
- Modify: `vercel.json`

**Interfaces:**
- Consumes: existing Astro keys (`framework`, `buildCommand`, `installCommand`, `outputDirectory`)
- Produces: global security headers on `/(.*)`

- [ ] **Step 1: Merge security headers into `vercel.json` without removing Astro keys**

Keep existing keys. Add:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://vitals.vercel-insights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests"
        }
      ]
    }
  ]
}
```

Notes: GA/gtag ship from `/_external/` (same-origin) plus inline config; keep `'unsafe-inline'`. Fonts resolve under `/_external/fonts.gstatic.com/` (same-origin). Extra `va.vercel-scripts.com` / `vitals.vercel-insights.com` only if production loads them — drop if unused after console check.

- [ ] **Step 2: Local JSON sanity**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "$(cat <<'EOF'
fix(security): add response headers via vercel.json

EOF
)"
```

- [ ] **Step 4: Verify after deploy** (or note “pending deploy”)

```bash
curl -sS -D - -o /dev/null https://sweepstakeswiz.com/ | grep -iE 'content-security|x-content-type|referrer-policy|permissions-policy|x-frame|strict-transport'
```

---

### Task 2: Homepage ItemList schema = 28 cards

**Files:**
- Modify: `index.html` (ItemList JSON-LD near `#toplist` / end of rankings section)

**Interfaces:**
- Consumes: 28 `<article class="card">` review URLs in card order
- Produces: `numberOfItems: 28` + 28 `ListItem` entries

- [ ] **Step 1: Replace ItemList `itemListElement` with all 28 cards in DOM order**

Display names + slugs (position order):

1. McLuck → `mcluck`
2. Pulsz → `pulsz`
3. Crown Coins → `crown-coins`
4. Hello Millions → `hello-millions`
5. PlayFame → `playfame`
6. Casino Click → `casino-click`
7. SpinBlitz → `spinblitz`
8. Legendz → `legendz`
9. Thrillzz → `thrillzz`
10. Card Crush → `card-crush`
11. Spree → `spree`
12. RoxyMoxy → `roxymoxy`
13. Zula → `zula`
14. Rolla Casino → `rolla`
15. Splash Coins → `splash-coins`
16. Sweet Sweeps → `sweet-sweeps`
17. Big Pirate → `big-pirate`
18. Lucky Bunny → `lucky-bunny`
19. DexyPlay → `dexyplay`
20. Sweepico → `sweepico`
21. Wow Vegas → `wow-vegas`
22. FreeSpin → `freespin`
23. AceBet → `acebet`
24. Jackpota → `jackpota`
25. High 5 Casino → `high5`
26. Jackpot Go → `jackpot-go`
27. SpinFinite → `spinfinite`
28. Mega Bonanza → `mega-bonanza`

Each `ListItem`:

```json
{
  "@type": "ListItem",
  "position": N,
  "name": "Display Name",
  "url": "https://sweepstakeswiz.com/reviews/<slug>/",
  "item": { "@id": "https://sweepstakeswiz.com/reviews/<slug>/#brand" }
}
```

Keep existing Organization nodes for brands that already have them; do not invent new operator legal entities. Set `"numberOfItems": 28`.

- [ ] **Step 2: Verify locally**

```bash
python3 - <<'PY'
import re, json
html=open('index.html').read()
m=re.search(r'<script type="application/ld\+json">(\{"@context":"https://schema.org","@graph":\[\{"@type":"ItemList".*?</script>)', html)
# fallback: find numberOfItems + count cards
n=re.search(r'"@id":"https://sweepstakeswiz.com/#toplist"[^}]*"numberOfItems":(\d+)', html)
cards=len(re.findall(r'<article class="card ', html))
print('numberOfItems', n.group(1) if n else None, 'cards', cards)
assert n and int(n.group(1))==cards==28
print('OK')
PY
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
fix(seo): align homepage ItemList numberOfItems with 28 cards

EOF
)"
```

---

### Task 3: Freshness signals

**Files:**
- Modify: `scripts/generate-astro-pages.mjs` (`writeSitemapAndRobots`)
- Modify: `index.html` (hero live badge)

**Interfaces:**
- Consumes: git last-commit date per URL’s source file when available
- Produces: varied `<lastmod>` values; hero badge month aligned with Updated stamp

- [ ] **Step 1: Replace blanket `today` lastmod with per-URL dates**

In `writeSitemapAndRobots()`, for each URL resolve a source path (homepage → `index.html`, review → `reviews/<slug>.html`, MDX → `src/content/...`, Astro route → `src/routes/...`). Use:

```js
function lastmodFor(filePath) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', filePath], { encoding: 'utf8' }).trim() || today;
  } catch {
    return today;
  }
}
```

Fallback to `today` only when git has no history for that path.

- [ ] **Step 2: Align hero badge**

Change:

`All Sweepstakes Sites Active — Verified May 19, 2026`

→

`All Sweepstakes Sites Active — Verified July 2026`

(matches `__UPDATED_DATE__` / JS month stamp convention)

- [ ] **Step 3: Regenerate sitemap**

Run: `npm run generate:pages`
Then: `grep -oE '<lastmod>[^<]+' sitemap.xml | sort | uniq -c | head`

Expected: more than one distinct date (or demonstrably file-backed dates).

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-astro-pages.mjs index.html sitemap.xml public/sitemap.xml
git commit -m "$(cat <<'EOF'
fix(seo): use per-page sitemap lastmod and align verified badge

EOF
)"
```

---

### Task 4: Compress OG image + fix meta dimensions

**Files:**
- Modify: `sweepstakeslogo/sweepstakeswiz-og.png`, `public/sweepstakeslogo/sweepstakeswiz-og.png`
- Modify: `index.html` (`og:image:width` / `height`)
- Modify: any layout/partial that hardcodes 400×244 (grep)

- [ ] **Step 1: Re-encode OG to ≤200 KB at 1200×630**

```bash
cwebp -q 80 -resize 1200 630 sweepstakeslogo/sweepstakeswiz-og.png -o /tmp/og.webp
# Prefer keeping .png path for existing meta URLs — use optimized PNG:
convert sweepstakeslogo/sweepstakeswiz-og.png -resize 1200x630 -strip PNG8:/tmp/og.png
# if PNG8 too large, use JPEG quality 80 renamed kept as png only if visual OK;
# better: keep PNG path with quantized PNG or update meta to .jpg/.webp sitewide
ls -la /tmp/og.png /tmp/og.webp
```

Target ≤ ~205000 bytes. Sync into both `sweepstakeslogo/` and `public/sweepstakeslogo/`. If switching to WebP/JPEG, update all `og:image` / `twitter:image` references.

- [ ] **Step 2: Fix meta tags**

```html
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

- [ ] **Step 3: Commit**

```bash
git add sweepstakeslogo/sweepstakeswiz-og.png public/sweepstakeslogo/sweepstakeswiz-og.png index.html
git commit -m "$(cat <<'EOF'
fix(seo): compress OG image and correct og:image dimensions

EOF
)"
```

---

### Task 5: Long-lived caching for static assets

**Files:**
- Modify: `vercel.json` (merge into Task 1 `headers`)
- Modify: `index.html` (add `?v=20260719` on `style.css` / `include.js` if present)

- [ ] **Step 1: Append cache header rules** (more-specific sources after or before global — Vercel matches most specific)

```json
{
  "source": "/sweepstakeslogo/(.*)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=604800, stale-while-revalidate=86400" }]
},
{
  "source": "/partials/(.*)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=3600, must-revalidate" }]
},
{
  "source": "/(style\\.css|favicon\\.ico)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=3600, must-revalidate" }]
}
```

- [ ] **Step 2: Cache-bust query on homepage CSS/JS**

`style.css` → `style.css?v=20260719`; `/partials/include.js` → `...?v=20260719`

- [ ] **Step 3: Commit**

```bash
git add vercel.json index.html
git commit -m "$(cat <<'EOF'
perf: add long-lived cache headers for static assets

EOF
)"
```

---

### Task 6: Verify `rel="sponsored"` (no code unless gap)

**Files:**
- Read: `index.html`, `src/components/AffiliateLink.astro`, sample `reviews/*.html`

- [ ] **Step 1: Confirm all `/bonuses/` CTAs carry sponsored**

```bash
rg -n 'href="/bonuses/[^"]+"' index.html reviews --glob '*.html' | rg -v 'sponsored' || echo 'ALL_HAVE_SPONSORED'
```

Expected: `ALL_HAVE_SPONSORED` (or fix only the gaps found).

- [ ] **Step 2: Commit only if fixes needed**; otherwise document “verified — no change” in commit message N/A / skip commit.

---

### Task 7: Homepage FAQ ARIA + decorative emoji

**Files:**
- Modify: `index.html` (FAQ markup + toggle JS; emoji wraps)

- [ ] **Step 1: Wire FAQ accordion ARIA**

For each of 7 items, set `id`/`aria-controls`/`aria-expanded`/`role="region"` pattern. Update toggle JS to set `aria-expanded` true/false when toggling `.open`.

- [ ] **Step 2: Wrap decorative emoji**

Examples: `🏆` in H2, trust-pill icons, CTA fire emoji only if purely decorative — use `<span aria-hidden="true">…</span>`. Do not change visible text.

- [ ] **Step 3: Skip T7b dropdown rewrite** (nav already has hrefs) — note in commit body.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
fix(a11y): FAQ aria-expanded/controls and hide decorative emoji

EOF
)"
```

---

### Task 8: Compress oversized images

**Files:**
- Modify: `sweepstakeslogo/sweepstakeswiz-mark.png`, `favicon.ico`, `apple-touch-icon.png`, casino logos as needed
- Sync copies under `public/`

- [ ] **Step 1: Re-encode mark → WebP 112×112 ≤10 KB; update nav `src` if extension changes**
- [ ] **Step 2: Rebuild multi-size favicon ≤10 KB**
- [ ] **Step 3: Compress apple-touch-icon ≤15 KB**
- [ ] **Step 4: Batch casino logos to WebP ≤15 KB at ~128×76; update `src` in HTML if extension changes**
- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
perf: compress nav mark, favicon, and casino logos

EOF
)"
```

---

### Task 9: Copy & micro-SEO cleanups

**Files:**
- Modify: `index.html` (typo)
- Modify: `partials/footer.html` + review Legal columns / `scripts/update-review-chrome.mjs` if that’s the source of truth
- Modify: `reviews/mcluck.html` H1 (and grep siblings for same `&#8212;<br>` pattern)

- [ ] **Step 1: Fix hero typo** → `Best Sweepstakes Sites Right Now`
- [ ] **Step 2: Remove `rel="nofollow"` from Privacy Policy links (footer + reviews). Leave do-not-sell/contact judgment: audit scope is Privacy only.
- [ ] **Step 3: Fix McLuck H1 spacing:** `McLuck Review — Bonus, McJackpots & Payouts (2026)` (spaces around em dash and ampersand; keep line breaks if design needs them)
- [ ] **Step 4: HSTS preload submission is manual post-deploy — file a follow-up note, do not block.**
- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
fix(seo): hero typo, privacy follow, and review H1 spacing

EOF
)"
```

---

### Task 10: Cookie/consent posture (review only)

**Files:**
- Read: `legal/privacy.html`, `legal/cookie.html`, `legal/do-not-sell.html`

- [ ] **Step 1: Confirm GA disclosure + Google opt-out + CCPA path exist**
- [ ] **Step 2: Write short note under `.planning/` or close task with: “No CMP added — existing legal pages sufficient; owner sign-off required for banner.”
- [ ] **Step 3: No code commit unless a disclosure gap is found (then minimal copy fix only).

---

## Definition of done

- [ ] T1–T5, T8, T9 verify commands pass (prod after deploy; local/file checks pre-deploy)
- [ ] T2 schema count = 28 cards
- [ ] T6 sponsored verified
- [ ] T7 FAQ keyboard/ARIA
- [ ] T10 review note recorded
- [ ] Geo + GA still work (smoke: US-eligible CTA renders; gtag config present with `G-XR0EZ750YM`)
- [ ] No ranking/bonus/rating edits

## Self-review

1. **Spec coverage:** T1–T10 mapped; T6/T7b/T10 adapted to repo reality; T2 locked to A.
2. **Placeholders:** none intentional.
3. **Consistency:** GA ID, Astro `vercel.json` merge, dual asset paths (`sweepstakeslogo/` + `public/`).
