/**
 * Shared response helpers for the public tracker API endpoints.
 * All endpoints are read-only, CORS-open, and advertise the CC-BY 4.0 license.
 */
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';

function baseHeaders(contentType: string): Record<string, string> {
  return {
    'content-type': contentType,
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'cache-control': 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400',
    link: `<${LICENSE}>; rel="license"`,
  };
}

export function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: baseHeaders('application/json; charset=utf-8'),
  });
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      ...baseHeaders('text/csv; charset=utf-8'),
      'content-disposition': `inline; filename="${filename}"`,
    },
  });
}

/** RFC-4180-safe CSV cell. */
export function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
