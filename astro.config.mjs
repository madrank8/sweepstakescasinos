import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';

// SSR on Vercel so geo middleware can suppress affiliate CTAs per US state.
// Content/trust pages opt back into static via `export const prerender = true`
// (set automatically by scripts/generate-astro-pages.mjs for non-affiliate pages).
export default defineConfig({
  // Production origin lives in src/data/site.ts (SITE.origin). Kept literal here
  // because astro.config is evaluated before TS path resolution; keep in sync.
  site: 'https://sweepstakeswiz.com',
  output: 'server',
  adapter: vercel(),
  integrations: [mdx()],
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
