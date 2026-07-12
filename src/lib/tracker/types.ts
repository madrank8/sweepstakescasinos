/**
 * Sweepstakes Legality Tracker — data model.
 *
 * Ported from the standalone SweepDogs tracker (Next.js + Supabase) so the Wiz
 * site can read the SAME Supabase project natively. These types mirror the six
 * Postgres tables that the daily n8n pipeline (LegiScan + Google News) keeps
 * fresh. Nothing here is authoritative for affiliate-CTA suppression — that
 * remains governed by src/data/geo.ts. The tracker is authoritative only for
 * DISPLAYED legal status, pending legislation, sources, and freshness.
 */

export type SweepsCasinoStatus =
  | 'legal_unregulated'
  | 'gray'
  | 'restricted'
  | 'banned'
  | 'pending_ban';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type AvailabilityStatus =
  | 'available'
  | 'restricted'
  | 'banned'
  | 'pending_exit'
  | 'never_offered';

export type LegislationDirection = 'anti_sweeps' | 'pro_sweeps' | 'neutral';

export type LegislationStatus =
  | 'introduced'
  | 'committee'
  | 'passed_chamber'
  | 'signed'
  | 'dead';

export type EventSeverity = 'critical' | 'high' | 'medium' | 'info';
export type EventDirection = 'restrictive' | 'permissive' | 'neutral';

export type StateRecord = {
  state_code: string;
  state_name: string;
  state_slug: string;
  wikidata_id: string | null;
  sweeps_casino_status: SweepsCasinoStatus;
  sweeps_status_confidence: ConfidenceLevel;
  sweeps_status_changed_at: string;
  sweeps_status_summary: string;
  sweeps_status_full_text: string;
  real_money_casino: string;
  sportsbook_status: string;
  dfs_status: string;
  lottery_status: string;
  social_casino_status: string;
  state_ag_url: string | null;
  gaming_authority_url: string | null;
  gaming_authority_name: string | null;
  sources_json: string[];
  last_reviewed_at: string;
  last_auto_updated_at: string;
  review_required: boolean;
};

export type LegalityEvent = {
  id: string;
  state_code: string;
  event_date: string;
  event_type: string;
  title: string;
  summary: string;
  full_summary: string;
  source_url: string;
  source_publisher: string;
  severity: EventSeverity;
  direction: EventDirection;
  operators_affected: string[];
  ai_classified: boolean;
  human_verified: boolean;
  created_at: string;
};

export type PendingLegislation = {
  bill_id: string;
  state_code: string;
  bill_number: string;
  title: string;
  summary: string;
  sponsor: string;
  sponsors_full: Array<Record<string, string>>;
  status: LegislationStatus;
  status_label: string;
  direction: LegislationDirection;
  last_action_date: string;
  last_action_text: string;
  bill_url: string;
  state_bill_url: string;
  introduced_date: string;
  keywords_matched: string[];
  ai_classified: boolean;
  human_verified: boolean;
};

export type Operator = {
  operator_slug: string;
  name: string;
  parent_company: string | null;
  parent_company_url: string | null;
  launch_year: number | null;
  logo_url: string | null;
  description: string;
  website_url: string;
  is_publicly_traded: boolean;
  ticker: string | null;
  sweepdogs_review_url: string | null;
  sweepdogs_rating: number | null;
};

export type OperatorAvailability = {
  operator_slug: string;
  state_code: string;
  status: AvailabilityStatus;
  last_verified_at: string;
  notes: string | null;
};

export type NewsItem = {
  id: string;
  url: string;
  headline: string;
  publisher: string;
  publisher_authority: 'tier1' | 'tier2' | 'industry' | 'blog';
  published_at: string;
  states_affected: string[];
  operators_affected: string[];
  category: 'regulatory' | 'litigation' | 'operator_news' | 'industry' | 'consumer';
  relevance_score: number;
  summary: string;
  ai_classified: boolean;
  hidden: boolean;
};

export type TrackerBundle = {
  states: StateRecord[];
  events: LegalityEvent[];
  pendingLegislation: PendingLegislation[];
  operators: Operator[];
  availability: OperatorAvailability[];
  news: NewsItem[];
  /** True when the bundle is the committed baseline (Supabase unavailable). */
  degraded: boolean;
  /** Max last_auto_updated_at across states, ISO 8601. */
  generatedAt: string;
};

/** Per-state provenance record derived from events + sources (mirrors /api/provenance.json). */
export type ProvenanceRecord = {
  state_code: string;
  state_name: string;
  state_slug: string;
  legality_status: SweepsCasinoStatus;
  confidence: ConfidenceLevel;
  last_reviewed_at: string;
  last_auto_updated_at: string;
  review_required: boolean;
  source_count: number;
  sources: string[];
  latest_event: {
    id: string;
    date: string;
    title: string;
    source_url: string;
    source_publisher: string;
    human_verified: boolean;
  } | null;
};

export const SWEEPS_STATUS_META: Record<
  SweepsCasinoStatus,
  { label: string; short: string; color: string }
> = {
  legal_unregulated: { label: 'Legal / unregulated', short: 'Legal', color: '#34d399' },
  gray: { label: 'Gray market', short: 'Gray', color: '#fbbf24' },
  restricted: { label: 'Restricted', short: 'Restricted', color: '#fb923c' },
  pending_ban: { label: 'Pending ban', short: 'Pending', color: '#e879f9' },
  banned: { label: 'Banned', short: 'Banned', color: '#f43f5e' },
};
