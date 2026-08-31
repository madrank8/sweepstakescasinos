import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { AFFILIATE_PARTNERS } from '../../src/data/affiliates';
import { BRAND_ENTITIES } from '../../src/data/brandEntities';
import { OPERATORS, verifiedValue } from '../../src/data/operators';
import {
  reconcileAvailabilityAuthorities,
  renderAvailabilityConflictReport,
} from '../../src/lib/availability';
import {
  fallbackAvailability,
  fallbackOperators,
  fallbackStates,
} from '../../src/lib/tracker/fallback';
import { visibleEditorialScore } from '../../src/lib/pageChrome';
import { validateAllResults } from '../../src/data/testingResults';
import { findTestingClaims, type UnsupportedTestingClaim } from './claim-policy';

export type ConflictStatus = 'RESOLVED' | 'UNRESOLVED' | 'MANUAL_REVIEW';

export interface SourceValue {
  path: string;
  value: string;
}

export interface OperatorConflict {
  slug: string;
  field: string;
  sources: SourceValue[];
  status: ConflictStatus;
}

export interface ReviewInventory {
  slug: string;
  path: string;
  title: string;
  h1: string;
  description: string;
  canonical: string;
  robots: string;
  visibleScore?: number;
  schemaScore?: number;
  operatorName?: string;
}

export interface HomepageOperator {
  slug: string;
  path: string;
  name: string;
  score?: number;
  offer: string;
}

export interface ComparisonOperator {
  slug: string;
  path: string;
  name: string;
  offer: string;
}

export interface HubOperatorFact {
  slug: string;
  path: string;
  field: string;
  value: string;
}

export interface OperatorAudit {
  reviews: ReviewInventory[];
  homepage: HomepageOperator[];
  comparison: ComparisonOperator[];
  hubs: HubOperatorFact[];
  conflicts: OperatorConflict[];
}

type JsonNode = Record<string, unknown>;

function read(root: string, path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
    nbsp: ' ',
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

function plain(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function attribute(tag: string, name: string): string {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return decodeHtml(match?.[1] ?? match?.[2] ?? '');
}

function meta(html: string, name: string): string {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (
      attribute(tag, 'name').toLowerCase() === name.toLowerCase() ||
      attribute(tag, 'property').toLowerCase() === name.toLowerCase()
    ) {
      return attribute(tag, 'content');
    }
  }
  return '';
}

function canonical(html: string): string {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attribute(match[0], 'rel').toLowerCase() === 'canonical') {
      return attribute(match[0], 'href');
    }
  }
  return '';
}

function jsonLdNodes(html: string): JsonNode[] {
  const nodes: JsonNode[] = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(match[1]) as JsonNode;
      if (Array.isArray(parsed['@graph'])) {
        for (const node of parsed['@graph']) {
          if (node && typeof node === 'object') nodes.push(node as JsonNode);
        }
      } else {
        nodes.push(parsed);
      }
    } catch {
      // Parse failures are reported by the existing schema verifier. The audit
      // records absent values rather than inventing data from malformed JSON.
    }
  }
  return nodes;
}

function allFiles(root: string, start: string, extensions: Set<string>): string[] {
  const out: string[] = [];
  const absoluteStart = join(root, start);
  if (!existsSync(absoluteStart)) return out;
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir).sort()) {
      const absolute = join(dir, entry);
      const stats = statSync(absolute);
      if (stats.isDirectory()) walk(absolute);
      else if (extensions.has(extname(entry))) {
        out.push(relative(root, absolute).replaceAll('\\', '/'));
      }
    }
  };
  walk(absoluteStart);
  return out;
}

function reviewInventory(root: string): ReviewInventory[] {
  return readdirSync(join(root, 'reviews'))
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => {
      const path = `reviews/${file}`;
      const html = read(root, path);
      const nodes = jsonLdNodes(html);
      const review = nodes.find((node) => node['@type'] === 'Review');
      const rating = review?.reviewRating as JsonNode | undefined;
      const itemRef = review?.itemReviewed as JsonNode | undefined;
      const brandId = typeof itemRef?.['@id'] === 'string' ? itemRef['@id'] : '';
      const brand = nodes.find((node) => node['@id'] === brandId);
      const parent = brand?.parentOrganization as JsonNode | undefined;
      const title = plain(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
      const h1 = plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
      const score = visibleEditorialScore(html);
      return {
        slug: file.replace(/\.html$/, ''),
        path,
        title,
        h1,
        description: meta(html, 'description'),
        canonical: canonical(html),
        robots: meta(html, 'robots'),
        ...(score == null ? {} : { visibleScore: score }),
        ...(typeof rating?.ratingValue === 'string' || typeof rating?.ratingValue === 'number'
          ? { schemaScore: Number(rating.ratingValue) }
          : {}),
        ...(typeof parent?.name === 'string' ? { operatorName: parent.name } : {}),
      };
    });
}

function homepageInventory(root: string): HomepageOperator[] {
  const html = read(root, 'index.html');
  const cards: HomepageOperator[] = [];
  for (const match of html.matchAll(
    /<article\b[^>]*class=["'][^"']*\bcard\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi,
  )) {
    const body = match[1];
    const slug = body.match(/href=["']\/reviews\/([a-z0-9-]+)\/["']/i)?.[1];
    if (!slug) continue;
    const scoreRaw = body.match(
      /class=["'][^"']*\bcard-score\b[^"']*["'][^>]*>\s*(\d+(?:\.\d+)?)\s*\/\s*5/i,
    )?.[1];
    cards.push({
      slug,
      path: 'index.html',
      name: plain(
        body.match(/class=["'][^"']*\bcard-cname\b[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1] ??
          slug,
      ),
      ...(scoreRaw ? { score: Number(scoreRaw) } : {}),
      offer: plain(
        body.match(/class=["'][^"']*\bcard-offer\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i)?.[1] ??
          '',
      ),
    });
  }
  return cards;
}

function slugForName(name: string, homepage: HomepageOperator[]): string | undefined {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return homepage.find(
    (card) =>
      card.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized ||
      card.slug.replaceAll('-', '') === normalized.replace(/casino|coins/g, ''),
  )?.slug;
}

function comparisonInventory(root: string, homepage: HomepageOperator[]): ComparisonOperator[] {
  const path = 'src/content/comparisons/sweepstakes-casinos.mdx';
  const mdx = read(root, path);
  const rows: ComparisonOperator[] = [];
  for (const line of mdx.split('\n')) {
    const match = line.match(
      /^\|\s*\d+\s*\|\s*\*\*([^*]+)\*\*\s*\|[^|]*\|([^|]+)\|[^|]*\|\s*\[[^\]]+\]\(\/reviews\/([a-z0-9-]+)\/\)\s*\|$/,
    );
    if (!match) continue;
    rows.push({
      slug: match[3] || slugForName(match[1], homepage) || '',
      path,
      name: match[1].trim(),
      offer: plain(match[2]),
    });
  }
  return rows.sort((a, b) => a.slug.localeCompare(b.slug));
}

function hubInventory(root: string): HubOperatorFact[] {
  const facts: HubOperatorFact[] = [];
  const newPath = 'src/routes/new/index.astro';
  const newSource = read(root, newPath);
  for (const match of newSource.matchAll(
    /\{\s*slug:\s*'([^']+)',[\s\S]*?note:\s*'([^']+)',\s*\}/g,
  )) {
    facts.push({
      slug: match[1],
      path: newPath,
      field: 'curated hub note',
      value: match[2],
    });
  }

  const bonusPath = 'src/routes/bonuses/no-deposit/index.astro';
  const bonusSource = read(root, bonusPath);
  for (const match of bonusSource.matchAll(/canonicalOffer\('([^']+)',\s*'[^']+'\)/g)) {
    const operator = OPERATORS.find((candidate) => candidate.slug === match[1]);
    if (!operator) continue;
    const signup =
      verifiedValue(operator.signupOffer) ??
      (operator.signupOffer.status === 'unresolved'
        ? operator.signupOffer.sources.find((source) => source.provenance.source === bonusPath)?.value
        : undefined);
    const gift = verifiedValue(operator.giftCardRedemptionMinimum);
    const cash = verifiedValue(operator.cashRedemptionMinimum);
    const minimum = [
      ...(gift ? [`${gift.amount} ${gift.currency} (gift cards)`] : []),
      ...(cash ? [`${cash.amount} ${cash.currency} (cash)`] : []),
    ].join('; ');
    if (signup) {
      facts.push({
        slug: match[1],
        path: bonusPath,
        field: 'welcome offer',
        value: signup,
      });
    }
    if (minimum) {
      facts.push({
        slug: match[1],
        path: bonusPath,
        field: 'minimum redemption',
        value: minimum,
      });
    }
  }

  const statePath = 'src/routes/state-legality/index.astro';
  for (const partner of AFFILIATE_PARTNERS) {
    facts.push({
      slug: partner.slug,
      path: statePath,
      field: 'operator availability authority',
      value: 'AFFILIATE_PARTNERS + tracker status + site CTA policy',
    });
  }
  return facts.sort(
    (a, b) =>
      a.path.localeCompare(b.path) ||
      a.slug.localeCompare(b.slug) ||
      a.field.localeCompare(b.field),
  );
}

function distinctSources(sources: SourceValue[]): SourceValue[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.path}\0${source.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function inventoryOperatorFacts(root = process.cwd()): OperatorAudit {
  const reviews = reviewInventory(root);
  const homepage = homepageInventory(root);
  const comparison = comparisonInventory(root, homepage);
  const hubs = hubInventory(root);
  const conflicts: OperatorConflict[] = [];

  for (const review of reviews) {
    const home = homepage.find((card) => card.slug === review.slug);
    const scoreSources = distinctSources([
      ...(home?.score == null ? [] : [{ path: 'index.html', value: `${home.score}/5` }]),
      ...(review.visibleScore == null
        ? []
        : [{ path: review.path, value: `${review.visibleScore}/100 (${review.visibleScore / 20}/5)` }]),
      ...(review.schemaScore == null
        ? []
        : [{ path: `${review.path} JSON-LD Review.reviewRating`, value: `${review.schemaScore}/5` }]),
    ]);
    const normalizedScores = new Set(
      scoreSources.map((source) => {
        const match = source.value.match(/(?:\(([\d.]+)\/5\)|^([\d.]+)\/5)/);
        return Number(match?.[1] ?? match?.[2]).toFixed(3);
      }),
    );
    if (normalizedScores.size > 1) {
      conflicts.push({
        slug: review.slug,
        field: 'editorial score',
        sources: scoreSources,
        status: 'UNRESOLVED',
      });
    }

    const canonicalBrand = BRAND_ENTITIES[review.slug];
    if (canonicalBrand?.operatorName && review.operatorName) {
      const operatorSources = distinctSources([
        { path: review.path, value: review.operatorName },
        {
          path: `src/data/brandEntities.ts#${review.slug}.operatorName`,
          value: canonicalBrand.operatorName,
        },
      ]);
      if (new Set(operatorSources.map((source) => source.value.toLowerCase())).size > 1) {
        conflicts.push({
          slug: review.slug,
          field: 'operator identity',
          sources: operatorSources,
          status: 'MANUAL_REVIEW',
        });
      }
    }

    const compared = comparison.find((entry) => entry.slug === review.slug);
    const hubOffer = hubs.find(
      (entry) => entry.slug === review.slug && entry.field === 'welcome offer',
    );
    if (home?.offer && (compared?.offer || hubOffer?.value)) {
      const offerSources = distinctSources([
        { path: 'index.html', value: home.offer },
        ...(compared ? [{ path: compared.path, value: compared.offer }] : []),
        ...(hubOffer ? [{ path: hubOffer.path, value: hubOffer.value }] : []),
      ]);
      const normalize = (value: string) =>
        value.toLowerCase().replace(/\b(?:free|welcome|no code|sign-up)\b/g, '').replace(/\W/g, '');
      if (new Set(offerSources.map((source) => normalize(source.value))).size > 1) {
        conflicts.push({
          slug: review.slug,
          field: 'welcome offer',
          sources: offerSources,
          status: 'UNRESOLVED',
        });
      }
    }
  }

  conflicts.sort(
    (a, b) => a.slug.localeCompare(b.slug) || a.field.localeCompare(b.field),
  );
  return { reviews, homepage, comparison, hubs, conflicts };
}

export function documentedTestingSlugs(root: string): Set<string> {
  try {
    const { rows, issues } = validateAllResults(root);
    const errors = new Set(
      issues.filter((issue) => issue.level === 'error').map((issue) => issue.slug),
    );
    return new Set(
      rows
        .filter((row) => row.could_test === 'Y' && !errors.has(row.brand_slug))
        .map((row) => row.brand_slug),
    );
  } catch {
    return new Set();
  }
}

function claimSourcePaths(root: string): string[] {
  const paths = [
    'index.html',
    'about.html',
    'how-we-rate.html',
    'editorial-policy.html',
    'responsible-gaming.html',
    ...allFiles(root, 'reviews', new Set(['.html'])),
    ...allFiles(root, 'author', new Set(['.html'])),
    ...allFiles(root, 'src/content', new Set(['.mdx'])),
    ...allFiles(root, 'src/routes', new Set(['.astro'])),
  ];
  return [...new Set(paths)].filter((path) => existsSync(join(root, path))).sort();
}

export interface TestingClaimOccurrence extends UnsupportedTestingClaim {}

export function scanTestingClaims(root = process.cwd()): TestingClaimOccurrence[] {
  const documented = documentedTestingSlugs(root);
  const claims = claimSourcePaths(root).flatMap((path) => {
    const slug = path.match(/^reviews\/([a-z0-9-]+)\.html$/)?.[1];
    return findTestingClaims(read(root, path), path, Boolean(slug && documented.has(slug)));
  });
  return claims.sort(
    (a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.column - b.column,
  );
}

export interface AuthoredRoute {
  url: string;
  source: string;
  canonical: string;
  robots: string;
  sitemap: boolean;
}

export interface InternalLink {
  path: string;
  line: number;
  target: string;
  normalizedTarget: string;
  missing: boolean;
}

export interface RouteAudit {
  routes: AuthoredRoute[];
  links: InternalLink[];
  missingTargets: InternalLink[];
  orphanCandidates: AuthoredRoute[];
  prototypeNoindex: boolean;
}

function htmlUrl(path: string): string {
  if (path === 'index.html') return '/';
  return `/${path.replace(/\.html$/, '')}/`.replace(/\/+/g, '/');
}

function staticAstroUrl(path: string): string | null {
  const rel = path.replace(/^src\/routes\//, '').replace(/\.astro$/, '');
  if (rel.includes('[')) return null;
  return `/${rel.replace(/\/index$/, '').replace(/\/?$/, '/')}`.replace(/\/+/g, '/');
}

function sourceRouteInventory(root: string): AuthoredRoute[] {
  const sitemap = new Set(
    [...read(root, 'sitemap.xml').matchAll(/<loc>https:\/\/sweepstakeswiz\.com([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    ),
  );
  const routes: AuthoredRoute[] = [];
  const htmlPaths = [
    ...readdirSync(root)
      .filter((file) => file.endsWith('.html'))
      .sort(),
    ...['reviews', 'legal', 'author', 'bonuses', 'prototypes'].flatMap((dir) =>
      allFiles(root, dir, new Set(['.html'])),
    ),
  ];
  for (const path of [...new Set(htmlPaths)].sort()) {
    const html = read(root, path);
    const url = htmlUrl(path);
    routes.push({
      url,
      source: path,
      canonical: canonical(html),
      robots: meta(html, 'robots') || 'unspecified',
      sitemap: sitemap.has(url),
    });
  }
  for (const path of allFiles(root, 'src/routes', new Set(['.astro']))) {
    const url = staticAstroUrl(path);
    if (!url) continue;
    const source = read(root, path);
    const canonicalPath = source.match(/canonicalPath\s*=\s*["']([^"']+)["']/)?.[1];
    const robots = source.match(/robots\s*=\s*["']([^"']+)["']/)?.[1] ?? 'layout default: index, follow';
    routes.push({
      url,
      source: path,
      canonical: canonicalPath ? `https://sweepstakeswiz.com${canonicalPath}` : 'computed by route/layout',
      robots,
      sitemap: sitemap.has(url),
    });
  }
  const contentRoutes: Array<[string, string, string]> = [
    ['src/content/guides', '/guides/', '.mdx'],
    ['src/content/comparisons', '/best/', '.mdx'],
    ['src/content/news', '/news/', '.mdx'],
  ];
  for (const [dir, prefix, extension] of contentRoutes) {
    for (const path of allFiles(root, dir, new Set([extension]))) {
      const body = read(root, path);
      if (/\bdraft:\s*true\b/.test(body.slice(0, 1000))) continue;
      const slug = path.split('/').pop()!.replace(/\.mdx$/, '');
      const url = `${prefix}${slug}/`;
      routes.push({
        url,
        source: path,
        canonical: `https://sweepstakeswiz.com${url}`,
        robots: 'layout default: index, follow',
        sitemap: sitemap.has(url),
      });
    }
  }
  return routes.sort((a, b) => a.url.localeCompare(b.url) || a.source.localeCompare(b.source));
}

function normalizeInternalTarget(target: string): string | null {
  if (/^(?:mailto:|tel:|javascript:|data:|#)/i.test(target)) return null;
  let url: URL;
  try {
    url = new URL(target, 'https://sweepstakeswiz.com/');
  } catch {
    return null;
  }
  if (url.origin !== 'https://sweepstakeswiz.com') return null;
  const path = url.pathname;
  if (
    ['/_external/', '/sweepstakeslogo/', '/partials/', '/images/', '/testing/'].some(
      (prefix) => path.startsWith(prefix),
    )
  ) {
    return null;
  }
  if (
    /\.(?:css|js|mjs|png|jpe?g|webp|svg|ico|xml|txt|json|csv|pdf|woff2?)$/i.test(path)
  ) {
    return null;
  }
  if (path === '/') return '/';
  return `${path.replace(/\/+$/, '')}/`;
}

function isKnownDynamicTarget(target: string): boolean {
  return (
    /^\/states\/[a-z0-9-]+\/$/.test(target) ||
    /^\/bonuses\/[a-z0-9-]+\/$/.test(target) ||
    /^\/sweepstakes-tracker\/api\/states\/[a-z]{2}\.json\/?$/.test(target)
  );
}

export function auditAuthoredRoutes(root = process.cwd()): RouteAudit {
  const routes = sourceRouteInventory(root);
  const routeUrls = new Set(routes.map((route) => route.url));
  const links: InternalLink[] = [];
  const files = [
    ...claimSourcePaths(root),
    ...allFiles(root, 'legal', new Set(['.html'])),
    ...allFiles(root, 'bonuses', new Set(['.html'])),
    'contact.html',
    'sitemap.html',
  ]
    .filter((path) => existsSync(join(root, path)))
    .filter((path, index, all) => all.indexOf(path) === index)
    .sort();
  for (const path of files) {
    const source = read(root, path);
    const lines = source.split('\n');
    lines.forEach((line, index) => {
      for (const match of line.matchAll(/\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/gi)) {
        const target = match[1] ?? match[2] ?? match[3] ?? '';
        if (target.includes('${')) continue;
        const normalizedTarget = normalizeInternalTarget(target);
        if (!normalizedTarget) continue;
        const missing = !routeUrls.has(normalizedTarget) && !isKnownDynamicTarget(normalizedTarget);
        links.push({ path, line: index + 1, target, normalizedTarget, missing });
      }
      for (const match of line.matchAll(/\[[^\]]+\]\((\/[^)\s]+)\)/g)) {
        const target = match[1];
        const normalizedTarget = normalizeInternalTarget(target);
        if (!normalizedTarget) continue;
        const missing = !routeUrls.has(normalizedTarget) && !isKnownDynamicTarget(normalizedTarget);
        links.push({ path, line: index + 1, target, normalizedTarget, missing });
      }
    });
  }
  links.sort(
    (a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.target.localeCompare(b.target),
  );
  const inbound = new Set(links.filter((link) => !link.missing).map((link) => link.normalizedTarget));
  const orphanCandidates = routes.filter(
    (route) =>
      route.url !== '/' &&
      !inbound.has(route.url) &&
      !route.url.startsWith('/bonuses/') &&
      !route.url.startsWith('/prototypes/'),
  );
  const prototypePath = join(root, 'prototypes/mcluck-firsthand-review-preview.html');
  const prototypeNoindex =
    existsSync(prototypePath) &&
    /\bnoindex\b/i.test(meta(readFileSync(prototypePath, 'utf8'), 'robots'));
  return {
    routes,
    links,
    missingTargets: links.filter((link) => link.missing),
    orphanCandidates,
    prototypeNoindex,
  };
}

export interface ReviewSchemaParity {
  slug: string;
  path: string;
  visibleScore?: number;
  sourceSchemaScore?: number;
  expectedSchemaScore?: number;
  parity: 'MATCH' | 'MISMATCH' | 'NO_VISIBLE_SCORE';
  usesExistingVisibleScoreHelper: true;
}

export interface SchemaAudit {
  reviews: ReviewSchemaParity[];
  mismatches: ReviewSchemaParity[];
}

export function auditSchemaParity(root = process.cwd()): SchemaAudit {
  const reviews = reviewInventory(root).map((review): ReviewSchemaParity => {
    const expectedSchemaScore =
      review.visibleScore == null ? undefined : review.visibleScore / 20;
    const parity =
      expectedSchemaScore == null
        ? 'NO_VISIBLE_SCORE'
        : review.schemaScore != null && Math.abs(review.schemaScore - expectedSchemaScore) < 0.001
          ? 'MATCH'
          : 'MISMATCH';
    return {
      slug: review.slug,
      path: review.path,
      ...(review.visibleScore == null ? {} : { visibleScore: review.visibleScore }),
      ...(review.schemaScore == null ? {} : { sourceSchemaScore: review.schemaScore }),
      ...(expectedSchemaScore == null ? {} : { expectedSchemaScore }),
      parity,
      usesExistingVisibleScoreHelper: true,
    };
  });
  return { reviews, mismatches: reviews.filter((review) => review.parity === 'MISMATCH') };
}

function md(value: unknown): string {
  return String(value ?? '—').replaceAll('|', '\\|').replace(/\s+/g, ' ').trim() || '—';
}

function reportHeader(title: string): string {
  return `# ${title}\n\nSource snapshot: repository authored sources. Generated deterministically without a runtime date.\n\n`;
}

function operatorReport(audit: OperatorAudit): string {
  const lines = [
    reportHeader('Operator Data Conflicts'),
    `Coverage: **${audit.reviews.length} authored reviews**, **${audit.homepage.length} homepage cards**, **${audit.comparison.length} comparison rows**, and **${audit.hubs.length} relevant hub facts**.\n\n`,
    'No conflict below is resolved by this audit. Values remain exactly as authored pending source review.\n\n',
    '`src/data/operators.ts` records these conflicts as `unresolved`; canonical selectors and Review schema omit them. Verified canonical values retain field-level provenance, while affiliate restrictions and schema identity remain in their separate data modules.\n\n',
    '| Operator | Field | Exact source values | Status |\n',
    '|---|---|---|---|\n',
    ...audit.conflicts.map(
      (conflict) =>
        `| ${md(conflict.slug)} | ${md(conflict.field)} | ${conflict.sources
          .map((source) => `\`${md(source.path)}\` = \`${md(source.value)}\``)
          .join('<br>')} | ${conflict.status} |\n`,
    ),
    '\n## Review inventory\n\n',
    audit.reviews.map((review) => `- \`${review.path}\` — ${md(review.title)}\n`).join(''),
    '\n## Homepage inventory\n\n',
    audit.homepage
      .map(
        (card) =>
          `- \`${card.slug}\` — \`${md(card.score == null ? 'no parsed score' : `${card.score}/5`)}\`; offer \`${md(card.offer)}\`\n`,
      )
      .join(''),
    '\n## Relevant hub inventory\n\n',
    audit.hubs
      .map(
        (fact) =>
          `- \`${fact.path}\` — \`${fact.slug}\` ${fact.field}: \`${md(fact.value)}\`\n`,
      )
      .join(''),
  ];
  return lines.join('');
}

function testingClaimsReport(claims: TestingClaimOccurrence[]): string {
  const counts = new Map<string, number>();
  for (const claim of claims) counts.set(claim.classification, (counts.get(claim.classification) ?? 0) + 1);
  return [
    reportHeader('Testing Claims Audit'),
    `Evidence authority: \`evidence/testing-results.csv\` has **0 data rows** and \`src/data/readerReports.generated.ts\` has **0 aggregates**.\n\n`,
    `Matched occurrences: **${claims.length}**. ` +
      ['DOCUMENTED_FIRST_HAND', 'THIRD_PARTY_OR_READER_DATA', 'UNSUPPORTED', 'AMBIGUOUS']
        .map((key) => `${key}: **${counts.get(key) ?? 0}**`)
        .join('; ') +
      '.\n\n',
    '| Source | Phrase | Surface | Classification | Evidence basis | Context |\n',
    '|---|---|---|---|---|---|\n',
    ...claims.map(
      (claim) =>
        `| \`${claim.path}:${claim.line}:${claim.column}\` | \`${md(claim.phrase)}\` | ${claim.surface} | ${claim.classification} | ${md(claim.evidenceBasis)} | ${md(claim.context)} |\n`,
    ),
  ].join('');
}

function schemaReport(audit: SchemaAudit): string {
  const canonicalScores = new Map(
    OPERATORS.map((operator) => [operator.slug, operator.editorScore100]),
  );
  const verifiedCount = [...canonicalScores.values()].filter(
    (fact) => fact.status === 'verified',
  ).length;
  return [
    reportHeader('Visible and Schema Parity Audit'),
    'Visible legacy scores are parsed with `visibleEditorialScore()` from `src/lib/pageChrome.ts`; schema ratings now use only verified `editorScore100` values from `src/data/operators.ts`.\n\n',
    `Coverage: **${audit.reviews.length} reviews**; source mismatches: **${audit.mismatches.length}**. Build-time consolidation emits **${verifiedCount}** verified canonical Review ratings and omits ratings for unresolved records; it never converts a five-star value.\n\n`,
    '| Review | Visible score | Source JSON-LD score | Expected `/5` equivalent | Source parity |\n',
    '|---|---:|---:|---:|---|\n',
    ...audit.reviews.map(
      (review) =>
        `| \`${review.path}\` | ${md(review.visibleScore == null ? 'not detected' : `${review.visibleScore}/100`)} | ${md(review.sourceSchemaScore == null ? 'absent' : `${review.sourceSchemaScore}/5`)} | ${md(review.expectedSchemaScore == null ? 'n/a' : `${review.expectedSchemaScore}/5`)} | ${review.parity} |\n`,
    ),
  ].join('');
}

function technicalReport(
  routes: RouteAudit,
  claims: TestingClaimOccurrence[],
): string {
  const unsupported = claims.filter((claim) => claim.classification === 'UNSUPPORTED');
  const legalPolicy = routes.routes
    .filter((route) => route.source.startsWith('legal/'))
    .map(
      (route) =>
        `- \`${route.source}\`: robots \`${route.robots}\`; sitemap ${route.sitemap ? 'included' : 'excluded'}; canonical \`${route.canonical || 'absent'}\`.\n`,
    )
    .join('');
  return [
    reportHeader('Technical SEO Audit'),
    '## CRITICAL\n\n',
    unsupported.length
      ? `- ${unsupported.length} unsupported matched testing claim(s) remain. See \`testing-claims-audit.md\`.\n`
      : '- No unsupported matched testing claims remain on audited publishable sources.\n',
    routes.prototypeNoindex
      ? '- `prototypes/mcluck-firsthand-review-preview.html` explicitly emits `noindex, nofollow`.\n'
      : '- Prototype noindex protection is missing.\n',
    '\n## HIGH IMPACT\n\n',
    `- Internal-link inventory found **${routes.missingTargets.length}** links whose targets are not represented by an authored exact or known dynamic route. These are documented, not redirected.\n`,
    '- `src/lib/htmlStamp.ts` replaces `__UPDATED_DATE__` with the build month and year. This is build freshness, not a substantive source date; retain for Phase 2/3 review rather than replacing it with another synthetic date.\n',
    '- Legal-page sitemap/noindex policy is internally mixed and requires a policy decision; no legal page was reindexed or removed here:\n',
    legalPolicy,
    '- Clean authored URL/canonical strategy remains unresolved: root `.html` sources are rendered at trailing-slash routes while canonical tags use the clean routes. No redirects or URL paths changed.\n',
    '\n## OPPORTUNISTIC\n\n',
    `- **${routes.orphanCandidates.length}** authored routes have no detected inbound source link and are candidates for manual review; dynamic and bonus endpoints are excluded from this count.\n`,
    '- Homepage and `/best/sweepstakes-casinos/` target overlapping “best sweepstakes casinos” intent; see `cannibalisation-review.md` before changing either URL or canonical.\n',
    '\n## NOISE\n\n',
    '- `src/pages/` is generated and excluded from source findings. Generated wrappers are not duplicate authored pages.\n',
    '- Bonus source HTML is intentionally replaced by the SSR geo-aware gateway; its source-file presence alone is not treated as an indexation defect.\n',
  ].join('');
}

function cannibalisationReport(root: string): string {
  const home = read(root, 'index.html');
  const comparison = read(root, 'src/content/comparisons/sweepstakes-casinos.mdx');
  const homeTitle = plain(home.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const comparisonTitle = comparison.match(/^title:\s*"([^"]+)"/m)?.[1] ?? '';
  return [
    reportHeader('Cannibalisation Review'),
    '| Surfaces | Exact title values | Intent overlap | Status |\n',
    '|---|---|---|---|\n',
    `| \`index.html\` and \`src/content/comparisons/sweepstakes-casinos.mdx\` | \`index.html\` = \`${md(homeTitle)}\`<br>\`src/content/comparisons/sweepstakes-casinos.mdx\` = \`${md(comparisonTitle)}\` | Both explicitly target “Best Sweepstakes Casinos”; homepage is the current primary entry point and the comparison contains deeper top-10 coverage. | MANUAL_REVIEW |\n`,
    '\nNo canonical, redirect, or URL consolidation is selected by this audit.\n',
  ].join('');
}

function commercialHubReport(audit: OperatorAudit): string {
  return [
    reportHeader('Commercial Hub Plan'),
    '## Current factual shape\n\n',
    `- Homepage: ${audit.homepage.length} operator cards at \`/\` from \`index.html\`.\n`,
    `- Comparison: ${audit.comparison.length} operator rows at \`/best/sweepstakes-casinos/\` from \`src/content/comparisons/sweepstakes-casinos.mdx\`.\n`,
    `- Relevant authored hubs: ${audit.hubs.length} operator facts across the new-casino, no-deposit, and state-legality routes.\n`,
    `- Affiliate authority: ${AFFILIATE_PARTNERS.length} partners in \`src/data/affiliates.ts\`; tracking and economics stay outside editorial facts.\n`,
    '- Geo authority: `src/data/geo.ts` remains the site-level CTA suppression layer.\n\n',
    '## Phase 2/3 plan\n\n',
    '1. Keep `/` as the primary “Best Sweepstakes Casinos” entry point unless a human URL/canonical decision changes that strategy.\n',
    '2. Treat `/best/sweepstakes-casinos/` as deeper comparison coverage; remove field drift through the future canonical editorial operator model, not by copying affiliate data into content.\n',
    '3. Preserve affiliate tracking, per-partner availability, and site-level suppression as separate authorities.\n',
    '4. Resolve each `UNRESOLVED` or `MANUAL_REVIEW` row in `operator-data-conflicts.md` only against cited source evidence.\n\n',
    'No ranking, offer, legal status, redirect, or canonical winner is asserted here.\n',
  ].join('');
}

function internalLinkReport(routes: RouteAudit): string {
  return [
    reportHeader('Internal Link Map'),
    `Inventory: **${routes.routes.length} authored routes**, **${routes.links.length} internal link occurrences**, **${routes.missingTargets.length} missing-target occurrences**, and **${routes.orphanCandidates.length} orphan candidates**.\n\n`,
    '## Missing targets\n\n',
    routes.missingTargets.length
      ? '| Source | Target | Normalized target |\n|---|---|---|\n' +
          routes.missingTargets
            .map(
              (link) =>
                `| \`${link.path}:${link.line}\` | \`${md(link.target)}\` | \`${md(link.normalizedTarget)}\` |\n`,
            )
            .join('')
      : 'None detected.\n',
    '\n## Orphan candidates\n\n',
    routes.orphanCandidates.length
      ? routes.orphanCandidates
          .map((route) => `- \`${route.url}\` from \`${route.source}\`\n`)
          .join('')
      : 'None detected.\n',
    '\n## Route signals\n\n',
    '| URL | Authored source | Robots | Canonical | Sitemap |\n',
    '|---|---|---|---|---|\n',
    ...routes.routes.map(
      (route) =>
        `| \`${route.url}\` | \`${route.source}\` | \`${md(route.robots)}\` | \`${md(route.canonical || 'absent')}\` | ${route.sitemap ? 'yes' : 'no'} |\n`,
    ),
  ].join('');
}

export function renderAuditReports(root = process.cwd()): Map<string, string> {
  const operators = inventoryOperatorFacts(root);
  const claims = scanTestingClaims(root);
  const routes = auditAuthoredRoutes(root);
  const schema = auditSchemaParity(root);
  const availability = reconcileAvailabilityAuthorities({
    states: fallbackStates,
    partners: AFFILIATE_PARTNERS,
    trackerOperators: fallbackOperators,
    trackerAvailability: fallbackAvailability,
  });
  return new Map([
    ['operator-data-conflicts.md', operatorReport(operators)],
    ['testing-claims-audit.md', testingClaimsReport(claims)],
    ['state-legality-conflicts.md', renderAvailabilityConflictReport(availability)],
    ['schema-audit.md', schemaReport(schema)],
    ['technical-audit.md', technicalReport(routes, claims)],
    ['cannibalisation-review.md', cannibalisationReport(root)],
    ['commercial-hub-plan.md', commercialHubReport(operators)],
    ['internal-link-map.md', internalLinkReport(routes)],
  ]);
}

export function auditSummary(root = process.cwd()) {
  const operators = inventoryOperatorFacts(root);
  const claims = scanTestingClaims(root);
  const routes = auditAuthoredRoutes(root);
  const schema = auditSchemaParity(root);
  const availability = reconcileAvailabilityAuthorities({
    states: fallbackStates,
    partners: AFFILIATE_PARTNERS,
    trackerOperators: fallbackOperators,
    trackerAvailability: fallbackAvailability,
  });
  return {
    reviewCount: operators.reviews.length,
    homepageOperatorCount: operators.homepage.length,
    comparisonOperatorCount: operators.comparison.length,
    hubOperatorFactCount: operators.hubs.length,
    operatorConflictCount: operators.conflicts.length,
    testingClaimCount: claims.length,
    testingClaimClassifications: Object.fromEntries(
      ['DOCUMENTED_FIRST_HAND', 'THIRD_PARTY_OR_READER_DATA', 'UNSUPPORTED', 'AMBIGUOUS'].map(
        (classification) => [
          classification,
          claims.filter((claim) => claim.classification === classification).length,
        ],
      ),
    ),
    authoredRouteCount: routes.routes.length,
    internalLinkCount: routes.links.length,
    missingTargetCount: routes.missingTargets.length,
    orphanCandidateCount: routes.orphanCandidates.length,
    prototypeNoindex: routes.prototypeNoindex,
    schemaReviewCount: schema.reviews.length,
    schemaMismatchCount: schema.mismatches.length,
    stateCount: availability.jurisdictionCount,
    affiliateCount: availability.partnerCount,
    stateAuthorityConflictCount: availability.warnings.filter((warning) =>
      ['tracker-policy-difference', 'impossible-commercial-intersection'].includes(
        warning.kind,
      ),
    ).length,
  };
}
