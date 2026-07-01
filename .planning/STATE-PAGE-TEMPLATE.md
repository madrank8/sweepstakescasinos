# State Legality Page — Canonical Template

**Reference implementation:** `src/content/states/texas.mdx`
**Route (shared scaffolding):** `src/routes/states/[slug].astro`
**Hub:** `/state-legality/` (50-state table links to each guide)
**Updated:** 2026-07-01

Every `/states/<slug>/` page follows this template so the cluster is consistent,
E-E-A-T-strong, and AEO-friendly — **without** becoming templated clones (each page's
legal-research sections must be genuinely state-specific; see the scaled-content rule below).

---

## What the ROUTE provides automatically (do NOT hand-author these)

`src/routes/states/[slug].astro` renders these for every state — authors get them for free:

- **Breadcrumb** Home › State Legality › {State} (+ `BreadcrumbList` schema).
- **Available-operators list** — auto-filtered from `geo.ts` / `affiliates.ts` (reviews links only; **never** affiliate CTAs on state pages).
- **"Sweepstakes casino legality in other states"** — auto sibling cross-links to every other state guide.
- **Author byline + "Last updated {date}"** trust strip (from frontmatter `updated`).
- **Schema:** `WebPage` (with `datePublished`/`dateModified`), `FAQPage` (from frontmatter `faq`), `BreadcrumbList`, publisher `Organization`.
- **Responsible-gaming + "not legal advice" disclaimer** box.

So the **MDX only supplies the state-specific body** (verdict, quick facts, and legal-research prose).

---

## Frontmatter (schema: `content.config.ts` → `states`)

```yaml
---
stateCode: TX                 # 2-letter enum (drives geo + operator list)
title: "Are Sweepstakes Casinos Legal in {State}? (2026 Guide)"
description: "≤160 chars, verdict-first, includes the key statute/bill."
legalStatus: available        # available | info-only | restricted
updated: 2026-07-01           # bump only on substantive change (drives dateModified + byline)
draft: false
faq:                          # 5 state-specific Q&As (PAA-derived) → FAQPage schema
  - q: "..."
    a: "..."                  # 40–60 words, declarative, answer-first
---
```

---

## MDX body — canonical section order

1. **Verdict capsule** (lead `**bold**` paragraph) — the answer FIRST, 40–60 words: legal status + effective date + what it means. This is the AEO/featured-snippet target.
2. **Quick-facts table** — Site status · Partner availability · Minimum age · Key statute · 2026 legislation (or Affiliate liability for banned states).
3. One line linking up to `/state-legality/` + `/how-we-rate/`.
4. `## Why sweepstakes casinos are different from real-money gambling` — short model explainer, then embed the **shared gambling-test visual** (see below), then a `> **Direct answer:**` capsule.
5. `## What {State} law says about sweepstakes casinos` — **the primary information-gain section.** Cite the statute/bill by number with a primary-source link + effective date. State-specific; never boilerplate.
6. `## Which sweepstakes casinos are available in {State}?` — narrative; the operator list itself is auto-rendered by the route. Link `/best/sweepstakes-casinos/` for available states only.
7. `## Who can play in {State}?` — age/KYC (18+/21+).
8. `## Prizes and redemptions in {State}`.
9. `## Is {State} likely to ban sweepstakes casinos?` (available states) **or** enforcement/timeline (banned states).
10. `## Legal gaming options in {State}` — lottery, tribal, sportsbook, ADW, gold-coin-only social. Required for banned states.
11. `## Play responsibly` — RG + 1-800-GAMBLER.
12. Closing `>` disclaimer (not legal advice). **Do not** hand-type a date here — the route byline shows "Last updated".

(FAQ, sibling links, availability list, byline, and disclaimer box are appended by the route.)

### Shared visual (reuse — do not regenerate per state)

```mdx
<figure>
  <img src="/images/guides/gambling-test.png" alt="The gambling test: gambling requires prize, chance, and consideration (payment); sweepstakes casinos remove the consideration element through a no-purchase-necessary free entry path." width="1376" height="768" loading="lazy" />
  <figcaption>Why sweepstakes casinos fall outside most gambling definitions (AI-generated illustration).</figcaption>
</figure>
```

Tailor only the `alt` tail for the state's specific law where useful (see CA/NY). It's a shared asset — one image across the whole cluster is intentional and fine.

---

## Rules (non-negotiable)

- **No affiliate CTAs on state pages** — reviews are linked editorially only; affiliate clicks always go through the geo-gated `/bonuses/` gateway. (AEO iGaming veto I4.)
- **Info-only states** (`legalStatus: info-only`, in `SITE_BANNED_STATES`): explain *why* we suppress offers (affiliate liability), never promote; link `/best/` **only** from available states.
- **Answer capsules**: every question-shaped H2 gets a declarative 40–60 word answer near the top (chunk-extractability / featured snippets). Say "redeem prizes," not "win real money gambling."
- **Primary-source citations** for every legal claim (statute/bill link + date). Do not parrot competitor claims (e.g. Lines.com's unverified "FL Dept of Agriculture regulates" line).
- **Scaled-content guard**: the state-law section (5) must be genuinely state-specific research. Never ship a batch that swaps only the state name — that trips scaled-content-abuse signals.
- **YMYL freshness**: bump `updated` only on substantive change; keep the legislative facts current.

## Quality gates before publish (per page)

- `npm run build` passes (Class-A lint + methodology check).
- Verdict capsule + FAQ present; FAQPage + WebPage(`dateModified`) + BreadcrumbList valid.
- Zero affiliate CTAs render for the state (esp. info-only states).
- Primary-source link for every legal claim.

---

## Rollout status

| State | Status | legalStatus |
|-------|--------|-------------|
| Texas | ✅ reference | available |
| Florida | ✅ | available |
| California | ✅ | info-only |
| New York | ✅ | info-only |
| Next batch | OH, IL, PA, GA, NC (available); WA, MI, NJ, CT (info-only); IN/OK (scheduled bans) | — |

Adding a state: create `src/content/states/<slug>.mdx` from this template, add its row link on `/state-legality/`, rebuild (sitemap + sibling links update automatically).
