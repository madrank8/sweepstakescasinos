/**
 * Pulsz E-E-A-T fix pack: comparison scores, freshness, Trustpilot
 * aggregateRating, crawlable sponsored CTAs, evolution/weights copy,
 * hidden first-hand stub, and empty reader-report suppression.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getOperator, reviewSourceDates, verifiedValue } from '../src/data/operators';
import { suppressAffiliateCtas, prepareSsrAffiliateReviewHtml } from '../src/lib/affiliateHtml';
import { brandAggregateRating } from '../src/lib/brandAggregateRating';
import { injectOperatorFactsHtml } from '../src/lib/operatorFactsHtml';
import { consolidateJsonLd } from '../src/lib/pageChrome';
import { renderReaderReportBlock, injectReaderReports } from '../src/lib/readerReportsDisplay';
import { brandOrganizationNode } from '../src/lib/schema';

const root = resolve(import.meta.dirname, '..');
const pulszSource = readFileSync(resolve(root, 'reviews/pulsz.html'), 'utf8');

function graphFromHtml(html: string): Array<Record<string, unknown>> {
  const block = [
    ...html.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  assert.ok(block.length >= 1, 'expected JSON-LD');
  return (JSON.parse(block[0][1]) as { '@graph': Array<Record<string, unknown>> })['@graph'];
}

const comparisonFixture = `
<main>
  <h2>How Pulsz Compares to Crown Coins &amp; McLuck</h2>
  <table class="src-tbl">
    <thead><tr><th>Factor</th><th>Pulsz</th><th>Crown Coins</th><th>McLuck</th></tr></thead>
    <tbody>
      <tr><td><span class="sn">Editor score</span></td><td><span class="sp sp-hi">4.5 / 5</span></td><td>4.6 / 5</td><td>4.5 / 5</td></tr>
    </tbody>
  </table>
  <!--sc-operator-facts data-operator="pulsz" data-fields="name,editorScore100"-->
</main>
`;

const comparisonRendered = injectOperatorFactsHtml(comparisonFixture, 'pulsz');
const editorRow = comparisonRendered.match(
  /<tr>[\s\S]*?Editor score[\s\S]*?<\/tr>/i,
)?.[0];
assert.ok(editorRow, 'comparison editor-score row must survive');
assert.match(editorRow, /data-comparison-operator="pulsz"[^>]*>88\/100/);
assert.match(editorRow, /data-comparison-operator="crown-coins"[^>]*>91\/100/);
assert.match(editorRow, /data-comparison-operator="mcluck"[^>]*>88\/100/);
assert.doesNotMatch(
  editorRow.replace(/data-comparison-operator="pulsz"[^>]*>88\/100/, ''),
  /88\/100[\s\S]*88\/100[\s\S]*88\/100/,
  'competitor columns must not all bleed Pulsz\'s 88',
);

const crownFixture = comparisonFixture
  .replace('data-operator="pulsz"', 'data-operator="crown-coins"')
  .replace('How Pulsz Compares', 'How Crown Coins Compares')
  .replace(
    '<th>Factor</th><th>Pulsz</th><th>Crown Coins</th><th>McLuck</th>',
    '<th>Factor</th><th>Crown Coins</th><th>McLuck</th><th>Pulsz</th>',
  );
const crownRendered = injectOperatorFactsHtml(crownFixture, 'crown-coins');
const crownRow = crownRendered.match(/<tr>[\s\S]*?Editor score[\s\S]*?<\/tr>/i)?.[0] ?? '';
assert.match(crownRow, /data-comparison-operator="crown-coins"[^>]*>91\/100/);
assert.match(crownRow, /data-comparison-operator="mcluck"[^>]*>88\/100/);
assert.match(crownRow, /data-comparison-operator="pulsz"[^>]*>88\/100/);

assert.equal(reviewSourceDates('pulsz')?.modifiedOn, '2026-11-05');
assert.match(pulszSource, /<title>Pulsz Review 2026 — Bonus, Apps, Payouts &amp; Trustpilot \| SweepstakesWiz<\/title>/);
assert.match(
  pulszSource,
  /property="og:title" content="Pulsz Review 2026 — Bonus, Apps, Fast Payouts &amp; 22K Trustpilot"/,
);

const pulsz = getOperator('pulsz');
assert.ok(pulsz);
const ratings = verifiedValue(pulsz.externalRatings);
assert.ok(ratings);
const trustpilot = ratings.find((rating) => rating.sourceName === 'Trustpilot');
assert.equal(trustpilot?.value, 4.4);
assert.equal(trustpilot?.scale, 5);
assert.equal(trustpilot?.ratingCount, 22000);
assert.equal(trustpilot?.sourceUrl, 'https://www.trustpilot.com/review/pulsz.com');

assert.deepEqual(brandAggregateRating('pulsz'), {
  '@type': 'AggregateRating',
  ratingValue: 4.4,
  ratingCount: 22000,
  bestRating: 5,
  worstRating: 1,
});
const brandNode = brandOrganizationNode('pulsz');
assert.deepEqual(brandNode?.aggregateRating, brandAggregateRating('pulsz'));

const renderedUnknown = prepareSsrAffiliateReviewHtml(
  pulszSource,
  null,
  'pulsz',
  'review-pulsz',
);
assert.match(
  renderedUnknown,
  /<a\b[^>]*href="\/bonuses\/pulsz\/[^"]*"[^>]*rel="sponsored nofollow noopener"/,
);
assert.match(renderedUnknown, /data-geo-swap="1"/);
assert.equal((renderedUnknown.match(/rel="sponsored nofollow noopener"/g) ?? []).length >= 1, true);

const renderedCA = prepareSsrAffiliateReviewHtml(
  pulszSource,
  'CA',
  'pulsz',
  'review-pulsz',
);
assert.doesNotMatch(renderedCA, /href="\/bonuses\/pulsz\//);
assert.match(
  renderedCA,
  /<a\b[^>]*href="\/bonuses\/no-deposit\/"[^>]*rel="nofollow noopener"/,
);

const renderedTX = prepareSsrAffiliateReviewHtml(
  pulszSource,
  'TX',
  'pulsz',
  'review-pulsz',
);
assert.match(renderedTX, /href="\/bonuses\/pulsz\/\?clickId=review-pulsz"/);
assert.match(renderedTX, /rel="sponsored nofollow noopener"/);

const graph = graphFromHtml(renderedTX);
const reviewNode = graph.find((node) => node['@type'] === 'Review');
const webPage = graph.find((node) => node['@type'] === 'ItemPage' || node['@type'] === 'WebPage');
const brand = graph.find(
  (node) => node['@id'] === 'https://sweepstakeswiz.com/reviews/pulsz/#brand',
);
assert.equal(reviewNode?.dateModified, '2026-11-05T00:00:00Z');
assert.equal(webPage?.dateModified, '2026-11-05T00:00:00Z');
assert.deepEqual(brand?.aggregateRating, {
  '@type': 'AggregateRating',
  ratingValue: 4.4,
  ratingCount: 22000,
  bestRating: 5,
  worstRating: 1,
});
JSON.parse(JSON.stringify({ '@graph': graph }));

assert.match(renderedTX, /Updated November 2026/);
assert.match(renderedTX, /Updated November 5, 2026/);
assert.doesNotMatch(renderedTX, /Updated June 24, 2026/);

assert.match(pulszSource, /id="evolution"/);
assert.match(pulszSource, /How Pulsz Has Evolved/);
assert.match(pulszSource, /Pulse 8 Studios/);
assert.match(pulszSource, /TODO\(human\): confirm any specific 2025/);
assert.match(pulszSource, /How the 88\/100 is calculated/);
assert.match(pulszSource, /TODO\(human\): confirm these component weights/);
assert.match(pulszSource, /TODO\(human\): Hands-on check/);
assert.match(
  pulszSource,
  /<!-- testing:hands-on -->[\s\S]*<!--[\s\S]*Hands-on check[\s\S]*-->[\s\S]*<!-- \/testing:hands-on -->/,
);
assert.doesNotMatch(
  renderedTX.replace(/<!--[\s\S]*?-->/g, ''),
  /Hands-on check — November 2026/,
);

assert.doesNotMatch(injectReaderReports('<main></main>', 'pulsz'), /id="reader-reports"/);
assert.doesNotMatch(renderReaderReportBlock('pulsz'), /No reader reports for/);

const sample =
  '<a href="/bonuses/pulsz/" class="btn-claim" rel="nofollow sponsored">Claim Bonus</a>';
const unknownCta = suppressAffiliateCtas(sample, null, 'review-pulsz', {
  crawlableDefault: true,
});
assert.match(unknownCta, /href="\/bonuses\/pulsz\/\?clickId=review-pulsz"/);
assert.match(unknownCta, /rel="sponsored nofollow noopener"/);
const bannedCta = suppressAffiliateCtas(sample, 'CA', 'review-pulsz', {
  crawlableDefault: true,
});
assert.match(bannedCta, /href="\/bonuses\/no-deposit\/"/);
assert.doesNotMatch(bannedCta, /\/bonuses\/pulsz\//);

const chrome = consolidateJsonLd(pulszSource);
assert.doesNotMatch(chrome, /â€”/);
assert.match(chrome, /SweepstakesWiz/);

console.log('pulsz review E-E-A-T fixes: OK');
