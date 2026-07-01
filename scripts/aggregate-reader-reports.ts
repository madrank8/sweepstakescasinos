/**
 * Aggregate APPROVED reader reports into src/data/readerReports.generated.ts.
 *
 * Runs in prebuild. Resilient by design: if Supabase creds are absent (local
 * builds) or the query fails, it logs and exits 0 WITHOUT touching the existing
 * generated file — so it can never break a deploy.
 *
 * Run: npm run reader-reports:aggregate
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Row {
  brand_slug: string;
  hours_to_payout: number | null;
  rating: number | null;
  redemption_method: string | null;
  created_at: string;
}

interface Aggregate {
  count: number;
  medianHours: number | null;
  avgRating: number | null;
  methods: Record<string, number>;
  lastReport: string | null;
}

const OUT = join(process.cwd(), 'src', 'data', 'readerReports.generated.ts');

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  const val = s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  return Math.round(val * 100) / 100;
}

function build(rows: Row[]): Record<string, Aggregate> {
  const byBrand = new Map<string, Row[]>();
  for (const r of rows) {
    if (!byBrand.has(r.brand_slug)) byBrand.set(r.brand_slug, []);
    byBrand.get(r.brand_slug)!.push(r);
  }
  const out: Record<string, Aggregate> = {};
  for (const [slug, rs] of byBrand) {
    const hours = rs.map((r) => r.hours_to_payout).filter((h): h is number => h != null);
    const ratings = rs.map((r) => r.rating).filter((n): n is number => n != null);
    const methods: Record<string, number> = {};
    for (const r of rs) {
      if (r.redemption_method) methods[r.redemption_method] = (methods[r.redemption_method] ?? 0) + 1;
    }
    const lastReport = rs
      .map((r) => r.created_at?.slice(0, 10))
      .filter(Boolean)
      .sort()
      .pop() ?? null;
    out[slug] = {
      count: rs.length,
      medianHours: median(hours),
      avgRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100 : null,
      methods,
      lastReport,
    };
  }
  return out;
}

function render(aggregates: Record<string, Aggregate>): string {
  return `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by \`scripts/aggregate-reader-reports.ts\` (npm run reader-reports:aggregate)
 * from APPROVED rows in the Supabase \`reader_reports\` table. On builds without
 * Supabase creds (e.g. local without .env), aggregation is skipped and this file
 * is left as-is. Committed for auditability; regenerated on each Vercel build.
 */

export interface ReaderReportAggregate {
  count: number;
  medianHours: number | null;
  avgRating: number | null;
  methods: Record<string, number>;
  lastReport: string | null; // YYYY-MM-DD
}

export const READER_REPORT_AGGREGATES: Record<string, ReaderReportAggregate> = ${JSON.stringify(aggregates, null, 2)};

export const READER_REPORTS_GENERATED_AT: string | null = ${JSON.stringify(new Date().toISOString())};
`;
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('[reader-reports] No Supabase creds — skipping aggregation (existing data file kept).');
    return;
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from('reader_reports')
    .select('brand_slug,hours_to_payout,rating,redemption_method,created_at')
    .eq('status', 'approved');
  if (error) {
    console.warn('[reader-reports] Query failed, keeping existing data file:', error.message);
    return;
  }
  const rows = (data ?? []) as Row[];
  const aggregates = build(rows);
  writeFileSync(OUT, render(aggregates));
  console.log(
    `[reader-reports] Aggregated ${rows.length} approved report(s) across ${Object.keys(aggregates).length} brand(s).`,
  );
}

main().catch((e) => {
  console.warn('[reader-reports] Aggregation error (non-fatal):', e instanceof Error ? e.message : e);
});
