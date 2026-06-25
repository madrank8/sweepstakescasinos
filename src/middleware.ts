import { defineMiddleware } from 'astro:middleware';
import { normalizeRegion } from './data/geo';

/**
 * Geo middleware — resolves the visitor's US state once per request and exposes
 * it on `Astro.locals` so pages/components can drive affiliate-CTA suppression.
 *
 * Geo source: Vercel injects `x-vercel-ip-country-region` (subdivision, e.g.
 * "CA") and `x-vercel-ip-country` on every edge/server request. We read the
 * header rather than a framework `geo` object so this works with the Astro
 * Vercel adapter.
 *
 * REQUIREMENT: this only runs for server-rendered responses. The site must use
 * `@astrojs/vercel` with `output: 'server'` (or `'hybrid'` + `prerender = false`
 * on pages that show affiliate CTAs). On a pure static build the header is
 * absent at build time, so every state resolves to `null` (fail-closed).
 *
 * Local dev / preview override: set `PUBLIC_DEV_GEO_STATE=TX` (or any code) to
 * simulate a state when no Vercel header is present.
 */
export const onRequest = defineMiddleware((context, next) => {
  // Prerendered (static) pages have no per-request geo; don't touch headers.
  if (context.isPrerendered) {
    context.locals.usState = null;
    context.locals.usCountry = null;
    return next();
  }

  const header =
    context.request.headers.get('x-vercel-ip-country-region') ??
    import.meta.env.PUBLIC_DEV_GEO_STATE ??
    null;

  const country =
    context.request.headers.get('x-vercel-ip-country') ?? null;

  // Only trust subdivision when the visitor is in the US.
  const usState =
    country == null || country === 'US' ? normalizeRegion(header) : null;

  context.locals.usState = usState;
  context.locals.usCountry = country;

  return next();
});
