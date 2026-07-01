/**
 * Enforce the rating-methodology single source of truth (spec §6).
 *
 * `src/data/ratingMethodology.ts` is canonical. Both surfaces that display the
 * criteria — the homepage rate section (`index.html`) and `/how-we-rate/`
 * (`how-we-rate.html`) — must show the SAME criterion names and weights.
 *
 * This guards against the drift that previously left the homepage (4 criteria)
 * and how-we-rate (7 criteria) describing the same system differently.
 *
 * Run: npm run methodology:check   (also part of prebuild + `npm run ci`)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RATING_CRITERIA, RATING_WEIGHT_TOTAL } from '../src/data/ratingMethodology';

const root = process.cwd();

const SURFACES = [
  { label: 'homepage', file: 'index.html' },
  { label: 'how-we-rate', file: 'how-we-rate.html' },
];

/** Decode the few HTML entities we use in criterion names + collapse whitespace. */
function normalize(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;|\u2019/g, "'")
    .replace(/\s+/g, ' ');
}

const errors: string[] = [];

if (RATING_WEIGHT_TOTAL !== 100) {
  errors.push(`Criterion weights sum to ${RATING_WEIGHT_TOTAL}, expected 100.`);
}

for (const surface of SURFACES) {
  let content: string;
  try {
    content = normalize(readFileSync(join(root, surface.file), 'utf8'));
  } catch {
    errors.push(`Cannot read ${surface.file}`);
    continue;
  }
  for (const c of RATING_CRITERIA) {
    if (!content.includes(c.name)) {
      errors.push(`${surface.file}: missing criterion name "${c.name}"`);
    }
    if (!content.includes(`${c.weight}%`)) {
      errors.push(`${surface.file}: missing weight "${c.weight}%" for "${c.name}"`);
    }
  }
}

console.log('\n=== Rating-methodology consistency (single source of truth) ===\n');

if (errors.length === 0) {
  console.log(
    `✅ All ${RATING_CRITERIA.length} criteria (weights total ${RATING_WEIGHT_TOTAL}%) match on every surface.\n`,
  );
  process.exit(0);
}

console.error('✗ Methodology drift detected:\n');
for (const e of errors) console.error(`  - ${e}`);
console.error(
  '\nEdit src/data/ratingMethodology.ts and update index.html + how-we-rate.html to match.\n',
);
process.exit(1);
