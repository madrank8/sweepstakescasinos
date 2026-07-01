# Sweepstakes Wiz — Evidence Strategy (Solo Operator, No First-Party Testing)

**Date:** 2026-06-30
**Context:** Single operator. Full hands-on testing of 28 brands is not feasible. We need an honest, SEO-safe, user-satisfying way to substantiate (or correct) the testing/payout claims currently on the pages.
**Supersedes:** The hands-on rollout assumption in `.planning/TESTING-TEAM-BRIEF.md` (that brief assumed a human testing team).

---

## The core reframe

The current pages read as if we personally registered, played, and cashed out at each brand ("we tested", "14-day hands-on test", "our test redemption cleared in 2 business days"). We did not. That mismatch is the **single biggest risk on the site** — and fixing it is a *net positive* for SEO, not a sacrifice.

> **Key insight:** Fabricated first-hand experience is a liability. Google's reviews system and "scaled content abuse" policy specifically target reviews that *fake* hands-on experience. Removing the false "we tested" claims **lowers risk**. We then rebuild ranking power with the two things a solo operator genuinely can produce.

We do **not** need to manufacture "Experience." We need to:

1. **Stop overclaiming** — every "we tested" becomes an accurate statement of what we actually did.
2. **Manufacture information gain** — original analysis and structuring of *public* data. One person can do this.
3. **Harvest real experience** — collect genuine reader-submitted payout times/experiences, moderate, aggregate, and attribute them. This is honest first-hand experience — just not ours.

E-E-A-T is four signals: Experience, **Expertise, Authoritativeness, Trust**. We lean on the last three (which a solo analyst earns through transparency + original work) and source Experience from the community.

---

## Three honest evidence pillars

Every review is built from one or more of these. None require us to test anything.

### Pillar 1 — Transparent editorial analysis (baseline, all 28 brands)
- Analysis of **published operator terms** (bonus structure, redemption minimums, fees, KYC, restricted states).
- Cross-checked against third-party sources.
- **Labeled honestly:** "Editorial analysis of published terms, last verified [date]."
- This is what we actually do today — we just stop calling it "testing."

### Pillar 2 — Original aggregated-data research (information gain)
The thing a solo operator *can* uniquely build: structured datasets from public signals, with our own methodology, updated over time.

- **Payout-Speed Index** — structured comparison of every brand's published + reader-reported redemption windows, ranked, dated, with sample sizes. A genuine original dataset competitors don't have.
- **Trustpilot sentiment analysis** — our own structured read of public review volume/score/trend per brand (not just quoting a number — analyzing it).
- **Bonus-value math** — normalized "real SC value" comparisons across brands.
- **Terms-change monitoring** — timestamp when a brand changes bonuses/terms/minimums. Freshness + original observation.

This is "information gain" — the highest-leverage quality signal per our own SEO knowledge base. It scales with analysis, not travel.

### Pillar 3 — Reader reports (community-sourced experience) ✅ approved
Real users submit their actual payout times and experiences. We moderate, aggregate, and attribute. This becomes our **Experience** signal — honest, verifiable, and growing.

- "Based on **47 reader-submitted redemptions**, median Skrill payout = **19 hours** (range 6–48h), as of [date]."
- Genuinely original data. Genuinely first-hand (the reader's hand). Fully disclosed.
- Doubles as engagement + return-visit driver.

---

## Phased plan

### Phase 0 — Stop the bleeding (P0, ~1 day)
Remove every false first-hand claim and fix the data bugs from the audit.

| Task | How | Files |
|------|-----|-------|
| Soften overclaims across **all 28 reviews** (not just flagged) | Run/extend the existing soften pipeline | `src/lib/testingFragments.ts` (`OVERCLAIM_PATTERNS`, `softenOverclaimHtml`), `scripts/apply-testing-results.ts --soften-overclaims` |
| Extend `OVERCLAIM_PATTERNS` to catch remaining phrasing | Add patterns for meta descriptions, "Payouts Tested", "14-Day Live Review", hero badges | `src/lib/testingFragments.ts` |
| Rewrite all disclosure blocks to "editorial analysis" | Use `buildFaqProducedEditorial` / `buildDisclosureEditorial` everywhere | `src/lib/testingFragments.ts` |
| Fix Rolla → WOW Vegas wrong redirect | Correct destination URL | `bonuses/rolla.html` (audit §3) |
| Audit all 15 non-partner interstitials for correct URLs | Manual check | `bonuses/*.html` |

**Outcome:** Zero fabricated experience claims live on the site. This alone removes the main penalty risk.

---

### Phase 1 — Rebuild trust through transparency (P0/P1, ~2 days)
Make the honest methodology a *feature*, not an apology.

| Task | Detail |
|------|--------|
| Rewrite `how-we-rate.html` | Explain exactly what we do: analyze published terms + aggregate third-party data + collect reader reports. Transparency = trust. |
| Update `editorial-policy.html` | State plainly: we do not claim hands-on payout testing unless reader-verified; we disclose sources and dates. |
| Reframe author page | `author/ilija-milosevic.html` → position as **iGaming analyst** (terms analysis, data aggregation), not a tester. Keep real credentials/`sameAs`. |
| Add a visible "How we know this" line per review | Links to methodology; states data sources + last-verified date. |
| Standardize honest labels | "Editorial analysis · verified [date]" vs "Reader-reported · N reports · [date range]". |

---

### Phase 2 — Reader-reports system (P1, the centerpiece, ~3-5 days)
The engine that gives us genuine Experience data without testing.

**Architecture (decisions made — adjust if you prefer):**
- **Storage:** Supabase (already available via MCP) — `reader_reports` table. Owner-moderated; nothing displays until approved.
- **Submission:** Astro form → Vercel serverless function (Fluid Compute) → Supabase insert with `status='pending'`.
- **Moderation:** Owner approves/rejects in Supabase; spam/fraud/operator-manipulation filter is mandatory.
- **Display:** Per-review "Reader Reports" section — aggregated stats (median payout, sample size, date range) + a few approved verbatim quotes.
- **Build/SSR:** Aggregate approved reports at build time (and/or SSR fetch) into per-brand stats.

**Fields to collect (no PII):**
`brand_slug, redemption_method, amount_band, request_date, paid_date → computed_hours, state, kyc_experience, rating_1_5, free_text, optional_redacted_screenshot, consent`

**Anti-abuse (required):**
- Rate-limit + simple bot check (BotID is available on Vercel).
- Require specific detail (method + dates) or auto-flag.
- Manual approval before display.
- Strip/auto-reject PII; redaction reminder on upload.

**Schema (careful):**
- Use `AggregateRating` / `Review` JSON-LD **only** from genuine approved reader reports, with **honest counts**. Never fabricate. Visible numbers must match JSON-LD exactly.

**Reuse existing infra:** The `could_test` / CSV concept in `src/data/testingResults.ts` can be repurposed for ingesting/aggregating reader data instead of tester data.

---

### Phase 3 — Original data research (P1/P2, ongoing)
Turn aggregation into rankable, original assets.

| Asset | Build |
|-------|-------|
| **Payout-Speed Index** page | New MDX comparison page; table of published + reader-reported windows; sortable; dated; sample sizes. |
| **Trustpilot trend analysis** | Per-review: our structured read of score + volume + trend (analysis, not just the number). |
| **Bonus-value comparison** | Normalized "real SC value" math across brands. |
| **Terms/bonus change log** | Lightweight monitoring; timestamp changes; surfaces freshness. |

These are "information gain" — the highest-value quality lever, and fully solo-doable.

---

### Phase 4 — Compliance + housekeeping (P1/P2, from the audit)
Parallel fixes that still apply regardless of evidence strategy.

| Task | Ref |
|------|-----|
| Geo-gate or strip CTAs on 15 non-partner reviews | Audit §2 |
| Verify brand accessibility from our location ("unsure") | New — quick check; informs which brands even merit reader-report prompts |
| Complete/retire testing anchors on rolla, sweepico | Audit §4 |
| Card Crush info-only copy | Audit §5 |
| `.nvmrc` (22), fix README, wire/remove `@vercel/analytics` | Audit §8, §11, §16 |

---

## SEO guardrails (do not violate)

1. **Never present editorial or aggregated data as first-hand.** Honest labels everywhere.
2. **Schema must match reality.** Only mark up `AggregateRating`/`Review` from genuine reader reports; honest counts; visible = JSON-LD.
3. **Date everything.** "Verified [date]", "N reports as of [date range]". Freshness + honesty.
4. **No fabricated testimonials.** Reader quotes must be real and approved.
5. **Transparency page is canonical.** Every review links to `how-we-rate` describing the no-testing methodology.
6. **Keep ratings consistent** between hero copy, comparison tables, and JSON-LD.

---

## Why this is SEO-safe AND user-satisfying

- **SEO:** Removes scaled-content/fake-experience risk; adds information gain (original data) + genuine Experience (reader reports) + Trust (transparency). This is exactly what Google's reviews system rewards. Solo comparison sites rank well on expertise + original analysis + trust without testing everything.
- **Users:** Get honest, dated, source-cited info + real peer payout data — more trustworthy than a generic "we tested" they can't verify. Reader reports also create engagement and return visits.
- **Defensible moat:** Best aggregation + best transparency + real community data, updated often — not pretend testing any competitor can also fake.

---

## Decisions made (override if you disagree)

- Reader-report storage = **Supabase** (MCP available). Alternative: Git-committed moderated JSON for a zero-infra v1.
- Reports are **owner-moderated** before display (non-negotiable for fraud control).
- Hands-on `testing:apply` path is **retained but dormant** — if reader data ever substantiates a specific claim, we can cite it; we never auto-claim.

---

## Suggested order

```
Phase 0 (overclaims + bug fixes)  →  Phase 1 (transparency rewrite)
        →  Phase 2 (reader reports MVP)  →  Phase 3 (data research)
        →  Phase 4 (compliance/housekeeping, in parallel)
```

**Fastest path to "safe":** Phase 0 + Phase 1 = the site is honest and low-risk within ~3 days. Phases 2–3 then build the upside.

---

## Related docs
- `.planning/SITE-AUDIT.md` — full audit (this plan resolves §1, and informs §4–§6)
- `.planning/TESTING-TEAM-BRIEF.md` — superseded for hands-on; reader-reports replaces the tester team
- `.planning/GOOGLE-LLM-READINESS-PLAN.md` — AEO/LLM alignment
- `src/lib/testingFragments.ts` — soften/disclosure helpers (reused in Phase 0/1)
- `src/data/testingResults.ts` — repurpose for reader-report aggregation
