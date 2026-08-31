import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

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
  return [...html.matchAll(/<a\b[^>]*\bdata-affiliate=["'][^"']+["'][^>]*>/gi)]
    .length;
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
      const ctaCount = affiliateCtaCount(page.html);
      if (mode === 'TX' && ctaCount === 0) {
        failures.push({
          path,
          mode,
          reason: 'allowed Texas render lacks an affiliate CTA',
        });
      }
      if (mode !== 'TX' && ctaCount > 0) {
        failures.push({
          path,
          mode,
          reason: `${mode === 'CA' ? 'banned California' : 'unknown-region'} render exposes an affiliate CTA`,
        });
      }

      if (/^\/reviews\/[^/]+\/$/.test(path)) {
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
    '/tools/sweepstakes-odds-calculator/',
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
    const source = readFileSync(resolve(reviewsDir, file), 'utf8');
    if (/\bhref=["']\/bonuses\/[a-z0-9-]+\/?["']/i.test(source)) {
      paths.add(`/reviews/${file.replace(/\.html$/, '')}/`);
    }
  }
  return [...paths].sort();
}

async function fetchPage(
  base: URL,
  path: string,
  mode: GeoMode,
): Promise<RenderedPage> {
  const response = await fetch(new URL(path, base), {
    headers: geoRequestHeaders(mode),
    redirect: 'manual',
  });
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

async function crawl(baseUrl: string): Promise<RenderedPage[]> {
  const base = new URL(baseUrl);
  const queued = new Set<string>(['/']);
  try {
    const sitemap = await fetch(new URL('/sitemap.xml', base), {
      headers: geoRequestHeaders('unknown'),
    });
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
    const page = await fetchPage(base, path, 'unknown');
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
  baseUrl: string,
  paths: readonly string[],
): Promise<GeoRenderedPage[]> {
  const base = new URL(baseUrl);
  const pages: GeoRenderedPage[] = [];
  const modes: GeoMode[] = ['unknown', 'TX', 'CA'];
  for (const path of paths) {
    for (const mode of modes) {
      pages.push({ ...(await fetchPage(base, path, mode)), mode });
    }
  }
  return pages;
}

async function waitForPreview(
  child: ChildProcess,
  baseUrl: string,
  output: () => string,
): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Preview exited before startup.\n${output()}`);
    }
    try {
      const response = await fetch(baseUrl, {
        headers: geoRequestHeaders('unknown'),
      });
      if (response.status < 500) return;
    } catch {
      // Preview has not opened its localhost socket yet.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(`Preview did not start within 30 seconds.\n${output()}`);
}

async function stopPreview(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise<void>((resolveClose) => child.once('close', () => resolveClose())),
    new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 5_000)),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

async function main(): Promise<void> {
  const baseArg = process.argv.find((arg) => arg.startsWith('--base-url='));
  const shouldStartPreview = process.argv.includes('--start-preview');
  const baseUrl =
    baseArg?.slice('--base-url='.length) ??
    (shouldStartPreview
      ? 'http://127.0.0.1:43219'
      : 'http://127.0.0.1:4321');
  let preview: ChildProcess | undefined;
  let previewOutput = '';
  if (shouldStartPreview) {
    const url = new URL(baseUrl);
    preview = spawn(
      'npm',
      [
        'run',
        'preview',
        '--',
        '--host',
        url.hostname,
        '--port',
        url.port,
      ],
      { cwd: resolve(import.meta.dirname, '../..'), env: process.env },
    );
    preview.stdout?.on('data', (chunk) => {
      previewOutput = `${previewOutput}${String(chunk)}`.slice(-8_000);
    });
    preview.stderr?.on('data', (chunk) => {
      previewOutput = `${previewOutput}${String(chunk)}`.slice(-8_000);
    });
    await waitForPreview(preview, baseUrl, () => previewOutput);
  }

  try {
    const pages = await crawl(baseUrl);
    const graph = validateRenderedLinkGraph(pages);
    const geoPaths = geoDependentPaths();
    const geoPages = await crawlGeoModes(baseUrl, geoPaths);
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
  } finally {
    if (preview) await stopPreview(preview);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
