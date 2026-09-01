import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AFFILIATE_PARTNERS } from '../../src/data/affiliates';
import { OPERATORS } from '../../src/data/operators';
import { availabilityForPartner } from '../../src/lib/availability';
import { reviewOutboundAvailabilityView } from '../../src/lib/availabilityViews';
import { buildComparisonOperatorViews } from '../../src/lib/homepage';

export interface RenderedPage {
  path: string;
  status: number;
  html: string;
  location?: string;
}

export interface RenderedLinkIssue {
  source: string;
  target: string;
}

export interface RenderedLinkGraphResult {
  pageCount: number;
  linkCount: number;
  missingTargets: RenderedLinkIssue[];
  unintendedRedirects: RenderedLinkIssue[];
  duplicateBlockDestinations: RenderedLinkIssue[];
  hierarchyFailures: Array<{ path: string; reason: string }>;
  missingImportantInbound: string[];
}

export type GeoMode = 'unknown' | 'TX' | 'CA';

export interface GeoRenderedPage extends RenderedPage {
  mode: GeoMode;
}

export interface GeoValidationFailure {
  path: string;
  mode: GeoMode;
  reason: string;
}

type PageFetcher = (path: string, mode: GeoMode) => Promise<Response>;

const SITE_ORIGIN = 'https://sweepstakeswiz.com';
const IMPORTANT_COMMERCIAL_PATHS = [
  '/reviews/',
  '/best/sweepstakes-casinos/',
  '/new/',
  '/bonuses/no-deposit/',
  '/state-legality/',
] as const;

function normalizedPath(value: string): string | null {
  if (/^(?:mailto:|tel:|javascript:|data:|#)/i.test(value)) return null;
  let url: URL;
  try {
    url = new URL(value, SITE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== SITE_ORIGIN) return null;
  if (
    ['/_external/', '/sweepstakeslogo/', '/partials/', '/images/', '/testing/'].some(
      (prefix) => url.pathname.startsWith(prefix),
    )
  ) {
    return null;
  }
  if (
    /\.(?:css|js|mjs|png|jpe?g|webp|svg|ico|xml|txt|json|csv|pdf|woff2?)$/i.test(
      url.pathname,
    )
  ) {
    return null;
  }
  return url.pathname === '/'
    ? '/'
    : `${url.pathname.replace(/\/+$/, '')}/`;
}

function linksIn(html: string): string[] {
  return [...html.matchAll(/\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)]
    .map((match) => normalizedPath(match[1] ?? match[2] ?? ''))
    .filter((path): path is string => path !== null);
}

function uniqueIssues(issues: RenderedLinkIssue[]): RenderedLinkIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.source}\0${issue.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasAny(links: string[], targets: readonly string[]): boolean {
  return targets.some((target) => links.includes(target));
}

function contextualBlocks(html: string): Array<{ html: string; index: number }> {
  const pattern =
    /<!--sc-contextual-nav-->\s*<aside\b[\s\S]*?<\/aside>|<nav\b[^>]*class=["'][^"']*(?:guide-contextual-links|article-contextual-links)[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi;
  return [...html.matchAll(pattern)].map((match) => ({
    html: match[0],
    index: match.index,
  }));
}

export function validateRenderedLinkGraph(
  renderedPages: readonly RenderedPage[],
): RenderedLinkGraphResult {
  const pages = new Map(renderedPages.map((page) => [page.path, page]));
  const allLinks = renderedPages.flatMap((page) =>
    linksIn(page.html).map((target) => ({ source: page.path, target })),
  );
  const missingTargets = uniqueIssues(
    allLinks.filter(({ target }) => {
      if (/^\/bonuses\/[a-z0-9-]+\/$/.test(target)) return false;
      const page = pages.get(target);
      return !page || page.status === 404 || page.status === 410 || page.status >= 500;
    }),
  );
  const unintendedRedirects = uniqueIssues(
    allLinks.filter(({ target }) => {
      const page = pages.get(target);
      return Boolean(page && page.status >= 300 && page.status < 400);
    }),
  );

  const duplicateBlockDestinations: RenderedLinkIssue[] = [];
  for (const page of renderedPages) {
    for (const block of contextualBlocks(page.html)) {
      const seen = new Set<string>();
      for (const target of linksIn(block.html)) {
        if (seen.has(target)) {
          duplicateBlockDestinations.push({ source: page.path, target });
        }
        seen.add(target);
      }
      const nearby = new Set(
        linksIn(page.html.slice(Math.max(0, block.index - 2500), block.index)),
      );
      for (const target of seen) {
        if (nearby.has(target)) {
          duplicateBlockDestinations.push({ source: page.path, target });
        }
      }
    }
  }

  const hierarchyFailures: Array<{ path: string; reason: string }> = [];
  for (const page of renderedPages.filter((candidate) => candidate.status === 200)) {
    const links = linksIn(page.html);
    if (/^\/reviews\/[^/]+\/$/.test(page.path)) {
      if (!page.html.includes('<!--sc-contextual-nav-->')) {
        hierarchyFailures.push({
          path: page.path,
          reason: 'review lacks the contextual navigation block',
        });
      }
      if (!links.includes('/reviews/')) {
        hierarchyFailures.push({
          path: page.path,
          reason: 'review lacks its review-directory parent',
        });
      }
      if (
        !links.some(
          (target) =>
            /^\/reviews\/[^/]+\/$/.test(target) && target !== page.path,
        )
      ) {
        hierarchyFailures.push({
          path: page.path,
          reason: 'review lacks a deterministic related review',
        });
      }
      if (
        !hasAny(links, [
          '/best/sweepstakes-casinos/',
          '/new/',
          '/bonuses/no-deposit/',
        ])
      ) {
        hierarchyFailures.push({
          path: page.path,
          reason: 'review lacks a relevant commercial hub',
        });
      }
      if (
        !links.includes('/state-legality/') &&
        !links.some((target) => /^\/states\/[^/]+\/$/.test(target))
      ) {
        hierarchyFailures.push({
          path: page.path,
          reason: 'review lacks state availability context',
        });
      }
    }
    if (/^\/states\/[^/]+\/$/.test(page.path)) {
      for (const required of ['/reviews/', '/best/sweepstakes-casinos/']) {
        if (!links.includes(required)) {
          hierarchyFailures.push({
            path: page.path,
            reason: `state page lacks ${required}`,
          });
        }
      }
    }
    if (/^\/guides\/[^/]+\/$/.test(page.path)) {
      if (!links.includes('/guides/')) {
        hierarchyFailures.push({
          path: page.path,
          reason: 'guide lacks its parent hub',
        });
      }
      if (
        !hasAny(links, [
          '/best/sweepstakes-casinos/',
          '/bonuses/no-deposit/',
          '/state-legality/',
        ])
      ) {
        hierarchyFailures.push({
          path: page.path,
          reason: 'guide lacks a context-appropriate commercial destination',
        });
      }
    }
  }

  const inbound = new Set(
    allLinks
      .filter((link) => link.source !== link.target)
      .map((link) => link.target),
  );
  return {
    pageCount: renderedPages.length,
    linkCount: allLinks.length,
    missingTargets,
    unintendedRedirects,
    duplicateBlockDestinations: uniqueIssues(duplicateBlockDestinations),
    hierarchyFailures,
    missingImportantInbound: IMPORTANT_COMMERCIAL_PATHS.filter(
      (path) => !inbound.has(path),
    ),
  };
}

export function parseSitemapPaths(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => normalizedPath(match[1]))
    .filter((path): path is string => path !== null);
}

export function geoRequestHeaders(mode: GeoMode): Record<string, string> {
  return mode === 'unknown'
    ? { 'x-vercel-ip-country': 'US' }
    : {
        'x-vercel-ip-country': 'US',
        'x-vercel-ip-country-region': mode,
      };
}

function affiliateCtaCount(html: string): number {
  return [...html.matchAll(/<a\b[^>]*>/gi)].filter(({ 0: anchor }) => {
    const gateway = anchor.match(
      /\bhref=["']\/bonuses\/([a-z0-9-]+)\/?(?:\?[^"']*)?["']/i,
    );
    return (
      /\bdata-affiliate=["'][^"']+["']/i.test(anchor) ||
      Boolean(gateway && gateway[1] !== 'no-deposit')
    );
  }).length;
}

function stateForMode(mode: GeoMode): 'TX' | 'CA' | null {
  return mode === 'unknown' ? null : mode;
}

export function expectedReviewCtaEligibility(
  slug: string,
  mode: GeoMode,
): boolean {
  return reviewOutboundAvailabilityView(slug, stateForMode(mode)).canCta;
}

function expectedRouteCtaEligibility(path: string, mode: GeoMode): boolean {
  const review = path.match(/^\/reviews\/([^/]+)\/$/);
  if (review) return expectedReviewCtaEligibility(review[1], mode);
  const state = stateForMode(mode);
  if (path === '/bonuses/no-deposit/') {
    return AFFILIATE_PARTNERS.some(
      (partner) => availabilityForPartner(partner, state).cta.eligible,
    );
  }
  if (path === '/' || /^\/best\/[^/]+\/$/.test(path)) {
    const limit = path === '/' ? undefined : 10;
    return buildComparisonOperatorViews(OPERATORS, state, limit).some(
      (operator) => operator.hasPartner && operator.canCta,
    );
  }
  return false;
}

function reviewGatewayCtaCount(html: string, slug: string): number {
  return [...html.matchAll(/<a\b[^>]*>/gi)].filter(({ 0: anchor }) =>
    new RegExp(
      `\\bhref=["']/bonuses/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?(?:\\?[^"']*)?["']`,
      'i',
    ).test(anchor),
  ).length;
}

function htmlAttribute(markup: string, name: string): string | undefined {
  const match = markup.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'),
  );
  return match?.[1] ?? match?.[2];
}

function renderedReviewEligibilitySummary(html: string): {
  eligible?: boolean;
  kind?: string;
  reason?: string;
  text: string;
} | null {
  const row = html.match(
    /<dd\b(?=[^>]*\bdata-review-fact\s*=\s*["']visitor-offer-eligibility["'])[^>]*>([\s\S]*?)<\/dd>/i,
  );
  if (!row) return null;
  const eligible = htmlAttribute(row[0], 'data-cta-eligible');
  return {
    eligible: eligible === 'true' ? true : eligible === 'false' ? false : undefined,
    kind: htmlAttribute(row[0], 'data-outbound-kind'),
    reason: htmlAttribute(row[0], 'data-cta-reason'),
    text: row[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  };
}

export function validateGeoRenderedRoutes(
  renderedPages: readonly GeoRenderedPage[],
  expectedPaths: readonly string[],
): GeoValidationFailure[] {
  const pages = new Map(
    renderedPages.map((page) => [`${page.mode}\0${page.path}`, page]),
  );
  const failures: GeoValidationFailure[] = [];
  const modes: GeoMode[] = ['unknown', 'TX', 'CA'];
  for (const path of expectedPaths) {
    for (const mode of modes) {
      const page = pages.get(`${mode}\0${path}`);
      if (!page || page.status !== 200) {
        failures.push({
          path,
          mode,
          reason: `expected a 200 render, received ${page?.status ?? 'no response'}`,
        });
        continue;
      }
      const review = path.match(/^\/reviews\/([^/]+)\/$/);
      const ctaCount = review
        ? reviewGatewayCtaCount(page.html, review[1])
        : affiliateCtaCount(page.html);
      const shouldHaveCta = expectedRouteCtaEligibility(path, mode);
      if (shouldHaveCta && ctaCount === 0) {
        failures.push({
          path,
          mode,
          reason: 'allowed Texas render lacks an affiliate CTA',
        });
      }
      if (!shouldHaveCta && ctaCount > 0) {
        failures.push({
          path,
          mode,
          reason: `${
            mode === 'CA'
              ? 'banned California'
              : mode === 'unknown'
                ? 'unknown-region'
                : 'operator-restricted Texas'
          } render exposes an affiliate CTA`,
        });
      }

      if (review) {
        const expectedSummary = reviewOutboundAvailabilityView(
          review[1],
          stateForMode(mode),
        );
        const summary = renderedReviewEligibilitySummary(page.html);
        if (!summary) {
          failures.push({
            path,
            mode,
            reason: 'review lacks its visitor offer eligibility summary',
          });
        } else {
          if (summary.eligible !== expectedSummary.canCta) {
            failures.push({
              path,
              mode,
              reason:
                `review summary eligibility ${String(summary.eligible)} does not match ` +
                `${expectedSummary.canCta}`,
            });
          }
          if (
            summary.kind !== expectedSummary.kind ||
            summary.reason !== expectedSummary.reason ||
            summary.text !== expectedSummary.label
          ) {
            failures.push({
              path,
              mode,
              reason: 'review summary kind, reason, or text does not match the outbound view',
            });
          }
        }
        const block = contextualBlocks(page.html)[0]?.html ?? '';
        const contextLinks = linksIn(block);
        const expectedContext =
          mode === 'unknown'
            ? '/state-legality/'
            : `/states/${mode === 'TX' ? 'texas' : 'california'}/`;
        if (!contextLinks.includes(expectedContext)) {
          failures.push({
            path,
            mode,
            reason: `review contextual block lacks ${expectedContext}`,
          });
        }
        const unexpectedContexts = contextLinks.filter(
          (target) =>
            (target === '/state-legality/' ||
              /^\/states\/[^/]+\/$/.test(target)) &&
            target !== expectedContext,
        );
        if (unexpectedContexts.length > 0) {
          failures.push({
            path,
            mode,
            reason: `review contextual block has unexpected state context ${unexpectedContexts.join(', ')}`,
          });
        }
      }
    }
  }
  return failures;
}

export function geoDependentPaths(
  root = resolve(import.meta.dirname, '../..'),
): string[] {
  const paths = new Set<string>([
    '/',
    '/bonuses/no-deposit/',
  ]);
  const comparisonsDir = resolve(root, 'src/content/comparisons');
  for (const file of readdirSync(comparisonsDir).filter((name) => name.endsWith('.mdx'))) {
    const source = readFileSync(resolve(comparisonsDir, file), 'utf8');
    if (!/^draft:\s*true\s*$/m.test(source)) {
      paths.add(`/best/${file.replace(/\.mdx$/, '')}/`);
    }
  }
  const reviewsDir = resolve(root, 'reviews');
  for (const file of readdirSync(reviewsDir).filter((name) => name.endsWith('.html'))) {
    paths.add(`/reviews/${file.replace(/\.html$/, '')}/`);
  }
  return [...paths].sort();
}

async function fetchPage(
  pageFetcher: PageFetcher,
  path: string,
  mode: GeoMode,
): Promise<RenderedPage> {
  const response = await pageFetcher(path, mode);
  const contentType = response.headers.get('content-type') ?? '';
  const html = contentType.includes('text/html') ? await response.text() : '';
  const locationHeader = response.headers.get('location');
  const location = locationHeader
    ? normalizedPath(locationHeader) ?? locationHeader
    : undefined;
  return {
    path,
    status: response.status,
    html,
    ...(location ? { location } : {}),
  };
}

async function crawl(pageFetcher: PageFetcher): Promise<RenderedPage[]> {
  const queued = new Set<string>(['/']);
  try {
    const sitemap = await pageFetcher('/sitemap.xml', 'unknown');
    if (sitemap.ok) {
      const xml = await sitemap.text();
      for (const path of parseSitemapPaths(xml)) queued.add(path);
    }
  } catch {
    // The root request below will provide the actionable connection failure.
  }

  const pages: RenderedPage[] = [];
  for (const path of queued) {
    if (pages.length >= 500) throw new Error('Rendered crawl exceeded 500 pages.');
    const page = await fetchPage(pageFetcher, path, 'unknown');
    pages.push(page);
    if (page.status !== 200) continue;
    for (const target of linksIn(page.html)) {
      if (/^\/bonuses\/[a-z0-9-]+\/$/.test(target)) continue;
      queued.add(target);
    }
  }
  return pages.sort((left, right) => left.path.localeCompare(right.path));
}

async function crawlGeoModes(
  pageFetcher: PageFetcher,
  paths: readonly string[],
): Promise<GeoRenderedPage[]> {
  const pages: GeoRenderedPage[] = [];
  const modes: GeoMode[] = ['unknown', 'TX', 'CA'];
  for (const path of paths) {
    for (const mode of modes) {
      pages.push({ ...(await fetchPage(pageFetcher, path, mode)), mode });
    }
  }
  return pages;
}

function contentTypeFor(path: string): string {
  if (path.endsWith('.html') || path.endsWith('/')) return 'text/html; charset=utf-8';
  if (path.endsWith('.xml')) return 'application/xml; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.js')) return 'text/javascript; charset=utf-8';
  return 'application/octet-stream';
}

export async function createBuiltPageFetcher(
  root = resolve(import.meta.dirname, '../..'),
): Promise<PageFetcher> {
  const outputRoot = resolve(root, '.vercel/output');
  const staticRoot = resolve(outputRoot, 'static');
  const handlerPath = resolve(
    outputRoot,
    'functions/_render.func/dist/server/entry.mjs',
  );
  if (!existsSync(handlerPath) || !existsSync(staticRoot)) {
    throw new Error('Missing .vercel/output build. Run npm run build first.');
  }

  delete process.env.TRACKER_SUPABASE_URL;
  delete process.env.TRACKER_SUPABASE_ANON_KEY;
  const handler = (await import(`${pathToFileURL(handlerPath).href}?rendered-crawl`))
    .default as { fetch(request: Request): Promise<Response> };

  return async (path, mode) => {
    const pathname = new URL(path, SITE_ORIGIN).pathname;
    const relative = pathname.replace(/^\/+/, '');
    const candidates = pathname === '/'
      ? [resolve(staticRoot, 'index.html')]
      : pathname.endsWith('/')
        ? [resolve(staticRoot, relative, 'index.html')]
        : [
            resolve(staticRoot, relative),
            resolve(staticRoot, relative, 'index.html'),
            resolve(staticRoot, `${relative}.html`),
          ];
    const staticFile = candidates.find((candidate) => existsSync(candidate));
    if (staticFile) {
      return new Response(readFileSync(staticFile), {
        status: 200,
        headers: { 'content-type': contentTypeFor(staticFile) },
      });
    }
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('External network is disabled during the rendered crawl.');
    };
    try {
      return await handler.fetch(
        new Request(new URL(path, SITE_ORIGIN), {
          headers: geoRequestHeaders(mode),
        }),
      );
    } finally {
      globalThis.fetch = realFetch;
    }
  };
}

async function main(): Promise<void> {
  const baseArg = process.argv.find((arg) => arg.startsWith('--base-url='));
  const pageFetcher: PageFetcher = baseArg
    ? async (path, mode) =>
        fetch(new URL(path, baseArg.slice('--base-url='.length)), {
          headers: geoRequestHeaders(mode),
          redirect: 'manual',
        })
    : await createBuiltPageFetcher();
  const pages = await crawl(pageFetcher);
  const graph = validateRenderedLinkGraph(pages);
  const geoPaths = geoDependentPaths();
  const geoPages = await crawlGeoModes(pageFetcher, geoPaths);
  const geoFailures = validateGeoRenderedRoutes(geoPages, geoPaths);
  const result = {
    ...graph,
    geoRouteCount: geoPaths.length,
    geoModePageCount: geoPages.length,
    geoFailures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (
    result.missingTargets.length ||
    result.unintendedRedirects.length ||
    result.duplicateBlockDestinations.length ||
    result.hierarchyFailures.length ||
    result.missingImportantInbound.length ||
    result.geoFailures.length
  ) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
