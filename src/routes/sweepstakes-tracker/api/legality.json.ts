export const prerender = false;

import type { APIRoute } from 'astro';
import { getTrackerData } from '../../../lib/tracker/data';
import { jsonResponse } from '../../../lib/tracker/http';

export const GET: APIRoute = async () => {
  const bundle = await getTrackerData();
  return jsonResponse({
    generated_at: bundle.generatedAt,
    jurisdictions: bundle.states.length,
    license: 'CC-BY-4.0',
    source: 'https://sweepstakeswiz.com/sweepstakes-tracker/',
    states: bundle.states,
  });
};
