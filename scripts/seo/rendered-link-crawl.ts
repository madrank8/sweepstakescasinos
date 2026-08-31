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
    const block = page.html.match(
      /<!--sc-contextual-nav-->[\s\S]*?<\/aside>/i,
    )?.[0];
    if (!block) continue;
    const seen = new Set<string>();
    for (const target of linksIn(block)) {
      if (seen.has(target)) {
        duplicateBlockDestinations.push({ source: page.path, target });
      }
      seen.add(target);
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

async function crawl(baseUrl: string): Promise<RenderedPage[]> {
  const base = new URL(baseUrl);
  const queued = new Set<string>(['/']);
  try {
    const sitemap = await fetch(new URL('/sitemap.xml', base));
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
    const response = await fetch(new URL(path, base), { redirect: 'manual' });
    const contentType = response.headers.get('content-type') ?? '';
    const html = contentType.includes('text/html') ? await response.text() : '';
    const locationHeader = response.headers.get('location');
    const location = locationHeader ? normalizedPath(locationHeader) ?? locationHeader : undefined;
    pages.push({
      path,
      status: response.status,
      html,
      ...(location ? { location } : {}),
    });
    if (response.status !== 200) continue;
    for (const target of linksIn(html)) {
      if (/^\/bonuses\/[a-z0-9-]+\/$/.test(target)) continue;
      queued.add(target);
    }
  }
  return pages.sort((left, right) => left.path.localeCompare(right.path));
}

async function main(): Promise<void> {
  const baseArg = process.argv.find((arg) => arg.startsWith('--base-url='));
  const baseUrl = baseArg?.slice('--base-url='.length) ?? 'http://127.0.0.1:4321';
  const pages = await crawl(baseUrl);
  const result = validateRenderedLinkGraph(pages);
  console.log(JSON.stringify(result, null, 2));
  if (
    result.missingTargets.length ||
    result.unintendedRedirects.length ||
    result.duplicateBlockDestinations.length ||
    result.hierarchyFailures.length ||
    result.missingImportantInbound.length
  ) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
