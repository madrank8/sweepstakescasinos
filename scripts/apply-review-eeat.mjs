/* Uniform E-E-A-T + disclosure cleanup across review pages (skips crown-coins, already done).
   - JSON-LD author Organization -> Person Steffen Nadel + publisher; bump dateModified
   - Byline "Editorial Team" -> linked Steffen Nadel; soften fabricated "Hands-on ... test" claim
   - Prepend AI-assistance disclosure into the existing Affiliate disclosure block
*/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'reviews');
const AUTHOR_JSONLD = '"author":{"@type":"Person","name":"Steffen Nadel","jobTitle":"US Sweepstakes Casino Analyst","url":"https://sweepstakeswiz.com/author/steffen-nadel/","sameAs":["https://www.linkedin.com/in/steffen-nadel"]},"publisher":{"@type":"Organization","name":"Sweepstakes Wiz","url":"https://sweepstakeswiz.com/"}';
const BYLINE = 'By <strong><a href="/author/steffen-nadel/" rel="author" style="color:inherit">Steffen Nadel</a></strong>';
const AI_NOTE = 'This review is AI-assisted and human-edited &#8212; no fabricated testing or &#8220;verified player&#8221; testimonials are presented as fact. ';

let changed = 0;
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.html') || f === 'crown-coins.html') continue;
  const p = join(dir, f);
  let html = readFileSync(p, 'utf8');
  const before = html;

  // 1) JSON-LD author Organization -> Person + publisher
  html = html.replace(
    /"author":\{"@type":"Organization","name":"[^"]*","url":"[^"]*"\}/,
    AUTHOR_JSONLD
  );
  // 2) dateModified bump (publish date preserved)
  html = html.replace(/"dateModified":"2026-05-20"/, '"dateModified":"2026-06-24"');

  // 3) Byline name
  html = html.split('By <strong>Editorial Team</strong>').join(BYLINE);

  // 4) Soften fabricated first-hand-testing byline claims
  html = html.split('Hands-on platform test').join('Editorial analysis');
  html = html.split('Hands-on test').join('Editorial analysis');

  // 5) AI disclosure inside existing affiliate disclosure (once)
  if (!html.includes('AI-assisted and human-edited')) {
    html = html.replace('<strong>Affiliate disclosure:</strong> ', `<strong>Affiliate disclosure:</strong> ${AI_NOTE}`);
  }

  if (html !== before) { writeFileSync(p, html); changed++; }
}
console.log(`E-E-A-T cleanup applied to ${changed} review files.`);
