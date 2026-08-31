# Visible and Schema Parity Audit

Source snapshot: repository authored sources. Generated deterministically without a runtime date.

Visible legacy scores are parsed with `visibleEditorialScore()` from `src/lib/pageChrome.ts`; schema ratings now use only verified `editorScore100` values from `src/data/operators.ts`.

Coverage: **29 reviews**; source mismatches: **23**. Build-time consolidation emits **4** verified canonical Review ratings and omits ratings for unresolved records; it never converts a five-star value.

AggregateRating nodes from empty reader data: **0**. Answer blocks remain visible review content and are not added to FAQPage schema; all FAQPage nodes are rebuilt from visible FAQ questions and answers.

| Review | Visible score | Source JSON-LD score | Expected `/5` equivalent | Source parity |
|---|---:|---:|---:|---|
| `reviews/acebet.html` | 88/100 | 4.5/5 | 4.4/5 | MISMATCH |
| `reviews/american-luck.html` | 72/100 | 3.6/5 | 3.6/5 | MATCH |
| `reviews/big-pirate.html` | 79/100 | 4.1/5 | 3.95/5 | MISMATCH |
| `reviews/card-crush.html` | 82/100 | 4.2/5 | 4.1/5 | MISMATCH |
| `reviews/casino-click.html` | 72/100 | 3.8/5 | 3.6/5 | MISMATCH |
| `reviews/crown-coins.html` | 91/100 | 4.6/5 | 4.55/5 | MISMATCH |
| `reviews/dexyplay.html` | 87/100 | 4.5/5 | 4.35/5 | MISMATCH |
| `reviews/freespin.html` | 82/100 | 4.3/5 | 4.1/5 | MISMATCH |
| `reviews/hello-millions.html` | 85/100 | 4.2/5 | 4.25/5 | MISMATCH |
| `reviews/high5.html` | 88/100 | 4.3/5 | 4.4/5 | MISMATCH |
| `reviews/jackpot-go.html` | 85/100 | 4.4/5 | 4.25/5 | MISMATCH |
| `reviews/jackpota.html` | 86/100 | 4.3/5 | 4.3/5 | MATCH |
| `reviews/legendz.html` | 84/100 | 4.2/5 | 4.2/5 | MATCH |
| `reviews/lucky-bunny.html` | 74/100 | 3.9/5 | 3.7/5 | MISMATCH |
| `reviews/mcluck.html` | 88/100 | 4.5/5 | 4.4/5 | MISMATCH |
| `reviews/mega-bonanza.html` | 82/100 | 4/5 | 4.1/5 | MISMATCH |
| `reviews/playfame.html` | 86/100 | 4.3/5 | 4.3/5 | MATCH |
| `reviews/pulsz.html` | 88/100 | 4.5/5 | 4.4/5 | MISMATCH |
| `reviews/rolla.html` | 92/100 | 4.7/5 | 4.6/5 | MISMATCH |
| `reviews/roxymoxy.html` | 80/100 | 4/5 | 4/5 | MATCH |
| `reviews/spinblitz.html` | 87/100 | 4.4/5 | 4.35/5 | MISMATCH |
| `reviews/spinfinite.html` | 80/100 | 4.1/5 | 4/5 | MISMATCH |
| `reviews/splash-coins.html` | 83/100 | 4.3/5 | 4.15/5 | MISMATCH |
| `reviews/spree.html` | 83/100 | 4/5 | 4.15/5 | MISMATCH |
| `reviews/sweepico.html` | 85/100 | 4.4/5 | 4.25/5 | MISMATCH |
| `reviews/sweet-sweeps.html` | 90/100 | 4.5/5 | 4.5/5 | MATCH |
| `reviews/thrillzz.html` | 85/100 | 4.3/5 | 4.25/5 | MISMATCH |
| `reviews/wow-vegas.html` | 91/100 | 4.5/5 | 4.55/5 | MISMATCH |
| `reviews/zula.html` | 87/100 | 4.4/5 | 4.35/5 | MISMATCH |
