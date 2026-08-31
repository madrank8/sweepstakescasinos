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
const LEGACY_SCORE_PAIR =
  /(<span\b[^>]*class=["'][^"']*\b(?:num|big)\b[^"']*["'][^>]*>)\s*\d{1,3}(?:\.\d+)?\s*(<\/span>\s*<span\b[^>]*class=["'][^"']*\b(?:den|denom)\b[^"']*["'][^>]*>)\s*\/\s*100\s*(<\/span>)/gi;
const FIELD_SET = new Set<string>(CANONICAL_OPERATOR_FIELDS);
const SCORE_ONLY_CLASSES = new Set([
  'v-score',
  'vb-num',
  'sh-score',
  'verdict-score',
  'sb-num',
]);
const SCORE_STARS_CLASSES = new Set([
  'v-stars',
  'vb-stars',
  'sh-stars',
  'verdict-stars',
  'sb-stars',
  'oc-stars',
  'oc-score',
]);
const LABELED_SCORE_ITEM_CLASSES = new Set(['metric', 'stat', 'qp-item', 'qf-item']);
const STICKY_SCORE_CLASSES = new Set(['sticky-sub', 'sticky-st']);
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
  classes: Set<string>;
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

function classNames(opening: string): Set<string> {
  const value = opening.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
  return new Set(value.split(/\s+/).filter(Boolean));
}

function elementRanges(html: string): HtmlElementRange[] {
  const ranges: HtmlElementRange[] = [];
  const stack: Array<Omit<HtmlElementRange, 'closeStart' | 'end' | 'classes'>> = [];
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
          classes: classNames(opening.opening),
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

function hasAnyClass(classes: Set<string>, expected: Set<string>): boolean {
  return [...classes].some((name) => expected.has(name));
}

function scoreStateHtml(score: number | undefined): string {
  const status = score === undefined ? 'unresolved' : 'verified';
  const value = score === undefined ? 'unresolved' : `${score}/100`;
  return `<span class="sc-editor-score-state" data-editor-score-status="${status}">Editor score: ${value}</span>`;
}

function replaceSemanticElements(
  html: string,
  predicate: (element: HtmlElementRange, inner: string) => boolean,
  replacement: (element: HtmlElementRange, inner: string) => string,
): string {
  const matches = elementRanges(html)
    .filter((element) =>
      predicate(element, html.slice(element.openEnd, element.closeStart)),
    )
    .sort((left, right) => right.start - left.start);
  let result = html;
  let replacedStart = Number.POSITIVE_INFINITY;
  for (const element of matches) {
    if (element.end > replacedStart) continue;
    const inner = html.slice(element.openEnd, element.closeStart);
    result =
      result.slice(0, element.start) +
      replacement(element, inner) +
      result.slice(element.end);
    replacedStart = element.start;
  }
  return result;
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

function normalizeStickyScore(inner: string, score: number | undefined): string {
  const scoreMarkup = scoreStateHtml(score);
  let inserted = false;
  return inner
    .split(/(\s*(?:&#183;|·|—|&mdash;)\s*)/)
    .map((fragment) => {
      if (!/\d(?:\.\d+)?\s*\/\s*5/i.test(fragment)) return fragment;
      if (/\b(?:Trustpilot|Google|App Store|iOS|Android)\b/i.test(fragment)) {
        return fragment;
      }
      const scrubbed = fragment
        .replace(/(?:&#9733;|&#189;|[★☆½])+\s*/gi, '')
        .replace(/~?\d(?:\.\d+)?\s*\/\s*5(?:\s*Editor)?/gi, '');
      if (inserted) return scrubbed;
      inserted = true;
      return `${scoreMarkup}${scrubbed}`;
    })
    .join('');
}

function normalizeLegacyEditorScore(
  html: string,
  score: number | undefined,
): string {
  const scoreMarkup = scoreStateHtml(score);
  let normalized = replaceSemanticElements(
    html,
    (element) =>
      hasAnyClass(element.classes, SCORE_ONLY_CLASSES) ||
      hasAnyClass(element.classes, SCORE_STARS_CLASSES) ||
      element.classes.has('score-bars'),
    (element) => replaceElementContents(element, scoreMarkup, score),
  );
  normalized = replaceSemanticElements(
    normalized,
    (element, inner) =>
      hasAnyClass(element.classes, LABELED_SCORE_ITEM_CLASSES) &&
      /\b(?:Editor Score|Overall(?: Score| Rating)?)\b/i.test(
        inner.replace(/<[^>]+>/g, ' '),
      ),
    (element) => replaceElementContents(element, scoreMarkup, score),
  );
  normalized = replaceSemanticElements(
    normalized,
    (element, inner) =>
      hasAnyClass(element.classes, STICKY_SCORE_CLASSES) &&
      /\d(?:\.\d+)?\s*\/\s*5/i.test(inner),
    (element, inner) =>
      replaceElementContents(element, normalizeStickyScore(inner, score), score),
  );
  const status = score === undefined ? 'unresolved' : 'verified';
  return normalized.replace(
    LEGACY_SCORE_PAIR,
    (_match, valueOpen: string, denominatorOpen: string, denominatorClose: string) => {
      const opening = valueOpen.replace(
        />$/,
        ` data-editor-score-status="${status}" data-canonical-score-status="${status}">`,
      );
      return `${opening}${scoreMarkup}${denominatorOpen}${denominatorClose}`;
    },
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
