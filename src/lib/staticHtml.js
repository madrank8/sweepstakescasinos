import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = process.cwd();

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function getStaticHtml(relativePath) {
  let html = readFileSync(resolve(projectRoot, relativePath), 'utf8');
  const now = new Date();
  const stamp = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  return html.replaceAll('__UPDATED_DATE__', stamp);
}
