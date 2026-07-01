/**
 * Renders the "Reader Reports" section injected into every review: aggregated,
 * moderated player-reported data (Class A — never first-party testing) plus the
 * submission form. Aggregates come from the build-time generated data file.
 *
 * AggregateRating JSON-LD is intentionally NOT emitted until a brand reaches
 * SCHEMA_MIN approved reports (avoids thin/manipulable markup); see plan §6.
 */
import { READER_REPORT_AGGREGATES } from '../data/readerReports.generated';
import { renderReaderReportForm } from './readerReportForm';
import { TESTING_BRAND_BY_SLUG } from '../data/testingBrands';

const SCHEMA_MIN = 10;

function fmtHours(h: number | null): string | null {
  if (h == null) return null;
  if (h < 48) return `~${Math.round(h)}h`;
  return `~${Math.round(h / 24)} days`;
}

export function hasSchemaThreshold(slug: string): boolean {
  const agg = READER_REPORT_AGGREGATES[slug];
  return !!agg && agg.count >= SCHEMA_MIN && agg.avgRating != null;
}

export function renderReaderReportBlock(slug: string): string {
  const brand = TESTING_BRAND_BY_SLUG.get(slug);
  const name = brand?.name ?? slug;
  const agg = READER_REPORT_AGGREGATES[slug];

  let stats: string;
  if (agg && agg.count > 0) {
    const bits: string[] = [];
    const median = fmtHours(agg.medianHours);
    if (median) bits.push(`median payout <strong>${median}</strong>`);
    if (agg.avgRating != null) bits.push(`average rating <strong>${agg.avgRating.toFixed(1)}/5</strong>`);
    const topMethod = Object.entries(agg.methods).sort((a, b) => b[1] - a[1])[0];
    if (topMethod) bits.push(`most-reported method <strong>${topMethod[0]}</strong>`);
    const summary = bits.length ? `${bits.join(' &#183; ')} ` : '';
    const asOf = agg.lastReport ? `, as of ${agg.lastReport}` : '';
    stats = `<div class="rr-stat">&#128202; <strong>Player-reported:</strong> ${summary}across <strong>${agg.count}</strong> reader report${agg.count === 1 ? '' : 's'}${asOf}.</div>`;
  } else {
    stats = `<div class="rr-stat rr-stat--empty">No reader reports for ${name} yet &#8212; be the first to share your experience below.</div>`;
  }

  const form = renderReaderReportForm({ brandSlug: slug, brandName: name });

  return `
<section id="reader-reports" class="reader-reports">
  <h2>&#128172; Reader Reports</h2>
  <p class="rr-intro">Real, moderated player experiences we&#8217;ve collected for ${name}. This is aggregated <strong>player-reported</strong> data &#8212; not first-party testing.</p>
  ${stats}
  ${form}
</section>
<style>
  .reader-reports{max-width:880px;margin:28px auto;padding:0 4px;}
  .reader-reports h2{font-size:1.35rem;font-weight:800;margin:0 0 6px;}
  .reader-reports .rr-intro{font-size:.92rem;color:#475569;line-height:1.6;margin:0 0 12px;}
  .reader-reports .rr-stat{font-size:.95rem;background:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #1a56db;border-radius:10px;padding:12px 16px;margin:0 0 6px;color:#1e3a8a;}
  .reader-reports .rr-stat--empty{background:#f8fafc;border-color:#e2e8f0;border-left-color:#94a3b8;color:#475569;}
</style>
`;
}

/**
 * Insert the Reader Reports section at the end of the article body (before the
 * last </main>, falling back to </body>). Safe to call on any review HTML.
 */
export function injectReaderReports(html: string, slug: string): string {
  const block = renderReaderReportBlock(slug);
  const i = html.lastIndexOf('</main>');
  if (i !== -1) return html.slice(0, i) + block + html.slice(i);
  const b = html.lastIndexOf('</body>');
  if (b !== -1) return html.slice(0, b) + block + html.slice(b);
  return html + block;
}
