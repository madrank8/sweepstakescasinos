/**
 * Validate first-party testing CSV + evidence files.
 * Run: npm run testing:verify
 */
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TESTING_BRANDS } from '../src/data/testingBrands';
import { validateAllResults, loadTestingResultsCsv } from '../src/data/testingResults';

const args = process.argv.slice(2);
const statusOnly = args.includes('--status-only');
const cwd = process.cwd();

const { rows, issues } = validateAllResults(cwd);
const errors = issues.filter((i) => i.level === 'error');
const warns = issues.filter((i) => i.level === 'warn');

const rowBySlug = new Map(rows.map((r) => [r.brand_slug, r]));

function statusForSlug(slug: string): string {
  const row = rowBySlug.get(slug);
  if (!row) return 'pending';
  if (errors.some((e) => e.slug === slug)) return 'invalid';
  return row.could_test === 'Y' ? 'hands-on complete' : `partial (${row.could_test})`;
}

const statusLines = [
  '# Testing Progress',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '| Batch | Brand | Slug | Partner | Overclaim | Status |',
  '|-------|-------|------|---------|-----------|--------|',
  ...TESTING_BRANDS.map((b) => {
    const partner = b.isPartner ? '★' : '—';
    const oc = b.overclaimFlag ? '⚠' : '—';
    return `| ${b.batch} | ${b.name} | \`${b.slug}\` | ${partner} | ${oc} | ${statusForSlug(b.slug)} |`;
  }),
  '',
  `**Summary:** ${rows.length} CSV rows · ${rows.filter((r) => r.could_test === 'Y').length} hands-on · ${errors.length} errors · ${warns.length} warnings`,
];

const statusPath = join(cwd, 'evidence', 'STATUS.md');
writeFileSync(statusPath, statusLines.join('\n') + '\n');

console.log('\n=== First-Party Testing Validation ===\n');
console.log(`CSV rows: ${rows.length}`);
console.log(`Status written: evidence/STATUS.md\n`);

for (const b of TESTING_BRANDS) {
  const st = statusForSlug(b.slug);
  const icon = st === 'pending' ? '○' : st === 'invalid' ? '✗' : '✓';
  console.log(`  ${icon} [B${b.batch}] ${b.slug}: ${st}`);
}

if (errors.length) {
  console.log('\n--- Errors ---');
  for (const e of errors) console.error(`  ✗ [${e.slug}] ${e.message}`);
}
if (warns.length) {
  console.log('\n--- Warnings ---');
  for (const w of warns) console.warn(`  ! [${w.slug}] ${w.message}`);
}

if (!statusOnly) {
  if (!existsSync(join(cwd, 'evidence', 'testing-results.csv'))) {
    console.log('\nNote: evidence/testing-results.csv not found (optional until tests begin).');
  }
}

console.log('');
if (errors.length > 0) {
  console.error(`FAILED — ${errors.length} error(s)\n`);
  process.exit(1);
}
console.log('PASSED\n');
