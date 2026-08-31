import {
  CANONICAL_OPERATOR_FIELDS,
  getOperator,
  verifiedValue,
  type CanonicalOperatorField,
  type ExternalRating,
  type RedemptionMinimum,
} from '../data/operators';

const MARKER =
  /<!--sc-operator-facts\s+data-operator="([a-z0-9-]+)"\s+data-fields="([^"]+)"\s*-->/g;
const FIELD_SET = new Set<string>(CANONICAL_OPERATOR_FIELDS);
const SCORE_RATIO = /(?:~\s*)?(\d{1,3}(?:\.\d+)?)\s*\/\s*(5|100)\b/gi;
const BARE_FIVE_SCORE = /\b[0-5]\.\d+\b/g;
const FIRST_PARTY_CUE =
  /\b(?:editor(?:ial)?|editor(?:ial)? score|editor(?:'s)? rating|overall(?: score| rating| verdict)?|our (?:score|rating)|we rate|how we (?:rate|score)|earns?(?: its| an?| the)?|is rated|rated by (?:us|sweepstakes wiz))\b/i;
const BREAKDOWN_CUE = /\b(?:how we (?:rate|score)|rating breakdown|score breakdown)\b/i;
const THIRD_PARTY_CUE =
  /\b(?:Trustpilot|Google Play|App Store|player-reported|reader reports?)\b|[a-z0-9.-]+\.com\b|(?:\b(?!Sweepstakes\s+Wiz\b)[A-Z][A-Za-z0-9.-]{2,})\s+rates?\b/;
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

interface HtmlElementRange {
  start: number;
  openEnd: number;
  closeStart: number;
  end: number;
  tag: string;
  opening: string;
}

interface TextReplacement {
  start: number;
  end: number;
  value: string;
}

const LABELS: Record<CanonicalOperatorField, string> = {
  name: 'Operator',
  operatorName: 'Company',
  launchDate: 'Launch date',
  signupOffer: 'Signup offer',
  dailyOffer: 'Daily offer',
  cashRedemptionMinimum: 'Cash redemption minimum',
  giftCardRedemptionMinimum: 'Gift-card redemption minimum',
  publishedRedemptionTiming: 'Published redemption timing',
  paymentMethods: 'Payment methods',
  gameCount: 'Published game count',
  externalRatings: 'External rating',
  editorScore100: 'Editor score',
  lastVerifiedDate: 'Last verified',
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatMinimum(value: RedemptionMinimum): string {
  return `${value.amount} ${value.currency}`;
}

function formatRatings(ratings: ExternalRating[]): string {
  return ratings
    .map(
      (rating) =>
        `${rating.sourceName}: ${rating.value}/${rating.scale} (as of ${rating.asOf})`,
    )
    .join('; ');
}

function formatField(field: CanonicalOperatorField, value: unknown): string {
  if (field === 'editorScore100') return `${value}/100`;
  if (field === 'gameCount') return Number(value).toLocaleString('en-US');
  if (field === 'paymentMethods') return (value as string[]).join(', ');
  if (field === 'externalRatings') return formatRatings(value as ExternalRating[]);
  if (field === 'cashRedemptionMinimum' || field === 'giftCardRedemptionMinimum') {
    return formatMinimum(value as RedemptionMinimum);
  }
  return String(value);
}

function elementRanges(html: string): HtmlElementRange[] {
  const ranges: HtmlElementRange[] = [];
  const stack: Array<Omit<HtmlElementRange, 'closeStart' | 'end'>> = [];
  const tags = /<\/?([a-z][a-z0-9:-]*)\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = tags.exec(html))) {
    const token = match[0];
    const tag = match[1].toLowerCase();
    if (token.startsWith('</')) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].tag !== tag) continue;
        const opening = stack[index];
        stack.splice(index);
        ranges.push({
          ...opening,
          closeStart: match.index,
          end: tags.lastIndex,
        });
        break;
      }
      continue;
    }
    if (VOID_ELEMENTS.has(tag) || /\/\s*>$/.test(token)) continue;
    if (tag === 'script' || tag === 'style') {
      const close = new RegExp(`</${tag}\\s*>`, 'gi');
      close.lastIndex = tags.lastIndex;
      const closing = close.exec(html);
      if (closing) tags.lastIndex = close.lastIndex;
      continue;
    }
    stack.push({
      start: match.index,
      openEnd: tags.lastIndex,
      tag,
      opening: token,
    });
  }
  return ranges;
}

function scoreStateHtml(score: number | undefined): string {
  const status = score === undefined ? 'unresolved' : 'verified';
  const value = score === undefined ? 'unresolved' : `${score}/100`;
  return `<span class="sc-editor-score-state" data-editor-score-status="${status}">Editor score: ${value}</span>`;
}

function replaceElementContents(
  element: HtmlElementRange,
  content: string,
  score: number | undefined,
): string {
  const status = score === undefined ? 'unresolved' : 'verified';
  const opening = /\bdata-editor-score-status\s*=/.test(element.opening)
    ? element.opening
    : element.opening.replace(/>$/, ` data-editor-score-status="${status}">`);
  return `${opening}${content}</${element.tag}>`;
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#8211|#8212|#183|nbsp);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function visibleTextSegments(html: string): Array<{ start: number; text: string }> {
  const segments: Array<{ start: number; text: string }> = [];
  const hidden =
    /<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<[^>]+>/gi;
  let cursor = 0;
  for (const match of html.matchAll(hidden)) {
    if (match.index > cursor) {
      segments.push({ start: cursor, text: html.slice(cursor, match.index) });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < html.length) segments.push({ start: cursor, text: html.slice(cursor) });
  return segments;
}

function containingElements(
  elements: HtmlElementRange[],
  position: number,
): HtmlElementRange[] {
  return elements
    .filter((element) => element.start <= position && position < element.end)
    .sort(
      (left, right) =>
        left.end - left.start - (right.end - right.start),
    );
}

function elementText(html: string, element: HtmlElementRange): string {
  return plainText(html.slice(element.openEnd, element.closeStart));
}

function elementHtml(html: string, element: HtmlElementRange): string {
  return html.slice(element.start, element.end);
}

function isExplicitThirdPartyScore(
  html: string,
  position: number,
  ancestors: HtmlElementRange[],
): boolean {
  const windowStart = Math.max(0, position - 110);
  const windowText = html.slice(windowStart, Math.min(html.length, position + 120));
  const relative = position - windowStart;
  const separators = /(?:&#183;|·|—|&mdash;|[!?;])/gi;
  let clauseStart = 0;
  let clauseEnd = windowText.length;
  for (const separator of windowText.matchAll(separators)) {
    if (separator.index < relative) {
      clauseStart = separator.index + separator[0].length;
    } else {
      clauseEnd = separator.index;
      break;
    }
  }
  const local = plainText(windowText.slice(clauseStart, clauseEnd));
  if (FIRST_PARTY_CUE.test(local)) return false;
  if (THIRD_PARTY_CUE.test(local)) return true;

  const row = ancestors.find((element) => element.tag === 'tr');
  if (!row) return false;
  const rowText = elementText(html, row);
  if (FIRST_PARTY_CUE.test(rowText)) return false;
  return (
    THIRD_PARTY_CUE.test(rowText) ||
    /\bhref\s*=\s*["']https?:\/\//i.test(elementHtml(html, row))
  );
}

function isBreakdownSubcategory(
  html: string,
  ancestors: HtmlElementRange[],
): boolean {
  for (let index = 0; index < ancestors.length; index += 1) {
    const text = elementText(html, ancestors[index]);
    if (FIRST_PARTY_CUE.test(text)) return false;
    const label = text
      .replace(SCORE_RATIO, ' ')
      .replace(/(?:&#9733;|&#189;|[★☆½])+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!/[a-z]{3}/i.test(label)) continue;
    SCORE_RATIO.lastIndex = 0;
    if ([...text.matchAll(SCORE_RATIO)].length !== 1) continue;
    if (
      ancestors
        .slice(index + 1, index + 2)
        .some((ancestor) => {
          const openingContent = html
            .slice(ancestor.openEnd, Math.min(ancestor.closeStart, ancestor.openEnd + 600))
            .replace(/<!--[\s\S]*?-->/g, '');
          return /<h[2-4]\b[^>]*>[\s\S]{0,180}?\b(?:how we (?:rate|score)|rating breakdown|score breakdown)\b[\s\S]{0,80}?<\/h[2-4]>/i.test(
            openingContent,
          );
        })
    ) {
      return true;
    }
  }
  return false;
}

function shouldNormalizeScore(
  html: string,
  position: number,
  elements: HtmlElementRange[],
): boolean {
  const ancestors = containingElements(elements, position);
  if (
    ancestors.some((element) =>
      /\bdata-editor-score-status\s*=/.test(element.opening),
    )
  ) {
    return false;
  }
  const thirdParty = isExplicitThirdPartyScore(html, position, ancestors);
  const breakdown = isBreakdownSubcategory(html, ancestors);
  if (thirdParty) return false;
  return !breakdown;
}

function applyTextReplacements(
  html: string,
  replacements: TextReplacement[],
): string {
  let result = html;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    result =
      result.slice(0, replacement.start) +
      replacement.value +
      result.slice(replacement.end);
  }
  return result;
}

function normalizeSplitScoreElements(
  html: string,
  score: number | undefined,
): string {
  const elements = elementRanges(html);
  const candidates = elements
    .filter((element) => {
      const inner = html.slice(element.openEnd, element.closeStart);
      SCORE_RATIO.lastIndex = 0;
      if (SCORE_RATIO.test(inner)) return false;
      SCORE_RATIO.lastIndex = 0;
      if (!SCORE_RATIO.test(elementText(html, element))) return false;
      return shouldNormalizeScore(html, element.openEnd, elements);
    })
    .filter(
      (element, _index, all) =>
        !all.some(
          (child) =>
            child !== element &&
            child.start > element.start &&
            child.end < element.end,
        ),
    )
    .sort((left, right) => right.start - left.start);
  let result = html;
  for (const element of candidates) {
    result =
      result.slice(0, element.start) +
      replaceElementContents(element, scoreStateHtml(score), score) +
      result.slice(element.end);
  }
  return result;
}

function normalizeDirectScoreText(
  html: string,
  score: number | undefined,
): string {
  const elements = elementRanges(html);
  const replacements: TextReplacement[] = [];
  for (const segment of visibleTextSegments(html)) {
    SCORE_RATIO.lastIndex = 0;
    for (const match of segment.text.matchAll(SCORE_RATIO)) {
      const start = segment.start + match.index;
      if (shouldNormalizeScore(html, start, elements)) {
        replacements.push({
          start,
          end: start + match[0].length,
          value: scoreStateHtml(score),
        });
      }
    }
    for (const match of segment.text.matchAll(BARE_FIVE_SCORE)) {
      const start = segment.start + match.index;
      const trailing = segment.text.slice(match.index + match[0].length);
      if (/^\s*\/\s*(?:5|100)\b/.test(trailing)) continue;
      const ancestors = containingElements(elements, start);
      if (
        ancestors
          .slice(0, 4)
          .some((element) => FIRST_PARTY_CUE.test(elementText(html, element))) &&
        shouldNormalizeScore(html, start, elements)
      ) {
        replacements.push({
          start,
          end: start + match[0].length,
          value: scoreStateHtml(score),
        });
      }
    }
  }
  return applyTextReplacements(html, replacements);
}

function removeFirstPartyStars(html: string): string {
  const elements = elementRanges(html);
  const replacements: TextReplacement[] = [];
  for (const segment of visibleTextSegments(html)) {
    for (const match of segment.text.matchAll(/(?:&#9733;|&#189;|[★☆½]){3,}/gi)) {
      const start = segment.start + match.index;
      const ancestors = containingElements(elements, start);
      if (
        ancestors.some((element) =>
          /\bdata-editor-score-status\s*=/.test(elementHtml(html, element)),
        ) &&
        !isExplicitThirdPartyScore(html, start, ancestors) &&
        !isBreakdownSubcategory(html, ancestors)
      ) {
        replacements.push({ start, end: start + match[0].length, value: '' });
      }
    }
  }
  return applyTextReplacements(html, replacements);
}

function normalizeLegacyEditorScore(
  html: string,
  score: number | undefined,
): string {
  const scoreMarkup = scoreStateHtml(score);
  let normalized = normalizeSplitScoreElements(html, score);
  normalized = normalizeDirectScoreText(normalized, score);
  normalized = removeFirstPartyStars(normalized);
  const escapedMarkup = scoreMarkup.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return normalized.replace(
    new RegExp(`${escapedMarkup}\\s*(?:and|&amp;)\\s*${escapedMarkup}`, 'gi'),
    scoreMarkup,
  );
}

/**
 * Replace declarative review markers with verified canonical facts. Missing
 * and unresolved fields intentionally produce no output.
 */
export function injectOperatorFactsHtml(html: string, slug: string): string {
  if (!MARKER.test(html)) {
    MARKER.lastIndex = 0;
    return html;
  }
  MARKER.lastIndex = 0;
  const operator = getOperator(slug);
  if (!operator) throw new Error(`[operator-facts] Unknown review slug: ${slug}`);
  const normalizedHtml = normalizeLegacyEditorScore(
    html,
    verifiedValue(operator.editorScore100),
  );

  return normalizedHtml.replace(MARKER, (_marker, markerSlug: string, fieldsRaw: string) => {
    if (markerSlug !== slug) {
      throw new Error(
        `[operator-facts] Marker slug "${markerSlug}" does not match review "${slug}"`,
      );
    }
    const fields = fieldsRaw.split(',').map((field) => field.trim());
    const invalid = fields.filter((field) => !FIELD_SET.has(field));
    if (invalid.length > 0) {
      throw new Error(`[operator-facts] Unknown field(s): ${invalid.join(', ')}`);
    }

    const rows = (fields as CanonicalOperatorField[]).flatMap((field) => {
      const value = verifiedValue(operator[field]);
      if (value === undefined) return [];
      return [
        `<div class="sc-operator-fact"><dt>${LABELS[field]}</dt>` +
          `<dd data-canonical-field="${field}">${escapeHtml(formatField(field, value))}</dd></div>`,
      ];
    });
    if (rows.length === 0) {
      return `<!--sc-operator-facts-rendered data-canonical-operator="${slug}" data-empty="true"-->`;
    }
    return (
      `<!--sc-operator-facts-rendered data-canonical-operator="${slug}"-->` +
      `<dl class="sc-operator-facts" data-canonical-operator="${slug}">${rows.join('')}</dl>`
    );
  });
}
