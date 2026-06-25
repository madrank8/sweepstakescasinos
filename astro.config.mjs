import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// SSR on Vercel so geo middleware can suppress affiliate CTAs per US state.
// Content/trust pages opt back into static via `export const prerender = true`
// (set automatically by scripts/generate-astro-pages.mjs for non-affiliate pages).
export default defineConfig({
  site: 'https://sweepstakeslist.vercel.app',
  output: 'server',
  adapter: vercel(),
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
