/**
 * Focused verification for Task 2: GLM content policy and query alignment.
 * Extended per Task 2 review fixes.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const EXPECTED_DATE_MODIFIED = '2026-09-08T00:00:00Z';
const EXPECTED_DATE_PUBLISHED: Record<string, string> = {
  'reviews/dexyplay.html': '2026-05-20T00:00:00Z',
  'reviews/sweepico.html': '2026-05-20T00:00:00Z',
  'reviews/big-pirate.html': '2026-05-20T00:00:00Z',
};
const REVIEW_FILES = Object.keys(EXPECTED_DATE_PUBLISHED);

function read(rel: string): string {
  return readFileSync(REPO_ROOT + rel, 'utf8');
}

function metaContent(html: string, key: string): string | null {
  const needle1 = 'name="' + key + '" content="';
  const needle2 = 'property="' + key + '" content="';
  const start = html.indexOf(needle1) >= 0 ? html.indexOf(needle1) + needle1.length : html.indexOf(needle2) >= 0 ? html.indexOf(needle2) + needle2.length : -1;
  if (start < 0) return null;
  const end = html.indexOf('"', start);
  return end > start ? html.slice(start, end) : null;
}

function firstH1(html: string): string | null {
  const open = html.indexOf('<h1');
  if (open < 0) return null;
  const gt = html.indexOf('>', open);
  const close = html.indexOf('</h1>', gt);
  if (gt < 0 || close < 0) return null;
  const inner = html.slice(gt + 1, close);
  return inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleTag(html: string): string | null {
  const open = html.indexOf('<title');
  const gt = open >= 0 ? html.indexOf('>', open) : -1;
  const close = gt >= 0 ? html.indexOf('</title>', gt) : -1;
  if (gt < 0 || close < 0) return null;
  return html.slice(gt + 1, close).trim();
}

function parseAllJsonLd(html: string, file: string): unknown[] {
  const out: unknown[] = [];
  let idx = 0;
  for (;;) {
    const open = html.indexOf('<script type="application/ld+json">', idx);
    if (open < 0) break;
    const start = open + '<script type="application/ld+json">'.length;
    const close = html.indexOf('</script>', start);
    if (close < 0) {
      assert.fail(file + ': JSON-LD script tag not closed');
      break;
    }
    try {
      out.push(JSON.parse(html.slice(start, close)));
    } catch (e) {
      assert.fail(file + ': JSON-LD does not parse: ' + (e as Error).message.slice(0, 120));
    }
    idx = close + '</script>'.length;
  }
  return out;
}

function collectValues(node: unknown, key: string, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const v of node) collectValues(v, key, out);
    return out;
  }
  if (node === null || typeof node !== 'object') return out;
  const obj = node as Record<string, unknown>;
  if (typeof obj[key] === 'string') out.push(obj[key]);
  for (const v of Object.values(obj)) collectValues(v, key, out);
  return out;
}

function containsCi(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function metaSurfaces(html: string): Array<{ name: string; value: string | null }> {
  return [
    { name: '<title>', value: titleTag(html) },
    { name: 'meta[name=description]', value: metaContent(html, 'description') },
    { name: 'meta[property="og:title"]', value: metaContent(html, 'og:title') },
    { name: 'meta[property="og:description"]', value: metaContent(html, 'og:description') },
    { name: 'meta[name="twitter:title"]', value: metaContent(html, 'twitter:title') },
    { name: 'meta[name="twitter:description"]', value: metaContent(html, 'twitter:description') },
    { name: '<h1>', value: firstH1(html) },
  ];
}

// 1. No Sweepsy references in DexyPlay or Sweepico
for (const rel of ['reviews/dexyplay.html', 'reviews/sweepico.html']) {
  const html = read(rel);
  assert.ok(!containsCi(html, 'sweepsy'), rel + ' must contain no case-insensitive "sweepsy" references');
}

// 2. No banned VIP-duration comparisons or invented mechanisms in Sweepico
const sweepico = read('reviews/sweepico.html');
const bannedVipPhrases = [
  'VIP longevity',
  'industry-standard 30',
  '30-day industry',
  '30-day norm',
  'industry-leading',
  'rolling reset',
  'rolling schedule',
];
for (const phrase of bannedVipPhrases) {
  assert.ok(!containsCi(sweepico, phrase), 'reviews/sweepico.html must not contain banned VIP phrase "' + phrase + '"');
}

// 8. No semantic longevity patterns in Sweepico
const longevityPhrases = ['longer window', 'longer runway', 'longer than'];
for (const phrase of longevityPhrases) {
  assert.ok(!containsCi(sweepico, phrase), 'reviews/sweepico.html must not contain semantic longevity phrase "' + phrase + '"');
}

// 3. Self-canonicals preserved
const expectedCanonicals: Record<string, string> = {
  'reviews/dexyplay.html': 'https://sweepstakeswiz.com/reviews/dexyplay/',
  'reviews/sweepico.html': 'https://sweepstakeswiz.com/reviews/sweepico/',
  'reviews/big-pirate.html': 'https://sweepstakeswiz.com/reviews/big-pirate/',
};
for (const [rel, expected] of Object.entries(expectedCanonicals)) {
  const html = read(rel);
  const open = html.indexOf('<link rel="canonical" href="');
  assert.ok(open >= 0, rel + ' must have a canonical link');
  const hrefStart = html.indexOf('href="', open) + 'href="'.length;
  const hrefEnd = html.indexOf('"', hrefStart);
  assert.equal(html.slice(hrefStart, hrefEnd), expected, rel + ' canonical must remain ' + expected);
}

// 4. Big Pirate title/description/social/H1 alignment
const bigPirate = read('reviews/big-pirate.html');
for (const s of metaSurfaces(bigPirate)) {
  assert.ok(s.value, 'Big Pirate ' + s.name + ' must be present');
  const v = s.value as string;
  assert.ok(v.toLowerCase().includes('big pirate'), 'Big Pirate ' + s.name + ' must reference "Big Pirate"');
  assert.ok(v.toLowerCase().includes('bonus'), 'Big Pirate ' + s.name + ' must reference "Bonus" intent');
  assert.ok(!v.toLowerCase().includes('legit test'), 'Big Pirate ' + s.name + ' must not say "legit test"');
  assert.ok(!v.toLowerCase().includes('tested'), 'Big Pirate ' + s.name + ' must not say "tested"');
  assert.ok(!v.toLowerCase().includes('everything verified'), 'Big Pirate ' + s.name + ' must not say "everything verified"');
}

// 12. Big Pirate metadata uses &amp; consistently (no bare & entities)
for (const s of metaSurfaces(bigPirate)) {
  if (!s.value) continue;
  const v = s.value as string;
  // Find any '&' not followed by an entity name
  let i = 0;
  for (;;) {
    const at = v.indexOf('&', i);
    if (at < 0) break;
    const after = v.slice(at + 1, at + 6);
    assert.ok(
      after.startsWith('amp;') || after.startsWith('lt;') || after.startsWith('gt;') || after.startsWith('quot;') || after.startsWith('apos;') || after.startsWith('#'),
      'Big Pirate ' + s.name + ' must use &amp; (bare & found)',
    );
    i = at + 1;
  }
}

// 9. DexyPlay and Sweepico metadata/H1 surfaces contain no tested/first-person claims
const firstPersonPhrases = ['tested', 'hands-on', 'fully tested', 'bonus tested', 'legit test', 'everything verified'];
for (const rel of ['reviews/dexyplay.html', 'reviews/sweepico.html']) {
  const html = read(rel);
  for (const s of metaSurfaces(html)) {
    if (!s.value) continue;
    const v = s.value as string;
    for (const phrase of firstPersonPhrases) {
      assert.ok(!v.toLowerCase().includes(phrase), rel + ' ' + s.name + ' must not contain "' + phrase + '"');
    }
  }
}

// 5 + 6. JSON-LD parses; every dateModified/datePublished occurrence correct
for (const rel of REVIEW_FILES) {
  const html = read(rel);
  const parsed = parseAllJsonLd(html, rel);
  assert.ok(parsed.length >= 1, rel + ' must have at least one JSON-LD block');
  const dateModifieds = collectValues(parsed, 'dateModified');
  const datePublisheds = collectValues(parsed, 'datePublished');
  assert.ok(dateModifieds.length >= 1, rel + ' JSON-LD must have dateModified');
  assert.ok(datePublisheds.length >= 1, rel + ' JSON-LD must have datePublished');
  for (const dm of dateModifieds) {
    assert.equal(dm, EXPECTED_DATE_MODIFIED, rel + ' JSON-LD dateModified must be ' + EXPECTED_DATE_MODIFIED + ' (got ' + dm + ')');
  }
  for (const dp of datePublisheds) {
    assert.equal(dp, EXPECTED_DATE_PUBLISHED[rel], rel + ' JSON-LD datePublished must be preserved as ' + EXPECTED_DATE_PUBLISHED[rel] + ' (got ' + dp + ')');
  }
  // Meta tags
  const modMeta = metaContent(html, 'article:modified_time');
  const pubMeta = metaContent(html, 'article:published_time');
  assert.ok(modMeta, rel + ' must have article:modified_time meta');
  assert.ok(pubMeta, rel + ' must have article:published_time meta');
  assert.equal(modMeta, EXPECTED_DATE_MODIFIED, rel + ' article:modified_time must be ' + EXPECTED_DATE_MODIFIED);
  assert.equal(pubMeta, EXPECTED_DATE_PUBLISHED[rel], rel + ' article:published_time must be preserved');
}

// 7. Sweepico source-count consistency (four sources after removing Sweepsy)
assert.ok(!containsCi(sweepico, '5 sources'), 'reviews/sweepico.html must not say "5 sources"');
assert.ok(!containsCi(sweepico, 'five sources'), 'reviews/sweepico.html must not say "five sources"');
assert.ok(!containsCi(sweepico, 'all five'), 'reviews/sweepico.html must not say "all five"');
assert.ok(!containsCi(sweepico, 'all 5'), 'reviews/sweepico.html must not say "all 5"');
// Source table has exactly four data rows (count <span class="sn"> within src-table region)
const srcTableStart = sweepico.indexOf('<table class="src-table"');
assert.ok(srcTableStart >= 0, 'reviews/sweepico.html must have a src-table');
const srcTableEnd = sweepico.indexOf('</table>', srcTableStart);
const srcTableBlock = sweepico.slice(srcTableStart, srcTableEnd);
const snCount = srcTableBlock.split('<span class="sn">').length - 1;
assert.equal(snCount, 4, 'reviews/sweepico.html src-table must have exactly 4 source rows (got ' + snCount + ')');

// 10. No "as of September 2026" operator-offer assertions
for (const rel of REVIEW_FILES) {
  const html = read(rel);
  assert.ok(!containsCi(html, 'as of September 2026'), rel + ' must not contain "as of September 2026"');
}

// 11. Freshness labels: no "Verified May 2026"; explicit offer-check + page-update dates
for (const rel of REVIEW_FILES) {
  const html = read(rel);
  assert.ok(!containsCi(html, 'Verified May 2026'), rel + ' must not contain "Verified May 2026" badge');
  assert.ok(containsCi(html, 'Offer details checked May 2026'), rel + ' must carry an "Offer details checked May 2026" label');
  assert.ok(containsCi(html, 'Updated September 8, 2026'), rel + ' must carry an explicit "Updated September 8, 2026" page-update date');
}

// 13. Big Pirate promo FAQ (visible + JSON-LD) does not claim "no codes exist now"
const bpFaqVisible = bigPirateFaqVisible(bigPirate);
assert.ok(!containsCi(bpFaqVisible, 'No verified Big Pirate promo codes exist'), 'Big Pirate visible promo FAQ must not claim no codes exist now');
assert.ok(!containsCi(bpFaqVisible, 'no code is required or available'), 'Big Pirate visible promo FAQ must not claim no code is required or available');
assert.ok(containsCi(bpFaqVisible, 'confirm current terms'), 'Big Pirate visible promo FAQ must direct readers to confirm current terms');
const bpParsed = parseAllJsonLd(bigPirate, 'reviews/big-pirate.html');
const bpFaqJson = collectFaqText(bpParsed, 'Does Big Pirate Casino require a promo code?');
assert.ok(bpFaqJson, 'Big Pirate JSON-LD must contain the promo code FAQ');
assert.ok(!containsCi(bpFaqJson, 'No verified Big Pirate promo codes exist'), 'Big Pirate JSON-LD promo FAQ must not claim no codes exist now');
assert.ok(containsCi(bpFaqJson, 'confirm current terms'), 'Big Pirate JSON-LD promo FAQ must direct readers to confirm current terms');

// 14. Sweepico VIP coinback not duplicated in JSON-LD positiveNotes or visible pros
const sweepicoParsed = parseAllJsonLd(sweepico, 'reviews/sweepico.html');
const positiveNames = collectPositiveNoteNames(sweepicoParsed);
const coinbackNotes = positiveNames.filter((n) => containsCi(n, 'coinback'));
assert.equal(coinbackNotes.length, 1, 'reviews/sweepico.html JSON-LD must have exactly one coinback positive note (got ' + coinbackNotes.length + ')');
// Visible pros list: count coinback mentions
const prosStart = sweepico.indexOf('<div class="pc-box pros-box">');
const prosEnd = sweepico.indexOf('</div>', sweepico.indexOf('</ul>', prosStart));
const prosBlock = sweepico.slice(prosStart, prosEnd);
const prosCoinback = prosBlock.split('<li>').filter((li) => containsCi(li, 'coinback')).length;
assert.equal(prosCoinback, 1, 'reviews/sweepico.html visible pros must list coinback exactly once (got ' + prosCoinback + ')');

// 15. DexyPlay bonus heading + score row have no stale "Promo Code"; no duplicate email-verification card
const dexy = read('reviews/dexyplay.html');
const bonusHeading = dexy.match(/<h2 id="bonus">[^<]*<\/h2>/i);
assert.ok(bonusHeading, 'reviews/dexyplay.html must have a bonus heading');
assert.ok(!containsCi(bonusHeading[0], 'Promo Code'), 'reviews/dexyplay.html bonus heading must not contain "Promo Code"');
const scoreRow = dexy.match(/<div class="sbar-row"><div class="sbar-cat">[^<]*Welcome[^<]*<\/div>/i);
assert.ok(scoreRow, 'reviews/dexyplay.html must have a Welcome score row');
assert.ok(!containsCi(scoreRow[0], 'Promo Code'), 'reviews/dexyplay.html Welcome score row must not contain "Promo Code"');
// Email-verification bonus is still referenced (in the signup card description) but has no standalone duplicate card.
const evConceptMatches = dexy.match(/email verification/gi);
assert.ok(evConceptMatches && evConceptMatches.length >= 1, 'reviews/dexyplay.html must still reference the email-verification bonus');
const evStandaloneCard = dexy.match(/<div class="bc-title">Email Verification Bonus<\/div>/i);
assert.equal(evStandaloneCard, null, 'reviews/dexyplay.html must not have a standalone duplicate email-verification bonus card');

console.log('verify-priority-seo-content: OK');

function bigPirateFaqVisible(html: string): string {
  // Extract the visible promo-code FAQ answer block (last occurrence = visible HTML, not JSON-LD).
  const needle = 'Does Big Pirate Casino require a promo code?';
  const idx = html.lastIndexOf(needle);
  if (idx < 0) return '';
  const bodyStart = html.indexOf('faq-inner', idx);
  const bodyEnd = html.indexOf('</div>', bodyStart);
  return bodyStart >= 0 && bodyEnd > bodyStart ? html.slice(bodyStart, bodyEnd) : '';
}

function collectFaqText(parsed: unknown[], question: string): string | null {
  for (const node of parsed) {
    const found = walkForFaq(node, question);
    if (found) return found;
  }
  return null;
}

function walkForFaq(node: unknown, question: string): string | null {
  if (Array.isArray(node)) {
    for (const v of node) {
      const r = walkForFaq(v, question);
      if (r) return r;
    }
    return null;
  }
  if (node === null || typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;
  if (obj['@type'] === 'Question' && typeof obj['name'] === 'string' && obj['name'] === question) {
    const acc = obj['acceptedAnswer'] as Record<string, unknown> | undefined;
    if (acc && typeof acc['text'] === 'string') return acc['text'];
  }
  for (const v of Object.values(obj)) {
    const r = walkForFaq(v, question);
    if (r) return r;
  }
  return null;
}

function collectPositiveNoteNames(parsed: unknown[]): string[] {
  const out: string[] = [];
  for (const node of parsed) walkPositiveNotes(node, out);
  return out;
}

function walkPositiveNotes(node: unknown, out: string[]): void {
  if (Array.isArray(node)) {
    for (const v of node) walkPositiveNotes(v, out);
    return;
  }
  if (node === null || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if (obj['positiveNotes']) {
    const pn = obj['positiveNotes'] as Record<string, unknown>;
    const elems = pn['itemListElement'];
    if (Array.isArray(elems)) {
      for (const e of elems) {
        const eo = e as Record<string, unknown>;
        if (typeof eo['name'] === 'string') out.push(eo['name']);
      }
    }
  }
  for (const v of Object.values(obj)) walkPositiveNotes(v, out);
}
