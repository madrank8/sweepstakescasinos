/**
 * Pre-publish lint: block unlabeled first-party ("Class B") experience claims.
 *
 * Enforces the content-classification hard rule from
 * `.planning/AI-AUTHORSHIP-DISCLOSURE-SPEC.md` §3: editorial/aggregated content
 * (Class A) must never be phrased as first-hand experience (Class B) such as
 * "we tested", "our testers confirmed", "our test result", etc.
 *
 * Because this site does no first-party testing, there is no evidence manifest
 * to satisfy a Class B claim — so any Class B phrasing fails the build unless it
 * appears in ALLOWLIST (the handful of intentional negations on trust pages,
 * e.g. 'never presented as first-party "we tested it" experience').
 *
 * Run: npm run content:lint   (also part of `npm run ci`)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();

/** First-person experiential ("Class B") phrasing that implies we did it ourselves. */
const BANNED_PATTERNS: RegExp[] = [
  /\bwe tested\b/i,
  /\bour testers?\b/i,
  /\btesters? confirmed\b/i,
  /\bwe confirmed\b/i,
  /\bi signed up\b/i,
  /\bwe signed up\b/i,
  /\bour team verified\b/i,
  /\bwe verified\b/i,
  /\bwe redeemed\b/i,
  /\bwe cashed out\b/i,
  /\bour tests?\b/i,
  /\bwe personally\b/i,
  /\bobserved in our test\b/i,
  /\bhands-on test(?:ed|ing)?\b/i,
  /\b14-day hands-on\b/i,
  /\bpayouts tested\b/i,
];

/**
 * Approved exceptions: intentional negations that quote the banned phrase in
 * order to disavow it. An exception matches when the file path contains `file`
 * AND the offending line contains `text` (case-insensitive).
 */
const ALLOWLIST: Array<{ file: string; text: string }> = [
  { file: 'editorial-policy.html', text: 'we tested it' },
  { file: 'editorial-policy.html', text: 'hands-on testing is ever added' },
  { file: 'how-we-rate.html', text: 'we tested it' },
  { file: 'author/ilija-milosevic.html', text: 'we tested it' },
];

/** Content surfaces to lint (indexable pages + authored content). */
const SCAN_DIRS = ['reviews', 'legal', 'author', 'partials', 'best', 'guides', 'states'];
const SCAN_CONTENT = ['src/content'];
const SCAN_ROOT_HTML = true; // also scan top-level *.html

const EXTENSIONS = new Set(['.html', '.mdx']);

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const abs = join(dir, entry);
    let s;
    try {
      s = statSync(abs);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      walk(abs, out);
    } else if (EXTENSIONS.has(abs.slice(abs.lastIndexOf('.')))) {
      out.push(abs);
    }
  }
}

function collectFiles(): string[] {
  const files: string[] = [];
  if (SCAN_ROOT_HTML) {
    for (const entry of readdirSync(root)) {
      if (entry.endsWith('.html')) files.push(join(root, entry));
    }
  }
  for (const d of SCAN_DIRS) walk(join(root, d), files);
  for (const d of SCAN_CONTENT) walk(join(root, d), files);
  return files;
}

function isAllowlisted(relPath: string, line: string): boolean {
  const lower = line.toLowerCase();
  return ALLOWLIST.some(
    (a) => relPath.includes(a.file) && lower.includes(a.text.toLowerCase()),
  );
}

interface Violation {
  file: string;
  line: number;
  match: string;
  text: string;
}

const violations: Violation[] = [];

for (const abs of collectFiles()) {
  const relPath = relative(root, abs).replaceAll('\\', '/');
  const lines = readFileSync(abs, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // Skip HTML-comment-only lines (e.g. empty <!-- testing:hands-on --> markers).
    if (/^\s*<!--.*-->\s*$/.test(line)) return;
    for (const re of BANNED_PATTERNS) {
      const m = line.match(re);
      if (m && !isAllowlisted(relPath, line)) {
        violations.push({ file: relPath, line: i + 1, match: m[0], text: line.trim() });
      }
    }
  });
}

console.log('\n=== Experience-claim lint (Class A/B) ===\n');

if (violations.length === 0) {
  console.log('✅ No unlabeled first-party (Class B) claims found.\n');
  process.exit(0);
}

console.error(`✗ ${violations.length} unlabeled Class B claim(s) found:\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.match}]`);
  console.error(`     ${v.text.slice(0, 160)}`);
}
console.error(
  '\nEditorial/aggregated content must not be phrased as first-hand experience.',
);
console.error(
  'Rewrite to Class A (e.g. "published terms show…", "player reports indicate…"),',
);
console.error('or add an intentional-negation exception to ALLOWLIST if quoting to disavow.\n');
process.exit(1);
