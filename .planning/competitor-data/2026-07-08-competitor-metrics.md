# Competitor Data Pull — 2026-07-08 (supporting file)

Raw metrics behind `COMPETITOR-CONTENT-STRATEGY-2026-07.md`. Live pulls unless marked
`[ESTIMATED]`. Tools: **DataForSEO Labs** (domain/keyword/SERP/backlinks, US, `en`),
**Ahrefs MCP** (Domain Rating only — 7 calls × 50 units = **350 units**).

> **Metric notes.** `ETV` = DataForSEO estimated monthly organic traffic (clicks/mo), US
> desktop model — treat as directional, not GA truth. DataForSEO monetary fields are in
> **dollars**; Ahrefs monetary fields would be in **cents** (no Ahrefs money pulled here).
> KD from DataForSEO `keyword_properties.keyword_difficulty` (0–100).

## 1. Domain overviews (DataForSEO `domain_rank_overview`, US, organic)

| Domain | DR (Ahrefs) | Organic keywords | Est. traffic (ETV/mo) | # ranked #1 | Ahrefs rank |
|---|---|---|---|---|---|
| **sweepskings.com** | **63** | **8,170** | **~128,576** | 79 | 219,699 |
| lines.com | 56 | 55,229 | ~525,985 | 23 | 383,984 |
| thelines.com | 61 | 28,644 | ~356,175 | 428 | 256,134 |
| pokerlistings.com | 71 | 10,738 | ~316,318 | 118 | 83,284* |
| vegasinsider.com | 71 | 78,564 | ~1,600,748 | 3,605 | 101,318 |
| slotsfan.com | 32 | 1,474 | ~6,432 | 18 | 3,305,697 |
| gammasweep.com | [n/a] | 64 | ~139 | 3 | — |
| sweepstakescasino.com | [n/a] | 623 | ~649 | 0 | — |
| sweepedia.com | [n/a] | 15 | ~9 | 0 | — |
| gamble-usa.com | [n/a] | (no DFS rows returned) | — | — | — |
| **sweepstakeswiz.com (us)** | **0** | ~0 (no DFS footprint) | ~0 (5 GSC clicks) | 0 | null |

\* pokerlistings & vegasinsider DR tied at 71; ahrefs_rank differs.

## 2. `best sweepstakes casinos` live SERP (US desktop, depth 20) — 2026-07-08

1. deadspin.com (parasite/big-media)  2. **sweepskings.com**  3. reddit.com  4. al.com (parasite)
5. pokerlistings.com  6. trustpilot.com (sweepstakestable.com)  7. thelines.com  8. gammasweep.com
9. youtube.com  10. slotsfan.com
PAA answer sources: gamingamerica.com, **lines.com** (highest-payout), legalsportsreport.com (no-deposit table).
Related: "top 10 / list of / usa / reddit / 2026 / sign up bonus / online" sweepstakes casinos.

## 3. sweepskings.com structure (robots + sitemap + ranked-keyword URLs)

- WordPress (`/wp-admin/`), affiliate cloaking via `/goto/` (disallowed in robots).
- Sitemaps: `page-sitemap.xml`, `post-sitemap.xml`, `review-sitemap.xml` (**~357 `<loc>`** in review sitemap).
- Page types seen in ranked-keyword data:
  - `/reviews/{brand}/` — dominant; ~45+ distinct brands in top-100 traffic pages alone.
  - `/sweepstakes-casinos/similar/{brand}/` — "alternatives to X" pages (yay, wow-vegas, spinblitz…).
  - `/sweepstakes-casinos/no-deposit/` (`/bonuses/no-deposit/`) — no-deposit tracker (recurs, high traffic).
  - `/sweepstakes-casinos/new/` — new-casinos hub (recurs, high traffic).
  - `/news/{slug}/` — news (e.g. `luckybird-io-declared-closed` — captures "brand shut down" intent).
  - `/topic/{id}-…/` — community forum (UGC / real-experience signals).
  - `/sweepstakes-casinos/` hub + `/` homepage rank for head terms.

## 4. sweepskings top traffic pages / keywords (DataForSEO `ranked_keywords`, top ≤20 pos, ETV desc)

| Keyword | SV/mo | KD | Their pos | Page | ETV |
|---|---|---|---|---|---|
| american luck casino | 90,500 | 3 | 2 | /reviews/american-luck/ | 14,661 |
| chumba casino | (high) | — | top | /reviews/chumba/ | high |
| yay casino | — | — | top | /sweepstakes-casinos/similar/yay/ | — |
| new sweepstakes casino(s) | 12,100 | 32 | top | / , /sweepstakes-casinos/new/ | high |
| list of sweepstakes casinos | 12,100 | 34 | top | / | high |
| luck party / lucky party casino | — | — | top | /reviews/luck-party/ | — |
| sweepskings (brand) | — | — | 1 | / | — |
| no deposit / bonus without deposit | 480–2,900 | — | top | /sweepstakes-casinos/no-deposit/ | — |

Their #1 traffic driver is a **brand review of "American Luck"** (SV 90,500, KD 3, navigational) — a
brand we do **not** cover. Pattern: obscure/new brand navigational terms = huge, low-difficulty.

## 5. Opportunity-keyword metrics (DataForSEO `keyword_overview`, US)

| Keyword | SV/mo | KD | Main intent | YoY trend |
|---|---|---|---|---|
| sweepstakes casinos | 60,500 | 15 | commercial | −18% |
| social casino | 49,500 | 6 | informational | −45% |
| new sweepstakes casinos | 12,100 | 32 | commercial | −18% |
| list of sweepstakes casinos | 12,100 | 34 | commercial | −33% |
| new social casinos | 8,100 | 30 | informational | −33% |
| best sweepstakes casinos | 4,400 | 32 | commercial | −33% |
| social casinos list | 3,600 | 30 | informational | −21% |
| sweepstakes casino no deposit bonus | 2,900 | ~24 (RD-based) | commercial→trans | −64% |
| new sweepstakes casinos 2026 | 1,600 | 17 | commercial | −18% |
| sweepstakes casino real money | 1,600 | 17 | transactional | −80% |
| free sweeps coins | 880 | ~59 (RD-based) | informational | −61% |
| no deposit sweepstakes casino | 480 | ~45 (RD-based) | commercial | −46% |
| stake us alternatives | 390 | low | commercial | −33% |
| sweepstakes casino apps | 390 | 12 | commercial | −34% |
| fastest payout sweepstakes casino | 260 | mid | commercial | −34% (but **+24% QoQ**) |
| chumba casino alternatives | 210 | mid | commercial | −82% |
| sweepstakes casinos like chumba | 210 | 10 | commercial | −96% |
| sweepstakes casino promo codes | 170 | low | commercial | −21% |
| sweepstakes casino reviews | 70 | 11 | commercial | **+40% YoY** |
| how do sweepstakes casinos work | 90 | 11 | informational | flat |
| mcluck alternatives | 30 | — | informational | **+100% MoM** |

Whole niche is **declining** (−18% to −96% YoY) — win = **share capture**, not category growth.

## 6. sweepskings off-page (DataForSEO `backlinks_summary`)

- 97,580 backlinks · **4,958 referring domains** (3,740 main) · rank 273.
- **backlinks_spam_score 50** · 84,165 of 88,228 referring pages **nofollow**.
- Referring TLDs dominated by **.online (36.7k), .xyz (7.3k), .site (6.7k), .website (6.4k), .space (4.9k)** →
  low-quality/PBN-style footprint. DR 63 is **volume-inflated**, not editorial-quality.
- Us: `backlinks_summary` returned **no rows** → ~0 referring domains (matches DR 0).

## 7. Our GSC anchor (baseline 2026-07-08)

- 5 clicks / 1,969 impressions / avg pos 47.4 (data since ~Jun 29). Everything on page 3–6.
- Best striking-distance: `/reviews/roxymoxy/` cluster (~pos 17–29). Money hub `/best/sweepstakes-casinos/`
  at pos ~156; core guide `/guides/what-are-sweepstakes-casinos/` pos ~134. No commercial-hub rankings.

## Tool limits / caveats

- Ahrefs: only Domain Rating pulled (350 units). Ahrefs `serp-overview`/keyword pulls avoided (return empty
  for low-volume long-tail yet still bill units — per project pipeline note). No Ahrefs money data pulled.
- DataForSEO ETV/KD are modeled estimates; brand navigational SV (e.g. american luck 90,500) spikes with
  promo cycles — verify before committing large effort.
- `gamble-usa.com` returned no DFS rows (possibly blocked/*.com-variant); dropped from the core set.
- Our own DFS footprint is ~nil (brand-new site) so `competitors_domain` on us returned no rows — competitor
  set was built from the live head-term SERP + candidate validation instead.
