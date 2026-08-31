export interface RenderedEditorScoreContext {
  kind: 'first-party-language' | 'aggregate-total' | 'unattributed-rating';
  value: number;
  scale: 5 | 100;
  excerpt: string;
}

const SCORE = /(\d{1,3}(?:\.\d+)?)\s*\/\s*(5|100)\b/g;
const BARE_FIVE_SCORE = /\b([0-5]\.\d+)\b/g;
const FIRST_PARTY_LANGUAGE =
  /\b(?:editor(?:ial)? (?:score|rating)|overall|our (?:score|rating|verdict|reviewers?)|from our reviewers?|verdict|final rating|we rate|how we (?:rate|score)|earns?(?: its| an?| the)?|is rated|rated by (?:us|sweepstakes wiz))\b/i;
const STRONG_FIRST_PARTY_LANGUAGE =
  /\b(?:editor(?:ial)? (?:score|rating)|our (?:score|rating|verdict|reviewers?)|from our reviewers?|verdict|final rating|we rate|how we (?:rate|score)|rated by (?:us|sweepstakes wiz))\b/i;
const NAMED_THIRD_PARTY =
  /\b(?:Trustpilot|Google Play|App Store|iOS App|Deadspin(?:\.com)?|SweepstakesCasinoReviews(?:\.com)?|SweepsKings(?:\.com)?|Sweepsy(?:\.com)?|Sweepstaker(?:\.com)?|FreakyGaming(?:\.com)?|Strafe(?:\.com)?|OddsAssist|SweepState|Next\.io|(?:independent|expert|editorial) reviewers?|player-reported|reader reports?)\b/i;

function hasNamedThirdPartyAttribution(text: string): boolean {
  return NAMED_THIRD_PARTY.test(text) && !STRONG_FIRST_PARTY_LANGUAGE.test(text);
}

function nearestMatchDistance(
  text: string,
  offset: number,
  pattern: RegExp,
): number {
  const global = new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`);
  let nearest = Number.POSITIVE_INFINITY;
  for (const match of text.matchAll(global)) {
    nearest = Math.min(nearest, Math.abs(match.index - offset));
  }
  return nearest;
}

function namedSourceIsNearest(text: string, scoreOffset: number): boolean {
  const sourceDistance = nearestMatchDistance(
    text,
    scoreOffset,
    NAMED_THIRD_PARTY,
  );
  const firstPartyDistance = nearestMatchDistance(
    text,
    scoreOffset,
    STRONG_FIRST_PARTY_LANGUAGE,
  );
  return sourceDistance <= 240 && sourceDistance < firstPartyDistance;
}

function scoreHasNamedThirdPartyAttribution(
  lines: string[],
  lineIndex: number,
  scoreIndex: number,
  scoreLength: number,
  scoreOnly: boolean,
): boolean {
  const line = lines[lineIndex];
  if (namedSourceIsNearest(line, scoreIndex)) return true;
  if (
    NAMED_THIRD_PARTY.test(lines[lineIndex - 1] ?? '') ||
    NAMED_THIRD_PARTY.test(lines[lineIndex + 1] ?? '')
  ) {
    return true;
  }
  if (
    !scoreOnly &&
    !/\breviews?\b|\(\s*~?[\d,.]+[Kk]?\+?\s*(?:reviews?)?\s*\)/i.test(line)
  ) {
    return false;
  }
  const immediate = lines
    .slice(Math.max(0, lineIndex - 3), lineIndex + 2)
    .join(' ');
  if (hasNamedThirdPartyAttribution(immediate)) return true;
  const start = Math.max(0, lineIndex - 30);
  const contextLines = lines.slice(start, lineIndex + 4);
  const beforeScore = contextLines
    .slice(0, lineIndex - start)
    .join(' ');
  const adjacent = contextLines.join(' ');
  return namedSourceIsNearest(adjacent, beforeScore.length + 1 + scoreIndex);
}

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
      hasNamedThirdPartyAttribution(text) ||
      /<a\b[^>]*\bhref\s*=\s*["']https?:\/\//i.test(row)
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
        line
          .replace(/\d{1,3}(?:\.\d+)?\s*\/\s*(?:5|100)\b/g, '')
          .replace(/[~★☆½]/g, '')
          .trim().length === 0;
      const previous = lines[lineIndex - 1] ?? '';
      const next = lines[lineIndex + 1] ?? '';
      if (
        scoreHasNamedThirdPartyAttribution(
          lines,
          lineIndex,
          match.index,
          match[0].length,
          scoreOnly,
        )
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
      if (
        scoreHasNamedThirdPartyAttribution(
          lines,
          lineIndex,
          match.index,
          match[0].length,
          bareScoreOnly,
        )
      ) {
        continue;
      }
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
