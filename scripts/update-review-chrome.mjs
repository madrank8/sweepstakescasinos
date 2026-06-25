/**
 * One-off maintenance: update the top nav + footer "Legal" column in the
 * hand-authored review pages to reflect the new trust/legal pages and the
 * State Legality hub. Targets only the two bounded, non-nested blocks so it is
 * safe to run across all reviews. Idempotent.
 *
 * Run: node scripts/update-review-chrome.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const reviewsDir = join(process.cwd(), 'reviews');

const NAV_RE = /<div class="site-nav-links" id="navLinks">[\s\S]*?<\/div>/;
const NAV_NEW = `<div class="site-nav-links" id="navLinks">
      <a href="/#offers">Top Casinos</a>
      <a href="/how-we-rate/">How We Rate</a>
      <a href="/state-legality/">State Legality</a>
      <a href="/responsible-gaming/">Responsible Gaming</a>
      <a href="/contact/">Contact</a>
    </div>`;

const LEGAL_RE = /<div class="sf-col">\s*<h4>Legal<\/h4>[\s\S]*?<\/div>/;
const LEGAL_NEW =
  '<div class="sf-col"><h4>Legal</h4>' +
  '<a href="/legal/affiliate-disclosure/">Affiliate Disclosure</a>' +
  '<a href="/legal/privacy/" rel="nofollow">Privacy Policy</a>' +
  '<a href="/legal/terms/" rel="nofollow">Terms of Use</a>' +
  '<a href="/legal/cookie/" rel="nofollow">Cookie Policy</a>' +
  '<a href="/legal/dmca/" rel="nofollow">DMCA</a>' +
  '<a href="/legal/accessibility/">Accessibility</a>' +
  '<a href="/state-legality/">State Legality</a>' +
  '<a href="/sitemap/">Sitemap</a></div>';

let changed = 0;
const skippedNav = [];
const skippedLegal = [];

for (const file of readdirSync(reviewsDir).filter((f) => f.endsWith('.html'))) {
  const path = join(reviewsDir, file);
  const original = readFileSync(path, 'utf8');
  let html = original;

  if (NAV_RE.test(html)) html = html.replace(NAV_RE, NAV_NEW);
  else skippedNav.push(file);

  if (LEGAL_RE.test(html)) html = html.replace(LEGAL_RE, LEGAL_NEW);
  else skippedLegal.push(file);

  if (html !== original) {
    writeFileSync(path, html);
    changed += 1;
  }
}

console.log(`Updated ${changed} review file(s).`);
if (skippedNav.length) console.log(`No site-nav match: ${skippedNav.join(', ')}`);
if (skippedLegal.length) console.log(`No Legal footer col match: ${skippedLegal.join(', ')}`);
