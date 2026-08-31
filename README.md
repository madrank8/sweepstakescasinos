# Sweepstakes Wiz Astro Site

Hybrid Astro site for `https://sweepstakeswiz.com/`.

Root HTML files and `src/routes/` are authored sources. `npm run dev` and
`npm run build` regenerate `src/pages/`; do not edit that generated directory.
The generator also copies static assets and regenerates sitemap/robots/LLM
outputs.

Astro uses `build.format: "directory"`, so authored HTML sources are served at
clean trailing-slash URLs such as `/reviews/mcluck/`.

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
