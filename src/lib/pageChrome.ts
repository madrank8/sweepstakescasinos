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

import { SITE } from '../data/site';

const ORIGIN = SITE.origin;
const ORG_MARKER = '<!--sc-org-graph-->';

/**
 * Canonical publisher entity graph (one Organization + one WebSite with stable
 * @id), referenced by other page schema. Founder links to the author Person
 * node (@id on /author/ilija-milosevic/). No SearchAction (no site search).
 */
const ORG_GRAPH = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${ORIGIN}/#organization`,
      name: SITE.name,
      alternateName: SITE.altName,
      url: `${ORIGIN}/`,
      logo: {
        '@type': 'ImageObject',
        '@id': `${ORIGIN}/#logo`,
        url: `${ORIGIN}${SITE.logo}`,
        caption: SITE.name,
      },
      image: { '@id': `${ORIGIN}/#logo` },
      description:
        'Independent review site comparing US sweepstakes (social) casinos, bonuses, and redemption policies.',
      founder: { '@id': `${ORIGIN}/author/${SITE.authorSlug}/#person` },
      sameAs: ['https://www.youtube.com/@SweepstakesWiz'],
      knowsAbout: [
        'Sweepstakes casinos',
        'Social casinos',
        'Casino bonuses',
        'Responsible gaming',
        'US gaming law',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${ORIGIN}/#website`,
      url: `${ORIGIN}/`,
      name: SITE.name,
      publisher: { '@id': `${ORIGIN}/#organization` },
      inLanguage: 'en-US',
    },
  ],
};

const ORG_SCRIPT = `${ORG_MARKER}\n<script type="application/ld+json">${JSON.stringify(
  ORG_GRAPH,
)}</script>`;

const HEAD_CLOSE = /<\/head>/i;

const GA_MARKER = '<!--sc-google-analytics-->';
const GOOGLE_ANALYTICS = `${GA_MARKER}
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YS24XQPM4Y"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-YS24XQPM4Y');
</script>`;

/**
 * Inject Google Analytics 4 tracking before </head>.
 * Idempotent; no-op for documents without a </head>.
 */
export function injectGoogleAnalytics(html: string): string {
  if (html.includes(GA_MARKER)) return html;
  return html.replace(HEAD_CLOSE, (match) => `${GOOGLE_ANALYTICS}\n${match}`);
}

/**
 * Inject the publisher Organization + WebSite JSON-LD before </head>.
 * Idempotent; no-op for documents without a </head>.
 */
export function injectOrgSchema(html: string): string {
  if (html.includes(ORG_MARKER)) return html;
  return html.replace(HEAD_CLOSE, (match) => `${ORG_SCRIPT}\n${match}`);
}

const FAVICON_MARKER = '<!--sc-favicons-->';

const FAVICONS = `${FAVICON_MARKER}
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="${SITE.logo.replace('sweepstakeswiz.png', 'sweepstakeswiz-mark.png')}">
<link rel="apple-touch-icon" href="/sweepstakeslogo/apple-touch-icon.png">`;

/**
 * Inject the Sweepstakes Wiz favicon / touch-icon links before </head>.
 * Idempotent; no-op for documents without a </head>.
 */
export function injectFavicon(html: string): string {
  if (html.includes(FAVICON_MARKER)) return html;
  return html.replace(HEAD_CLOSE, (match) => `${FAVICONS}\n${match}`);
}

/** Apply all global page chrome (favicons + compliance ribbon + publisher schema + GA4). */
export function decorateChrome(html: string): string {
  return injectGoogleAnalytics(injectFavicon(injectOrgSchema(injectComplianceRibbon(html))));
}

/**
 * Raw markup accessors for native Astro layouts (e.g. MDX content pages) that
 * don't pass through the set:html pipeline but must render the same chrome.
 * The caller is responsible for date-stamping the ribbon's __UPDATED_DATE__.
 */
export function complianceRibbonMarkup(): string {
  return RIBBON;
}

export function orgSchemaMarkup(): string {
  return ORG_SCRIPT;
}

export function faviconMarkup(): string {
  return FAVICONS;
}

export function googleAnalyticsMarkup(): string {
  return GOOGLE_ANALYTICS;
}
