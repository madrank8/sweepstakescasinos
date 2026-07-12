/**
 * Read-only Supabase client for the Sweepstakes Legality Tracker dataset.
 *
 * This points at the EXISTING SweepDogs tracker Supabase project (kept fresh by
 * the daily n8n pipeline) and is intentionally separate from the Wiz
 * reader-reports admin client in src/lib/supabaseAdmin.ts. It uses the ANON key
 * only and never writes.
 *
 * Required env (Vercel project settings + local `.env`):
 *   TRACKER_SUPABASE_URL        e.g. https://xxxx.supabase.co
 *   TRACKER_SUPABASE_ANON_KEY   public anon key from the tracker project
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

function env(name: string): string | undefined {
  // Astro exposes server env via import.meta.env; Vercel functions via process.env.
  return (import.meta.env as Record<string, string | undefined>)[name] ?? process.env[name];
}

/** Returns the read-only tracker client, or null when creds are absent. */
export function getTrackerClient(): SupabaseClient | null {
  const url = env('TRACKER_SUPABASE_URL');
  const key = env('TRACKER_SUPABASE_ANON_KEY');
  if (!url || !key) return null;
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
