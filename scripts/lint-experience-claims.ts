/**
 * Pre-publish gate for unsupported first-hand/testing language.
 *
 * Classification is evidence-aware: valid first-party evidence permits
 * accurately scoped labels, and explicit operator/laboratory/reader
 * attribution is retained. Unsupported title/H1/meta/body implications fail.
 *
 * Run: npm run content:lint   (also part of `npm run ci`)
 */
import { scanTestingClaims } from './seo/audit-core';

const violations = scanTestingClaims(process.cwd()).filter(
  (claim) => claim.classification === 'UNSUPPORTED',
);

console.log('\n=== Experience-claim lint (Class A/B) ===\n');

if (violations.length === 0) {
  console.log('✅ No unlabeled first-party (Class B) claims found.\n');
  process.exit(0);
}

console.error(`✗ ${violations.length} unlabeled Class B claim(s) found:\n`);
for (const v of violations) {
  console.error(`  ${v.path}:${v.line}  [${v.phrase}; ${v.surface}]`);
  console.error(`     ${v.context.slice(0, 160)}`);
}
console.error(
  '\nEditorial/aggregated content must not imply undocumented first-hand experience.',
);
console.error(
  'Use precise source attribution, or add valid testing evidence before a first-hand label.',
);
process.exit(1);
