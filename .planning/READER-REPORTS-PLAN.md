# Reader Reports — Implementation Plan (Evidence Layer / Phase 2)

**Date:** 2026-07-01
**Status:** Plan — research complete, awaiting decisions before execution
**Purpose:** The honest evidence layer that replaces first-party hands-on testing (spec §4). Real players submit what actually happened at a brand; we moderate, aggregate, and display **"Player-reported (N reports · date)"** — genuine Experience signal for E-E-A-T without fabricating anything.

---

## 1. What this delivers

- Turns real player experiences into original, verifiable, dated data on each review — the differentiation lever the AI-authorship spec calls for, adapted to a solo operator.
- Feeds the **Redemption Terms & Speed** and **Trust & Support** scoring criteria with real signal instead of guesses.
- Fully Class A / FTC-safe: attributed, aggregated, dated, never presented as our own testing.

---

## 2. Architecture (researched)

```
Player → review page form (honeypot + BotID)
      → POST /api/reader-reports (Astro server endpoint, prerender=false)
          → validate + bot check + rate limit
          → insert with SERVICE ROLE key, status='pending'   (browser never touches Supabase)
      → Supabase table reader_reports  (RLS deny-all for anon; only service role writes)

Owner → Supabase dashboard → set status='approved' | 'rejected'

Build → scripts/aggregate-reader-reports.ts (service role, read approved)
      → writes src/data/readerReports.generated.ts (per-brand aggregates)
      → generate-astro-pages injects into <!-- reader-reports --> marker on each review
      → "Player-reported: median X, N reports, as of <date>" + optional AggregateRating JSON-LD
```

### Key design decisions (grounded in research)

| Decision | Choice | Why |
|---|---|---|
| Where inserts happen | **Server-side only**, via Astro API route using the **service-role key** | Browser never holds Supabase creds; no anon-insert RLS complexity (a common failure mode); table stays fully private |
| Framework glue | Astro **server endpoint** `src/pages/api/reader-reports.ts` with `export const prerender = false` | Confirmed pattern for Astro `output:'server'` + `@astrojs/vercel` |
| Bot protection | **Vercel BotID** (invisible, native) + honeypot field + IP rate-limit | We deploy on Vercel; BotID is the native, invisible, recommended option. Cloudflare Turnstile is the portable fallback if we ever leave Vercel |
| Storage read for display | **Build-time aggregation** → committed data file → marker injection | Works with static-prerendered reviews; cache-friendly; no per-request DB calls. New approved reports appear on next deploy (daily Vercel cron can auto-rebuild) |
| Moderation | Manual, via Supabase dashboard `status` column | Non-negotiable for fraud/operator-manipulation control; nothing displays until approved |
| Reports table visibility | **Private** (RLS deny-all to `anon`) | Raw submissions may contain edge-case PII; only aggregates are public |

---

## 3. Database schema (Supabase / Postgres 17)

Table `public.reader_reports`:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` default `gen_random_uuid()` PK | |
| `created_at` | `timestamptz` default `now()` | |
| `brand_slug` | `text` not null | must match a known review slug (validated in API) |
| `status` | `text` default `'pending'` | `pending` / `approved` / `rejected` (CHECK constraint) |
| `redemption_method` | `text` | e.g. Skrill, bank, gift card, crypto |
| `amount_band` | `text` | bucketed, e.g. "$50–$100" (no exact amounts) |
| `request_date` | `date` | |
| `payout_date` | `date` | |
| `hours_to_payout` | `numeric` | computed client- or server-side, nullable |
| `us_state` | `text` | 2-letter, optional |
| `kyc_experience` | `text` | short free text |
| `rating` | `int` | 1–5 (CHECK) |
| `comment` | `text` | free text, length-capped |
| `consent` | `boolean` not null | must be true |
| `source_ip_hash` | `text` | hashed, for rate-limit/abuse only (not PII) |

**RLS:** enable RLS; **no** `anon` policies (deny-all). Service role bypasses RLS for insert (API route) and select (aggregation). Optional moderator dashboard uses Supabase auth.

**Anti-PII:** API rejects submissions containing email/phone/card patterns in free-text; UI reminds "no personal details."

---

## 4. Submission form

- Lives at the bottom of each review (a "Report your experience" block) + a standalone `/report/` page. Reuses a `<!-- reader-reports-form -->` marker or a small Astro island.
- Fields: brand (prefilled per review), redemption method, amount band (select), request/payout dates, US state (optional), KYC experience, 1–5 rating, comment, **consent checkbox**, hidden **honeypot**.
- Progressive enhancement: normal HTML form posting to `/api/reader-reports`; JS enhances with inline success/error + BotID token.
- No login required (keeps friction low; BotID + moderation handle abuse).

---

## 5. API route responsibilities (`/api/reader-reports`)

1. `export const prerender = false`; return JSON always.
2. Reject if honeypot filled.
3. **BotID** `checkBotId()` → reject bots.
4. Validate: `brand_slug` ∈ known slugs; dates sane; rating 1–5; consent true; lengths capped; no PII patterns.
5. Rate-limit by hashed IP (e.g. N/hour) — simple in-memory or Supabase counter.
6. Insert with **service-role** client, `status='pending'`.
7. Return `{ success: true }` (never leak internal errors).

**Env vars (Vercel):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `PUBLIC_`), BotID auto-wired on Vercel.

---

## 6. Aggregation + display

- `scripts/aggregate-reader-reports.ts` (service role): pull `status='approved'`, group by `brand_slug`, compute per brand: report count, median `hours_to_payout`, method breakdown, average rating, date range. Write `src/data/readerReports.generated.ts` (gitignored or committed — TBD).
- `generate-astro-pages.mjs` injects into a `<!-- reader-reports -->` / `<!-- /reader-reports -->` marker on each review (mirrors the existing `testing:` marker mechanism in `src/lib/testingFragments.ts`).
- Display copy: **"Player-reported: median Skrill payout ~19h across 12 reader reports, as of 2026-07-01."** + a few approved verbatim quotes.
- **Schema.org:** only emit `AggregateRating`/`Review` from genuine approved reports, with **honest counts**; visible numbers must equal JSON-LD (enforceable later by extending `methodology:check`-style gate). Suppress markup below a minimum sample (e.g. < 3 reports).
- **Class A lint stays green:** all copy is "player-reported", never "we tested".

---

## 7. Moderation workflow (owner)

1. New rows land as `pending`.
2. Review in Supabase dashboard (or a tiny `/admin` behind Supabase auth — later).
3. Set `approved` (redact any stray PII first) or `rejected`.
4. Next build/deploy (or daily cron) picks up approved rows.

---

## 8. Anti-abuse & legal

- BotID + honeypot + rate-limit + manual approval (defense in depth).
- No PII stored; consent required; redaction reminder; IP only stored hashed for abuse control.
- UGC disclaimer in `/legal/terms/` (reports are user opinions; we don't guarantee them).
- Aligns with FTC Consumer Review Rule: genuine, unincentivized, moderated, honestly aggregated.

---

## 9. Phasing

**MVP (ship first):**
- Table + RLS + service-role insert
- API route + BotID + validation
- Form on review pages
- Manual moderation in dashboard
- Build-time aggregation + marker display (text only, no schema yet)

**V2:**
- `AggregateRating` JSON-LD from approved reports (+ consistency gate)
- Daily Vercel cron to auto-rebuild when new reports approved
- `/admin` moderation UI (Supabase auth)
- Payout-Speed Index page fed by the same data (Pillar 2 of the evidence strategy)

---

## 10. Effort estimate

| Piece | Est. |
|---|---|
| Supabase table + RLS migration (via MCP `apply_migration`) | 0.5 day |
| API route + validation + BotID + rate-limit | 1 day |
| Form (review marker + standalone page) | 0.5–1 day |
| Aggregation script + marker injection in generate step | 1 day |
| Moderation runbook + legal disclaimer | 0.25 day |
| **MVP total** | **~3–4 days** |

---

## 11. Decisions (confirmed 2026-07-01)

1. **Supabase project:** ✅ Create a **new dedicated `sweepstakeswiz` project** (clean isolation). *(Billable — confirm cost before creating.)*
2. **Bot protection:** **Vercel BotID** (native, invisible) + honeypot + rate-limit.
3. **Form placement:** ✅ On **every review** + a standalone `/report/` page.
4. **AggregateRating schema:** ✅ **Text-only until a brand reaches ~10 approved reports**, then auto-enable `AggregateRating` markup (avoids thin/manipulable schema).
5. **Generated data file:** commit `src/data/readerReports.generated.ts` for auditability (default; revisit if noisy).

---

## 12. Related
- `.planning/EVIDENCE-STRATEGY-PLAN.md` — parent strategy (this is Pillar 3)
- `.planning/AI-AUTHORSHIP-DISCLOSURE-SPEC.md` §4 — evidence layer (reinterpreted as reader reports)
- `src/lib/testingFragments.ts` — existing marker-injection mechanism to reuse
- `scripts/generate-astro-pages.mjs` — where marker injection hooks in
