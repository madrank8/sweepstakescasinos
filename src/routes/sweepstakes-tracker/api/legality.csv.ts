export const prerender = false;

import type { APIRoute } from 'astro';
import { getTrackerData } from '../../../lib/tracker/data';
import { csvCell, csvResponse } from '../../../lib/tracker/http';

const COLUMNS: string[] = [
  'state_code',
  'state_name',
  'state_slug',
  'sweeps_casino_status',
  'sweeps_status_confidence',
  'sweeps_status_changed_at',
  'sweeps_status_summary',
  'last_reviewed_at',
  'last_auto_updated_at',
  'review_required',
];

export const GET: APIRoute = async () => {
  const bundle = await getTrackerData();
  const header = COLUMNS.join(',');
  const rows = bundle.states.map((s) =>
    COLUMNS.map((c) => csvCell((s as Record<string, unknown>)[c])).join(','),
  );
  return csvResponse([header, ...rows].join('\n') + '\n', 'sweepstakes-legality.csv');
};
