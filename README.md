# Sweepstakes Casinos List Astro Site

Astro-powered static site for `https://sweepstakescasinoslist.com/`.

The mirrored HTML files in the project root remain the content source. `npm run dev` and `npm run build` regenerate Astro routes under `src/pages/` and copy static assets into `public/`.

Astro is configured with `build.format: "preserve"` so existing `.html` URLs and nested `index.html` files are preserved.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local Astro preview URL shown in the terminal.

For Astro's raw hot dev server, use:

```bash
npm run astro:dev
```

## Build

```bash
npm run build
```

The production files are emitted to `dist/`.
