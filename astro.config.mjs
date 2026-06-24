import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sweepastro.vercel.app',
  trailingSlash: 'ignore',
  build: {
    format: 'directory'
  }
});
