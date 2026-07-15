/**
 * Tracker data access layer.
 *
 * `getTrackerData()` loads the six tracker tables from the read-only Supabase
 * client, with an in-memory cache (per server process / render pass) and a
 * committed baseline fallback so a Supabase outage never breaks the build.
 *
 * Derived helpers (stats, provenance, per-state lookups) live here so pages and
 * API endpoints share one source of truth.
 */
import { getTrackerClient } from './client';
import {
  fallbackAvailability,
  fallbackEvents,
  fallbackNews,
  fallbackOperators,
  fallbackPendingLegislation,
  fallbackStates,
} from './fallback';
import type {
  LegalityEvent,
  NewsItem,
  Operator,
  OperatorAvailability,
  PendingLegislation,
  ProvenanceRecord,
  StateRecord,
  TrackerBundle,
} from './types';

let cache: { bundle: TrackerBundle; at: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes within a warm server process

function maxIso(dates: string[]): string {
  let max = 0;
  for (const d of dates) {
    const t = new Date(d).getTime();
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max > 0 ? new Date(max).toISOString() : new Date().toISOString();
}

function buildFallbackBundle(): TrackerBundle {
  return {
    states: fallbackStates,
    events: fallbackEvents,
    pendingLegislation: fallbackPendingLegislation,
    operators: fallbackOperators,
    availability: fallbackAvailability,
    news: fallbackNews,
    degraded: true,
    generatedAt: maxIso(fallbackStates.map((s) => s.last_auto_updated_at)),
  };
}

async function loadFromSupabase(): Promise<TrackerBundle | null> {
  const client = getTrackerClient();
  if (!client) return null;
  try {
    const [states, events, pendingLegislation, operators, availability, news] = await Promise.all([
      client.from('states').select('*'),
      client.from('legality_events').select('*').order('event_date', { ascending: false }).limit(100),
      client.from('pending_legislation').select('*').order('last_action_date', { ascending: false }),
      client.from('operators').select('*'),
      client.from('operator_availability').select('*'),
      client.from('news_items').select('*').eq('hidden', false).order('published_at', { ascending: false }).limit(100),
    ]);

    if (
      states.error ||
      events.error ||
      pendingLegislation.error ||
      operators.error ||
      availability.error ||
      news.error
    ) {
      return null;
    }
    const stateRows = (states.data as StateRecord[]) ?? [];
    if (stateRows.length === 0) return null;

    return {
      states: stateRows,
      events: (events.data as LegalityEvent[]) ?? [],
      pendingLegislation: (pendingLegislation.data as PendingLegislation[]) ?? [],
      operators: (operators.data as Operator[]) ?? [],
      availability: (availability.data as OperatorAvailability[]) ?? [],
      news: (news.data as NewsItem[]) ?? [],
      degraded: false,
      generatedAt: maxIso(stateRows.map((s) => s.last_auto_updated_at)),
    };
  } catch {
    return null;
  }
}

export async function getTrackerData(): Promise<TrackerBundle> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.bundle;
  const live = await loadFromSupabase();
  const bundle = live ?? buildFallbackBundle();
  cache = { bundle, at: Date.now() };
  return bundle;
}

export async function getStateByCode(code: string): Promise<StateRecord | null> {
  const data = await getTrackerData();
  return data.states.find((s) => s.state_code.toUpperCase() === code.toUpperCase()) ?? null;
}

export async function getStateBySlug(slug: string): Promise<StateRecord | null> {
  const data = await getTrackerData();
  return data.states.find((s) => s.state_slug === slug) ?? null;
}

export function eventsForState(bundle: TrackerBundle, code: string): LegalityEvent[] {
  return bundle.events.filter((e) => e.state_code.toUpperCase() === code.toUpperCase());
}

export function legislationForState(bundle: TrackerBundle, code: string): PendingLegislation[] {
  return bundle.pendingLegislation.filter((b) => b.state_code.toUpperCase() === code.toUpperCase());
}

const DAY_MS = 86400000;

export function wasChangedWithinDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return (Date.now() - t) / DAY_MS <= days;
}

export type TrackerStats = {
  jurisdictions: number;
  changed90d: number;
  activeBills: number;
  bannedCount: number;
  pendingCount: number;
  humanVerifiedEvents: number;
  reviewedWithin7d: number;
  coverage7dPct: number;
  generatedAt: string;
  degraded: boolean;
};

export function computeStats(bundle: TrackerBundle): TrackerStats {
  const jurisdictions = bundle.states.length;
  const changed90d = bundle.states.filter((s) => wasChangedWithinDays(s.sweeps_status_changed_at, 90)).length;
  const reviewedWithin7d = bundle.states.filter((s) => wasChangedWithinDays(s.last_reviewed_at, 7)).length;
  return {
    jurisdictions,
    changed90d,
    activeBills: bundle.pendingLegislation.filter((b) => b.status !== 'dead').length,
    bannedCount: bundle.states.filter((s) => s.sweeps_casino_status === 'banned').length,
    pendingCount: bundle.states.filter((s) => s.sweeps_casino_status === 'pending_ban').length,
    humanVerifiedEvents: bundle.events.filter((e) => e.human_verified).length,
    reviewedWithin7d,
    coverage7dPct: jurisdictions > 0 ? Math.round((reviewedWithin7d / jurisdictions) * 100) : 0,
    generatedAt: bundle.generatedAt,
    degraded: bundle.degraded,
  };
}

/** Derive per-state provenance (mirrors the tracker's /api/provenance.json). */
export function buildProvenance(bundle: TrackerBundle): ProvenanceRecord[] {
  return bundle.states.map((s) => {
    const stateEvents = eventsForState(bundle, s.state_code).sort(
      (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
    );
    const latest = stateEvents[0];
    return {
      state_code: s.state_code,
      state_name: s.state_name,
      state_slug: s.state_slug,
      legality_status: s.sweeps_casino_status,
      confidence: s.sweeps_status_confidence,
      last_reviewed_at: s.last_reviewed_at,
      last_auto_updated_at: s.last_auto_updated_at,
      review_required: s.review_required,
      source_count: s.sources_json.length,
      sources: s.sources_json,
      latest_event: latest
        ? {
            id: latest.id,
            date: latest.event_date,
            title: latest.title,
            source_url: latest.source_url,
            source_publisher: latest.source_publisher,
            human_verified: latest.human_verified,
          }
        : null,
    };
  });
}
