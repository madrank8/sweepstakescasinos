# GSC Insights — Coverage + Query-to-Content Gap Analysis — 2026-07-08

**Property:** `sc-domain:sweepstakeswiz.com` · **Data:** GSC API via `user-gsc` MCP · **Window:** 90d requested (`2026-04-09 → 07-08`), effective data ~since 2026-06-29.
**Companion:** raw totals/tables live in [`gsc-baselines/2026-07-08.md`](gsc-baselines/2026-07-08.md).

**TL;DR:**
- **Indexing is healthy (12/13 priority URLs indexed)** — the ONE gap is `/guides/are-sweepstakes-casinos-legit/`, which is **unknown to Google / never crawled**. Fix first.
- **Brand coverage is complete.** Every brand generating impressions (incl. the sampled BigPirate, AceBet, Spinfinite, Sweepico) already has a review page. There are **no new-review brand gaps** — the win is *ranking* existing pages, not creating new ones.
- **Everything ranks on page 3–6 (avg pos 47).** 1,969 impressions → 5 clicks is expected at these positions. The job now is to climb.
- **Best near-term lever: `/reviews/roxymoxy/`** — already ranks pos ~17–21 for its brand cluster (~80 combined impressions, 0 clicks). Closest page to page-1.

---

## Deliverable 1 — Coverage / indexing check

Full table in the baseline file (§4). Summary:

- **Indexed (12):** `/`, `/guides/`, `/guides/what-are-sweepstakes-casinos/`, `/guides/sweeps-coins-explained/`, `/guides/gold-coins-vs-sweeps-coins/`, `/guides/how-to-redeem-sweeps-coins/`, `/state-legality/`, `/states/california/`, `/states/florida/`, `/states/new-york/`, `/states/texas/`, `/best/sweepstakes-casinos/`.
- **NOT indexed (1):** `/guides/are-sweepstakes-casinos-legit/` → *"URL is unknown to Google", last crawl "Never".*

### Coverage actions
1. **🔴 P0 — Index `/guides/are-sweepstakes-casinos-legit/`.** Google has never discovered it. Confirm it's in `sitemap.xml`, add internal links from the guides hub + related guides, then request indexing. Its sibling guides were all crawled Jun 30–Jul 3, so this one was likely missed by the sitemap/linking at ship time.
2. **🟡 P1 — Verify 5 review pages with 0 impressions** (`/reviews/pulsz/`, `/reviews/wow-vegas/`, `/reviews/jackpot-go/`, `/reviews/spinblitz/`, `/reviews/sweet-sweeps/`). Pulsz and WOW Vegas are high-search-volume brands — zero impressions across the whole window suggests they may not be indexed or are too new. Run URL Inspection on them next.
3. Newly shipped **state pages (CA/FL/NY/TX) and 3 of 4 guides are indexed but show 0 impressions** — normal for pages days old. Track them in the next baseline; if still 0 in 2–3 weeks, investigate.

---

## Deliverable 2 — Query-to-content gap analysis

### A. Brand-query gaps → **none material**
Cross-checked all brand-like queries against `reviews/*.html` (28 pages: acebet, big-pirate, card-crush, casino-click, crown-coins, dexyplay, freespin, hello-millions, high5, jackpot-go, jackpota, legendz, lucky-bunny, mcluck, mega-bonanza, playfame, pulsz, rolla, roxymoxy, spinblitz, spinfinite, splash-coins, spree, sweepico, sweet-sweeps, thrillzz, wow-vegas, zula) and the live `/reviews/<brand>/` routes. `src/content/reviews/` is empty (reviews are still the standalone HTML set).

- The task's sampled brands **all already have reviews**: BigPirate → `big-pirate.html`, AceBet → `acebet.html`, Spinfinite → `spinfinite.html`, Sweepico → `sweepico.html`. All four also appear in the page-impressions data. **Not gaps.**
- Every brand with meaningful impressions maps to an existing review page (verified via the `query`+`page` pull — Google is already attributing brand queries to the correct review URLs).
- **Only truly uncovered queries are 1-impression noise:** `sweepskings` (1 imp, misattributed to `/reviews/rolla/`) and `crypto crown 20 review` (1 imp, on `/reviews/crown-coins/`). Not worth a page yet — **park on a watchlist**; revisit if either climbs above ~15 impressions/month.

**Conclusion:** the content library already covers demand. Redirect effort from "new reviews" to "rank the reviews we have."

### B. Striking-distance queries (position ~8–25)
Small ranking push here could win the site's *first* organic clicks. All map cleanly to an existing page.

| Query | Impr | Pos | Target page | Note |
|---|---|---|---|---|
| roxymoxy | 24 | 17.5 | /reviews/roxymoxy/ | brand head term |
| roxy moxy casino reviews | 18 | 21.4 | /reviews/roxymoxy/ | |
| roxymoxy casino | 16 | 20.2 | /reviews/roxymoxy/ | |
| roxy moxy casino promo code | 9 | 16.9 | /reviews/roxymoxy/ | bonus intent |
| roxy moxy casino no deposit bonus | 15 | 26.5 | /reviews/roxymoxy/ | just outside band |
| dexyplay review | 3 | 24.7 | /reviews/dexyplay/ | |
| bigpirate bonus | 1 | 9.0 | /reviews/big-pirate/ | closest to pos 1 |
| lucky bunny promo code | 1 | 24.0 | /reviews/lucky-bunny/ | |

**The RoxyMoxy cluster is the standout:** ~80 combined impressions at pos 16–26, all pointing at one page sitting on the page-2→page-1 edge. This is the single best "small push → real clicks" opportunity on the site.

### C. Page opportunities (impressions but ~0 clicks)
Because **every** review page has 0 clicks, split by *why*:

**C1 — Ranking-limited (pos > ~45): fix rank first, CTR won't matter yet.**
High-impression, deep-position pages: `/reviews/casino-click/` (310 imp, pos 47), `/reviews/playfame/` (288, 49.8), `/reviews/zula/` (187, 50.7), `/reviews/legendz/` (142, 58.8), `/reviews/thrillzz/` (119, 55.2), `/reviews/hello-millions/` (110, 62.8). → Need content depth, internal links, and E-E-A-T/schema signals to climb out of page 3–6. `/reviews/high5/` is worst at pos 87.5.

**C2 — CTR/title-meta-limited (pos ≤ ~30, close enough that title/meta + a nudge yields clicks):**
`/reviews/roxymoxy/` (254 imp, pos 29.6), `/reviews/card-crush/` (35 imp, pos 18.3), `/reviews/dexyplay/` (7 imp, pos 15.6), `/reviews/lucky-bunny/` (66 imp, pos 32.2), `/reviews/sweepico/` (47 imp, pos 31.9 — already earned 1 click). → Audit `<title>`/meta description for compelling, query-matched copy (year, "legit?", "bonus", "review 2026").

**C3 — Money page + core guide are effectively invisible:**
- `/best/sweepstakes-casinos/` — 3 imp, **pos 156.3**. The primary commercial hub barely ranks. Priority for internal linking (link it from every review + homepage hero), content, and backlinks.
- `/guides/what-are-sweepstakes-casinos/` — 17 imp but **pos 133.6** (query "what is sweepstakes casino" pos 79.7). Core informational guide ranking on page 13. Needs authority/interlinking.

### Recommendations (concrete, prioritized)
1. **🔴 Index the missing legit guide** (see Coverage action 1).
2. **🟢 Optimize `/reviews/roxymoxy/`** for its brand cluster (`roxymoxy`, `roxymoxy casino`, `roxy moxy casino reviews/promo code/no deposit bonus`) — title/meta refresh + internal links from related reviews and the "best" hub. Highest-probability first clicks.
3. **🟡 Title/meta CTR pass on C2 pages** (`card-crush`, `dexyplay`, `lucky-bunny`, `sweepico`, `roxymoxy`) — these are page-2 and close.
4. **🟡 Interlink + strengthen `/best/sweepstakes-casinos/` and `/guides/what-are-sweepstakes-casinos/`** — both are near-invisible (pos 130–156) despite being core money/authority pages. Link them prominently from every review page and the homepage.
5. **🟡 Confirm indexing of Pulsz / WOW Vegas / Jackpot-Go / SpinBlitz / Sweet-Sweeps reviews** (0 impressions).
6. **⚪ Watchlist (no action yet):** `sweepskings`, `crypto crown` — only 1 impression each.

---

## Limitations encountered
- Query-level **clicks fully anonymized** at this volume → no "top queries by clicks."
- `sort_by`/`sort_direction` **ignored server-side** (alphabetical rows) → pulled 1000 rows, sorted client-side.
- `batch_url_inspection` **max 10 URLs/call** → 13 priority URLs split into 2 batches.
- **28d ≈ 90d** (data only since ~Jun 29) → single T-0 snapshot, no trend yet.
