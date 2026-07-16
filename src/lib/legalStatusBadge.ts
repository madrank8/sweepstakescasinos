/**
 * Date-stamped legal-status verification badge for review pages.
 * Date is grounded in SITE_LEGAL_STATUS_VERIFIED_ON (geo.ts) — never fabricated.
 */
import { SITE_LEGAL_STATUS_VERIFIED_ON } from '../data/geo';

const BADGE_MARKER = '<!--sc-legal-verified-->';

function badgeMarkup(verifiedOn: string): string {
  return `${BADGE_MARKER}
<style>
.sc-legal-verified{margin:12px 0 18px;padding:10px 14px;border:1px solid rgba(15,23,42,.12);border-left:4px solid #0a1628;border-radius:8px;background:#f8fafc;font:600 13px/1.5 'DM Sans',system-ui,sans-serif;color:#334155;}
.sc-legal-verified time{font-variant-numeric:tabular-nums;color:#0a1628;}
.sc-legal-verified a{color:#1d4ed8;text-decoration:underline;}
</style>
<p class="sc-legal-verified" role="status">
  Legal status last verified: <time datetime="${verifiedOn}">${verifiedOn}</time>
  · <a href="/sweepstakes-tracker/">legality tracker</a>
  · <a href="/state-legality/">state legality hub</a>
</p>`;
}

const RESTRICTED_BOX_OPEN =
  /(<div\b[^>]*\bclass="[^"]*\brestricted-box\b[^"]*"[^>]*>)/i;
const AUTHOR_EEAT_OPEN = /(<div\b[^>]*\bclass="[^"]*\bauthor-eeat\b[^"]*"[^>]*>)/i;

/**
 * Insert the verification badge immediately before the restricted-states box
 * (preferred) or author E-E-A-T block. Idempotent; no nested-div parsing.
 */
export function injectLegalStatusBadge(
  html: string,
  verifiedOn: string = SITE_LEGAL_STATUS_VERIFIED_ON,
): string {
  if (html.includes(BADGE_MARKER)) return html;
  const badge = badgeMarkup(verifiedOn);
  if (RESTRICTED_BOX_OPEN.test(html)) {
    return html.replace(RESTRICTED_BOX_OPEN, `${badge}\n$1`);
  }
  if (AUTHOR_EEAT_OPEN.test(html)) {
    return html.replace(AUTHOR_EEAT_OPEN, `${badge}\n$1`);
  }
  return html.replace(/<body\b[^>]*>/i, (m) => `${m}\n${badge}`);
}
