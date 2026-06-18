# Sweepstakes Casinos List Local Mirror

Static mirror of `https://sweepstakescasinoslist.com/`.

## Run Locally

For best results, serve the folder over HTTP so shared partials and scripts can load:

```bash
cd sweepstakescasinoslist-local
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

Opening `index.html` directly may work for most static content, but browser file restrictions can block shared partial loading on some pages.
