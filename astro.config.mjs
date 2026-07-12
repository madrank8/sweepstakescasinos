import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';
import { execFileSync } from 'node:child_process';

/**
 * Dev-only safeguard: regenerate `src/pages/` from `src/routes/` (and the
 * root-level HTML sources) before the dev server starts.
 *
 * `src/pages/` is gitignored and produced by scripts/generate-astro-pages.mjs.
 * `npm run build` already runs it via `prebuild`, but a bare `astro dev` does
 * not — which left the generated tree STALE and let the `/bonuses/[slug]`
 * gateway shadow newly-added static routes (e.g. /bonuses/no-deposit/) with a
 * "Not found" 404. Running the generator at dev startup keeps the served pages
 * in sync with the authored routes regardless of how dev is invoked.
 */
function generatePagesOnDev() {
  return {
    name: 'generate-astro-pages-on-dev',
    hooks: {
      'astro:config:setup': ({ command }) => {
        if (command !== 'dev') return;
        execFileSync('npx', ['tsx', 'scripts/generate-astro-pages.mjs'], {
          stdio: 'inherit',
        });
      },
    },
  };
}

// SSR on Vercel so geo middleware can suppress affiliate CTAs per US state.
// Content/trust pages opt back into static via `export const prerender = true`
// (set automatically by scripts/generate-astro-pages.mjs for non-affiliate pages).
export default defineConfig({
  // Production origin lives in src/data/site.ts (SITE.origin). Kept literal here
  // because astro.config is evaluated before TS path resolution; keep in sync.
  site: 'https://sweepstakeswiz.com',
  output: 'server',
  adapter: vercel(),
  integrations: [mdx(), generatePagesOnDev()],
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
