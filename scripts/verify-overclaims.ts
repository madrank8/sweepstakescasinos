/**
 * CI gate: overclaim-flagged review HTML must not still match OVERCLAIM_PATTERNS.
 * Run: npm run testing:verify-overclaims
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TESTING_BRANDS } from '../src/data/testingBrands';
import { documentedTestingSlugs } from './seo/audit-core';
import { findUnsupportedTestingClaims } from './seo/claim-policy';

const cwd = process.cwd();
const flagged = TESTING_BRANDS.filter((b) => b.overclaimFlag);
const documented = documentedTestingSlugs(cwd);

let failures = 0;

console.log('\n=== Overclaim language gate ===\n');
console.log(`Checking ${flagged.length} overclaim-flagged review(s)…\n`);

for (const brand of flagged) {
  const path = join(cwd, brand.reviewPath);
  if (!existsSync(path)) {
    console.error(`  ✗ ${brand.slug}: missing ${brand.reviewPath}`);
    failures += 1;
    continue;
  }
  const html = readFileSync(path, 'utf8');
  const hits = findUnsupportedTestingClaims(
    html,
    brand.reviewPath,
    documented.has(brand.slug),
  );

  if (hits.length) {
    console.error(`  ✗ ${brand.slug}: ${hits.length} pattern hit(s)`);
    for (const hit of hits.slice(0, 5)) {
      console.error(`      - ${hit.phrase} at ${hit.path}:${hit.line} (${hit.surface})`);
    }
    failures += 1;
  } else {
    console.log(`  ✓ ${brand.slug}`);
  }
}

console.log('');
if (failures > 0) {
  console.error(
    `FAILED — ${failures} review(s) still match overclaim patterns. Run:\n` +
      `  npm run testing:apply -- --soften-overclaims\n`,
  );
  process.exit(1);
}
console.log('PASSED — no overclaim patterns remain on flagged reviews.\n');
