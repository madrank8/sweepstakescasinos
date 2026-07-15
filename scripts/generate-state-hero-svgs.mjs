#!/usr/bin/env node
/**
 * generate-state-hero-svgs.mjs
 *
 * Second-wave visual leverage play: one template generates 8 per-state hero
 * SVGs (public/images/states/{slug}-legality-status.svg) from a single source
 * of truth. Each SVG is data-driven and shows: state name + code, tracker
 * legal-status pill, key statute + effective date, site status (info-only vs
 * offers shown), partner availability count, and an AMOE-mandatory note.
 *
 * Also mirrors the output into ./images/states/ (which is the checked-in
 * source of truth; public/ is gitignored).
 *
 * Author-controlled encoding: this script emits UTF-8 directly via Node's fs,
 * which sidesteps the recurring stray-byte issue we hit when authoring SVGs
 * through the LLM Write tool.
 *
 * Run: node scripts/generate-state-hero-svgs.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const OUT_DIRS = [
  resolve(REPO_ROOT, 'public/images/states'),
  resolve(REPO_ROOT, 'images/states'),
];

const STATE_TOTAL_PARTNERS = 13;

/** Single source of truth for the 8 state hero cards. */
const STATES = [
  {
    code: 'CA',
    slug: 'california',
    name: 'California',
    status: 'BANNED',
    statusTone: 'banned',
    statute: 'AB-831',
    effective: 'Effective Jan 1, 2026',
    partnersAvailable: 3,
    siteStatus: 'info-only',
    subnote: 'Affiliate promotion carries statutory exposure.',
  },
  {
    code: 'NY',
    slug: 'new-york',
    name: 'New York',
    status: 'BANNED',
    statusTone: 'banned',
    statute: 'S5935A / Ch. 605',
    effective: 'Signed and effective Dec 5, 2025',
    partnersAvailable: 2,
    siteStatus: 'info-only',
    subnote: 'AG cease-and-desist wave preceded the statute.',
  },
  {
    code: 'NJ',
    slug: 'new-jersey',
    name: 'New Jersey',
    status: 'BANNED',
    statusTone: 'banned',
    statute: 'A5447',
    effective: 'Signed and effective Aug 15, 2025',
    partnersAvailable: 0,
    siteStatus: 'info-only',
    subnote: 'DGE enforcement plus statute; operators geo-blocked.',
  },
  {
    code: 'MI',
    slug: 'michigan',
    name: 'Michigan',
    status: 'RESTRICTED',
    statusTone: 'restricted',
    statute: 'MGCB C&D posture',
    effective: 'Ongoing enforcement, no dedicated statute',
    partnersAvailable: 0,
    siteStatus: 'info-only',
    subnote: 'Michigan Gaming Control Board treats the model as unlicensed gambling.',
  },
  {
    code: 'WA',
    slug: 'washington',
    name: 'Washington',
    status: 'BANNED',
    statusTone: 'banned',
    statute: 'RCW 9.46 (no AMOE exemption)',
    effective: 'Long-standing statutory posture',
    partnersAvailable: 0,
    siteStatus: 'info-only',
    subnote: 'Washington gambling law lacks a no-purchase carve-out.',
  },
  {
    code: 'OH',
    slug: 'ohio',
    name: 'Ohio',
    status: 'GRAY',
    statusTone: 'gray',
    statute: 'Rev. Code Ch. 2915',
    effective: 'No dedicated sweepstakes-casino statute',
    partnersAvailable: 7,
    siteStatus: 'offers-shown',
    subnote: 'Operator terms and AG posture may shift; monitor per operator.',
  },
  {
    code: 'FL',
    slug: 'florida',
    name: 'Florida',
    status: 'LEGAL',
    statusTone: 'legal',
    statute: 'Fla. Stat. § 849.094',
    effective: 'Promotional sweepstakes framework applies',
    partnersAvailable: 12,
    siteStatus: 'offers-shown',
    subnote: 'One of the deepest US sweepstakes markets by operator coverage.',
  },
  {
    code: 'TX',
    slug: 'texas',
    name: 'Texas',
    status: 'LEGAL',
    statusTone: 'legal',
    statute: 'Tex. Penal Code Ch. 47',
    effective: 'No dedicated sweepstakes-casino statute',
    partnersAvailable: 12,
    siteStatus: 'offers-shown',
    subnote: 'AMOE-backed model operates as promotional sweepstakes.',
  },
];

const TONES = {
  banned: { pillFill: '#dc2626', pillText: '#ffffff', bandFill: '#fef2f2', bandStroke: '#fecaca', bandText: '#7f1d1d', accent: '#dc2626' },
  restricted: { pillFill: '#f59e0b', pillText: '#ffffff', bandFill: '#fffbeb', bandStroke: '#fde68a', bandText: '#78350f', accent: '#f59e0b' },
  gray: { pillFill: '#64748b', pillText: '#ffffff', bandFill: '#f1f5f9', bandStroke: '#cbd5e1', bandText: '#334155', accent: '#64748b' },
  legal: { pillFill: '#10b981', pillText: '#ffffff', bandFill: '#ecfdf5', bandStroke: '#a7f3d0', bandText: '#065f46', accent: '#10b981' },
};

/** XML-escape any user-supplied text before injecting into SVG text nodes. */
function xml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * Render a single state hero SVG. 960x320 canvas, two-column layout:
 * left = identity + statute, right = availability + site status.
 */
function renderStateHeroSvg(s) {
  const tone = TONES[s.statusTone];
  const isSuppressed = s.siteStatus === 'info-only';
  const siteBadgeFill = isSuppressed ? '#0a1628' : '#10b981';
  const siteBadgeText = isSuppressed ? 'Info only' : 'Offers shown';
  const siteSubline = isSuppressed
    ? 'Sweepstakes Wiz suppresses all affiliate offers for residents.'
    : 'Sweepstakes Wiz shows verified affiliate offers to residents.';

  const partnerNumber = `${s.partnersAvailable} of ${STATE_TOTAL_PARTNERS}`;
  const partnerCaption = isSuppressed
    ? `${s.partnersAvailable} of ${STATE_TOTAL_PARTNERS} reviewed operators list this state; the site suppresses all.`
    : `${s.partnersAvailable} of ${STATE_TOTAL_PARTNERS} reviewed operators accept residents.`;

  const titleId = `stateHero-${s.slug}-title`;
  const descId = `stateHero-${s.slug}-desc`;
  const desc = xml(
    `Sweepstakes casino legality status for ${s.name} in 2026. Legal status is ${s.status.toLowerCase()}. Key statute or posture is ${s.statute}. ${s.effective}. Sweepstakes Wiz site status is ${isSuppressed ? 'information only with no affiliate offers shown' : 'affiliate offers shown to residents'}, and ${s.partnersAvailable} of ${STATE_TOTAL_PARTNERS} reviewed operators ${isSuppressed ? 'list the state but the site still suppresses all offers' : 'accept residents'}. Every legitimate sweepstakes operator provides a mandatory no-purchase AMOE entry method regardless of state.`
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 320" role="img" aria-labelledby="${titleId} ${descId}">
  <title id="${titleId}">${xml(`${s.name} sweepstakes casino legality status (2026)`)}</title>
  <desc id="${descId}">${desc}</desc>
  <defs>
    <style>
      .sh-font-display { font-family: 'Sora', system-ui, sans-serif; }
      .sh-font-body { font-family: 'DM Sans', system-ui, sans-serif; }
    </style>
  </defs>
  <rect width="960" height="320" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>

  <!-- Left column: identity -->
  <g transform="translate(24,24)">
    <rect x="0" y="0" width="6" height="120" rx="3" fill="${tone.accent}"/>
    <text x="20" y="30" class="sh-font-body" font-size="11" font-weight="700" fill="#64748b">SWEEPSTAKES CASINO LEGALITY</text>
    <text x="20" y="72" class="sh-font-display" font-size="36" font-weight="800" fill="#0a1628">${xml(s.name)}</text>
    <text x="20" y="98" class="sh-font-body" font-size="12" fill="#475569">State code ${xml(s.code)}</text>

    <rect x="20" y="118" width="140" height="30" rx="6" fill="${tone.pillFill}"/>
    <text x="90" y="138" text-anchor="middle" class="sh-font-display" font-size="13" font-weight="800" fill="${tone.pillText}">${xml(s.status)}</text>
  </g>

  <!-- Statute band (bottom-left) -->
  <g transform="translate(24,180)">
    <rect width="440" height="100" rx="10" fill="${tone.bandFill}" stroke="${tone.bandStroke}" stroke-width="1.5"/>
    <text x="18" y="26" class="sh-font-body" font-size="10.5" font-weight="700" fill="${tone.bandText}">KEY STATUTE / POSTURE</text>
    <text x="18" y="52" class="sh-font-display" font-size="15" font-weight="800" fill="#0a1628">${xml(s.statute)}</text>
    <text x="18" y="72" class="sh-font-body" font-size="11" fill="${tone.bandText}">${xml(s.effective)}</text>
    <text x="18" y="90" class="sh-font-body" font-size="10" font-style="italic" fill="${tone.bandText}">${xml(s.subnote)}</text>
  </g>

  <!-- Right column: availability -->
  <g transform="translate(496,24)">
    <text x="0" y="18" class="sh-font-body" font-size="11" font-weight="700" fill="#64748b">SWEEPSTAKES WIZ SITE STATUS</text>

    <rect x="0" y="30" width="160" height="30" rx="6" fill="${siteBadgeFill}"/>
    <text x="80" y="50" text-anchor="middle" class="sh-font-display" font-size="13" font-weight="800" fill="#ffffff">${xml(siteBadgeText)}</text>

    <text x="0" y="86" class="sh-font-body" font-size="11" fill="#475569">${xml(siteSubline)}</text>
  </g>

  <!-- Partner availability card -->
  <g transform="translate(496,116)">
    <rect width="440" height="70" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="18" y="24" class="sh-font-body" font-size="10.5" font-weight="700" fill="#64748b">PARTNER AVAILABILITY</text>
    <text x="18" y="52" class="sh-font-display" font-size="22" font-weight="800" fill="#0a1628">${xml(partnerNumber)}</text>
    <text x="130" y="52" class="sh-font-body" font-size="11" fill="#475569">reviewed operators</text>
    <text x="18" y="66" class="sh-font-body" font-size="9.5" fill="#94a3b8">${xml(partnerCaption)}</text>
  </g>

  <!-- AMOE reminder -->
  <g transform="translate(496,196)">
    <rect width="440" height="82" rx="10" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
    <text x="18" y="24" class="sh-font-display" font-size="12" font-weight="800" fill="#1e3a8a">AMOE always applies</text>
    <text x="18" y="42" class="sh-font-body" font-size="10.5" fill="#1a56db">Every legitimate operator publishes a free mail-in entry route,</text>
    <text x="18" y="56" class="sh-font-body" font-size="10.5" fill="#1a56db">independent of state law. If a brand hides it, treat it as a red flag.</text>
    <text x="18" y="72" class="sh-font-body" font-size="9.5" font-style="italic" fill="#334155">See our red-flag scorecard for the full eight checks.</text>
  </g>

  <text x="480" y="308" text-anchor="middle" class="sh-font-body" font-size="9.5" fill="#94a3b8">Source: SweepstakesWiz Legality Tracker, July 2026. Editorial illustration; not legal advice.</text>
</svg>
`;
}

function main() {
  for (const dir of OUT_DIRS) {
    mkdirSync(dir, { recursive: true });
  }

  for (const s of STATES) {
    const svg = renderStateHeroSvg(s);
    const filename = `${s.slug}-legality-status.svg`;
    for (const dir of OUT_DIRS) {
      const outPath = resolve(dir, filename);
      writeFileSync(outPath, svg, { encoding: 'utf-8' });
    }
    // eslint-disable-next-line no-console
    console.log(`generated ${filename} (${svg.length} chars, ${s.status})`);
  }

  console.log(`\n${STATES.length} state hero SVGs written to:\n  ${OUT_DIRS.join('\n  ')}`);
}

main();
