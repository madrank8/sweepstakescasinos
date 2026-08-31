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
const LEGACY_EDITOR_SCORE =
  /(<span\b[^>]*class=["'][^"']*\b(?:num|big)\b[^"']*["'][^>]*>)\s*\d{1,3}(?:\.\d+)?\s*(<\/span>\s*<span\b[^>]*class=["'][^"']*\b(?:den|denom)\b[^"']*["'][^>]*>)\s*\/\s*100\s*(<\/span>)/gi;
const FIELD_SET = new Set<string>(CANONICAL_OPERATOR_FIELDS);

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

function normalizeLegacyEditorScore(
  html: string,
  score: number | undefined,
): string {
  return html.replace(
    LEGACY_EDITOR_SCORE,
    (_match, valueOpen: string, denominatorOpen: string, denominatorClose: string) => {
      if (score !== undefined) {
        return `${valueOpen}${score}${denominatorOpen}/100${denominatorClose}`;
      }
      const unresolvedOpen = valueOpen.replace(
        />$/,
        ' data-canonical-score-status="unresolved">',
      );
      return `${unresolvedOpen}Score unresolved${denominatorOpen}${denominatorClose}`;
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
