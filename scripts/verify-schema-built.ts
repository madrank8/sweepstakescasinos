/**
 * Post-build JSON-LD acceptance gate. Every indexable sitemap URL is read from
 * Vercel's static output or rendered through the built server handler.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { READER_REPORT_AGGREGATES } from '../src/data/readerReports.generated';
import { SITE } from '../src/data/site';
import { getOperator, verifiedValue } from '../src/data/operators';
import {
  AUTHOR_ID,
  ORG_ID,
  WEBSITE_ID,
} from '../src/lib/schema';
import { BRAND_AGGREGATE_RATING_MIN_REPORTS } from '../src/lib/brandAggregateRating';
import { itemListParityErrors } from './lib/itemlist-parity';
import { findRenderedEditorScoreContexts } from './lib/rendered-editor-score-detector';

type Node = Record<string, unknown>;
type BuiltHandler = { fetch(request: Request): Promise<Response> };

const ROOT = process.cwd();
const OUTPUT = join(ROOT, '.vercel', 'output');
const STATIC = join(OUTPUT, 'static');
const ENTRY = join(OUTPUT, 'functions', '_render.func', 'dist', 'server', 'entry.mjs');
const JSON_LD_SCRIPT =
  /<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;
const errors: string[] = [];

function fail(url: string, message: string): void {
  errors.push(`${url}: ${message}`);
}

function walk(value: unknown, visit: (node: Node) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const node = value as Node;
  visit(node);
  for (const child of Object.values(node)) walk(child, visit);
}

function walkStrings(value: unknown, visit: (value: string) => void): void {
  if (typeof value === 'string') {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, visit);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const child of Object.values(value as Node)) walkStrings(child, visit);
}

function canonicalFromHtml(html: string): string | undefined {
  return html.match(
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i,
  )?.[1];
}

function verifyTrackingUrls(url: string, graph: unknown): void {
  walkStrings(graph, (value) => {
    if (!/^(?:https?:\/\/|\/)/i.test(value)) return;
    let parsed: URL;
    try {
      parsed = new URL(value, SITE.origin);
    } catch {
      return;
    }
    for (const key of parsed.searchParams.keys()) {
      if (
        /^utm_/i.test(key) ||
        /^(?:gclid|dclid|fbclid|msclkid|clickid|affiliate|affid|referral)$/i.test(key)
      ) {
        fail(url, `tracking query parameter "${key}" appears in JSON-LD URL`);
      }
    }
  });
}

function verifyPage(url: string, html: string): void {
  const blocks = [...html.matchAll(JSON_LD_SCRIPT)];
  if (blocks.length !== 1) {
    fail(url, `expected exactly one JSON-LD block, found ${blocks.length}`);
    return;
  }
  const raw = blocks[0][1];
  if (raw.includes('<') || raw.includes('\u2028') || raw.includes('\u2029')) {
    fail(url, 'JSON-LD contains an HTML-unsafe literal');
  }

  let document: Node;
  try {
    document = JSON.parse(raw) as Node;
  } catch (error) {
    fail(url, `JSON-LD does not parse: ${error instanceof Error ? error.message : error}`);
    return;
  }
  if (!Array.isArray(document['@graph'])) {
    fail(url, 'JSON-LD document must contain one @graph array');
    return;
  }
  const graph = document['@graph'] as Node[];
  for (const error of itemListParityErrors(html, graph)) {
    fail(url, error);
  }
  const canonical = canonicalFromHtml(html);
  if (!canonical) {
    fail(url, 'indexable page has no canonical URL');
    return;
  }

  const defined = new Map<string, number>();
  const referenced = new Set<string>();
  const reviews: Node[] = [];
  const breadcrumbs: Node[] = [];
  const aggregateOwners: Array<{ owner: Node; aggregate: Node }> = [];

  walk(graph, (node) => {
    const id = node['@id'];
    if (typeof id === 'string') {
      if (Object.keys(node).length === 1) referenced.add(id);
      else defined.set(id, (defined.get(id) ?? 0) + 1);
    }
    if (node['@type'] === 'Review') reviews.push(node);
    if (node['@type'] === 'BreadcrumbList') breadcrumbs.push(node);
    if (node.aggregateRating && typeof node.aggregateRating === 'object') {
      aggregateOwners.push({ owner: node, aggregate: node.aggregateRating as Node });
    }
  });

  for (const id of [
    ORG_ID,
    WEBSITE_ID,
    AUTHOR_ID,
    `${canonical}#webpage`,
    `${canonical}#breadcrumb`,
  ]) {
    if (!defined.has(id)) fail(url, `missing foundation entity ${id}`);
  }
  for (const [id, count] of defined) {
    if (count > 1) fail(url, `@id is defined ${count} times: ${id}`);
  }
  for (const id of referenced) {
    if (id.startsWith(SITE.origin) && id.includes('#') && !defined.has(id)) {
      fail(url, `unresolved same-origin @id reference: ${id}`);
    }
  }

  if (breadcrumbs.length !== 1) {
    fail(url, `expected one BreadcrumbList, found ${breadcrumbs.length}`);
  } else {
    const items = breadcrumbs[0].itemListElement;
    if (!Array.isArray(items) || items.length === 0) {
      fail(url, 'BreadcrumbList must contain ListItems');
    } else {
      items.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
          fail(url, `breadcrumb ${index + 1} is not an object`);
          return;
        }
        const crumb = item as Node;
        if (crumb['@type'] !== 'ListItem' || crumb.position !== index + 1 || !crumb.name) {
          fail(url, `breadcrumb ${index + 1} has invalid type, position, or name`);
        }
        if (index === items.length - 1 && 'item' in crumb) {
          fail(url, 'current-page breadcrumb must omit item');
        }
      });
    }
  }

  const reviewSlug = canonical.match(
    /^https:\/\/sweepstakeswiz\.com\/reviews\/([a-z0-9-]+)\/$/,
  )?.[1];
  const operator = reviewSlug ? getOperator(reviewSlug) : undefined;
  const expectedScore = operator
    ? verifiedValue(operator.editorScore100)
    : undefined;
  const renderedScoreContexts = findRenderedEditorScoreContexts(html);
  if (operator && expectedScore === undefined && renderedScoreContexts.length > 0) {
    fail(
      url,
      `unresolved editor score leaked in rendered ${renderedScoreContexts
        .map((context) => context.kind)
        .join(', ')} context(s)`,
    );
  }
  if (operator && expectedScore !== undefined) {
    if (renderedScoreContexts.length === 0) {
      fail(url, `verified editor score ${expectedScore}/100 is not visibly rendered`);
    }
    for (const context of renderedScoreContexts) {
      if (context.scale !== 100 || context.value !== expectedScore) {
        fail(
          url,
          `rendered ${context.kind} score ${context.value}/${context.scale} does not match ${expectedScore}/100`,
        );
      }
    }
  }
  for (const review of reviews) {
    const rating = review.reviewRating as Node | undefined;
    if (expectedScore == null) {
      if (rating) fail(url, 'Review rating exists without a visible editorial /100 score');
    } else if (
      !rating ||
      rating.ratingValue !== expectedScore ||
      rating.bestRating !== 100 ||
      rating.worstRating !== 0
    ) {
      fail(url, `Review rating does not match visible ${expectedScore}/100 score`);
    }
  }

  for (const { owner, aggregate } of aggregateOwners) {
    const match =
      typeof owner['@id'] === 'string'
        ? owner['@id'].match(/^https:\/\/sweepstakeswiz\.com\/reviews\/([a-z0-9-]+)\/#brand$/)
        : null;
    const data = match ? READER_REPORT_AGGREGATES[match[1]] : undefined;
    if (
      !data ||
      data.count < BRAND_AGGREGATE_RATING_MIN_REPORTS ||
      data.avgRating == null
    ) {
      fail(url, 'AggregateRating emitted without 10 approved reader reports');
    } else if (
      aggregate.ratingCount !== data.count ||
      aggregate.ratingValue !== data.avgRating
    ) {
      fail(url, 'AggregateRating does not match approved reader-report aggregate');
    }
  }

  verifyTrackingUrls(url, document);
}

async function main(): Promise<void> {
  assert.ok(existsSync(OUTPUT), 'missing .vercel/output; run npm run build first');
  assert.ok(existsSync(ENTRY), 'missing built Vercel server entrypoint');
  const sitemapPath = join(STATIC, 'sitemap.xml');
  assert.ok(existsSync(sitemapPath), 'missing built sitemap.xml');
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length > 0, 'built sitemap contains no indexable URLs');

  const imported = (await import(`${pathToFileURL(ENTRY).href}?schema-check=${Date.now()}`)) as {
    default: BuiltHandler;
  };
  const initialCwd = process.cwd();
  process.chdir(join(OUTPUT, 'functions', '_render.func'));
  try {
    for (const url of urls) {
      const pathname = new URL(url).pathname;
      const rel = pathname === '/' ? 'index.html' : `${pathname.replace(/^\/|\/$/g, '')}/index.html`;
      const staticPath = join(STATIC, rel);
      let html: string;
      if (existsSync(staticPath)) {
        html = readFileSync(staticPath, 'utf8');
      } else {
        const response = await imported.default.fetch(new Request(url));
        if (!response.ok) {
          fail(url, `built server returned ${response.status}`);
          continue;
        }
        html = await response.text();
      }
      verifyPage(url, html);
    }
  } finally {
    process.chdir(initialCwd);
  }

  if (errors.length > 0) {
    console.error(`\n[verify-schema-built] ${errors.length} error(s):\n`);
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }
  console.log(`[verify-schema-built] OK — ${urls.length} indexable built pages validated.`);
}

main().catch((error) => {
  console.error('[verify-schema-built] fatal:', error);
  process.exit(1);
});
