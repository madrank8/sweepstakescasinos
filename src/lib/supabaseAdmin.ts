/**
 * Server-only Supabase client using the SERVICE ROLE key.
 *
 * The browser never talks to Supabase — reader-report submissions go through
 * our `/api/reader-reports` endpoint, which uses this admin client to insert
 * rows (bypassing RLS). The service-role key must NEVER be exposed to the
 * client, so it is read from a non-`PUBLIC_` env var.
 *
 * Required env (set in Vercel project settings + local `.env`):
 *   SUPABASE_URL                 e.g. https://ybedkkpunwrtthvffcra.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    from Supabase dashboard → Project Settings → API
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

function env(name: string): string | undefined {
  // Astro exposes server env via import.meta.env; Vercel functions via process.env.
  return (import.meta.env as Record<string, string | undefined>)[name] ?? process.env[name];
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
