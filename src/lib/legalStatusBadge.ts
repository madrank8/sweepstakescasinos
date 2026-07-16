/**
 * Date-stamped legal-status verification badge for review pages.
 * Date is grounded in SITE_LEGAL_STATUS_VERIFIED_ON (geo.ts) — never fabricated.
 */
import { SITE_LEGAL_STATUS_VERIFIED_ON } from '../data/geo';

const BADGE_MARKER = '<!--sc-legal-verified-->';

function badgeMarkup(verifiedOn: string): string {
  return `${BADGE_MARKER}
<style>
.sc-legal-verified{margin:14px 0 20px;padding:12px 16px;border:1px solid rgba(15,23,42,.16);border-left:5px solid #0a1628;border-radius:10px;background:linear-gradient(180deg,#f1f5f9 0%,#f8fafc 100%);font:600 13.5px/1.55 'DM Sans',system-ui,sans-serif;color:#1e293b;box-shadow:0 1px 2px rgba(15,23,42,.04);}
.sc-legal-verified time{font-variant-numeric:tabular-nums;color:#0a1628;font-weight:700;}
.sc-legal-verified a{color:#1d4ed8;text-decoration:underline;text-underline-offset:2px;}
.sc-legal-verified a:hover{color:#1e40af;}
</style>
<p class="sc-legal-verified" role="status">
  Legal status last verified: <time datetime="${verifiedOn}">${verifiedOn}</time>
  · <a href="/sweepstakes-tracker/">legality tracker</a>
  · <a href="/state-legality/">state legality hub</a>
</p>`;
}

/** Preferred → fallback anchors so chrome-light reviews still get a visible mid-page badge. */
const ANCHORS: RegExp[] = [
  /(<div\b[^>]*\bclass="[^"]*\brestricted-box\b[^"]*"[^>]*>)/i,
  /(<div\b[^>]*\bclass="[^"]*\bauthor-eeat\b[^"]*"[^>]*>)/i,
  /(<div\b[^>]*\bclass="[^"]*\bverdict-box\b[^"]*"[^>]*>)/i,
  /(<div\b[^>]*\bclass="[^"]*\banswer-capsule\b[^"]*"[^>]*>)/i,
  /(<div\b[^>]*\bclass="[^"]*\boffer-card\b[^"]*"[^>]*>)/i,
  /(<main\b[^>]*>)/i,
];

/**
 * Insert the verification badge immediately before the best available chrome
 * anchor. Idempotent; no nested-div parsing.
 */
export function injectLegalStatusBadge(
  html: string,
  verifiedOn: string = SITE_LEGAL_STATUS_VERIFIED_ON,
): string {
  if (html.includes(BADGE_MARKER)) return html;
  const badge = badgeMarkup(verifiedOn);
  for (const re of ANCHORS) {
    if (re.test(html)) {
      return html.replace(re, `${badge}\n$1`);
    }
  }
  return html.replace(/<body\b[^>]*>/i, (m) => `${m}\n${badge}`);
}
