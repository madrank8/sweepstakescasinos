export interface RenderedEditorScoreContext {
  kind: 'first-party-language' | 'aggregate-total' | 'unattributed-rating';
  value: number;
  scale: 5 | 100;
  excerpt: string;
}

const SCORE = /(\d{1,3}(?:\.\d+)?)\s*\/\s*(5|100)\b/g;
const BARE_FIVE_SCORE = /\b([0-5]\.\d+)\b/g;
const FIRST_PARTY_LANGUAGE =
  /\b(?:editor(?:ial)?|overall|our (?:score|rating)|we rate|how we (?:rate|score)|earns?(?: its| an?| the)?|is rated|rated by (?:us|sweepstakes wiz))\b/i;
const EXPLICIT_THIRD_PARTY =
  /\b(?:Trustpilot|Google Play|App Store|player-reported|reader reports?)\b|[a-z0-9.-]+\.com\b/i;

function decodeText(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_match, digits: string) =>
      String.fromCodePoint(Number(digits)),
    )
    .replace(/&#x([a-f0-9]+);/gi, (_match, digits: string) =>
      String.fromCodePoint(Number.parseInt(digits, 16)),
    )
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function plainText(value: string): string {
  return decodeText(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function removeExplicitExternalRows(html: string): string {
  return html.replace(/<tr\b[\s\S]*?<\/tr\s*>/gi, (row) => {
    const text = plainText(row);
    if (FIRST_PARTY_LANGUAGE.test(text)) return row;
    if (
      EXPLICIT_THIRD_PARTY.test(text) ||
      /\bhref\s*=\s*["']https?:\/\//i.test(row)
    ) {
      return '\n';
    }
    return row;
  });
}

function visibleLines(html: string): string[] {
  const visible = removeExplicitExternalRows(html)
    .replace(/<head\b[\s\S]*?<\/head\s*>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(
      /<\/(?:address|article|aside|blockquote|div|dd|dt|figcaption|footer|h[1-6]|header|li|main|nav|p|section|span|td|th|tr)>/gi,
      '\n',
    )
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const lines = decodeText(visible)
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  for (let index = 0; index < lines.length - 1; index += 1) {
    if (/^\d{1,3}(?:\.\d+)?$/.test(lines[index]) && /^\/\s*(?:5|100)\b/.test(lines[index + 1])) {
      lines.splice(index, 2, `${lines[index]}${lines[index + 1]}`);
    }
  }
  return lines;
}

function previousLineIsDescriptive(lines: string[], index: number): boolean {
  const previous = lines[index - 1] ?? '';
  return (
    /[a-z]{3}/i.test(previous) &&
    !FIRST_PARTY_LANGUAGE.test(previous) &&
    !/(?:★|☆){3,}/.test(previous)
  );
}

export function findRenderedEditorScoreContexts(
  html: string,
): RenderedEditorScoreContext[] {
  const lines = visibleLines(html);
  const contexts: RenderedEditorScoreContext[] = [];

  lines.forEach((line, lineIndex) => {
    for (const match of line.matchAll(SCORE)) {
      const value = Number(match[1]);
      const scale = Number(match[2]) as 5 | 100;
      const scoreOnly =
        line.replace(/\d{1,3}(?:\.\d+)?\s*\/\s*(?:5|100)\b/g, '').trim()
          .length === 0;
      const previous = lines[lineIndex - 1] ?? '';
      const next = lines[lineIndex + 1] ?? '';
      const sourceContext = lines
        .slice(Math.max(0, lineIndex - 3), lineIndex + 4)
        .join(' ');
      if (
        EXPLICIT_THIRD_PARTY.test(line) ||
        (EXPLICIT_THIRD_PARTY.test(sourceContext) &&
          (scoreOnly ||
            /\breviews?\b/i.test(line) ||
            /\(\s*~?[\d,.]+[Kk]?\+?\s*\)/.test(line)))
      ) {
        continue;
      }
      const firstParty =
        FIRST_PARTY_LANGUAGE.test(line) ||
        (scoreOnly &&
          (FIRST_PARTY_LANGUAGE.test(previous) ||
            FIRST_PARTY_LANGUAGE.test(next)));
      if (
        scale === 100 &&
        !firstParty &&
        scoreOnly &&
        previousLineIsDescriptive(lines, lineIndex)
      ) {
        continue;
      }
      contexts.push({
        kind: firstParty
          ? 'first-party-language'
          : scale === 100
            ? 'aggregate-total'
            : 'unattributed-rating',
        value,
        scale,
        excerpt: line.slice(0, 180),
      });
    }

    const previous = lines[lineIndex - 1] ?? '';
    const next = lines[lineIndex + 1] ?? '';
    const bareScoreOnly =
      line.replace(/\b[0-5]\.\d+\b/g, '').replace(/(?:★|☆|½)+/g, '').trim()
        .length === 0;
    if (
      EXPLICIT_THIRD_PARTY.test(line) ||
      (!FIRST_PARTY_LANGUAGE.test(line) &&
        !(
          bareScoreOnly &&
          (FIRST_PARTY_LANGUAGE.test(previous) ||
            FIRST_PARTY_LANGUAGE.test(next))
        ))
    ) {
      return;
    }
    for (const match of line.matchAll(BARE_FIVE_SCORE)) {
      const trailing = line.slice(match.index + match[0].length);
      if (/^\s*\/\s*(?:5|100)\b/.test(trailing)) continue;
      contexts.push({
        kind: 'first-party-language',
        value: Number(match[1]),
        scale: 5,
        excerpt: line.slice(0, 180),
      });
    }
  });
  return contexts;
}

export function validateRenderedEditorScoreContexts(
  expectedScore100: number | undefined,
  html: string,
): string[] {
  const contexts = findRenderedEditorScoreContexts(html);
  if (expectedScore100 === undefined) {
    return contexts.map(
      (context) =>
        `unresolved editor score leaked in ${context.kind}: ${context.excerpt}`,
    );
  }
  if (contexts.length === 0) {
    return [`verified editor score ${expectedScore100}/100 is not visibly rendered`];
  }
  return contexts.flatMap((context) =>
    context.scale === 100 && context.value === expectedScore100
      ? []
      : [
          `rendered ${context.kind} score ${context.value}/${context.scale} ` +
            `does not match ${expectedScore100}/100`,
        ],
  );
}
