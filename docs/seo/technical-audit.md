# Technical SEO Audit

Source snapshot: repository authored sources. Generated deterministically without a runtime date.

## CRITICAL

- No unsupported matched testing claims remain on audited publishable sources.
- `prototypes/mcluck-firsthand-review-preview.html` explicitly emits `noindex, nofollow`.

## HIGH IMPACT

- Internal-link inventory found **0** links whose targets are not represented by an authored exact or known dynamic route. These are documented, not redirected.
- The review pipeline injects deterministic contextual navigation into **29 reviews** through both static and SSR transforms. Related-review tie-breaks use canonical editorial facts and slug order; affiliate CPA and tracking data are not inputs.
- Redirect-only routes are excluded from content-orphan findings; `/best/` remains a deliberate 301 to `/best/sweepstakes-casinos/`, not a content page.
- `src/lib/htmlStamp.ts` replaces `__UPDATED_DATE__` with the build month and year. This is build freshness, not a substantive source date; retain for Phase 2/3 review rather than replacing it with another synthetic date.
- Legal-page sitemap/noindex policy is internally mixed and requires a policy decision; no legal page was reindexed or removed here:
- `legal/accessibility.html`: robots `index, follow`; sitemap excluded; canonical `https://sweepstakeswiz.com/legal/accessibility/`.
- `legal/affiliate-disclosure.html`: robots `index, follow`; sitemap included; canonical `https://sweepstakeswiz.com/legal/affiliate-disclosure/`.
- `legal/cookie.html`: robots `noindex, follow`; sitemap excluded; canonical `https://sweepstakeswiz.com/legal/cookie/`.
- `legal/dmca.html`: robots `noindex, follow`; sitemap excluded; canonical `https://sweepstakeswiz.com/legal/dmca/`.
- `legal/do-not-sell.html`: robots `noindex, follow`; sitemap excluded; canonical `https://sweepstakeswiz.com/legal/do-not-sell/`.
- `legal/privacy.html`: robots `noindex, nofollow`; sitemap excluded; canonical `https://sweepstakeswiz.com/legal/privacy/`.
- `legal/terms.html`: robots `noindex, nofollow`; sitemap excluded; canonical `https://sweepstakeswiz.com/legal/terms/`.
- Clean authored URL/canonical strategy remains unresolved: root `.html` sources are rendered at trailing-slash routes while canonical tags use the clean routes. No redirects or URL paths changed.

## OPPORTUNISTIC

- **0** authored routes have no detected inbound source link and are candidates for manual review; dynamic and bonus endpoints are excluded from this count.
- Homepage and `/best/sweepstakes-casinos/` share a topic but now serve concise decision-support and deep ranked-comparison intents respectively; see `cannibalisation-review.md`.

## NOISE

- `src/pages/` is generated and excluded from source findings. `index.html` is retained as historical audit evidence and is not inventoried as the served root route.
- Bonus source HTML is intentionally replaced by the SSR geo-aware gateway; its source-file presence alone is not treated as an indexation defect.
