export interface RenderedEditorScoreContext {
  kind:
    | 'labeled-score'
    | 'score-total'
    | 'star-score'
    | 'score-bars-total'
    | 'sticky-score';
  value: number | null;
  scale: 5 | 100 | null;
  excerpt: string;
}

interface VisibleElement {
  tag: string;
  opening: string;
  inner: string;
  classes: Set<string>;
}

const SCORE_TOTAL_CLASSES = new Set([
  'v-score',
  'vb-num',
  'sh-score',
  'verdict-score',
  'sb-num',
]);
const STAR_SCORE_CLASSES = new Set([
  'v-stars',
  'vb-stars',
  'sh-stars',
  'verdict-stars',
  'sb-stars',
  'oc-stars',
  'oc-score',
]);
const LABELED_SCORE_CLASSES = new Set(['metric', 'stat', 'qp-item', 'qf-item']);
const STICKY_CLASSES = new Set(['sticky-sub', 'sticky-st']);
const VOID_TAGS = new Set([
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

function visibleElements(html: string): VisibleElement[] {
  const withoutRawBlocks = html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '');
  const elements: VisibleElement[] = [];
  const stack: Array<{ tag: string; opening: string; innerStart: number }> = [];
  const tags = /<\/?([a-z][a-z0-9:-]*)\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = tags.exec(withoutRawBlocks))) {
    const token = match[0];
    const tag = match[1].toLowerCase();
    if (!token.startsWith('</')) {
      if (!VOID_TAGS.has(tag) && !/\/\s*>$/.test(token)) {
        stack.push({ tag, opening: token, innerStart: tags.lastIndex });
      }
      continue;
    }
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (stack[index].tag !== tag) continue;
      const opening = stack[index];
      stack.splice(index);
      const classValue =
        opening.opening.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
      elements.push({
        tag,
        opening: opening.opening,
        inner: withoutRawBlocks.slice(opening.innerStart, match.index),
        classes: new Set(classValue.split(/\s+/).filter(Boolean)),
      });
      break;
    }
  }
  return elements;
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#8211|#8212|#183|nbsp);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasClass(element: VisibleElement, classes: Set<string>): boolean {
  return [...element.classes].some((name) => classes.has(name));
}

function rating(text: string, allowBare = false): {
  value: number | null;
  scale: 5 | 100 | null;
} | undefined {
  const ratio = text.match(/(\d{1,3}(?:\.\d+)?)\s*\/\s*(5|100)\b/);
  if (ratio) {
    return {
      value: Number(ratio[1]),
      scale: Number(ratio[2]) as 5 | 100,
    };
  }
  if (allowBare) {
    const bare = text.match(/\b([0-5](?:\.\d+)?)\b/);
    if (bare) return { value: Number(bare[1]), scale: 5 };
  }
  if (/(?:&#9733;|[★☆]){3,}/i.test(text)) {
    return { value: null, scale: null };
  }
  return undefined;
}

function excerpt(element: VisibleElement): string {
  return plainText(element.inner).slice(0, 180);
}

export function findRenderedEditorScoreContexts(
  html: string,
): RenderedEditorScoreContext[] {
  const contexts: RenderedEditorScoreContext[] = [];
  for (const element of visibleElements(html)) {
    const text = plainText(element.inner);
    if (hasClass(element, SCORE_TOTAL_CLASSES)) {
      const found = rating(text);
      if (found) contexts.push({ kind: 'score-total', ...found, excerpt: excerpt(element) });
      continue;
    }
    if (hasClass(element, STAR_SCORE_CLASSES)) {
      const found = rating(text);
      if (found) contexts.push({ kind: 'star-score', ...found, excerpt: excerpt(element) });
      continue;
    }
    if (element.classes.has('score-bars')) {
      const total =
        element.inner.match(
          /class=["'][^"']*\bsbars-total\b[^"']*["'][^>]*>([^<]*)</i,
        )?.[1] ?? text;
      const found = rating(plainText(total));
      if (found) {
        contexts.push({
          kind: 'score-bars-total',
          ...found,
          excerpt: excerpt(element),
        });
      }
      continue;
    }
    if (
      hasClass(element, LABELED_SCORE_CLASSES) &&
      /\b(?:Editor Score|Overall(?: Score| Rating)?)\b/i.test(text)
    ) {
      const found = rating(text, true);
      if (found) contexts.push({ kind: 'labeled-score', ...found, excerpt: excerpt(element) });
      continue;
    }
    if (hasClass(element, STICKY_CLASSES)) {
      for (const fragment of element.inner.split(/(?:&#183;|·|—|&mdash;)/i)) {
        const fragmentText = plainText(fragment);
        if (/\b(?:Trustpilot|Google|App Store|iOS|Android)\b/i.test(fragmentText)) {
          continue;
        }
        const found = rating(fragmentText);
        if (found) {
          contexts.push({
            kind: 'sticky-score',
            ...found,
            excerpt: fragmentText.slice(0, 180),
          });
        }
      }
    }
  }
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
