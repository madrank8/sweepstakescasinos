/**
 * Follow-up fix for the static review pages (docs/schema-markup-plan.md).
 *
 * `apply-review-schema.mjs` (already run) consolidated each review into a
 * Review + brand Organization + Person @graph, but left `Review.publisher`
 * and the Person's `worksFor` referencing the site Organization (#organization)
 * WITHOUT ever defining it on the page — an unresolved @id reference on all
 * 29 pages (Google reads schema page-by-page; every referenced entity must be
 * defined ON that page, same rule enforced by buildPageGraph() for the Astro
 * routes). This script:
 *
 *  - Injects the real Organization + WebSite nodes into each review's existing
 *    @graph, imported directly from src/lib/schema.ts (single source of
 *    truth — no hand-duplicated copy to drift out of sync).
 *  - Replaces the hand-duplicated Person node with the same authorPersonNode()
 *    used everywhere else (picks up knowsAbout + ImageObject image already
 *    fixed there).
 *  - Consolidates the separate FAQPage + BreadcrumbList <script> blocks into
 *    the same single @graph (36-point audit check #3).
 *  - Reformats Review.datePublished/dateModified to full ISO datetime+
 *    timezone (Google's Rich Results Article/Review validator flags
 *    date-only strings — same issue found and fixed on /state-legality/).
 *
 * Idempotent: skips files where the Organization node is already present.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { organizationNode, webSiteNode, authorPersonNode, ORG_ID } from '../src/lib/schema.ts';

const ROOT = process.cwd();
const SCRIPT_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

function toFullIso(dateOnly) {
  if (!dateOnly) return dateOnly;
  // Already has a time component (defensive — survey found none, but stay safe).
  if (typeof dateOnly === 'string' && dateOnly.includes('T')) return dateOnly;
  return `${dateOnly}T00:00:00Z`;
}

function fixReview(file) {
  const path = join(ROOT, 'reviews', file);
  let html = readFileSync(path, 'utf8');

  const blocks = [...html.matchAll(SCRIPT_RE)].map((m) => {
    let json = null;
    try {
      json = JSON.parse(m[1]);
    } catch {
      /* handled below */
    }
    return { raw: m[0], json };
  });

  const graphBlock = blocks.find((b) => b.json && Array.isArray(b.json['@graph']));
  if (!graphBlock) {
    console.warn(`  ! ${file}: no @graph block found — skipped`);
    return 'no-graph';
  }
  if (graphBlock.json['@graph'].some((n) => n['@id'] === ORG_ID)) {
    return 'skipped';
  }

  const faqBlock = blocks.find((b) => b.json && b.json['@type'] === 'FAQPage');
  const breadcrumbBlock = blocks.find((b) => b.json && b.json['@type'] === 'BreadcrumbList');

  const graph = graphBlock.json['@graph'].map((n) => {
    if (n['@type'] === 'Review') {
      return {
        ...n,
        ...(n.datePublished ? { datePublished: toFullIso(n.datePublished) } : {}),
        ...(n.dateModified ? { dateModified: toFullIso(n.dateModified) } : {}),
      };
    }
    // Replace the hand-duplicated Person with the canonical, already-fixed node.
    if (n['@type'] === 'Person') return authorPersonNode();
    return n;
  });

  // Strip each block's own top-level @context — redundant once merged into
  // the page's single @graph (the array already carries one @context).
  const stripContext = (node) => {
    const { '@context': _ctx, ...rest } = node;
    return rest;
  };

  graph.push(organizationNode(), webSiteNode());
  if (faqBlock) graph.push(stripContext(faqBlock.json));
  if (breadcrumbBlock) graph.push(stripContext(breadcrumbBlock.json));

  const consolidated = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  })}</script>`;

  html = html.replace(graphBlock.raw, consolidated);
  if (faqBlock) html = html.replace(faqBlock.raw, '');
  if (breadcrumbBlock) html = html.replace(breadcrumbBlock.raw, '');
  // Collapse any blank lines left by the two removed blocks.
  html = html.replace(/\n{3,}/g, '\n\n');

  writeFileSync(path, html);
  return 'fixed';
}

const files = readdirSync(join(ROOT, 'reviews')).filter((f) => f.endsWith('.html')).sort();
let fixed = 0;
let skipped = 0;
for (const f of files) {
  const result = fixReview(f);
  if (result === 'fixed') fixed++;
  if (result === 'skipped') skipped++;
  console.log(`  ${result === 'fixed' ? '✓' : result === 'skipped' ? '·' : '!'} ${f}: ${result}`);
}
console.log(`\nReview schema foundation fix: ${fixed} fixed, ${skipped} already done, ${files.length} total.`);
