/**
 * POST /api/reader-reports — intake for moderated player experience reports.
 *
 * The browser posts a FormData here; we validate, screen for bots/PII, then
 * insert with the Supabase SERVICE ROLE (status='pending'). Nothing is public
 * until an owner approves it in the Supabase dashboard.
 *
 * Defense in depth: honeypot field + per-IP rate limit + required consent +
 * manual moderation. (Vercel BotID can be layered on later — see the plan.)
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { TESTING_BRAND_BY_SLUG } from '../../data/testingBrands';

const RATE_LIMIT = 5; // submissions
const RATE_WINDOW_MS = 60 * 60 * 1000; // per hour, per hashed IP
const recent = new Map<string, number[]>();

const PII_PATTERNS: RegExp[] = [
  /[^\s@]+@[^\s@]+\.[^\s@]+/, // email
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // phone
  /\b(?:\d[ -]*?){13,16}\b/, // card-like number
];

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clientIpHash(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const ip = fwd.split(',')[0].trim();
  const salt = process.env.READER_REPORTS_SALT ?? 'sweepstakeswiz-static-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

function rateLimited(ipHash: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ipHash) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  recent.set(ipHash, hits);
  return hits.length > RATE_LIMIT;
}

function str(v: FormDataEntryValue | null, max: number): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

function hoursBetween(request?: string | null, payout?: string | null): number | null {
  if (!request || !payout) return null;
  const a = Date.parse(request);
  const b = Date.parse(payout);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round(((b - a) / 3_600_000) * 100) / 100;
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Invalid submission.' }, 400);
  }

  // Honeypot: real users never fill this hidden field.
  if (str(form.get('website'), 100)) return json({ success: true }, 200);

  // Consent is mandatory.
  const consent = String(form.get('consent') ?? '').toLowerCase();
  if (consent !== 'true' && consent !== 'on') {
    return json({ error: 'Please confirm the consent checkbox.' }, 400);
  }

  // Brand must be a known review slug.
  const brandSlug = str(form.get('brand_slug'), 64);
  if (!brandSlug || !TESTING_BRAND_BY_SLUG.has(brandSlug)) {
    return json({ error: 'Please choose a valid casino.' }, 400);
  }

  const comment = str(form.get('comment'), 1200);
  const kyc = str(form.get('kyc_experience'), 200);
  for (const field of [comment, kyc]) {
    if (field && PII_PATTERNS.some((re) => re.test(field))) {
      return json(
        { error: 'Please remove personal details (email, phone, card or account numbers) and resubmit.' },
        400,
      );
    }
  }

  const ratingRaw = str(form.get('rating'), 2);
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (rating != null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return json({ error: 'Invalid rating.' }, 400);
  }

  const requestDate = str(form.get('request_date'), 10);
  const payoutDate = str(form.get('payout_date'), 10);

  const ipHash = clientIpHash(request);
  if (rateLimited(ipHash)) {
    return json({ error: 'Too many submissions. Please try again later.' }, 429);
  }

  const row = {
    brand_slug: brandSlug,
    status: 'pending' as const,
    redemption_method: str(form.get('redemption_method'), 40),
    amount_band: str(form.get('amount_band'), 40),
    request_date: requestDate,
    payout_date: payoutDate,
    hours_to_payout: hoursBetween(requestDate, payoutDate),
    us_state: str(form.get('us_state'), 2)?.toUpperCase() ?? null,
    kyc_experience: kyc,
    rating,
    comment,
    consent: true,
    source_ip_hash: ipHash,
  };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('reader_reports').insert(row);
    if (error) {
      console.error('[reader-reports] insert failed:', error.message);
      return json({ error: 'Could not save your report right now. Please try again later.' }, 500);
    }
  } catch (e) {
    console.error('[reader-reports]', e instanceof Error ? e.message : e);
    return json({ error: 'Reporting is temporarily unavailable.' }, 503);
  }

  return json({ success: true }, 200);
};
