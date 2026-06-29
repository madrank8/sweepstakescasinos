/**
 * Add <!-- testing:* --> HTML anchors to all review pages (one-time prep).
 * Run: npm run testing:anchors
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TESTING_BRANDS } from '../src/data/testingBrands';

const REVIEWS_DIR = join(process.cwd(), 'reviews');

function insertHandsOnMarkers(out: string): string {
  if (out.includes('<!-- testing:hands-on -->')) return out;
  if (out.includes('class="verdict-box"') && out.includes('vb-stars')) {
    return out.replace(
      /(<div class="verdict-box">[\s\S]*?<div class="vb-stars">[\s\S]*?<\/div>\s*<\/div>)/,
      `$1\n    <!-- testing:hands-on -->\n    <!-- /testing:hands-on -->`,
    );
  }
  if (out.includes('class="verdict-box"') && out.includes('verdict-stars')) {
    return out.replace(
      /(<div class="verdict-box">[\s\S]*?<div class="verdict-stars">[\s\S]*?<\/div>\s*<\/div>)/,
      `$1\n    <!-- testing:hands-on -->\n    <!-- /testing:hands-on -->`,
    );
  }
  if (out.includes('id="verdict"')) {
    return out.replace(
      /(<h2 id="verdict"[^>]*>[\s\S]*?<\/h2>)/,
      `$1\n    <!-- testing:hands-on -->\n    <!-- /testing:hands-on -->`,
    );
  }
  return out.replace(
    /(<main[^>]*>[\s\S]*?<article[^>]*>)/,
    `$1\n    <!-- testing:hands-on -->\n    <!-- /testing:hands-on -->`,
  );
}

function addAnchors(html: string): string {
  // Remove hands-on markers (and any injected content) then re-insert at correct location
  let out = html.replace(
    /\s*<!-- testing:hands-on -->[\s\S]*?<!-- \/testing:hands-on -->\s*/g,
    '\n',
  );

  if (!out.includes('<!-- testing:meta -->')) {
    out = out.replace(/(<div class="hero-meta">)/, `$1\n        <!-- testing:meta -->`);
  }

  out = insertHandsOnMarkers(out);

  if (!out.includes('<!-- testing:payout-tested -->')) {
    if (out.includes('class="payout-block"')) {
      out = out.replace(
        /(<div class="payout-block">[\s\S]*?<div class="pb-head">[\s\S]*?<\/div>)/,
        `$1\n  <!-- testing:payout-tested -->\n  <!-- /testing:payout-tested -->`,
      );
    } else if (out.includes('class="payout-spotlight"')) {
      out = out.replace(
        /(<div class="payout-spotlight">[\s\S]*?<div class="payout-header-row">[\s\S]*?<\/div>)/,
        `$1\n      <!-- testing:payout-tested -->\n      <!-- /testing:payout-tested -->`,
      );
    } else if (out.includes('id="redemption"')) {
      out = out.replace(
        /(<h2 id="redemption"[^>]*>[\s\S]*?<\/h2>)/,
        `$1\n    <!-- testing:payout-tested -->\n    <!-- /testing:payout-tested -->`,
      );
    }
  }

  if (!out.includes('<!-- testing:disclosure -->')) {
    if (out.includes('How this was created (AI disclosure)')) {
      out = out.replace(
        /(<strong>How this was created \(AI disclosure\):<\/strong>)/,
        `$1\n      <!-- testing:disclosure -->`,
      );
    } else if (out.includes('class="disclosure"')) {
      out = out.replace(/(<div class="disclosure">)/, `<!-- testing:disclosure -->\n    $1`);
    }
  }

  if (!out.includes('<!-- testing:faq-produced -->')) {
    const faqRe = /(<div class="faq-item">[\s\S]*?How was this [^?]+\?[\s\S]*?<div class="faq-inner">)/;
    if (faqRe.test(out)) {
      out = out.replace(faqRe, `$1\n      <!-- testing:faq-produced -->`);
    } else {
      const faqRe2 = /(<div class="faq-item">[\s\S]*?review produced\?[\s\S]*?<div class="faq-inner">)/i;
      if (faqRe2.test(out)) out = out.replace(faqRe2, `$1\n      <!-- testing:faq-produced -->`);
    }
  }

  return out;
}

let changed = 0;
for (const brand of TESTING_BRANDS) {
  const file = join(REVIEWS_DIR, `${brand.slug}.html`);
  if (!existsSync(file)) {
    console.warn(`Missing review: ${file}`);
    continue;
  }
  const before = readFileSync(file, 'utf8');
  const after = addAnchors(before);
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
    console.log(`Anchors updated: ${brand.slug}`);
  }
}

console.log(`Done. ${changed} files updated.`);
