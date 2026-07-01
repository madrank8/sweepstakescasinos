/**
 * HTML fragment generators for first-party testing integration.
 */
import type { TestingResultRow } from '../data/testingResults';
import { resolvedHoursToPayout } from '../data/testingResults';
import { TESTING_BRAND_BY_SLUG } from '../data/testingBrands';

const DEFAULT_AUTHOR = 'Steffen Nadel';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatHeroMeta(row: TestingResultRow, handsOn: boolean): string {
  const date = row.date_tested || '2026';
  if (handsOn) {
    return `Hands-on test &#183; ${esc(date)} &#183; ${esc(row.tester_state)}`;
  }
  return `Editorial analysis &#183; ${esc(date)}`;
}

export function buildHandsOnSection(row: TestingResultRow, screenshotUrls: string[]): string {
  const brand = TESTING_BRAND_BY_SLUG.get(row.brand_slug);
  const name = brand?.name ?? row.brand_slug;
  const hours = resolvedHoursToPayout(row);

  const gallery =
    screenshotUrls.length > 0
      ? `<div class="testing-gallery" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin:16px 0;">
${screenshotUrls
  .map(
    (url) =>
      `  <figure style="margin:0;"><img src="${esc(url)}" alt="${esc(name)} hands-on test screenshot" loading="lazy" style="width:100%;border-radius:8px;border:1px solid #e5e7eb;"><figcaption style="font-size:.7rem;color:#6b7280;margin-top:4px;">${esc(url.split('/').pop() ?? '')}</figcaption></figure>`,
  )
  .join('\n')}
</div>`
      : '';

  return `<h2 id="hands-on">&#128270; Hands-On Testing Log</h2>
<div class="callout good" id="hands-on-block">
  <span class="ci">&#9989;</span>
  <div>
    <strong>First-party test completed ${esc(row.date_tested)}</strong> from ${esc(row.tester_state)}.
    Measured results below — each claim maps to a real screenshot in our evidence archive.
    <ul style="margin:10px 0 0;padding-left:18px;line-height:1.7;">
      <li><strong>Welcome bonus credited:</strong> ${esc(row.welcome_credited || '—')}${row.promo_code_needed && !/^no$/i.test(row.promo_code_needed.trim()) ? ` (promo code: ${esc(row.promo_code_needed)})` : ''}</li>
      <li><strong>Redemption method tested:</strong> ${esc(row.redemption_method || '—')}</li>
      <li><strong>Minimum enforced:</strong> ${esc(row.min_redemption || '—')}</li>
      ${hours !== null ? `<li><strong>Measured payout time:</strong> ${hours} hours (${esc(row.request_timestamp)} → ${esc(row.payout_timestamp)})</li>` : ''}
      ${row.kyc_docs ? `<li><strong>KYC:</strong> ${esc(row.kyc_docs)}${row.kyc_hours ? ` — cleared in ${esc(row.kyc_hours)} hours` : ''}</li>` : ''}
      ${row.support_channel ? `<li><strong>Support:</strong> ${esc(row.support_channel)} — first response ${esc(row.support_first_response || '—')}${row.support_resolved ? ` (${esc(row.support_resolved)})` : ''}</li>` : ''}
      ${row.games_ok ? `<li><strong>Games / platform:</strong> ${esc(row.games_ok)}</li>` : ''}
    </ul>
    ${row.notes ? `<p style="margin-top:10px;"><strong>Tester notes:</strong> ${esc(row.notes)}</p>` : ''}
  </div>
</div>
${gallery}`;
}

export function buildPayoutTestedCell(row: TestingResultRow): string {
  const hours = resolvedHoursToPayout(row);
  if (hours === null) return '';
  const method = row.redemption_method || 'Tested method';
  const cls = hours <= 24 ? 'ok' : 'warn';
  return `<div class="pb-row hi" data-testing="payout-tested">
    <div class="pb-cell"><div class="cl">Measured — ${esc(method)}</div><div class="cv">First-party test ${esc(row.date_tested)}</div></div>
    <div class="pb-cell"><div class="cl">Speed</div><div class="cv ${cls}">${hours} hours &#10003;</div></div>
    <div class="pb-cell"><div class="cl">Evidence</div><div class="cv ok">Real screenshots on file</div></div>
  </div>
  <!-- testing:payout-tested -->`;
}

export function buildDisclosureHandsOn(row: TestingResultRow, author = DEFAULT_AUTHOR): string {
  return `<strong>How this was created (AI disclosure):</strong> This review is AI-assisted and human-edited, and includes first-hand testing with real screenshots by ${esc(author)} on ${esc(row.date_tested)}. Research and draft copy were produced with AI from published terms and aggregated feedback, then verified against measured test results. No fabricated testimonials are presented as fact. Last substantive edit: ${esc(row.date_tested)}.`;
}

export function buildDisclosureEditorial(date: string): string {
  return `<strong>How this was created (AI disclosure):</strong> This review is AI-assisted and human-edited. Research and a first draft were produced with AI from published terms and aggregated third-party reviews, then reviewed and edited by our editorial team. No fabricated first-hand testing or &#8220;verified player&#8221; testimonials are presented as fact. Last substantive edit: ${esc(date)}.`;
}

export function buildFaqProducedHandsOn(row: TestingResultRow): string {
  const brand = TESTING_BRAND_BY_SLUG.get(row.brand_slug);
  const name = brand?.name ?? row.brand_slug;
  return `This review includes first-party hands-on testing dated ${esc(row.date_tested)} from ${esc(row.tester_state)}, following our <a href="/how-we-rate/" rel="nofollow">How We Rate</a> methodology. We registered a real account, claimed the welcome bonus, played, requested a redemption, and documented every step with timestamped screenshots. It is AI-assisted and human-edited; measured results replace prior editorial estimates for ${esc(name)}.`;
}

export function buildFaqProducedEditorial(limitation?: string): string {
  const base =
    'This is an editorial analysis of published terms cross-checked against third-party review sources and the Trustpilot dataset, following our <a href="/how-we-rate/" rel="nofollow">How We Rate</a> methodology. It is AI-assisted and human-edited; no fabricated first-hand testing or testimonials are presented as fact.';
  if (limitation) return `${base} ${esc(limitation)}`;
  return base;
}

export function buildFaqProducedSoften(row: TestingResultRow): string {
  const limitation =
    row.could_test === 'geo-blocked'
      ? `We could not complete first-hand testing — geo-blocked from ${row.tester_state}.`
      : row.could_test === 'KYC-failed'
        ? `We could not complete first-hand testing — KYC did not clear during the test window. ${row.notes}`
        : row.could_test === 'no-redemption'
          ? `We could not complete a full redemption test. ${row.notes}`
          : row.notes;
  return buildFaqProducedEditorial(limitation);
}

export function prependReviewBodyMeasured(existingBody: string, row: TestingResultRow): string {
  const hours = resolvedHoursToPayout(row);
  const prefix = hours
    ? `First-party hands-on test on ${row.date_tested}: ${row.redemption_method} redemption cleared in ${hours} hours. `
    : `First-party hands-on test on ${row.date_tested}. `;
  if (existingBody.startsWith('First-party hands-on test')) return existingBody;
  if (existingBody.startsWith('Editorial analysis')) {
    return prefix + existingBody.replace(/^Editorial analysis[^.]*\.\s*/, '');
  }
  return prefix + existingBody;
}

export const OVERCLAIM_PATTERNS: Array<[RegExp, string]> = [
  // Full fabricated first-hand sentences — remove entirely.
  [/We ran a structured 14-day hands-on test:?[^<]*/gi, ''],
  [/Our hands-on tests cleared[^<]*/gi, ''],
  [/Our hands-on tests confirmed[^<]*/gi, ''],
  [/Our test redemption #\d[^<]*/gi, ''],

  // First-person / self-testing phrases — reframe to honest editorial language
  // while preserving the surrounding sentence. Order: specific before general.
  [/We tested the platform hands-on/gi, 'We analyzed the platform'],
  [/Full hands-on expert review/gi, 'In-depth expert review'],
  [/Full hands-on ([\w.\-]+) review/gi, 'In-depth $1 review'],
  [/hands-on expert review/gi, 'in-depth expert review'],
  [/14-Day Live Review/gi, '2026 Review'],
  [/14-day hands-on test/gi, 'editorial analysis'],
  [/14-day live test/gi, 'editorial analysis'],
  [/14-day hands-on/gi, 'in-depth'],
  [/Hands-on platform test/gi, 'Editorial analysis'],
  [/Hands-on test/gi, 'Editorial analysis'],
  [/Live Review/g, 'Expert Review'],
  [/Payouts Tested/g, 'Payouts Explained'],
  [/Evolution Live Tested/gi, 'Evolution Live'],
  [/tested payouts/gi, 'payout speed'],
  [/redemption speed hands-on/gi, 'redemption speed'],
  [/ over 14 days/gi, ''],
  [/our 14-day test/gi, 'our analysis'],
  [/\(our tests confirmed\)/gi, '(per published policy)'],
  [/all five sources we verified/gi, 'third-party sources we cross-checked'],
  [/everything tested and verified/gi, 'everything reviewed in depth'],
  [/tested and verified/gi, 'independently reviewed'],
];

export function softenOverclaimHtml(html: string): string {
  let out = html;
  for (const [re, repl] of OVERCLAIM_PATTERNS) {
    out = out.replace(re, repl);
  }
  out = out.replace(/We tested/gi, 'We reviewed');
  return out;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function bumpDateModified(html: string, date: string): string {
  return html.replace(/"dateModified":"[^"]*"/, `"dateModified":"${date}"`);
}

export function injectAtMarker(html: string, marker: string, content: string, replace = false): string {
  const open = `<!-- testing:${marker} -->`;
  const close = `<!-- /testing:${marker} -->`;
  const regionRe = new RegExp(`${open}[\\s\\S]*?${close}`, 'm');
  if (regionRe.test(html)) {
    if (replace) {
      return html.replace(regionRe, `${open}\n${content}\n${close}`);
    }
    return html;
  }
  if (html.includes(open)) {
    return html.replace(open, `${open}\n${content}`);
  }
  return html;
}

export function replaceHeroMetaContent(html: string, newSuffix: string): string {
  return html.replace(
    /(<!-- testing:meta -->[\s\S]*?<div class="hero-meta">)([\s\S]*?)(<\/div>)/,
    (_, before, _inner, after) => {
      const bylineMatch = html.match(
        /(<div class="hero-meta">)\s*(By[\s\S]*?&nbsp;[^<]*<\/strong>)\s*&nbsp;[^<]*&nbsp;/,
      );
      if (bylineMatch) {
        return html.replace(
          /(<div class="hero-meta">[\s\S]*?<\/strong>)\s*&nbsp;[^;]*;&nbsp;[^<]*/,
          `$1 &nbsp;&#183;&nbsp; Updated ${newSuffix.includes('Hands-on') ? newSuffix.split('&#183;')[0].trim() : '2026'} &nbsp;&#183;&nbsp; ${newSuffix}`,
        );
      }
      return `${before}${newSuffix}${after}`;
    },
  );
}

/** Replace editorial / hands-on suffix in hero-meta after author byline. */
export function patchHeroMetaSuffix(html: string, suffix: string): string {
  if (!html.includes('<!-- testing:meta -->')) return html;
  return html.replace(
    /(<div class="hero-meta">[\s\S]*?<\/strong>)\s*(&nbsp;[^<]*)+/,
    `$1 &nbsp;&#183;&nbsp; ${suffix}`,
  );
}

export function patchBetweenMarkers(
  html: string,
  marker: string,
  innerHtml: string,
): string {
  const open = `<!-- testing:${marker} -->`;
  const close = `<!-- /testing:${marker} -->`;
  const regionRe = new RegExp(`(${open})[\\s\\S]*?(${close})`, 'm');
  if (regionRe.test(html)) {
    return html.replace(regionRe, `$1\n${innerHtml}\n$2`);
  }
  if (html.includes(open)) {
    return html.replace(open, `${open}\n${innerHtml}\n${close}`);
  }
  return html;
}

export function insertAfterMarker(html: string, marker: string, block: string): string {
  const tag = `<!-- testing:${marker} -->`;
  if (!html.includes(tag)) return html;
  const idx = html.indexOf(tag) + tag.length;
  const closeTag = `<!-- /testing:${marker} -->`;
  const closeIdx = html.indexOf(closeTag, idx);
  if (closeIdx !== -1) {
    return html.slice(0, closeIdx) + block + html.slice(closeIdx);
  }
  return html.slice(0, idx) + '\n' + block + html.slice(idx);
}

export function patchFaqProduced(html: string, answerHtml: string): string {
  return html.replace(
    /(<!-- testing:faq-produced -->[\s\S]*?<div class="faq-inner">)([\s\S]*?)(<\/div>)/,
    `$1${answerHtml}$3`,
  );
}

export function patchDisclosureCallout(html: string, disclosureHtml: string): string {
  if (html.includes('<!-- testing:disclosure -->')) {
    return html.replace(
      /(<!-- testing:disclosure -->[\s\S]*?<strong>How this was created \(AI disclosure\):<\/strong>)[\s\S]*?(<\/div><\/div>)/,
      `$1 ${disclosureHtml}$2`,
    );
  }
  return html.replace(
    /(<strong>How this was created \(AI disclosure\):<\/strong>)[\s\S]*?(<\/div><\/div>\s*<div class="disclosure">)/,
    `$1 ${disclosureHtml}$2`,
  );
}

export function appendPayoutTestedRow(html: string, rowHtml: string): string {
  if (html.includes('<!-- testing:payout-tested -->')) {
    return html.replace(
      /<!-- testing:payout-tested -->[\s\S]*?<!-- \/testing:payout-tested -->/,
      rowHtml,
    );
  }
  if (html.includes('class="payout-block"')) {
    return html.replace(
      /(<div class="payout-block">[\s\S]*?)(<\/div>\s*<div class="callout)/,
      `$1\n${rowHtml}\n$2`,
    );
  }
  return html;
}

export function publicScreenshotPath(slug: string, filename: string): string {
  return `/testing/${slug}/${filename}`;
}
