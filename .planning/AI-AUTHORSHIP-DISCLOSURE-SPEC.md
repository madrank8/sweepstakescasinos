# AI Authorship & Editorial Disclosure System — Spec + Adaptation

**Status:** Adopted, adapted for this build (Astro, not Next.js)
**Date:** 2026-07-01

---

## Adaptation & Status (this build)

This spec was handed off assuming Next.js. This project is **Astro 7** (mirrored
HTML `reviews/*.html` → generated wrappers + MDX collections + Vercel SSR).
Sections 1–7 apply as principles; Section 8 is re-specced below for Astro.

**Decisions (confirmed with owner 2026-07-01):**
- **Model B** — one named human author-of-record (Ilija Milosevic), AI-assisted + human-edited. No synthetic co-author.
- **Evidence layer = reader reports**, not first-party hands-on testing (solo operator cannot test). Section 4 is reinterpreted: the honest evidence is aggregated, moderated **player-reported** data labelled "Player-reported (N reports, dated)", never a "Hands-on tested" badge — unless real hands-on is ever added later.
- **Rating methodology single source of truth = the homepage's 4 grouped criteria** (Redemption Terms & Speed 30 · Sign-Up Bonus Value 25 · Ongoing Free Value 25 · Trust & Support 20). `/how-we-rate/` collapses to match.

**Status vs Definition of Done:**
| DoD item | Status |
|----------|--------|
| Real named author/editor + `sameAs` LinkedIn | ✅ `author/ilija-milosevic.html` |
| Site-wide AI disclosure at `/editorial-policy/` | ✅ (Phase 1) |
| Zero unlabeled Class B phrasing | ✅ (Phase 0 + spec sweep) |
| Class B pre-publish lint gate | ✅ `scripts/lint-experience-claims.ts` → `npm run content:lint` (in `npm run ci`) |
| Per-article disclosure block on every review | 🟡 AI-disclosure callouts present; byline format not standardized |
| ≥1 evidence-manifest hands-on review | 🔄 replaced by reader-reports layer (Phase 2) |
| Review schema `author`+`editor`+`itemReviewed` | 🟡 reviews use `author`=Person; Model B `author`=Org + `editor`=Person not yet applied |
| Rating methodology single config | 🔄 pending (collapse to 4 criteria, one config) |
| `dateModified` only on substantive edits | 🟡 scripts bump it; no diff-gate |

**Remaining net-new work:** methodology single-source config; per-article
disclosure byline standardization; (optional) Model B schema change across 28
reviews; reader-reports system (Phase 2, see `EVIDENCE-STRATEGY-PLAN.md`);
`dateModified` diff-gate.

**Section 8 re-spec for Astro (replaces the Next.js file tree):**
- Review content: `reviews/*.html` (source of truth) + `src/content/**/*.mdx` (new content). No `/content/reviews/[slug].mdx` Next routing.
- Methodology config: `src/data/ratingMethodology.ts`, imported by the homepage rate section and `/how-we-rate/` (rendered at build via the generate step).
- Disclosure block: extend the existing `<!-- testing:disclosure -->` / `<!-- testing:faq-produced -->` markers + `src/lib/testingFragments.ts`, not a React `DisclosureBlock.tsx`.
- Schema: injected via in-page JSON-LD + `src/lib/pageChrome.ts`; `schema-dts` may be used inside build scripts if we want typed builders. `next-seo` is N/A.
- Lint gate: `scripts/lint-experience-claims.ts` (shipped) — the Astro equivalent of `scripts/lint-experience-claims.ts` in §8.3.

---

## 1. Objective

Ship an E-E-A-T-defensible authorship and review system that:
- Discloses AI assistance honestly, per Google's `using-gen-ai-content` guidance and emerging state AI-transparency law
- Never fabricates first-party experience claims, per the FTC Consumer Review Rule (16 CFR 465)
- Gives one real, accountable, named human as author-of-record
- Makes genuine first-party testing verifiable and structurally distinct from aggregated/editorial content

This is **Model B**: a single named human author plus a disclosed AI-assist process. Not a dual AI-persona byline (Model A).

## 2. Editorial identity

### 2.1 Author-of-record
- One real, named human as author across all content.
- Author bio page required: full name, years of experience, specialties, real photo, real LinkedIn (`sameAs`), last-updated date.
- No invented personas. No stock-photo bios.

### 2.2 Site-wide disclosure statement
Lives at `/editorial-policy/`. Must state, in plain language:
- AI tools may assist with research synthesis, drafting, and illustration.
- Every article that uses AI assistance discloses it.
- A named human editor reviews, fact-checks, and is accountable for every published page.
- Editorial content is never presented as first-party "we tested it" experience unless explicitly labeled and dated as hands-on.

### 2.3 Per-article disclosure block
Every article gets an inline block, not just a footer link:
- Byline: `Written by [Site] Editorial · Reviewed by [Real Name]`
- AI-assistance label (L0–L4 taxonomy)
- Last substantive edit date

## 3. Content classification (hard rule)

| Class | Definition | Required phrasing | Evidence requirement |
|---|---|---|---|
| A. Aggregated/editorial | Derived from published operator terms, Trustpilot, reader reports | "Published terms show…", "Reports at scale indicate…", "Consistent with reviews on Trustpilot" | Source and date attribution only |
| B. First-party/hands-on | Someone on the team actually did it | "We tested…", "Our redemption completed in…", "I signed up and…" | Evidence manifest entry (Section 4) required before publish |

**Banned:** Class A content phrased in Class B language (direct FTC Consumer Review Rule exposure).

**Pre-publish lint rule:** flag `we tested|our testers|we confirmed|I signed up|we found|our team verified` (case-insensitive). If flagged with no matching evidence-manifest ID, block publish and force a rewrite to Class A. *(Implemented as `scripts/lint-experience-claims.ts`; because this build has no evidence manifest, any Class B phrasing fails unless allowlisted as an intentional negation.)*

## 4. Firsthand evidence pipeline (reinterpreted → reader reports)

Original spec assumes team testing. **This build uses reader reports instead.** Real players submit redemption method, amount band, request/payout dates, KYC experience; submissions are moderated, then aggregated per brand ("median payout across N reader reports, as of [date]"). Reviews render a **"Player-reported (N reports · [date])"** label, not a "Hands-on tested" badge. If real first-party testing is ever added, the original manifest model (below) can be reintroduced.

Original manifest entry (retained for future use):
```json
{
  "claim_id": "splash-coins-redemption-speed",
  "casino": "Splash Coins",
  "claim_text": "Redemption completed in 51 hours",
  "tested_by": "[Real Name]",
  "tested_date": "2026-06-28",
  "evidence": ["evidence/splash-coins/redemption-confirm-redacted.png"],
  "hands_on_label": true
}
```

## 5. Schema (JSON-LD)

### 5.1 Review schema pattern (Model B)
```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": { "@type": "Organization", "name": "Splash Coins" },
  "author": { "@type": "Organization", "name": "[Site] Editorial" },
  "editor": {
    "@type": "Person",
    "name": "[Real Editor Name]",
    "hasOccupation": { "@type": "Occupation", "name": "iGaming Analyst" },
    "sameAs": ["https://www.linkedin.com/in/..."]
  },
  "reviewRating": { "@type": "Rating", "ratingValue": "4.9", "bestRating": "5" },
  "datePublished": "2026-01-15",
  "dateModified": "2026-07-01"
}
```
Uses `editor` (standard `CreativeWork` property for a human fact-checker), not `reviewedBy` (MedicalWebPage-specific).

### 5.2 Also required
- `ItemList` on the rankings page, each casino a `ListItem` wrapping a `Review`.
- `FAQPage` on the FAQ accordion.
- `AggregateRating` if displaying a composite score.

### 5.3 dateModified integrity
`dateModified` only advances on a substantive content edit. Enforce via a changelog or diff check in the publish pipeline.

## 6. Methodology single source of truth
Rating weights live in exactly one config file, referenced by both the homepage rating panel and `/how-we-rate/`. Never hardcode percentages in two places. *(This build: the two surfaces currently disagree — homepage 4 criteria vs how-we-rate 7. Resolution: standardize on the 4 grouped criteria in `src/data/ratingMethodology.ts`.)*

## 7. Compliance pages
Full legal/trust page framework lives in the `sweepstakes-site-compliance` skill (12-page checklist). This spec owns only the authorship, disclosure, and schema layer on top of it.

## 9. Definition of done
See status table above.

## 10. Open questions — answered
1. Stack: **Astro 7** (not Next.js).
2. Author-of-record: **Ilija Milosevic** (real bio + LinkedIn `sameAs`).
3. Hands-on casinos at launch: **none** — replaced by reader reports.
4. CMS: **hybrid in-repo** (hand-authored HTML + MDX), not headless. Reader-reports storage = Supabase (Phase 2).
