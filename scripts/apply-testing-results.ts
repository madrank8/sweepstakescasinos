/**
 * Apply validated first-party testing results to review HTML pages.
 * Run: npm run testing:apply -- [--slug crown-coins] [--dry-run] [--force] [--soften-overclaims]
 */
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { TESTING_BRAND_BY_SLUG, TESTING_BRANDS } from '../src/data/testingBrands';
import {
  loadTestingResultsCsv,
  parseEvidenceFiles,
  validateTestingRow,
  type TestingResultRow,
} from '../src/data/testingResults';
import {
  appendPayoutTestedRow,
  buildDisclosureEditorial,
  buildDisclosureHandsOn,
  buildFaqProducedHandsOn,
  buildFaqProducedSoften,
  buildHandsOnSection,
  buildPayoutTestedCell,
  bumpDateModified,
  formatHeroMeta,
  insertAfterMarker,
  patchBetweenMarkers,
  patchDisclosureCallout,
  patchFaqProduced,
  patchHeroMetaSuffix,
  prependReviewBodyMeasured,
  publicScreenshotPath,
  softenOverclaimHtml,
  todayIsoDate,
} from '../src/lib/testingFragments';

const cwd = process.cwd();
const args = process.argv.slice(2);

function argValue(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const softenOnly = args.includes('--soften-overclaims');
const slugFilter = argValue('--slug');

function copyEvidenceToPublic(row: TestingResultRow): string[] {
  const files = parseEvidenceFiles(row.evidence_files);
  const destDir = join(cwd, 'testing', row.brand_slug);
  mkdirSync(destDir, { recursive: true });
  const urls: string[] = [];
  for (const file of files) {
    const src = join(cwd, 'evidence', row.brand_slug, file);
    const dest = join(destDir, file);
    if (!existsSync(src)) continue;
    if (!dryRun) copyFileSync(src, dest);
    urls.push(publicScreenshotPath(row.brand_slug, file));
  }
  return urls;
}

function patchReviewBodyJsonLd(html: string, row: TestingResultRow): string {
  return html.replace(/"reviewBody":"([^"]*)"/, (_, body: string) => {
    const updated = prependReviewBodyMeasured(body, row);
    const escaped = updated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"reviewBody":"${escaped}"`;
  });
}

function applyUpgrade(html: string, row: TestingResultRow): string {
  const screenshotUrls = copyEvidenceToPublic(row);
  let out = html;

  const heroSuffix = formatHeroMeta(row, true);
  out = patchHeroMetaSuffix(out, heroSuffix);

  const handsOnBlock = buildHandsOnSection(row, screenshotUrls);
  out = patchBetweenMarkers(out, 'hands-on', handsOnBlock);

  const payoutRow = buildPayoutTestedCell(row);
  if (payoutRow) out = appendPayoutTestedRow(out, payoutRow);

  out = patchDisclosureCallout(out, buildDisclosureHandsOn(row));
  out = patchFaqProduced(out, buildFaqProducedHandsOn(row));
  out = patchReviewBodyJsonLd(out, row);
  out = bumpDateModified(out, row.date_tested || todayIsoDate());

  return out;
}

function applySoften(html: string, row: TestingResultRow): string {
  let out = softenOverclaimHtml(html);
  const date = row.date_tested || todayIsoDate();
  out = patchHeroMetaSuffix(out, formatHeroMeta(row, false));
  out = patchFaqProduced(out, buildFaqProducedSoften(row));
  out = patchDisclosureCallout(out, buildDisclosureEditorial(date));
  out = bumpDateModified(out, date);
  return out;
}

function applySoftenOverclaimsOnly(html: string): string {
  return softenOverclaimHtml(html);
}

function processBrand(slug: string, row: TestingResultRow | undefined): boolean {
  const brand = TESTING_BRAND_BY_SLUG.get(slug);
  if (!brand) {
    console.error(`Unknown slug: ${slug}`);
    return false;
  }

  const reviewPath = join(cwd, brand.reviewPath);
  if (!existsSync(reviewPath)) {
    console.error(`Review not found: ${brand.reviewPath}`);
    return false;
  }

  if (row && !force) {
    const issues = validateTestingRow(row, cwd).filter((i) => i.level === 'error');
    if (issues.length) {
      console.error(`Validation failed for ${slug}:`);
      for (const i of issues) console.error(`  ✗ ${i.message}`);
      return false;
    }
  }

  let html = readFileSync(reviewPath, 'utf8');
  const before = html;

  if (softenOnly) {
    // Honest-language pass: strip fabricated first-hand claims regardless of
    // any CSV row. Never re-applies hands-on data in soften mode.
    html = applySoftenOverclaimsOnly(html);
  } else if (!row) {
    console.log(`Skip ${slug} — no CSV row`);
    return true;
  } else if (row.could_test === 'Y') {
    html = applyUpgrade(html, row);
  } else {
    html = applySoften(html, row);
  }

  if (html === before) {
    console.log(`No changes: ${slug}`);
    return true;
  }

  if (dryRun) {
    console.log(`[dry-run] Would update: ${brand.reviewPath} (${html.length - before.length} chars delta)`);
    return true;
  }

  writeFileSync(reviewPath, html);
  console.log(`Updated: ${brand.reviewPath}`);
  return true;
}

// Pre-flight: verify unless force or soften-only without rows
if (!force && !softenOnly) {
  const rows = loadTestingResultsCsv(cwd);
  const toCheck = slugFilter ? rows.filter((r) => r.brand_slug === slugFilter) : rows;
  let failed = false;
  for (const row of toCheck) {
    const issues = validateTestingRow(row, cwd).filter((i) => i.level === 'error');
    if (issues.length) {
      failed = true;
      console.error(`\nValidation errors for ${row.brand_slug}:`);
      for (const i of issues) console.error(`  ✗ ${i.message}`);
    }
  }
  if (failed && !dryRun) {
    console.error('\nAborting — fix errors or pass --force\n');
    process.exit(1);
  }
}

const rows = loadTestingResultsCsv(cwd);
const rowMap = new Map(rows.map((r) => [r.brand_slug, r]));

let slugs: string[];
if (slugFilter) {
  slugs = [slugFilter];
} else if (softenOnly) {
  // Apply the honest-language pass to every review, not just flagged ones.
  slugs = TESTING_BRANDS.map((b) => b.slug);
} else {
  slugs = rows.map((r) => r.brand_slug);
}

let ok = true;
for (const slug of slugs) {
  if (!processBrand(slug, rowMap.get(slug))) ok = false;
}

if (!ok) process.exit(1);
console.log(dryRun ? '\nDry run complete.\n' : '\nApply complete.\n');
