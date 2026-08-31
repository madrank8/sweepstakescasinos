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
  <a href="https://www.ncpgambling.org/" rel="noopener noreferrer" target="_blank">1-800-GAMBLER</a>
  <span class="sc-tr-sep">&middot;</span>
  <a href="/legal/affiliate-disclosure/">Affiliate disclosure</a>
  <span class="sc-tr-sep">&middot;</span>
  <span>Reviewed by <a href="${SITE.author.path}">${SITE.author.name}</a> &middot; Updated __UPDATED_DATE__</span>
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
import { getOperator, verifiedValue } from '../data/operators';
import {
  AUTHOR_ID,
  ORG_ID,
  WEBSITE_ID,
  brandOrganizationNode,
  buildPageGraph,
  serializeJsonLd,
  type Crumb,
  type WebPageType,
} from './schema';

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
const LEGACY_GOOGLE_TAG =
  /\s*(?:<!--\s*Google tag \(gtag\.js\)\s*-->\s*)?<script\s+async\s+src=(["'])(?:https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+|\/_external\/www\.googletagmanager\.com\/gtag\/js__[^"']+)\1><\/script>\s*<script\b[^>]*>[\s\S]*?gtag\s*\(\s*['"]config['"]\s*,\s*['"]G-[A-Z0-9]+['"][\s\S]*?<\/script>\s*/gi;

/**
 * Replace mirrored legacy gtag snippets with the canonical GA4 tracking tag.
 * Idempotent; no-op for documents without a </head>.
 */
export function injectGoogleAnalytics(html: string): string {
  if (html.includes(GA_MARKER)) return html;
  const withoutLegacyTags = html.replace(LEGACY_GOOGLE_TAG, '\n');
  return withoutLegacyTags.replace(HEAD_CLOSE, (match) => `${GOOGLE_ANALYTICS}\n${match}`);
}

type JsonLdNode = Record<string, unknown>;

const JSON_LD_MARKER = '<!--sc-jsonld-graph-->';
const JSON_LD_SCRIPT =
  /<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;
const BRAND_ID = new RegExp(`^${SITE.origin}/reviews/([a-z0-9-]+)/#brand$`);
const LEGACY_PAGE_TYPES = new Set<WebPageType>([
  'WebPage',
  'CollectionPage',
  'ItemPage',
  'AboutPage',
  'ContactPage',
  'ProfilePage',
]);

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
    ndash: '–',
    mdash: '—',
  };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_match, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function tagAttribute(tag: string, attribute: string): string | undefined {
  const match = tag.match(
    new RegExp(`\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'),
  );
  return match?.[1] ?? match?.[2];
}

function metaContent(html: string, name: string): string | undefined {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (tagAttribute(match[0], 'name')?.toLowerCase() === name.toLowerCase()) {
      return tagAttribute(match[0], 'content');
    }
  }
  return undefined;
}

function canonicalUrl(html: string): string | undefined {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (tagAttribute(match[0], 'rel')?.toLowerCase() === 'canonical') {
      return tagAttribute(match[0], 'href');
    }
  }
  return undefined;
}

function pageTitle(html: string): string {
  const raw =
    html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
    SITE.publisher.name;
  return decodeHtml(raw.replace(/<[^>]+>/g, '').trim());
}

function nodesFromJsonLd(html: string): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];
  for (const match of html.matchAll(JSON_LD_SCRIPT)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch (error) {
      throw new Error(
        `[schema] Legacy JSON-LD does not parse: ${error instanceof Error ? error.message : error}`,
      );
    }
    if (!parsed || typeof parsed !== 'object') continue;
    const value = parsed as JsonLdNode;
    const graph = value['@graph'];
    if (Array.isArray(graph)) {
      for (const node of graph) {
        if (node && typeof node === 'object') nodes.push(node as JsonLdNode);
      }
    } else {
      nodes.push(value);
    }
  }
  return nodes;
}

function breadcrumbCrumbs(
  nodes: JsonLdNode[],
  canonical: string,
  title: string,
): Crumb[] {
  const node = nodes.find((candidate) => candidate['@type'] === 'BreadcrumbList');
  const items = node?.itemListElement;
  if (Array.isArray(items) && items.length > 0) {
    const crumbs = items.flatMap((item, index): Crumb[] => {
      if (!item || typeof item !== 'object') return [];
      const entry = item as JsonLdNode;
      const name = typeof entry.name === 'string' ? entry.name : undefined;
      if (!name) return [];
      const rawItem = typeof entry.item === 'string' ? entry.item : undefined;
      let path = index === items.length - 1 ? new URL(canonical).pathname : '/';
      if (rawItem) {
        try {
          const url = new URL(rawItem, SITE.origin);
          if (url.origin === SITE.origin) path = `${url.pathname}${url.search}${url.hash}`;
        } catch {
          // Keep the safe same-origin fallback.
        }
      }
      return [{ name, path }];
    });
    if (crumbs.length > 0) {
      crumbs[crumbs.length - 1].path = new URL(canonical).pathname;
      return crumbs;
    }
  }
  const currentPath = new URL(canonical).pathname;
  return currentPath === '/'
    ? [{ name: 'Home', path: '/' }]
    : [
        { name: 'Home', path: '/' },
        { name: title, path: currentPath },
      ];
}

export function visibleEditorialScore(html: string): number | undefined {
  const verdict =
    /<(?:div|section)\b[^>]*class=["'][^"']*\b(?:verdict-wrap|verdict-box|score-box|score-hero)\b[^"']*["'][^>]*>[\s\S]{0,1200}?<span\b[^>]*class=["'][^"']*\b(?:num|big)\b[^"']*["'][^>]*>\s*(\d{1,3}(?:\.\d+)?)\s*<\/span>\s*<span\b[^>]*class=["'][^"']*\b(?:den|denom)\b[^"']*["'][^>]*>\s*\/\s*100\s*<\/span>/i;
  const value = Number(verdict.exec(html)?.[1]);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;
}

function contentNodes(
  nodes: JsonLdNode[],
  canonical: string,
  score: number | undefined,
  legacyPage: JsonLdNode | undefined,
) {
  const foundationIds = new Set([
    ORG_ID,
    WEBSITE_ID,
    AUTHOR_ID,
    `${canonical}#webpage`,
    `${canonical}#breadcrumb`,
  ]);
  const seenIds = new Set<string>();
  const content: JsonLdNode[] = [];
  for (const original of nodes) {
    if (original === legacyPage) continue;
    const { ['@context']: _context, ...node } = original;
    const id = typeof node['@id'] === 'string' ? node['@id'] : undefined;
    const brandMatch = id?.match(BRAND_ID);
    if (
      node['@type'] === 'BreadcrumbList' ||
      (id &&
        (foundationIds.has(id) ||
          (brandMatch && brandOrganizationNode(brandMatch[1]) !== undefined)))
    ) {
      continue;
    }
    if (node['@type'] === 'Review') {
      if (score == null) {
        delete node.reviewRating;
      } else {
        node.reviewRating = {
          '@type': 'Rating',
          ratingValue: score,
          bestRating: 100,
          worstRating: 0,
        };
      }
    }
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
    }
    content.push(node);
  }
  return content;
}

/**
 * Replace all legacy JSON-LD blocks with one foundation + content @graph.
 * Existing content entities survive; canonical foundation/brand identities
 * are rebuilt from their single sources of truth.
 */
export function consolidateJsonLd(html: string): string {
  if (html.includes(JSON_LD_MARKER) || !HEAD_CLOSE.test(html)) return html;
  const canonical = canonicalUrl(html);
  if (!canonical || !canonical.startsWith(SITE.origin)) return html;

  const title = pageTitle(html);
  const description = decodeHtml(metaContent(html, 'description') ?? '');
  const legacyNodes = nodesFromJsonLd(html);
  const legacyPage = legacyNodes.find((node) => {
    const type = node['@type'];
    return typeof type === 'string' && LEGACY_PAGE_TYPES.has(type as WebPageType);
  });
  const pageType =
    typeof legacyPage?.['@type'] === 'string'
      ? (legacyPage['@type'] as WebPageType)
      : canonical.includes('/reviews/')
        ? 'ItemPage'
        : 'WebPage';
  const review = legacyNodes.find((node) => node['@type'] === 'Review');
  const profileMain = legacyPage?.mainEntity;
  const mainEntityId =
    typeof review?.['@id'] === 'string'
      ? review['@id']
      : profileMain &&
          typeof profileMain === 'object' &&
          typeof (profileMain as JsonLdNode)['@id'] === 'string'
        ? ((profileMain as JsonLdNode)['@id'] as string)
        : undefined;
  const reviewSlug = canonical.match(/^https:\/\/sweepstakeswiz\.com\/reviews\/([a-z0-9-]+)\/$/)?.[1];
  const score = reviewSlug
    ? getOperator(reviewSlug)
      ? verifiedValue(getOperator(reviewSlug)!.editorScore100)
      : undefined
    : visibleEditorialScore(html);
  const graph = buildPageGraph({
    url: canonical,
    pageType,
    title,
    description,
    breadcrumbs: breadcrumbCrumbs(legacyNodes, canonical, title),
    mainEntityId,
    nodes: contentNodes(legacyNodes, canonical, score, legacyPage),
  });
  const script = `${JSON_LD_MARKER}\n<script type="application/ld+json">${serializeJsonLd(graph)}</script>`;
  const withoutLegacy = html.replace(JSON_LD_SCRIPT, '');
  return withoutLegacy.replace(HEAD_CLOSE, (match) => `${script}\n${match}`);
}

/** Backward-compatible entrypoint; consolidation includes publisher schema. */
export function injectOrgSchema(html: string): string {
  return consolidateJsonLd(html);
}

/** Backward-compatible entrypoint; consolidation includes WebPage schema. */
export function injectWebPageSchema(html: string): string {
  return consolidateJsonLd(html);
}

const FAVICON_MARKER = '<!--sc-favicons-->';

const FAVICONS = `${FAVICON_MARKER}
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="${SITE.logo.replace('sweepstakeswiz.png', 'sweepstakeswiz-mark.webp')}">
<link rel="apple-touch-icon" href="/sweepstakeslogo/apple-touch-icon.png">`;

/**
 * Inject the Sweepstakes Wiz favicon / touch-icon links before </head>.
 * Idempotent; no-op for documents without a </head>.
 */
export function injectFavicon(html: string): string {
  if (html.includes(FAVICON_MARKER)) return html;
  return html.replace(HEAD_CLOSE, (match) => `${FAVICONS}\n${match}`);
}

/** Apply all global page chrome (favicons + compliance ribbon + publisher/WebPage schema + GA4). */
export function decorateChrome(html: string): string {
  return injectGoogleAnalytics(
    injectFavicon(consolidateJsonLd(injectComplianceRibbon(html))),
  );
}

/**
 * Raw markup accessors for native Astro layouts (e.g. MDX content pages) that
 * don't pass through the set:html pipeline but must render the same chrome.
 * The caller is responsible for date-stamping the ribbon's __UPDATED_DATE__.
 */
export function complianceRibbonMarkup(): string {
  return RIBBON;
}

export function faviconMarkup(): string {
  return FAVICONS;
}

export function googleAnalyticsMarkup(): string {
  return GOOGLE_ANALYTICS;
}
