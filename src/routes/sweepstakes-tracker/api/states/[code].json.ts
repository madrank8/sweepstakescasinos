export const prerender = false;

import type { APIRoute } from 'astro';
import { getStateByCode } from '../../../../lib/tracker/data';
import { jsonResponse } from '../../../../lib/tracker/http';

export const GET: APIRoute = async ({ params }) => {
  const code = (params.code ?? '').toUpperCase();
  const state = await getStateByCode(code);
  if (!state) {
    return new Response(JSON.stringify({ error: 'not_found', code }), {
      status: 404,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }
  return jsonResponse({
    state_code: state.state_code,
    state_name: state.state_name,
    state_slug: state.state_slug,
    status: state.sweeps_casino_status,
    confidence: state.sweeps_status_confidence,
    summary: state.sweeps_status_summary,
    last_reviewed_at: state.last_reviewed_at,
    last_auto_updated_at: state.last_auto_updated_at,
    source: `https://sweepstakeswiz.com/states/${state.state_slug}/`,
    license: 'CC-BY-4.0',
  });
};
