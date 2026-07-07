/**
 * One-shot schema migration for the static review pages + homepage ItemList
 * (docs/schema-markup-plan.md phases 3-4).
 *
 * Per review page:
 *  - Consolidates the Review JSON-LD into one @graph with stable @ids:
 *      Review        -> <url>#review
 *      Brand Org     -> <url>#brand   (canonical entity home; identity kept
 *                                      from the existing itemReviewed data)
 *      Author Person -> /author/<slug>/#person (full node ON the page,
 *                                      referenced from Review.author by @id)
 *      Publisher     -> @id ref to the site Organization (injected site-wide)
 *  - Adds positiveNotes/negativeNotes ItemLists extracted from the VISIBLE
 *    pros/cons lists (schema-content parity, plan §4.4).
 *  - Adds @id to FAQPage + BreadcrumbList; rebuilds an invalid FAQPage block
 *    from the visible FAQ section.
 *  - REMOVES legacy AggregateRating blocks: AggregateRating is gated behind
 *    >=10 moderated reader reports (plan §4.1) and must never ship from
 *    editorial/third-party ratings.
 *
 * Homepage: upgrades the ranked ItemList to brand @id refs + ships the full
 * brand Organization nodes in the same @graph.
 *
 * Idempotent: pages already carrying the review-graph marker are skipped.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ORIGIN = 'https://sweepstakeswiz.com';
const ORG_ID = `${ORIGIN}/#organization`;
const AUTHOR_ID = `${ORIGIN}/author/ilija-milosevic/#person`;
const REVIEW_GRAPH_MARKER = '<!--sc-review-graph-->';

const AUTHOR_NODE = {
  '@type': 'Person',
  '@id': AUTHOR_ID,
  name: 'Ilija Milosevic',
  jobTitle: 'iGaming Writer & Analyst',
  description:
    'iGaming writer and analyst with 8+ years of experience creating search-driven content for gambling brands and affiliate websites, including casino, slot, and sportsbook reviews.',
  image: `${ORIGIN}/sweepstakeslogo/ilija-milosevic.webp`,
  url: `${ORIGIN}/author/ilija-milosevic/`,
  sameAs: ['https://www.linkedin.com/in/ilija-milosevic-hiperion'],
  worksFor: { '@id': ORG_ID },
};

const SCRIPT_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/** Extract the visible pros/cons <ul class="pc-list"> items (pros first). */
function extractProsCons(html) {
  const lists = [...html.matchAll(/<ul class="pc-list">([\s\S]*?)<\/ul>/g)].map((m) =>
    [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((li) => stripTags(li[1])),
  );
  if (lists.length < 2) return { pros: [], cons: [] };
  return { pros: lists[0], cons: lists[1] };
}

/** Rebuild FAQ Q&A pairs from the visible .faq-item markup (fallback path). */
function extractVisibleFaq(html) {
  const items = [];
  const re =
    /<button class="faq-q"[^>]*>([\s\S]*?)<\/button>[\s\S]*?<div class="faq-answer-inner">([\s\S]*?)<\/div>/g;
  for (const m of html.matchAll(re)) {
    const q = stripTags(m[1].replace(/<span class="faq-arrow">[\s\S]*?<\/span>/, ''));
    const a = stripTags(m[2]);
    if (q && a) items.push({ q, a });
  }
  return items;
}

function toItemList(names) {
  return {
    '@type': 'ItemList',
    itemListElement: names.map((name, i) => ({ '@type': 'ListItem', position: i + 1, name })),
  };
}

function migrateReview(file) {
  const path = join(ROOT, 'reviews', file);
  const slug = file.replace(/\.html$/, '');
  const url = `${ORIGIN}/reviews/${slug}/`;
  const brandId = `${url}#brand`;
  let html = readFileSync(path, 'utf8');
  if (html.includes(REVIEW_GRAPH_MARKER)) return 'skipped';

  const blocks = [...html.matchAll(SCRIPT_RE)].map((m) => {
    let json = null;
    try {
      json = JSON.parse(m[1]);
    } catch {
      /* invalid block — handled by type sniffing below */
    }
    const sniff = (t) => (json ? json['@type'] === t : m[1].includes(`"@type": "${t}"`) || m[1].includes(`"@type":"${t}"`));
    return { raw: m[0], body: m[1], json, sniff };
  });

  const reviewBlock = blocks.find((b) => b.json && b.json['@type'] === 'Review');
  if (!reviewBlock) {
    console.warn(`  ! ${file}: no parseable Review block — skipped`);
    return 'no-review';
  }
  const old = reviewBlock.json;

  // Brand Organization node: keep the published identity facts, re-home the
  // @id onto this review page (the entity's canonical home).
  const item = old.itemReviewed ?? {};
  const brandNode = {
    '@type': 'Organization',
    '@id': brandId,
    name: item.name,
    ...(item.url ? { url: item.url, sameAs: [item.url] } : {}),
    ...(item.parentOrganization ? { parentOrganization: item.parentOrganization } : {}),
  };

  const { pros, cons } = extractProsCons(html);

  const reviewNode = {
    '@type': 'Review',
    '@id': `${url}#review`,
    url,
    mainEntityOfPage: url,
    itemReviewed: { '@id': brandId },
    author: { '@id': AUTHOR_ID },
    publisher: { '@id': ORG_ID },
    ...(old.datePublished ? { datePublished: old.datePublished } : {}),
    ...(old.dateModified ? { dateModified: old.dateModified } : {}),
    ...(old.reviewRating ? { reviewRating: old.reviewRating } : {}),
    ...(pros.length > 0 ? { positiveNotes: toItemList(pros) } : {}),
    ...(cons.length > 0 ? { negativeNotes: toItemList(cons) } : {}),
    ...(old.reviewBody ? { reviewBody: old.reviewBody } : {}),
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [reviewNode, brandNode, AUTHOR_NODE],
  };
  html = html.replace(
    reviewBlock.raw,
    `${REVIEW_GRAPH_MARKER}\n<script type="application/ld+json">${JSON.stringify(graph)}</script>`,
  );

  // Drop legacy AggregateRating blocks (gated pipeline only, plan §4.1).
  for (const b of blocks) {
    if (b === reviewBlock) continue;
    const isAggregate =
      (b.json && b.json.aggregateRating) || (!b.json && b.body.includes('"AggregateRating"'));
    if (isAggregate) {
      html = html.replace(b.raw, '');
      // Also remove a preceding "<!-- AggregateRating -->" comment if present.
      html = html.replace(/<!--\s*AggregateRating\s*-->\s*\n?/g, '');
    }
  }

  // FAQPage: add @id; rebuild invalid blocks from the visible FAQ section.
  for (const b of blocks) {
    if (b.json && b.json['@type'] === 'FAQPage' && !b.json['@id']) {
      const withId = { '@context': 'https://schema.org', '@id': `${url}#faq`, ...b.json };
      delete withId['@context'];
      html = html.replace(
        b.raw,
        `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...withId })}</script>`,
      );
    } else if (!b.json && b.sniff('FAQPage')) {
      const faq = extractVisibleFaq(html);
      if (faq.length > 0) {
        const rebuilt = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          mainEntity: faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        };
        html = html.replace(
          b.raw,
          `<script type="application/ld+json">${JSON.stringify(rebuilt)}</script>`,
        );
        console.log(`  ~ ${file}: rebuilt invalid FAQPage from visible FAQ (${faq.length} Qs)`);
      } else {
        html = html.replace(b.raw, '');
        console.log(`  ~ ${file}: removed invalid FAQPage block (no visible FAQ found)`);
      }
    }
  }

  // BreadcrumbList: add stable @id.
  for (const b of blocks) {
    if (b.json && b.json['@type'] === 'BreadcrumbList' && !b.json['@id']) {
      const withId = { '@context': 'https://schema.org', '@id': `${url}#breadcrumb`, ...b.json };
      html = html.replace(
        b.raw,
        `<script type="application/ld+json">${JSON.stringify(withId)}</script>`,
      );
    }
  }

  writeFileSync(path, html);
  return 'migrated';
}

/** Homepage: ItemList items become brand @id refs + full brand nodes ship on-page. */
function migrateHomepage() {
  const path = join(ROOT, 'index.html');
  let html = readFileSync(path, 'utf8');
  if (html.includes('#brand')) return 'skipped';

  const blocks = [...html.matchAll(SCRIPT_RE)];
  for (const m of blocks) {
    let json;
    try {
      json = JSON.parse(m[1]);
    } catch {
      continue;
    }
    if (json['@type'] !== 'ItemList') continue;

    const slugOf = (u) => u.match(/\/reviews\/([a-z0-9-]+)\//)?.[1];
    const slugs = json.itemListElement.map((li) => slugOf(li.url)).filter(Boolean);

    // Pull each brand's canonical node from its (already migrated) review page.
    const brandNodes = [];
    for (const slug of slugs) {
      const reviewHtml = readFileSync(join(ROOT, 'reviews', `${slug}.html`), 'utf8');
      const graphMatch = [...reviewHtml.matchAll(SCRIPT_RE)]
        .map((x) => {
          try {
            return JSON.parse(x[1]);
          } catch {
            return null;
          }
        })
        .find((j) => j && Array.isArray(j['@graph']));
      const brand = graphMatch?.['@graph'].find(
        (n) => n['@id'] === `${ORIGIN}/reviews/${slug}/#brand`,
      );
      if (brand) brandNodes.push(brand);
    }

    const itemList = {
      '@type': 'ItemList',
      '@id': `${ORIGIN}/#toplist`,
      name: json.name,
      itemListOrder: json.itemListOrder ?? 'https://schema.org/ItemListOrderDescending',
      numberOfItems: json.itemListElement.length,
      itemListElement: json.itemListElement.map((li) => ({
        ...li,
        ...(slugOf(li.url) ? { item: { '@id': `${ORIGIN}/reviews/${slugOf(li.url)}/#brand` } } : {}),
      })),
    };
    const graph = { '@context': 'https://schema.org', '@graph': [itemList, ...brandNodes] };
    html = html.replace(m[0], `<script type="application/ld+json">${JSON.stringify(graph)}</script>`);
    writeFileSync(path, html);
    return 'migrated';
  }
  return 'no-itemlist';
}

const files = readdirSync(join(ROOT, 'reviews')).filter((f) => f.endsWith('.html')).sort();
let migrated = 0;
for (const f of files) {
  const result = migrateReview(f);
  if (result === 'migrated') migrated++;
}
console.log(`Review schema migration: ${migrated}/${files.length} files migrated.`);
console.log(`Homepage ItemList: ${migrateHomepage()}.`);
