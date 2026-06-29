/**
 * Parse and validate first-party testing CSV results.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { TESTING_BRAND_BY_SLUG, TESTING_CSV_HEADER } from './testingBrands';

export const CouldTest = z.enum(['Y', 'geo-blocked', 'KYC-failed', 'no-redemption']);
export type CouldTestValue = z.infer<typeof CouldTest>;

export const TestingResultRow = z.object({
  brand_slug: z.string(),
  date_tested: z.string(),
  tester_state: z.string(),
  could_test: CouldTest,
  welcome_credited: z.string(),
  promo_code_needed: z.string(),
  redemption_method: z.string(),
  min_redemption: z.string(),
  request_timestamp: z.string(),
  payout_timestamp: z.string(),
  hours_to_payout: z.string(),
  kyc_docs: z.string(),
  kyc_hours: z.string(),
  support_channel: z.string(),
  support_first_response: z.string(),
  support_resolved: z.string(),
  games_ok: z.string(),
  state_availability_ok: z.string(),
  evidence_files: z.string(),
  notes: z.string(),
});

export type TestingResultRow = z.infer<typeof TestingResultRow>;

const EVIDENCE_NAME_RE = /^[a-z0-9-]+-[a-z0-9-]+-\d{8}\.(png|webp|jpg|jpeg)$/i;

/** Parse a simple CSV (handles quoted fields with commas). */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 1) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] ?? '').trim();
    });
    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function loadTestingResultsCsv(cwd = process.cwd()): TestingResultRow[] {
  const path = join(cwd, 'evidence', 'testing-results.csv');
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf8');
  const records = parseCsv(raw);
  return records
    .filter((r) => r.brand_slug)
    .map((r) => TestingResultRow.parse(r));
}

export function computeHoursToPayout(requestTs: string, payoutTs: string): number | null {
  if (!requestTs || !payoutTs) return null;
  const start = Date.parse(requestTs);
  const stop = Date.parse(payoutTs);
  if (Number.isNaN(start) || Number.isNaN(stop) || stop < start) return null;
  return Math.round(((stop - start) / 3_600_000) * 10) / 10;
}

export function parseEvidenceFiles(field: string): string[] {
  if (!field) return [];
  return field
    .split(/[|;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isValidEvidenceFileName(slug: string, filename: string): boolean {
  if (!filename.startsWith(`${slug}-`)) return false;
  return EVIDENCE_NAME_RE.test(filename);
}

export interface ValidationIssue {
  slug: string;
  level: 'error' | 'warn';
  message: string;
}

export function validateTestingRow(
  row: TestingResultRow,
  cwd = process.cwd(),
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { brand_slug: slug } = row;
  const brand = TESTING_BRAND_BY_SLUG.get(slug);

  if (!brand) {
    issues.push({ slug, level: 'error', message: `Unknown brand slug: ${slug}` });
    return issues;
  }

  const reviewPath = join(cwd, brand.reviewPath);
  if (!existsSync(reviewPath)) {
    issues.push({ slug, level: 'error', message: `Review file missing: ${brand.reviewPath}` });
  }

  if (!row.date_tested) {
    issues.push({ slug, level: 'error', message: 'date_tested is required' });
  }

  if (row.could_test === 'Y') {
    const hasPayout = row.request_timestamp && row.payout_timestamp;
    if (!hasPayout && !row.notes) {
      issues.push({
        slug,
        level: 'error',
        message: 'could_test=Y requires payout timestamps or notes explaining partial test',
      });
    }
  }

  const files = parseEvidenceFiles(row.evidence_files);
  const evidenceDir = join(cwd, 'evidence', slug);

  if (row.could_test === 'Y' && files.length === 0) {
    issues.push({ slug, level: 'error', message: 'could_test=Y requires at least one evidence file' });
  }

  for (const file of files) {
    const filePath = join(evidenceDir, file);
    if (!existsSync(filePath)) {
      issues.push({ slug, level: 'error', message: `Evidence file missing: evidence/${slug}/${file}` });
    }
    if (!isValidEvidenceFileName(slug, file)) {
      issues.push({
        slug,
        level: 'warn',
        message: `Evidence file name does not match pattern {slug}-{step}-{YYYYMMDD}.ext: ${file}`,
      });
    }
  }

  if (row.request_timestamp && row.payout_timestamp) {
    const computed = computeHoursToPayout(row.request_timestamp, row.payout_timestamp);
    if (computed !== null && row.hours_to_payout) {
      const stated = parseFloat(row.hours_to_payout);
      if (!Number.isNaN(stated) && Math.abs(stated - computed) > 1) {
        issues.push({
          slug,
          level: 'warn',
          message: `hours_to_payout (${stated}) differs from computed (${computed}h) by >1h`,
        });
      }
    }
  }

  if (/discrepanc/i.test(row.notes)) {
    issues.push({
      slug,
      level: 'warn',
      message: `Notes mention discrepancy — review page claims may need correction: ${row.notes.slice(0, 120)}`,
    });
  }

  return issues;
}

export function validateAllResults(cwd = process.cwd()): {
  rows: TestingResultRow[];
  issues: ValidationIssue[];
} {
  const rows = loadTestingResultsCsv(cwd);
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.brand_slug)) {
      issues.push({
        slug: row.brand_slug,
        level: 'error',
        message: 'Duplicate brand_slug in CSV',
      });
    }
    seen.add(row.brand_slug);
    issues.push(...validateTestingRow(row, cwd));
  }

  return { rows, issues };
}

export function resolvedHoursToPayout(row: TestingResultRow): number | null {
  if (row.hours_to_payout) {
    const n = parseFloat(row.hours_to_payout);
    if (!Number.isNaN(n)) return n;
  }
  return computeHoursToPayout(row.request_timestamp, row.payout_timestamp);
}

export { TESTING_CSV_HEADER };
