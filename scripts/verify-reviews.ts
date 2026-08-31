import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPartner } from '../src/data/affiliates';
import {
  CANONICAL_OPERATOR_FIELDS,
  OPERATORS,
  verifiedValue,
} from '../src/data/operators';
import { prepareSsrAffiliateReviewHtml } from '../src/lib/affiliateHtml';
import { reviewOutboundAvailabilityView } from '../src/lib/availabilityViews';
import { selectReviewContextualLinks } from '../src/lib/internalLinks';
import { getStaticReviewHtml } from '../src/lib/staticHtml.js';
import { findRenderedEditorScoreContexts } from './lib/rendered-editor-score-detector';
import { findUnsupportedTestingClaims } from './seo/claim-policy';

type JsonNode = Record<string, unknown>;

export interface ReviewQaResult {
  sourceCount: number;
  renderCount: number;
  staticRenderCount: number;
  ssrRenderCount: number;
  uniqueTitleCount: number;
  factSummaryCount: number;
  answerBlockCount: number;
  maxAnswerBlocksPerReview: number;
  factSummaryAfterVerdictCount: number;
  visibleInternalStatusLeakCount: number;
  outboundEligibilityAssertionCount: number;
  disclosureCount: number;
  contextualNavigationCount: number;
  faqPageCount: number;
  faqSchemaMismatchCount: number;
  errors: string[];
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
    nbsp: ' ',
    ndash: '–',
    mdash: '—',
  };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_match, value: string) =>
      String.fromCodePoint(Number.parseInt(value, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) =>
      named[name.toLowerCase()] ?? match,
    );
}

function plain(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function visiblePlain(value: string): string {
  return plain(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, ''),
  );
}

function canonical(html: string): string {
  return (
    html.match(
      /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i,
    )?.[1] ?? ''
  );
}

function title(html: string): string {
  return plain(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
}

function jsonLdNodes(html: string): JsonNode[] {
  const nodes: JsonNode[] = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const parsed = JSON.parse(match[1]) as JsonNode;
    if (Array.isArray(parsed['@graph'])) {
      nodes.push(...(parsed['@graph'] as JsonNode[]));
    } else {
      nodes.push(parsed);
    }
  }
  return nodes;
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

function dateErrors(slug: string, html: string, nodes: JsonNode[]): string[] {
  const errors: string[] = [];
  for (const match of html.matchAll(/<time\b[^>]*\bdatetime=["']([^"']+)["']/gi)) {
    if (!validIsoDate(match[1])) {
      errors.push(`${slug}: invalid visible datetime "${match[1]}"`);
    }
  }
  const walk = (value: unknown, key = ''): void => {
    if (Array.isArray(value)) {
      value.forEach((entry) => walk(entry, key));
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [childKey, child] of Object.entries(value as JsonNode)) {
      if (/^date[A-Z]/.test(childKey) && typeof child === 'string') {
        if (!validIsoDate(child)) {
          errors.push(`${slug}: invalid schema ${childKey} "${child}"`);
        }
      } else {
        walk(child, childKey);
      }
    }
  };
  walk(nodes);
  return errors;
}

function visibleFaqs(html: string): Array<{ question: string; answer: string }> {
  const questions = [
    ...html.matchAll(
      /<(button|div)\b[^>]*class=["'][^"']*\bfaq-(?:btn|q)\b[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi,
    ),
  ].map((match) =>
    plain(
      match[2].replace(
        /<span\b[^>]*class=["'][^"']*\bfaq-(?:arrow|arr)\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi,
        '',
      ),
    ),
  );
  const answers = [
    ...html.matchAll(
      /<div\b[^>]*class=["'][^"']*\bfaq-(?:answer-)?inner\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    ),
  ].map((match) => plain(match[1]));
  return questions.map((question, index) => ({
    question,
    answer: answers[index] ?? '',
  }));
}

function schemaFaqs(nodes: JsonNode[]): Array<{ question: string; answer: string }> {
  const faq = nodes.find((node) => node['@type'] === 'FAQPage');
  if (!faq || !Array.isArray(faq.mainEntity)) return [];
  return (faq.mainEntity as JsonNode[]).flatMap((question) => {
    const answer = question.acceptedAnswer as JsonNode | undefined;
    if (
      question['@type'] !== 'Question' ||
      typeof question.name !== 'string' ||
      typeof answer?.text !== 'string'
    ) {
      return [];
    }
    return [{ question: plain(question.name), answer: plain(answer.text) }];
  });
}

function reviewRating(nodes: JsonNode[]): JsonNode | undefined {
  const review = nodes.find((node) => node['@type'] === 'Review');
  return review?.reviewRating as JsonNode | undefined;
}

export function runReviewQa(root = process.cwd()): ReviewQaResult {
  const errors: string[] = [];
  const reviewDir = resolve(root, 'reviews');
  const slugs = readdirSync(reviewDir)
    .filter((file) => file.endsWith('.html'))
    .map((file) => file.replace(/\.html$/, ''))
    .sort();
  const records = new Map(OPERATORS.map((operator) => [operator.slug, operator]));
  const titles = new Map<string, string[]>();
  let staticRenderCount = 0;
  let ssrRenderCount = 0;
  let factSummaryCount = 0;
  let answerBlockCount = 0;
  const maxAnswerBlocksPerReview = 2;
  let factSummaryAfterVerdictCount = 0;
  let visibleInternalStatusLeakCount = 0;
  let outboundEligibilityAssertionCount = 0;
  let disclosureCount = 0;
  let contextualNavigationCount = 0;
  let faqPageCount = 0;
  let faqSchemaMismatchCount = 0;

  for (const slug of slugs) {
    const record = records.get(slug);
    if (!record) {
      errors.push(`${slug}: missing canonical operator record`);
      continue;
    }
    const relativePath = `reviews/${slug}.html`;
    const source = readFileSync(resolve(root, relativePath), 'utf8');
    const expectedCanonical = `https://sweepstakeswiz.com/reviews/${slug}/`;
    const sourceTitle = title(source);
    titles.set(sourceTitle, [...(titles.get(sourceTitle) ?? []), slug]);
    if ((source.match(/<h1\b/gi) ?? []).length !== 1) {
      errors.push(`${slug}: source must contain exactly one H1`);
    }
    if (!sourceTitle) errors.push(`${slug}: source title is empty`);
    if (canonical(source) !== expectedCanonical) {
      errors.push(`${slug}: source canonical does not match its slug`);
    }
    if (!/class=["'][^"']*\bdisclosure\b/i.test(source)) {
      errors.push(`${slug}: authored disclosure is missing`);
    }
    const unsupportedSourceClaims = findUnsupportedTestingClaims(
      source,
      relativePath,
      false,
    );
    if (unsupportedSourceClaims.length > 0) {
      errors.push(`${slug}: unsupported first-hand source claim`);
    }

    const ssr = /href=["']\/bonuses\//i.test(source);
    const rendered = ssr
      ? (ssrRenderCount++,
        prepareSsrAffiliateReviewHtml(
          source,
          null,
          slug,
          `review-${slug}`,
        ))
      : (staticRenderCount++, getStaticReviewHtml(relativePath, slug));
    if ((rendered.match(/<h1\b/gi) ?? []).length !== 1) {
      errors.push(`${slug}: rendered review must contain exactly one H1`);
    }
    if (canonical(rendered) !== expectedCanonical) {
      errors.push(`${slug}: rendered canonical does not match its slug`);
    }
    if (
      !rendered.includes(
        `<section class="sc-review-fact-summary" data-canonical-operator="${slug}">`,
      ) &&
      !rendered.includes(
        `<section class="sc-review-fact-summary" data-canonical-operator="${slug}" `,
      )
    ) {
      errors.push(`${slug}: canonical fact summary is missing`);
    } else {
      factSummaryCount += 1;
    }
    for (const field of CANONICAL_OPERATOR_FIELDS) {
      const status = record[field].status;
      if (!rendered.includes(`${field}:${status}`)) {
        errors.push(`${slug}.${field}: rendered canonical status mismatch`);
      }
      const row = `data-canonical-field="${field}"`;
      if (status === 'verified' && !rendered.includes(row)) {
        errors.push(`${slug}.${field}: verified fact row is missing`);
      }
      if (status !== 'verified' && rendered.includes(row)) {
        errors.push(`${slug}.${field}: unresolved or missing fact row is visible`);
      }
    }
    for (const required of [
      'legal-status-source',
      'visitor-offer-eligibility',
    ]) {
      if (!rendered.includes(`data-review-fact="${required}"`)) {
        errors.push(`${slug}: missing ${required} fact`);
      }
    }
    if (
      !rendered.includes('Sweepstakes Legality Tracker') ||
      !rendered.includes('<!--sc-legal-verified-->')
    ) {
      errors.push(`${slug}: availability authority wording is missing`);
    }
    if (getPartner(slug) && !rendered.includes('Affiliate offer availability:')) {
      errors.push(`${slug}: affiliate availability authority wording is missing`);
    }

    const answerBlocks = [
      ...rendered.matchAll(
        /<section class="sc-review-answer" data-answer-kind="([^"]+)">([\s\S]*?)<\/section>/g,
      ),
    ];
    answerBlockCount += answerBlocks.length;
    if (answerBlocks.length > maxAnswerBlocksPerReview) {
      errors.push(`${slug}: more than ${maxAnswerBlocksPerReview} injected answer blocks`);
    }
    const authoredHeadings = [
      ...source.matchAll(/<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/gi),
    ].map((match) => plain(match[1]));
    const kindCue: Record<string, RegExp> = {
      redemption: /\b(?:redemption|redeem|cash ?out|payout)\b/i,
      payments: /\b(?:payment|banking|redemption method)\b/i,
      games: /\b(?:games?|library|lobby|slots)\b/i,
      'company-launch': /\b(?:operator|company|owner|launch|who (?:runs|operates))\b/i,
      offer: /\b(?:bonus|offer|promo|free sc)\b/i,
    };
    for (const [, kind, block] of answerBlocks) {
      if (!/<h2[^>]*>[^<]*\?<\/h2>/.test(block)) {
        errors.push(`${slug}/${kind}: answer block lacks a question H2`);
      }
      if (/\b(?:we|our)\s+(?:observed|tested|measured)\b/i.test(block)) {
        errors.push(`${slug}/${kind}: answer block implies first-hand testing`);
      }
      if (authoredHeadings.some((heading) => kindCue[kind]?.test(heading))) {
        errors.push(`${slug}/${kind}: answer block duplicates an authored section`);
      }
    }
    const verdictPosition = rendered.search(
      /\bclass=["'][^"']*\b(?:verdict-(?:wrap|box)|score-(?:box|hero))\b/i,
    );
    const summaryPosition = rendered.indexOf('<!--sc-review-facts-after-verdict-->');
    if (verdictPosition >= 0 && summaryPosition > verdictPosition) {
      factSummaryAfterVerdictCount += 1;
    } else {
      errors.push(`${slug}: fact summary does not follow the authored verdict`);
    }
    const summary = rendered.match(
      /<section class="sc-review-fact-summary"[\s\S]*?<\/section>/i,
    )?.[0] ?? '';
    if (/\b(?:Unresolved|Not verified|Not canonicalized)\b/i.test(visiblePlain(summary))) {
      visibleInternalStatusLeakCount += 1;
      errors.push(`${slug}: fact summary exposes an internal status label`);
    }

    const nodes = jsonLdNodes(rendered);
    const score = verifiedValue(record.editorScore100);
    const rating = reviewRating(nodes);
    const contexts = findRenderedEditorScoreContexts(rendered);
    if (score === undefined) {
      if (rating) errors.push(`${slug}: schema rating exists for unresolved score`);
      if (contexts.length > 0) errors.push(`${slug}: unresolved visible score leaked`);
    } else {
      if (
        !rating ||
        rating.ratingValue !== score ||
        rating.bestRating !== 100 ||
        rating.worstRating !== 0
      ) {
        errors.push(`${slug}: visible/schema rating parity failed`);
      }
      if (
        contexts.length === 0 ||
        contexts.some(
          (context) => context.value !== score || context.scale !== 100,
        )
      ) {
        errors.push(`${slug}: visible canonical score parity failed`);
      }
    }

    const visible = visibleFaqs(rendered);
    const schema = schemaFaqs(nodes);
    if (nodes.some((node) => node['@type'] === 'FAQPage')) faqPageCount += 1;
    if (JSON.stringify(visible) !== JSON.stringify(schema)) {
      faqSchemaMismatchCount += 1;
      const mismatchIndex = Array.from(
        { length: Math.max(visible.length, schema.length) },
        (_, index) => index,
      ).find(
        (index) =>
          JSON.stringify(visible[index]) !== JSON.stringify(schema[index]),
      );
      errors.push(
        `${slug}: visible FAQ and FAQPage schema differ at item ${Number(mismatchIndex) + 1}: ` +
          `visible=${JSON.stringify(visible[mismatchIndex ?? 0])}; ` +
          `schema=${JSON.stringify(schema[mismatchIndex ?? 0])}`,
      );
    }
    if (
      answerBlocks.some(([, , block]) =>
        schema.some((entry) => block.includes(entry.question)),
      )
    ) {
      errors.push(`${slug}: answer block was copied into FAQ schema`);
    }

    const renderedWithoutReaderSubmission = rendered.replace(
      /<form\b[^>]*class=["'][^"']*\brr-form\b[^"']*["'][^>]*>[\s\S]*?<\/form>/gi,
      '',
    );
    const unsupportedRenderedClaims = findUnsupportedTestingClaims(
      renderedWithoutReaderSubmission,
      relativePath,
      false,
    );
    if (unsupportedRenderedClaims.length > 0) {
      errors.push(`${slug}: unsupported first-hand rendered claim`);
    }
    errors.push(...dateErrors(slug, rendered, nodes));

    if (/class=["'][^"']*\bdisclosure\b/i.test(rendered)) {
      disclosureCount += 1;
    } else {
      errors.push(`${slug}: rendered disclosure is missing`);
    }
    if (rendered.includes('<!--sc-contextual-nav-->')) {
      contextualNavigationCount += 1;
    } else {
      errors.push(`${slug}: contextual navigation is missing`);
    }
    for (const link of selectReviewContextualLinks(slug)) {
      if (!rendered.includes(`href="${link.href}"`)) {
        errors.push(`${slug}: contextual destination ${link.href} is missing`);
      }
    }

    for (const state of [null, 'TX', 'CA'] as const) {
      const geoRendered = prepareSsrAffiliateReviewHtml(
        source,
        state,
        slug,
        `review-${slug}`,
      );
      const expected = reviewOutboundAvailabilityView(slug, state);
      const summaryEligibility = geoRendered.match(
        /data-review-fact="visitor-offer-eligibility"[^>]*\bdata-cta-eligible="(true|false)"/i,
      )?.[1];
      if (summaryEligibility !== String(expected.canCta)) {
        errors.push(`${slug}/${state ?? 'unknown'}: summary CTA eligibility mismatch`);
      }
      const hasCta = new RegExp(
        `<a\\b[^>]*href=["']/bonuses/${slug}/?(?:\\?[^"']*)?["']`,
        'i',
      ).test(geoRendered);
      if (hasCta !== expected.canCta) {
        errors.push(`${slug}/${state ?? 'unknown'}: CTA presence disagrees with eligibility`);
      }
      outboundEligibilityAssertionCount += 1;
    }
  }

  for (const [value, owners] of titles) {
    if (owners.length > 1) {
      errors.push(`duplicate review title "${value}": ${owners.join(', ')}`);
    }
  }
  if (slugs.length !== 29) {
    errors.push(`review inventory: expected 29, found ${slugs.length}`);
  }
  if (records.size !== 29) {
    errors.push(`operator inventory: expected 29, found ${records.size}`);
  }

  return {
    sourceCount: slugs.length,
    renderCount: slugs.length,
    staticRenderCount,
    ssrRenderCount,
    uniqueTitleCount: titles.size,
    factSummaryCount,
    answerBlockCount,
    maxAnswerBlocksPerReview,
    factSummaryAfterVerdictCount,
    visibleInternalStatusLeakCount,
    outboundEligibilityAssertionCount,
    disclosureCount,
    contextualNavigationCount,
    faqPageCount,
    faqSchemaMismatchCount,
    errors: [...new Set(errors)].sort(),
  };
}

const isCli =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const result = runReviewQa();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) process.exit(1);
}
