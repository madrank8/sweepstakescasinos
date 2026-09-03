import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const homeSource = readFileSync(resolve(root, 'index.html'), 'utf8');
const cssSource = readFileSync(resolve(root, 'style.css'), 'utf8');

const cardOpenings = [...homeSource.matchAll(/<article\b([^>]*)>/g)]
  .map((match) => match[1])
  .filter((attrs) => /\bclass=["'][^"']*\bcard\b/.test(attrs));

assert.equal(cardOpenings.length, 28, 'fold must not drop ranked cards from the DOM');

for (let index = 0; index < 10; index += 1) {
  assert.doesNotMatch(
    cardOpenings[index],
    /\bfold-extra\b/,
    `card ${index + 1} must stay in the default fold`,
  );
}
for (let index = 10; index < 28; index += 1) {
  assert.match(
    cardOpenings[index],
    /\bfold-extra\b/,
    `card ${index + 1} must be fold-extra`,
  );
}

assert.match(
  homeSource,
  /<div class="grid fold-collapsed" id="casino-grid"/,
  'grid must start collapsed for js-fold CSS',
);
assert.match(
  homeSource,
  /document\.documentElement\.classList\.add\('js-fold'\)/,
  'head script must enable js-fold before paint',
);
assert.match(
  homeSource,
  /id="fold-toggle"[^>]*>Show all 28 casinos/,
  'gold show-all control must use the locked label',
);
assert.match(
  homeSource,
  /id="fold-count">Showing 10 of 28\. The other 18 stay on this page, just folded\./,
  'helper text must match the approved mockup',
);
assert.doesNotMatch(
  homeSource,
  /Top 10|Best 10|top ten/i,
  'the fold must not introduce a top-10 ranking claim',
);
assert.match(
  cardOpenings[0],
  /data-item-position="1"[^>]*data-item-name="McLuck"/,
);
assert.match(
  cardOpenings[9],
  /data-item-position="10"[^>]*data-item-name="Card Crush"/,
);
assert.match(
  cardOpenings[10],
  /data-item-position="11"[^>]*data-item-name="Spree"/,
);
assert.match(
  cardOpenings[27],
  /data-item-position="28"[^>]*data-item-name="Mega Bonanza"/,
);

assert.match(
  cssSource,
  /\.js-fold #casino-grid\.fold-collapsed \.fold-extra\s*\{\s*display:\s*none;/,
  'CSS must hide extras only when js-fold and collapsed',
);
assert.match(cssSource, /\.fold-more-wrap\s*\{[^}]*display:\s*none;/);
assert.match(cssSource, /\.js-fold \.fold-more-wrap\s*\{[^}]*display:\s*block;/);
assert.match(cssSource, /\.btn-claim\.fold-fewer\s*\{/);

assert.match(homeSource, /expanded=btn\.dataset\.f!=='all'/);
assert.match(homeSource, /grid\.classList\.toggle\('fold-collapsed', !expanded\)/);
assert.match(
  homeSource,
  /Showing all 28\. Click Show fewer to fold back to 10\./,
);
assert.match(
  homeSource,
  /if\(grid\) grid\.classList\.remove\('fold-collapsed'\)/,
  'missing toggle must uncollapse so cards stay visible',
);
