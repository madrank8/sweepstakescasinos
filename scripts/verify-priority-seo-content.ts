/**
 * Focused verification for Task 2: GLM content policy and query alignment.
 *
 * Checks:
 * 1. No case-insensitive `sweepsy` references remain in reviews/dexyplay.html
 *    or reviews/sweepico.html (visible copy or JSON-LD).
 * 2. No `VIP longevity`, `industry-standard 30`, `30-day industry`, `30-day norm`,
 *    or `industry-leading` VIP-duration comparisons remain in Sweepico visible
 *    copy or JSON-LD.
 * 3. DexyPlay, Sweepico, and Big Pirate retain their existing self-canonicals.
 * 4. Big Pirate's title, primary description, social titles/descriptions, and
 *    H1 align with `Big Pirate Casino Review` plus `Bonus` intent without
 *    "legit test", "tested", or "everything verified" claims.
 * 5. All edited JSON-LD scripts parse successfully (DexyPlay, Sweepico, Big Pirate).
 * 6. dateModified metadata + JSON-LD updated to 2026-09-08T00:00:00Z while
 *    datePublished is preserved on all three reviews.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const REPO_ROOT = new URL('..', import.meta.url).pathname;

function read(rel: string): string {
  return readFileSync(REPO_ROOT + rel, 'utf8');
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(
    '<meta\\s+(?:name|property)=["\']' + key + '["\']\\s+content=["\']([^"\']*)["\']',
    'i',
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

function firstH1(html: string): string | null {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseJsonLd(html: string, file: string): unknown[] {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const out: unknown[] = [];
  for (const m of blocks) {
    try {
      out.push(JSON.parse(m[1]));
    } catch (e) {
      assert.fail(file + ': JSON-LD does not parse: ' + (e as Error).message.slice(0, 120));
    }
  }
  return out;
}

function findDateModified(json: unknown): string | null {
  let result: string | null = null;
  if (Array.isArray(json)) {
    for (const v of json) {
      const r = findDateModified(v);
      if (r) result = r;
    }
    return result;
  }
  if (json === null || typeof json !== 'object') return result;
  const node = json as Record<string, unknown>;
  if (typeof node['dateModified'] === 'string') result = node['dateModified'];
  for (const v of Object.values(node)) {
    const r = findDateModified(v);
    if (r) result = r;
  }
  return result;
}

function findDatePublished(json: unknown): string | null {
  let result: string | null = null;
  if (Array.isArray(json)) {
    for (const v of json) {
      const r = findDatePublished(v);
      if (r) result = r;
    }
    return result;
  }
  if (json === null || typeof json !== 'object') return result;
  const node = json as Record<string, unknown>;
  if (typeof node['datePublished'] === 'string') result = node['datePublished'];
  for (const v of Object.values(node)) {
    const r = findDatePublished(v);
    if (r) result = r;
  }
  return result;
}

// 1. No Sweepsy references in DexyPlay or Sweepico
for (const rel of ['reviews/dexyplay.html', 'reviews/sweepico.html']) {
  const html = read(rel);
  const matches = html.match(/sweepsy/gi);
  assert.equal(
    matches,
    null,
    rel + ' must contain no case-insensitive "sweepsy" references (found ' + (matches?.length ?? 0) + ')',
  );
}

// 2. No banned VIP-duration comparisons in Sweepico
const sweepico = read('reviews/sweepico.html');
const bannedVipPhrases = [
  /VIP longevity/gi,
  /industry-standard 30/gi,
  /30-day industry/gi,
  /30-day norm/gi,
  /industry-leading/gi,
];
for (const re of bannedVipPhrases) {
  re.lastIndex = 0;
  const m = sweepico.match(re);
  assert.equal(
    m,
    null,
    'reviews/sweepico.html must not contain banned VIP-duration comparison "' + re.source + '" (found ' + (m?.length ?? 0) + ')',
  );
}

// 3. Self-canonicals preserved
const expectedCanonicals: Record<string, string> = {
  'reviews/dexyplay.html': 'https://sweepstakeswiz.com/reviews/dexyplay/',
  'reviews/sweepico.html': 'https://sweepstakeswiz.com/reviews/sweepico/',
  'reviews/big-pirate.html': 'https://sweepstakeswiz.com/reviews/big-pirate/',
};
for (const [rel, expected] of Object.entries(expectedCanonicals)) {
  const html = read(rel);
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  assert.ok(m, rel + ' must have a canonical link');
  assert.equal(m[1], expected, rel + ' canonical must remain ' + expected);
}

// 4. Big Pirate title/description/social/H1 alignment
const bigPirate = read('reviews/big-pirate.html');
const bpSurfaces: Array<{ name: string; value: string | null }> = [
  { name: '<title>', value: bigPirate.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null },
  { name: 'meta[name=description]', value: metaContent(bigPirate, 'description') },
  { name: 'meta[property="og:title"]', value: metaContent(bigPirate, 'og:title') },
  { name: 'meta[property="og:description"]', value: metaContent(bigPirate, 'og:description') },
  { name: 'meta[name="twitter:title"]', value: metaContent(bigPirate, 'twitter:title') },
  { name: 'meta[name="twitter:description"]', value: metaContent(bigPirate, 'twitter:description') },
  { name: '<h1>', value: firstH1(bigPirate) },
];
for (const s of bpSurfaces) {
  assert.ok(s.value, 'Big Pirate ' + s.name + ' must be present');
  const v = s.value as string;
  assert.match(v, /Big Pirate/i, 'Big Pirate ' + s.name + ' must reference "Big Pirate"');
  assert.match(v, /bonus/i, 'Big Pirate ' + s.name + ' must reference "Bonus" intent');
  assert.doesNotMatch(v, /legit test/i, 'Big Pirate ' + s.name + ' must not say "legit test"');
  assert.doesNotMatch(v, /tested/i, 'Big Pirate ' + s.name + ' must not say "tested"');
  assert.doesNotMatch(v, /everything verified/i, 'Big Pirate ' + s.name + ' must not say "everything verified"');
}

// 5. All edited JSON-LD parses successfully
for (const rel of ['reviews/dexyplay.html', 'reviews/sweepico.html', 'reviews/big-pirate.html']) {
  const html = read(rel);
  const parsed = parseJsonLd(html, rel);
  assert.ok(parsed.length >= 1, rel + ' must have at least one JSON-LD block');
}

// 6. dateModified updated; datePublished preserved
const expectedDateModified = '2026-09-08T00:00:00Z';
const expectedDatePublished: Record<string, string> = {
  'reviews/dexyplay.html': '2026-05-20T00:00:00Z',
  'reviews/sweepico.html': '2026-05-20T00:00:00Z',
  'reviews/big-pirate.html': '2026-05-20T00:00:00Z',
};
for (const rel of Object.keys(expectedDatePublished)) {
  const html = read(rel);
  const modMeta = html.match(/<meta\s+property=["']article:modified_time["']\s+content=["']([^"']+)["']/i);
  assert.ok(modMeta, rel + ' must have article:modified_time meta');
  assert.equal(modMeta[1], expectedDateModified, rel + ' article:modified_time must be ' + expectedDateModified);
  const pubMeta = html.match(/<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i);
  assert.ok(pubMeta, rel + ' must have article:published_time meta');
  assert.equal(pubMeta[1], expectedDatePublished[rel], rel + ' article:published_time must be preserved');
  const parsed = parseJsonLd(html, rel);
  const jm = findDateModified(parsed);
  assert.equal(jm, expectedDateModified, rel + ' JSON-LD dateModified must be ' + expectedDateModified);
  const jp = findDatePublished(parsed);
  assert.equal(jp, expectedDatePublished[rel], rel + ' JSON-LD datePublished must be preserved');
}

console.log('verify-priority-seo-content: OK');
