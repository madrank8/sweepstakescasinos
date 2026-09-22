/**
 * Brand / footer regression gate.
 *
 * Published chrome must read as Sweepstakes Wiz / sweepstakeswiz.com.
 * Old-domain wordmarks (sweepstakescasinoslist / casinoslist) are leaks.
 * Competitor review-site plugs (Sweepsy, SweepsKings) must not appear as
 * ours or as unexplained endorsements. Operator promo codes SWEEPSY /
 * SWEEPSKINGS are allowed. Internal /reviews/ links are allowed.
 *
 * Run: tsx scripts/verify-brand-footer.test.ts
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const SKIP_DIRS = new Set([
  '.git',
  '.astro',
  '.vercel',
  '.seo',
  'node_modules',
  'dist',
  '_external',
  '.planning',
  '.superpowers',
  '.cursor',
  '.beads',
  'docs',
  'evidence',
]);

const PUBLISHED_EXT = new Set(['.html', '.astro']);

const OLD_BRAND =
  /sweepstakescasinoslist|sweepstakescasinollist|casinoslist\.com|casinolist\.com|SWEEPSTAKES\s*CASINOS\s*LIST/i;

const FOOTER_BRAND = /sweepstakes\s*wiz|sweepstakeswiz\.com/i;

const COMPETITOR_HREF = /https?:\/\/(?:www\.)?(?:sweepsy|sweepskings)\.com/i;

/** Site name-drops. Promo codes SWEEPSY / SWEEPSKINGS do not match. */
const COMPETITOR_NAME = /Sweepsy(?:\.com)?|SweepsKings(?:\.com)?/;

function walkPublished(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkPublished(full));
      continue;
    }
    if (PUBLISHED_EXT.has(extname(name))) out.push(full);
  }
  return out.sort();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_m, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    )
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&(?:ndash|#8211);/gi, '–')
    .replace(/&(?:mdash|#8212);/gi, '—');
}

function visibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<head\b[\s\S]*?<\/head\s*>/gi, ' ')
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ');
}

function footerBlocks(html: string): string[] {
  return [...html.matchAll(/<footer\b[\s\S]*?<\/footer>/gi)].map((m) => m[0]);
}

const files = walkPublished(root);
assert.ok(files.some((f) => f.endsWith('partials/footer.html')));
assert.ok(files.some((f) => f.endsWith('reviews/dexyplay.html')));

const footerFiles = files.filter((file) => footerBlocks(readFileSync(file, 'utf8')).length > 0);
const oldBrandHits: string[] = [];
const unbrandedFooters: string[] = [];
const competitorHrefs: string[] = [];
const competitorNames: string[] = [];

for (const file of files) {
  const rel = relative(root, file);
  const html = readFileSync(file, 'utf8');
  const footers = footerBlocks(html);

  for (const footer of footers) {
    const text = visibleText(footer);
    if (OLD_BRAND.test(footer) || OLD_BRAND.test(text)) {
      oldBrandHits.push(`${rel}: leftover old brand in <footer>`);
    }
    if (!FOOTER_BRAND.test(text)) {
      unbrandedFooters.push(`${rel}: footer does not say SweepstakesWiz / sweepstakeswiz.com`);
    }
  }

  if (COMPETITOR_HREF.test(html)) {
    competitorHrefs.push(`${rel}: outbound Sweepsy/SweepsKings href`);
  }

  const visible = visibleText(html);
  if (COMPETITOR_NAME.test(visible)) {
    competitorNames.push(`${rel}: Sweepsy/SweepsKings name-drop`);
  }
}

const sharedFooter = readFileSync(join(root, 'partials/footer.html'), 'utf8');
assert.match(visibleText(sharedFooter), /SweepstakesWiz\.com|sweepstakeswiz\.com/i);
assert.doesNotMatch(sharedFooter, OLD_BRAND);

assert.deepEqual(oldBrandHits, [], oldBrandHits.join('\n'));
assert.deepEqual(unbrandedFooters, [], unbrandedFooters.join('\n'));
assert.deepEqual(competitorHrefs, [], competitorHrefs.join('\n'));
assert.deepEqual(competitorNames, [], competitorNames.join('\n'));

assert.equal(footerFiles.length > 20, true, 'expected many published footers');

console.log(
  `brand/footer tests: OK — ${files.length} published files, ${footerFiles.length} footers`,
);
