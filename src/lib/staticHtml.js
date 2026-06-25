import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stampUpdatedDate } from './htmlStamp.ts';
import { decorateChrome } from './pageChrome.ts';

const projectRoot = process.cwd();

/**
 * Read + decorate a source HTML file (compliance ribbon + date stamp). Used
 * ONLY by prerendered (static) pages, which run at build time where the source
 * files exist on disk.
 *
 * SSR pages must NOT use this (the source .html files are not in the Vercel
 * function bundle) — they import the HTML via `?raw` instead. See the generator.
 */
export function getStaticHtml(relativePath) {
  const html = readFileSync(resolve(projectRoot, relativePath), 'utf8');
  return stampUpdatedDate(decorateChrome(html));
}
