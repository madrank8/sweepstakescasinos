import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sweepstakeslist.vercel.app',
  trailingSlash: 'ignore',
  build: {
    format: 'directory'
  }
});
