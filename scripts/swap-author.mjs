/* Swap site author Steffen Nadel -> Ilija Milosevic across reviews + author page. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const repl = [
  ['Steffen Nadel', 'Ilija Milosevic'],
  ['/author/steffen-nadel/', '/author/ilija-milosevic/'],
  ['linkedin.com/in/steffen-nadel', 'linkedin.com/in/ilija-milosevic-hiperion'],
  ['"jobTitle":"US Sweepstakes Casino Analyst"', '"jobTitle":"iGaming SEO Writer"'],
  ['"jobTitle": "US Sweepstakes Casino Analyst"', '"jobTitle": "iGaming SEO Writer"'],
  ['"description":"Analyst covering US sweepstakes casino bonuses, KYC and redemption policies."',
   '"description":"iGaming SEO writer with 8+ years creating search-driven casino, slot, and sportsbook reviews and affiliate content."']
];

const files = [];
const rdir = join(root, 'reviews');
for (const f of readdirSync(rdir)) if (f.endsWith('.html')) files.push(join(rdir, f));
if (existsSync(join(root, 'author', 'steffen-nadel.html'))) files.push(join(root, 'author', 'steffen-nadel.html'));

let changed = 0;
for (const p of files) {
  let html = readFileSync(p, 'utf8');
  const before = html;
  for (const [a, b] of repl) html = html.split(a).join(b);
  if (html !== before) { writeFileSync(p, html); changed++; }
}
console.log(`Author swap applied to ${changed} files.`);
