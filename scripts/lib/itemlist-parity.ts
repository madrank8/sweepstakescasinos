type JsonNode = Record<string, unknown>;

type VisibleItem = {
  position: number;
  name: string;
  url: string;
};

function decodeHtmlAttribute(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
  };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_match, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) =>
      named[name.toLowerCase()] ?? match,
    );
}

function attribute(markup: string, name: string): string | undefined {
  const match = markup.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'),
  );
  const value = match?.[1] ?? match?.[2];
  return value === undefined ? undefined : decodeHtmlAttribute(value);
}

function matchingCloseIndex(
  html: string,
  tag: string,
  bodyStart: number,
): number | undefined {
  const tags = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
  tags.lastIndex = bodyStart;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = tags.exec(html))) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return match.index;
    } else if (!/\/\s*>$/.test(match[0])) {
      depth += 1;
    }
  }
  return undefined;
}

function visibleLists(
  html: string,
): Array<{ id: string; order?: string; items: VisibleItem[] }> {
  const lists: Array<{ id: string; order?: string; items: VisibleItem[] }> = [];
  for (const opening of html.matchAll(
    /<([a-z][a-z0-9:-]*)\b[^>]*\bdata-item-list\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>/gi,
  )) {
    const id = attribute(opening[0], 'data-item-list');
    if (!id) continue;
    const bodyStart = (opening.index ?? 0) + opening[0].length;
    const bodyEnd = matchingCloseIndex(html, opening[1], bodyStart);
    if (bodyEnd === undefined) continue;
    const body = html.slice(bodyStart, bodyEnd);
    const items: VisibleItem[] = [];
    for (const item of body.matchAll(
      /<[a-z][a-z0-9:-]*\b[^>]*\bdata-item-position\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>/gi,
    )) {
      const position = Number(attribute(item[0], 'data-item-position'));
      const name = attribute(item[0], 'data-item-name');
      const url = attribute(item[0], 'data-item-url');
      if (Number.isInteger(position) && name !== undefined && url !== undefined) {
        items.push({ position, name, url });
      }
    }
    lists.push({
      id,
      order: attribute(opening[0], 'data-item-list-order'),
      items,
    });
  }
  return lists;
}

export function itemListParityErrors(
  html: string,
  graph: readonly JsonNode[],
): string[] {
  const errors: string[] = [];
  for (const visible of visibleLists(html)) {
    const schema = graph.find(
      (node) => node['@type'] === 'ItemList' && node['@id'] === visible.id,
    );
    if (!schema) {
      errors.push(`${visible.id}: visible list has no matching ItemList schema`);
      continue;
    }
    const schemaItems = Array.isArray(schema.itemListElement)
      ? (schema.itemListElement as JsonNode[])
      : [];
    if (schema.numberOfItems !== visible.items.length) {
      errors.push(
        `${visible.id}: numberOfItems ${String(schema.numberOfItems)} does not match ${visible.items.length} visible items`,
      );
    }
    if (schemaItems.length !== visible.items.length) {
      errors.push(
        `${visible.id}: schema has ${schemaItems.length} items but markup has ${visible.items.length}`,
      );
    }
    if (visible.order && schema.itemListOrder !== visible.order) {
      errors.push(`${visible.id}: visible and schema list-order semantics differ`);
    }
    const length = Math.max(schemaItems.length, visible.items.length);
    for (let index = 0; index < length; index += 1) {
      const markup = visible.items[index];
      const item = schemaItems[index];
      if (!markup || !item) continue;
      if (item.position !== markup.position) {
        errors.push(`${visible.id}: item ${index + 1} position differs`);
      }
      if (item.name !== markup.name) {
        errors.push(`${visible.id}: item ${index + 1} name differs`);
      }
      if (item.url !== markup.url) {
        errors.push(`${visible.id}: item ${index + 1} URL differs`);
      }
    }
  }
  return errors;
}
