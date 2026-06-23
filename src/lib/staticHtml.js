import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = process.cwd();

export function getStaticHtml(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8');
}
