/**
 * Build gate for JSON-LD across the static HTML surfaces (reviews, homepage,
 * author, trust pages). Fails the build on (docs/schema-markup-plan.md §5):
 *
 *   - JSON-LD that does not parse
 *   - deprecated / banned types (SearchAction, ClaimReview, QAPage, ...)
 *   - missing required properties per type
 *   - internal @id references that do not resolve on-page (site-wide nodes
 *     injected by pageChrome at build are treated as always present)
 *   - AggregateRating on a brand without >=10 approved reader reports
 *   - non-ISO-8601 dates
 *
 * Astro-route schema (guides, states, best) is validated at build time by
 * src/lib/schema.ts buildPageGraph(); this script covers the raw HTML files.
 *
 * Run: npm run schema:verify
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { READER_REPORT_AGGREGATES } from '../src/data/readerReports.generated';
import { SITE } from '../src/data/site';

const ROOT = process.cwd();
const ORIGIN = SITE.origin;

/** @ids injected site-wide by pageChrome.decorateChrome at build time. */
const INJECTED_IDS = new Set([
  `${ORIGIN}/#organization`,
  `${ORIGIN}/#website`,
  `${ORIGIN}/#logo`,
  `${ORIGIN}/author/${SITE.authorSlug}/#person`,
]);

const BANNED_TYPES = new Set([
  'SearchAction',
  'ClaimReview',
  'QAPage',
  'SpecialAnnouncement',
  'Course',
  'EmployerAggregateRating',
  'LearningResource',
  'Vehicle',
]);

const AGGREGATE_MIN = 10;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/;
const DATE_PROPS = new Set(['datePublished', 'dateModified', 'dateCreated', 'uploadDate']);

const errors: string[] = [];
const fail = (file: string, msg: string) => errors.push(`${file}: ${msg}`);

type Node = Record<string, unknown>;

function walkNodes(value: unknown, visit: (node: Node) => void): void {
  if (Array.isArray(value)) {
    for (const v of value) walkNodes(v, visit);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  visit(value as Node);
  for (const v of Object.values(value as Node)) walkNodes(v, visit);
}

function checkRequiredProps(file: string, node: Node): void {
  const type = node['@type'];
  if (type === 'Review' && Object.keys(node).length > 1) {
    for (const prop of ['itemReviewed', 'author', 'reviewRating'] as const) {
      if (!(prop in node)) fail(file, `Review missing required property "${prop}"`);
    }
  }
  if (type === 'Article' && Object.keys(node).length > 1) {
    for (const prop of ['headline', 'author', 'datePublished'] as const) {
      if (!(prop in node)) fail(file, `Article missing required property "${prop}"`);
    }
  }
  if (type === 'BreadcrumbList') {
    const items = node.itemListElement;
    if (!Array.isArray(items) || items.length === 0) {
      fail(file, 'BreadcrumbList has no itemListElement');
    }
  }
}

function verifyFile(relPath: string): void {
  const html = readFileSync(join(ROOT, relPath), 'utf8');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

  const defined = new Set<string>(INJECTED_IDS);
  const referenced = new Set<string>();
  let brandSlugForAggregate: string | null = null;

  for (const m of blocks) {
    let json: unknown;
    try {
      json = JSON.parse(m[1]);
    } catch (e) {
      fail(relPath, `JSON-LD does not parse: ${(e as Error).message.slice(0, 80)}`);
      continue;
    }

    walkNodes(json, (node) => {
      const type = node['@type'];
      if (typeof type === 'string' && BANNED_TYPES.has(type)) {
        fail(relPath, `banned/deprecated schema type "${type}"`);
      }
      if ('potentialAction' in node) {
        fail(relPath, 'potentialAction present (SearchAction is deprecated — do not emit)');
      }
      const id = node['@id'];
      if (typeof id === 'string') {
        if (Object.keys(node).length === 1) referenced.add(id);
        else defined.add(id);
      }
      for (const [k, v] of Object.entries(node)) {
        if (DATE_PROPS.has(k) && typeof v === 'string' && !ISO_DATE.test(v)) {
          fail(relPath, `${k} is not ISO 8601: ${v}`);
        }
      }
      if ('aggregateRating' in node) {
        const slugMatch = relPath.match(/^reviews\/([a-z0-9-]+)\.html$/);
        brandSlugForAggregate = slugMatch ? slugMatch[1] : '(non-review page)';
      }
      checkRequiredProps(relPath, node);
    });
  }

  if (brandSlugForAggregate) {
    const agg = READER_REPORT_AGGREGATES[brandSlugForAggregate];
    if (!agg || agg.count < AGGREGATE_MIN) {
      fail(
        relPath,
        `AggregateRating emitted but brand "${brandSlugForAggregate}" has ` +
          `${agg?.count ?? 0} approved reader reports (< ${AGGREGATE_MIN} gate, plan §4.1)`,
      );
    }
  }

  for (const ref of referenced) {
    if (!ref.startsWith(ORIGIN) || !ref.includes('#')) continue;
    if (!defined.has(ref)) fail(relPath, `unresolved @id reference: ${ref}`);
  }
}

const targets: string[] = ['index.html'];
for (const dir of ['reviews', 'author']) {
  if (!existsSync(join(ROOT, dir))) continue;
  for (const f of readdirSync(join(ROOT, dir)).sort()) {
    if (f.endsWith('.html')) targets.push(`${dir}/${f}`);
  }
}
for (const f of [
  'about.html',
  'contact.html',
  'how-we-rate.html',
  'editorial-policy.html',
  'responsible-gaming.html',
  'state-legality.html',
]) {
  if (existsSync(join(ROOT, f))) targets.push(f);
}

for (const t of targets) verifyFile(t);

if (errors.length > 0) {
  console.error(`\n[verify-schema] ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`[verify-schema] OK — ${targets.length} static pages validated.`);
