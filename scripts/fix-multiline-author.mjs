/* Catch multi-line JSON-LD author Organization blocks + <meta name="author"> that the
   single-line pass missed (bespoke reviews: sweepico, rolla, big-pirate). Idempotent. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'reviews');
const personMultiline = `"author": {
    "@type": "Person",
    "name": "Steffen Nadel",
    "jobTitle": "US Sweepstakes Casino Analyst",
    "url": "https://sweepastro.vercel.app/author/steffen-nadel/",
    "sameAs": ["https://www.linkedin.com/in/steffen-nadel"]
  }`;

let changed = 0;
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.html')) continue;
  const p = join(dir, f);
  let html = readFileSync(p, 'utf8');
  const before = html;

  // meta author -> Steffen Nadel
  html = html.replace(/<meta name="author" content="[^"]*Editorial Team[^"]*">/g,
    '<meta name="author" content="Steffen Nadel">');

  // multi-line JSON-LD author Organization -> Person
  html = html.replace(
    /"author":\s*\{\s*"@type":\s*"Organization",\s*"name":\s*"[^"]*Editorial Team",\s*"url":\s*"[^"]*"\s*\}/,
    personMultiline
  );

  if (html !== before) { writeFileSync(p, html); changed++; }
}
console.log(`Multi-line author fix applied to ${changed} files.`);
