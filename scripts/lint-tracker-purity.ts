/**
 * Build gate: the Sweepstakes Legality Tracker must stay editorially independent.
 *
 * Fails the build if any authored route under src/routes/sweepstakes-tracker/**
 * contains an affiliate surface:
 *   - the geo-gated affiliate gateway (/bonuses/<slug>/)
 *   - a raw affiliate tracking link (tracker.gemified.io)
 *   - rel="sponsored" (or sponsored in a rel list)
 *   - the sanctioned AffiliateLink component
 *
 * This keeps the citation-grade hub free of monetization signals, which is the
 * whole point of the hybrid model (commercial pages live under /states/, /reviews/).
 *
 * Run: npm run tracker:lint
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { AFFILIATE_PARTNERS } from '../src/data/affiliates';

const ROOT = process.cwd();
const TARGET = join(ROOT, 'src', 'routes', 'sweepstakes-tracker');

const PARTNER_SLUGS = AFFILIATE_PARTNERS.map((p) => p.slug);

const rules: Array<{ label: string; test: (s: string) => boolean }> = [
  { label: 'affiliate gateway link (/bonuses/<slug>/)', test: (s) => PARTNER_SLUGS.some((slug) => s.includes(`/bonuses/${slug}`)) },
  { label: 'raw affiliate tracking link (tracker.gemified.io)', test: (s) => s.includes('tracker.gemified.io') },
  { label: 'rel="sponsored"', test: (s) => /rel=("|')[^"']*sponsored[^"']*("|')/.test(s) },
  { label: 'AffiliateLink component', test: (s) => s.includes('AffiliateLink') },
];

const errors: string[] = [];

function walk(dir: string): void {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      walk(abs);
      continue;
    }
    if (!/\.(astro|ts|js|mjs)$/.test(entry)) continue;
    const rel = relative(ROOT, abs);
    const content = readFileSync(abs, 'utf8');
    for (const rule of rules) {
      if (rule.test(content)) errors.push(`${rel}: ${rule.label}`);
    }
  }
}

if (!existsSync(TARGET)) {
  console.log('[tracker:lint] no sweepstakes-tracker routes found — skipped.');
  process.exit(0);
}

walk(TARGET);

if (errors.length > 0) {
  console.error(`\n[tracker:lint] ${errors.length} affiliate-purity violation(s) on the tracker hub:\n`);
  for (const e of errors) console.error(`  \u2717 ${e}`);
  console.error('\nThe /sweepstakes-tracker/ hub must contain NO affiliate links. Move commercial content to /states/ or /reviews/.');
  process.exit(1);
}
console.log('[tracker:lint] OK — tracker hub is affiliate-free.');
