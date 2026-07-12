/**
 * Committed baseline dataset used ONLY when the tracker Supabase project is
 * unreachable (e.g. during a CI build with no creds, or a transient outage).
 *
 * This mirrors the tracker's seed statuses so pages always render a coherent
 * 51-jurisdiction map even fully offline. Live Supabase data (kept fresh by the
 * daily n8n pipeline) always supersedes this. Bundles built from here are
 * flagged `degraded: true` so the UI can note the data is a baseline snapshot.
 */
import type {
  LegalityEvent,
  NewsItem,
  Operator,
  OperatorAvailability,
  PendingLegislation,
  StateRecord,
  SweepsCasinoStatus,
} from './types';

const STATE_INDEX: Array<[string, string]> = [
  ['AL', 'Alabama'],
  ['AK', 'Alaska'],
  ['AZ', 'Arizona'],
  ['AR', 'Arkansas'],
  ['CA', 'California'],
  ['CO', 'Colorado'],
  ['CT', 'Connecticut'],
  ['DE', 'Delaware'],
  ['DC', 'District of Columbia'],
  ['FL', 'Florida'],
  ['GA', 'Georgia'],
  ['HI', 'Hawaii'],
  ['ID', 'Idaho'],
  ['IL', 'Illinois'],
  ['IN', 'Indiana'],
  ['IA', 'Iowa'],
  ['KS', 'Kansas'],
  ['KY', 'Kentucky'],
  ['LA', 'Louisiana'],
  ['ME', 'Maine'],
  ['MD', 'Maryland'],
  ['MA', 'Massachusetts'],
  ['MI', 'Michigan'],
  ['MN', 'Minnesota'],
  ['MS', 'Mississippi'],
  ['MO', 'Missouri'],
  ['MT', 'Montana'],
  ['NE', 'Nebraska'],
  ['NV', 'Nevada'],
  ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],
  ['NY', 'New York'],
  ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],
  ['OH', 'Ohio'],
  ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'],
  ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],
  ['SD', 'South Dakota'],
  ['TN', 'Tennessee'],
  ['TX', 'Texas'],
  ['UT', 'Utah'],
  ['VT', 'Vermont'],
  ['VA', 'Virginia'],
  ['WA', 'Washington'],
  ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
];

function statusFor(code: string): SweepsCasinoStatus {
  if (['ID', 'WA'].includes(code)) return 'banned';
  if (['NY', 'FL', 'CT', 'NJ'].includes(code)) return 'pending_ban';
  if (['MI', 'LA', 'MS', 'MT', 'NV'].includes(code)) return 'restricted';
  if (['CA', 'TX', 'GA', 'NC', 'OH', 'PA'].includes(code)) return 'gray';
  return 'legal_unregulated';
}

function summaryFor(status: SweepsCasinoStatus): string {
  switch (status) {
    case 'banned':
      return 'Tracked as banned based on restrictive enforcement posture.';
    case 'pending_ban':
      return 'Tracked as pending-ban due to active or expected restrictive legislative pressure.';
    case 'restricted':
      return 'Tracked as restricted with notable compliance and availability limits.';
    case 'gray':
      return 'Tracked as gray-market with evolving interpretation and operator variability.';
    default:
      return 'Tracked as legal/unregulated pending state-specific enforcement updates.';
  }
}

function slugifyState(name: string): string {
  return name.toLowerCase().replaceAll('.', '').replaceAll(' ', '-');
}

const nowIso = new Date().toISOString();

export const fallbackStates: StateRecord[] = STATE_INDEX.map(([code, name], index) => {
  const status = statusFor(code);
  return {
    state_code: code,
    state_name: name,
    state_slug: slugifyState(name),
    wikidata_id: null,
    sweeps_casino_status: status,
    sweeps_status_confidence: status === 'pending_ban' ? 'medium' : 'high',
    sweeps_status_changed_at: new Date(Date.now() - index * 86400000 * 3).toISOString(),
    sweeps_status_summary: summaryFor(status),
    sweeps_status_full_text:
      'Sweepstakes Wiz tracks state attorney-general statements, bill text, and documented operator restrictions. This status monitor is informational and not legal advice. We prioritize official government publications and identifiable operator policy changes before updating status labels.',
    real_money_casino: 'varies_by_jurisdiction',
    sportsbook_status: 'varies_by_jurisdiction',
    dfs_status: 'varies_by_jurisdiction',
    lottery_status: 'state_lottery_available',
    social_casino_status: 'widely_available',
    state_ag_url: null,
    gaming_authority_url: null,
    gaming_authority_name: null,
    sources_json: ['https://legiscan.com/'],
    last_reviewed_at: nowIso,
    last_auto_updated_at: nowIso,
    review_required: false,
  };
});

export const fallbackEvents: LegalityEvent[] = [];
export const fallbackPendingLegislation: PendingLegislation[] = [];
export const fallbackOperators: Operator[] = [];
export const fallbackAvailability: OperatorAvailability[] = [];
export const fallbackNews: NewsItem[] = [];
