/**
 * Global, persistent compliance UI injected server-side into every rendered
 * page (static + SSR). Guarantees the required trust elements appear sitewide
 * regardless of whether a page uses shared partials or inline markup:
 *   - 21+ age badge
 *   - "no real-money gambling" framing (AEO/iGaming veto safety)
 *   - Responsible-gaming link + 1-800-GAMBLER
 *   - Affiliate disclosure link
 *   - "Reviewed by <author> · Updated <date>" editorial line
 *
 * The `__UPDATED_DATE__` token is replaced downstream by stampUpdatedDate().
 */

const RIBBON_MARKER = '<!--sc-trust-ribbon-->';

const RIBBON = `${RIBBON_MARKER}
<style>
.sc-trust-ribbon{display:flex;flex-wrap:wrap;align-items:center;gap:5px 12px;justify-content:center;background:#0a1628;color:#cbd5e1;font:600 12px/1.45 'DM Sans',system-ui,-apple-system,sans-serif;padding:7px 14px;border-bottom:1px solid rgba(255,255,255,.08);text-align:center;}
.sc-trust-ribbon a{color:#fbbf24;text-decoration:none;}
.sc-trust-ribbon a:hover{text-decoration:underline;}
.sc-trust-ribbon .sc-tr-badge{background:#fbbf24;color:#0a1628;font-weight:800;border-radius:4px;padding:1px 6px;letter-spacing:.02em;}
.sc-trust-ribbon .sc-tr-sep{opacity:.32;}
@media(max-width:560px){.sc-trust-ribbon{font-size:11px;gap:4px 9px;}}
</style>
<div class="sc-trust-ribbon" role="note" aria-label="Age, responsible gaming and affiliate disclosure">
  <span class="sc-tr-badge">21+</span>
  <span>Sweepstakes play &middot; no real-money gambling</span>
  <span class="sc-tr-sep">&middot;</span>
  <a href="/responsible-gaming/">Play responsibly</a>
  <a href="tel:18004262537">1-800-GAMBLER</a>
  <span class="sc-tr-sep">&middot;</span>
  <a href="/legal/affiliate-disclosure/">Affiliate disclosure</a>
  <span class="sc-tr-sep">&middot;</span>
  <span>Reviewed by <a href="/author/ilija-milosevic/">Ilija Milosevic</a> &middot; Updated __UPDATED_DATE__</span>
</div>`;

const BODY_OPEN = /<body\b[^>]*>/i;

/**
 * Insert the compliance ribbon immediately after the opening <body> tag.
 * Idempotent (no-op if already present); leaves pages without a <body> tag
 * unchanged.
 */
export function injectComplianceRibbon(html: string): string {
  if (html.includes(RIBBON_MARKER)) return html;
  return html.replace(BODY_OPEN, (match) => `${match}\n${RIBBON}`);
}
