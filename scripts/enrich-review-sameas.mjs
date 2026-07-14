/**
 * One-shot authority-layer enrichment for review brand Organization nodes
 * (36-point audit checks #20/#22 — sameAs breadth).
 *
 * Every entry below was individually verified via a real web search in this
 * session, confirming the sameAs target's domain/handle exactly matches the
 * brand's own official domain (never guessed from a URL pattern — several
 * near-miss domains exist in this space, e.g. acebet.cc vs. the unrelated
 * acebet.com/acebet.co, or jackpotgo.com vs. the unrelated jackpotgo.club).
 *
 * Only 13 of 29 brands are covered here. The rest either had no confirmed
 * exact-domain match, an ambiguous domain (crown-coins.com vs. the brand's
 * actual crowncoinscasino.com Trustpilot listing), or weren't reached before
 * this pass was scoped down — left untouched rather than guessed.
 *
 * Idempotent: only appends URLs not already present in sameAs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

const ENRICHMENT = {
  'acebet.html': ['https://www.trustpilot.com/review/acebet.cc'],
  'american-luck.html': ['https://www.trustpilot.com/review/americanluck.com'],
  'big-pirate.html': ['https://www.trustpilot.com/review/bigpirate.com'],
  'card-crush.html': ['https://www.trustpilot.com/review/cardcrush.com'],
  'casino-click.html': ['https://www.trustpilot.com/review/casino.click'],
  'freespin.html': ['https://www.trustpilot.com/review/www.freespin.com'],
  'hello-millions.html': ['https://www.trustpilot.com/review/hellomillions.com'],
  'high5.html': ['https://www.trustpilot.com/review/high5casino.com'],
  'jackpot-go.html': ['https://www.trustpilot.com/review/jackpotgo.com'],
  'jackpota.html': ['https://www.trustpilot.com/review/jackpota.com'],
  'legendz.html': ['https://www.trustpilot.com/review/legendz.com'],
  'pulsz.html': ['https://www.trustpilot.com/review/pulsz.com'],
  'mcluck.html': [
    'https://x.com/McLuckOfficial',
    'https://www.facebook.com/Mcluckdotcom',
    'https://www.instagram.com/mcluck.com.official',
  ],
};

let updated = 0;
for (const [file, urls] of Object.entries(ENRICHMENT)) {
  const path = join(ROOT, 'reviews', file);
  let html = readFileSync(path, 'utf8');
  const blocks = [...html.matchAll(SCRIPT_RE)].map((m) => {
    let json = null;
    try {
      json = JSON.parse(m[1]);
    } catch {
      /* skip */
    }
    return { raw: m[0], json };
  });
  const graphBlock = blocks.find((b) => b.json && Array.isArray(b.json['@graph']));
  if (!graphBlock) {
    console.warn(`  ! ${file}: no @graph block — skipped`);
    continue;
  }
  const brand = graphBlock.json['@graph'].find((n) => n['@type'] === 'Organization' && n['@id'].includes('#brand'));
  if (!brand) {
    console.warn(`  ! ${file}: no brand Organization found — skipped`);
    continue;
  }
  const existing = new Set(brand.sameAs ?? []);
  const before = existing.size;
  for (const u of urls) existing.add(u);
  if (existing.size === before) {
    console.log(`  · ${file}: already up to date`);
    continue;
  }
  brand.sameAs = [...existing];
  const newRaw = `<script type="application/ld+json">${JSON.stringify(graphBlock.json)}</script>`;
  html = html.replace(graphBlock.raw, newRaw);
  writeFileSync(path, html);
  updated++;
  console.log(`  ✓ ${file}: sameAs now [${existing.size}] ${[...existing].join(', ')}`);
}
console.log(`\nReview sameAs enrichment: ${updated}/${Object.keys(ENRICHMENT).length} files updated.`);
