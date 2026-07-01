# SEO Content Pipeline — Upgraded Process (Project Memory)

**Updated:** 2026-07-01
**Purpose:** The repeatable, tool-backed process for producing/upgrading content on this
site. This is how content gets made here — follow it instead of writing straight from a
topical map.

---

## Connected tools (Cursor MCP + CLI)

Config lives in `~/.cursor/mcp.json`. **All npx-based MCP servers MUST use the absolute
npx path** `/opt/homebrew/bin/npx` — bare `npx` crashes in Cursor with
`npm ENOENT .../Cursor.app/.../resources/lib` (`-32000 Connection closed`).

| Tool | MCP id / CLI | Use |
|------|--------------|-----|
| **DataForSEO** | `user-dataforseo` | Keyword SV/KD/CPC/intent (`dataforseo_labs_google_keyword_overview`), live SERP + PAA (`serp_organic_live_advanced`). `ENABLED_MODULES` = `SERP,KEYWORDS_DATA,DATAFORSEO_LABS,ONPAGE,BACKLINKS` (note **ONPAGE**, not `ON_PAGE` — wrong name = ZodError crash). |
| **Ahrefs** | `user-ahrefs` | Keyword/SERP metrics. **Call the `doc` tool first** for a tool's real schema. Money values in **cents**. Free test: keyword `ahrefs` (0 units). `serp-overview` returns empty for low-volume long-tail (still costs units) — prefer DataForSEO SERP for competitor discovery. |
| **Firecrawl** | CLI `firecrawl` (v1.11.x, authenticated) | Scrape competitor pages: `firecrawl scrape "<url>" --format markdown --only-main-content -o .seo/comp/<name>.md`. |
| **Higgsfield** | `plugin-higgsfield-higgsfield` | Image/video/3D generation. Needs **account credits** (billable endpoints error generically when out of credits; `show_plans_and_credits` surfaces the top-up path). |
| **Supabase** | `plugin-supabase-supabase` | Reader-reports DB (project `sweepdogs-site`). |

---

## Vendored quality-gate scorers (run locally / CI)

From the `algorithmic-authorship-gate` skill, vendored into `scripts/seo/` (stdlib Python):

- `corpus_fingerprint.py` → **Fingerprint Diffusion Score (FDS)**. Bands: **≥80 HEALTHY**, 60–79 diffusion-risk, <60 fingerprinted. Catches scaled-content sameness (R42 structure, R43 metadata, R44 velocity).
- `r45_provenance.py` → non-commodity provenance (SC-098). Target **PROVENANCE-OK** (our editorial/definitional pages classify as `infrastructure`: internal links + entity scaffold + `sameAs`/`@id`).
- `extract_guides.py` → builds `.seo/pages.json` from built HTML.

Run: `npm run seo:score` (build → extract → fingerprint → provenance). `.seo/` is gitignored.
Per-document 9-category rubric (`rules.md`) is LLM-judge — apply by hand (entity density,
measurable qualifiers, factual-relation paragraphs, topical coherence).

---

## Content Workflow "B" (per article)

1. **Live SERP + PAA** — DataForSEO `serp_organic_live_advanced` on the target term. Read PAA + related searches for content gaps.
2. **Pick top-3 comparable competitors** (articles, not just listicles).
3. **Firecrawl scrape** them → compare word count, H2/H3 structure, entities, coverage vs our page.
4. **Close consensus gaps** the ranking pages share, **while keeping our moat** (cited statutes, affiliate-liability transparency, reader-reports data, disambiguations competitors miss).
5. **De-fingerprint**: vary H2 archetypes/intro shape/closer across sibling pages (raises FDS D2).
6. **Gates**: `npm run build` (runs `content:lint` + `methodology:check`) → `npm run seo:score`. Must pass Class-A lint, FDS HEALTHY, R45 PROVENANCE-OK.
7. **Commit + push** (one commit per article).

---

## Honesty rules (non-negotiable — enforced by `content:lint`)

- **No fabricated first-party experience** ("we tested", "our test", "hands-on") — `scripts/lint-experience-claims.ts` blocks it at build (prebuild) and allowlists only intentional negations.
- Evidence = **moderated reader reports** (Supabase) + cited third-party sources, never invented tests.
- Every review links `/how-we-rate/` (single-source methodology, enforced by `methodology:check`).
- AI-assisted, human-edited; **AI imagery disclosed**.

---

## Visuals pipeline (Higgsfield)

1. **Preflight cost**: `generate_image` with `get_cost: true` (no job, no spend). `nano_banana_pro` ≈ 2 credits for a 16:9 diagram.
2. **Generate**: `generate_image` (`nano_banana_pro`, `aspect_ratio: "16:9"`). Prompt style: clean flat-vector, deep-navy `#0a1628` + gold `#fbbf24`, white bg, legible sans-serif, "no photorealism, no logos".
3. **Poll**: `job_status` with `sync: true` → completed → media URL.
4. **Download**: `curl -sL "<url>" -o images/guides/<slug>.png`.
5. **VISUAL QA** (mandatory): open the image (Read tool) and check text isn't garbled — AI diagrams sometimes misspell. Regenerate if bad.
6. **Embed**: `<figure><img src="/images/guides/<slug>.png" alt="…descriptive…" width height loading="lazy"><figcaption>… (AI-generated illustrative diagram).</figcaption></figure>` at the top of the guide.
7. **Deploy**: `images/` is copied to `public/` at build (`generate-astro-pages.mjs`). `.content-card img/figure/figcaption` styled in `partials/trust.css`.
8. **Honesty**: diagrams/illustrations only — **never fake screenshots or "proof"**. Disclose as AI-generated.

---

## Build gates (order)

`prebuild` = `content:lint` → `methodology:check` → `reader-reports:aggregate` → `generate:pages`, then `astro build`. Node **≥22.12** (use `nvm use 22`). Vercel deploys via `npm run build`, so all gates run on every deploy.

---

## Standing live-data findings (re-check, don't trust the old map)

- The topical map's **KD values are unreliable** (e.g. "best sweepstakes casinos" mapped KD 6, live KD 32). Re-baseline priorities on live DataForSEO/Ahrefs before building.
- The niche is **declining** (−33% to −80% YoY) — consistent with 2025–26 state bans.
- **PAA is value-obsessed** ("1 SC = $1", "how much is 100 SC"). Answer value explicitly.
- **Reddit ranks top-3** on many terms → real-experience intent → lean on reader-reports + FAQ schema.
