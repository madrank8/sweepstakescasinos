export const prerender = false;

import type { APIRoute } from 'astro';
import { buildProvenance, getTrackerData } from '../../../lib/tracker/data';
import { jsonResponse } from '../../../lib/tracker/http';

export const GET: APIRoute = async () => {
  const bundle = await getTrackerData();
  const provenance = buildProvenance(bundle);
  return jsonResponse({
    generated_at: bundle.generatedAt,
    jurisdictions: provenance.length,
    total_sources: provenance.reduce((n, p) => n + p.source_count, 0),
    total_events: bundle.events.length,
    human_verified_events: bundle.events.filter((e) => e.human_verified).length,
    license: 'CC-BY-4.0',
    states: provenance,
  });
};
