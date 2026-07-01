/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by `scripts/aggregate-reader-reports.ts` (npm run reader-reports:aggregate)
 * from APPROVED rows in the Supabase `reader_reports` table. On builds without
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

export const READER_REPORT_AGGREGATES: Record<string, ReaderReportAggregate> = {};

export const READER_REPORTS_GENERATED_AT: string | null = null;
