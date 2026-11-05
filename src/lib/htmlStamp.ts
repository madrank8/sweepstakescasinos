import { reviewSourceDates } from '../data/operators';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function utcParts(isoDate: string): { monthYear: string; longDate: string; iso: string } {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return {
    monthYear: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date),
    longDate: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date),
    iso: `${isoDate}T00:00:00Z`,
  };
}

/** Replace the `__UPDATED_DATE__` token with the current "Month YYYY". */
export function stampUpdatedDate(html: string, now: Date = new Date()): string {
  const stamp = `${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
  return html.replaceAll('__UPDATED_DATE__', stamp);
}

/**
 * Sync review freshness (ribbon, hero tag, byline, JSON-LD, article:modified_time)
 * from the operator's authored modifiedOn date.
 */
export function stampReviewFreshness(html: string, slug: string): string {
  const dates = reviewSourceDates(slug);
  if (!dates) return html;
  const { monthYear, longDate, iso } = utcParts(dates.modifiedOn);
  let out = html.replaceAll('__UPDATED_DATE__', monthYear);
  out = out.replace(
    /(<span class="tag tt"><span class="dot"><\/span>\s*Updated )[A-Za-z]+ \d{4}/g,
    `$1${monthYear}`,
  );
  out = out.replace(/(Updated )[A-Za-z]+ \d{1,2}, \d{4}/g, `$1${longDate}`);
  out = out.replace(/"dateModified":"[^"]+"/g, `"dateModified":"${iso}"`);
  if (/property="article:modified_time"/.test(out)) {
    out = out.replace(
      /property="article:modified_time" content="[^"]*"/,
      `property="article:modified_time" content="${iso}"`,
    );
  } else {
    out = out.replace(
      /(<meta property="article:published_time" content="[^"]*">)/,
      `$1\n<meta property="article:modified_time" content="${iso}">`,
    );
  }
  return out;
}
