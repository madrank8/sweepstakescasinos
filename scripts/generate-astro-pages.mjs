import { copyFileSync, cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { SITE } from '../src/data/site.ts';
import { US_STATES } from '../src/data/usStates.ts';

/** Match src/lib/tracker/fallback.ts slugifyState so sitemap URLs align. */
function stateSlug(name) {
  return name.toLowerCase().replaceAll('.', '').replaceAll(' ', '-');
}

const root = process.cwd();
const pagesDir = join(root, 'src', 'pages');
const publicDir = join(root, 'public');
const ORIGIN = SITE.origin;

// All /bonuses/<slug>/ destinations are served by the SSR gateway
// (src/pages/bonuses/[slug].astro) — partners AND non-partner editorial outbound.
// Skip generating static pages from bonuses/*.html so geo can never be bypassed.

// Directories that are assets/system, not content pages.
const ignoreDirs = new Set([
  '.git', 'node_modules', 'dist', 'public', 'src', 'scripts',
  '_external', 'sweepstakeslogo', 'partials', 'testing', 'output',
  '.cursor', '.planning', '.vercel'
]);

const pageFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    // Skip transient sidecar files (e.g. SQLite -wal/-shm) that can vanish
    // between readdir and stat and would otherwise crash the walk.
    if (entry.startsWith('.context-brain.db')) continue;
    const absolute = join(dir, entry);
    const rel = relative(root, absolute);
    let stats;
    try {
      stats = statSync(absolute);
    } catch {
      continue; // entry disappeared mid-walk; ignore
    }
    if (stats.isDirectory()) {
      if (ignoreDirs.has(entry)) continue;
      walk(absolute);
      continue;
    }
    if (stats.isFile() && entry.endsWith('.html')) pageFiles.push(rel);
  }
}

function relImport(fromFile, toFile) {
  let path = relative(dirname(fromFile), toFile).replaceAll('\\', '/');
  if (!path.startsWith('.')) path = `./${path}`;
  return path;
}

/**
 * Placement label baked into each affiliate CTA's clickId (see bonusGateway).
 * Homepage -> "homepage", reviews/<slug>.html -> "review-<slug>", any other
 * affiliate page -> its path slugified. Restricted to [a-z0-9-] so it never
 * needs URL-encoding and always survives the gateway's sanitize step.
 */
function placementLabel(sourcePath) {
  const noExt = sourcePath.replace(/\.html$/, '');
  if (noExt === 'index') return 'homepage';
  const reviewMatch = noExt.match(/^reviews\/([a-z0-9-]+)$/);
  if (reviewMatch) return `review-${reviewMatch[1]}`;
  return noExt.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'site';
}

/** A page needs SSR geo if it embeds any /bonuses/<slug>/ CTA (partner or editorial). */
function isAffiliatePage(sourcePath) {
  const html = readFileSync(join(root, sourcePath), 'utf8');
  return /href="\/bonuses\/[a-z0-9-]+\/?"/i.test(html);
}

// With build.format: 'directory', `src/pages/reviews/crown-coins.astro`
// is emitted as `/reviews/crown-coins/index.html` -> clean URL `/reviews/crown-coins/`.
function writePage(sourcePath) {
  // All bonus interstitials are replaced by the SSR gateway route.
  const bonusMatch = sourcePath.match(/^bonuses\/([a-z0-9-]+)\.html$/);
  if (bonusMatch) return;

  const noExt = sourcePath.replace(/\.html$/, '');
  const destination = noExt === 'index'
    ? join(pagesDir, 'index.astro')
    : join(pagesDir, `${noExt}.astro`);
  mkdirSync(dirname(destination), { recursive: true });

  const staticHtmlImport = relImport(destination, join(root, 'src', 'lib', 'staticHtml.js'));

  // Reviews get the Reader Reports section (aggregated player data + form)
  // injected; other pages (home, trust, legal) do not.
  const reviewMatch = sourcePath.match(/^reviews\/([a-z0-9-]+)\.html$/);
  const reviewSlug = reviewMatch ? reviewMatch[1] : null;

  let content;
  if (isAffiliatePage(sourcePath)) {
    // SSR + geo-suppression of affiliate CTAs per request.
    // Import the HTML via ?raw so it ships inside the Vercel function bundle
    // (runtime fs reads of source files are NOT available in serverless).
    const suppressImport = relImport(destination, join(root, 'src', 'lib', 'affiliateHtml'));
    const rawImport = relImport(destination, join(root, sourcePath));
    const placement = placementLabel(sourcePath);
    if (reviewSlug) {
      content =
        `---\n` +
        `export const prerender = false;\n` +
        `import rawHtml from '${rawImport}?raw';\n` +
        `import { prepareSsrAffiliateReviewHtml } from '${suppressImport}';\n` +
        `const html = prepareSsrAffiliateReviewHtml(rawHtml, Astro.locals.usState, '${reviewSlug}', '${placement}');\n` +
        `---\n<Fragment set:html={html} />\n`;
    } else {
      content =
        `---\n` +
        `export const prerender = false;\n` +
        `import rawHtml from '${rawImport}?raw';\n` +
        `import { prepareSsrAffiliateHtml } from '${suppressImport}';\n` +
        `const html = prepareSsrAffiliateHtml(rawHtml, Astro.locals.usState, '${placement}');\n` +
        `---\n<Fragment set:html={html} />\n`;
    }
  } else if (reviewSlug) {
    // Non-partner review -> static, but still gets the Reader Reports section.
    content =
      `---\n` +
      `export const prerender = true;\n` +
      `import { getStaticReviewHtml } from '${staticHtmlImport}';\n` +
      `const html = getStaticReviewHtml('${sourcePath}', '${reviewSlug}');\n` +
      `---\n<Fragment set:html={html} />\n`;
  } else {
    // No affiliate CTAs -> keep static for performance.
    content =
      `---\n` +
      `export const prerender = true;\n` +
      `import { getStaticHtml } from '${staticHtmlImport}';\n` +
      `const html = getStaticHtml('${sourcePath}');\n` +
      `---\n<Fragment set:html={html} />\n`;
  }
  writeFileSync(destination, content);
}

// SSR gateway: chokepoint for partner Gemified links AND non-partner editorial
// outbound. Replaces all static bonuses/*.html interstitials after geo check.
function writeBonusGateway() {
  const destination = join(pagesDir, 'bonuses', '[slug].astro');
  mkdirSync(dirname(destination), { recursive: true });
  const gatewayImport = relImport(destination, join(root, 'src', 'lib', 'bonusGateway'));
  const content = `---
export const prerender = false;
import { resolveBonusGateway } from '${gatewayImport}';

const result = resolveBonusGateway(Astro.params.slug, Astro.locals.usState, Astro.url.searchParams.get('clickId'));
if (result.status === 'redirect') return Astro.redirect(result.url, 302);
if (result.status === 'not-found') return new Response('Not found', { status: 404 });
const partner = result.partner;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Not available in your location</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    <main style="max-width:640px;margin:8vh auto;padding:0 20px;text-align:center;">
      <p style="font-size:0.8rem;letter-spacing:.08em;text-transform:uppercase;opacity:.6;">21+ · Play responsibly</p>
      <h1>{partner.name} isn’t available in your location</h1>
      <p>
        Based on your location, we’re showing informational content only. Affiliate
        offers for {partner.name} are not available where you are.
      </p>
      <p>
        You can still browse the free, no-purchase offers available where you are on our
        <a href="/bonuses/no-deposit/">no-deposit bonuses</a> tracker, or check the
        <a href="/state-legality/">state legality hub</a> for what's offered in your state.
      </p>
      <p>
        If you or someone you know has a gambling problem, call
        <strong>1-800-GAMBLER</strong> for confidential help.
      </p>
      <p><a href="/">← Back to home</a></p>
    </main>
  </body>
</html>
`;
  writeFileSync(destination, content);
}

// Copy committed app routes (collection consumers, dynamic SSR routes) into
// src/pages so they survive the wipe above. Authored under src/routes.
function copyAppRoutes() {
  const routesDir = join(root, 'src', 'routes');
  if (existsSync(routesDir)) {
    cpSync(routesDir, pagesDir, { recursive: true, force: true });
  }
}

function copyPublicAssets() {
  rmSync(publicDir, { recursive: true, force: true });
  mkdirSync(publicDir, { recursive: true });

  for (const file of ['style.css', 'favicon.ico']) {
    if (existsSync(join(root, file))) copyFileSync(join(root, file), join(publicDir, file));
  }
  for (const dir of ['_external', 'sweepstakeslogo', 'partials', 'testing', 'images']) {
    if (existsSync(join(root, dir))) cpSync(join(root, dir), join(publicDir, dir), { recursive: true, force: true });
  }

  writeSitemapAndRobots();
}

// Sitemap = indexable pages only (homepage + reviews + author). Bonuses/legal/contact
// and editorial info pages are noindex per site policy and excluded.
function writeSitemapAndRobots() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['/'];
  const reviewsDir = join(root, 'reviews');
  if (existsSync(reviewsDir)) {
    for (const f of readdirSync(reviewsDir).sort()) {
      if (f.endsWith('.html')) urls.push(`/reviews/${f.replace(/\.html$/, '')}/`);
    }
  }
  const authorDir = join(root, 'author');
  if (existsSync(authorDir)) {
    for (const f of readdirSync(authorDir).sort()) {
      if (f.endsWith('.html')) urls.push(`/author/${f.replace(/\.html$/, '')}/`);
    }
  }

  // Indexable trust / E-E-A-T pages (others — contact, sitemap, privacy/terms/
  // cookie/dmca — are noindex by design and intentionally excluded).
  const trustPages = [
    'about.html', 'how-we-rate.html', 'editorial-policy.html',
    'responsible-gaming.html',
    'legal/affiliate-disclosure.html',
  ];
  for (const rel of trustPages) {
    if (existsSync(join(root, rel))) urls.push(`/${rel.replace(/\.html$/, '')}/`);
  }

  // Reader-reports submission page (authored under src/routes/report.astro).
  if (existsSync(join(root, 'src', 'routes', 'report.astro'))) urls.push('/report/');

  // Guides hub / index (authored under src/routes/guides/index.astro).
  if (existsSync(join(root, 'src', 'routes', 'guides', 'index.astro'))) urls.push('/guides/');

  // News hub (legislation / enforcement updates).
  if (existsSync(join(root, 'src', 'routes', 'news', 'index.astro'))) urls.push('/news/');

  // New-sweepstakes-casinos freshness hub (authored under src/routes/new/index.astro).
  if (existsSync(join(root, 'src', 'routes', 'new', 'index.astro'))) urls.push('/new/');

  // No-deposit / free Sweeps Coins bonus tracker (authored under
  // src/routes/bonuses/no-deposit/index.astro). Indexable content hub that lives
  // under /bonuses/ — see the robots Allow exception below.
  if (existsSync(join(root, 'src', 'routes', 'bonuses', 'no-deposit', 'index.astro'))) urls.push('/bonuses/no-deposit/');

  // State legality hub (data-driven route replacing the old static HTML).
  if (existsSync(join(root, 'src', 'routes', 'state-legality', 'index.astro'))) urls.push('/state-legality/');

  // Sweepstakes Legality Tracker hub + support pages (authored under src/routes).
  const trackerPages = [
    ['sweepstakes-tracker/index.astro', '/sweepstakes-tracker/'],
    ['sweepstakes-tracker/methodology.astro', '/sweepstakes-tracker/methodology/'],
    ['sweepstakes-tracker/legislation/index.astro', '/sweepstakes-tracker/legislation/'],
    ['sweepstakes-tracker/api.astro', '/sweepstakes-tracker/api/'],
  ];
  for (const [rel, url] of trackerPages) {
    if (existsSync(join(root, 'src', 'routes', rel))) urls.push(url);
  }

  // All 51 state pages (data-driven via src/routes/states/[slug].astro).
  if (existsSync(join(root, 'src', 'routes', 'states', '[slug].astro'))) {
    for (const name of Object.values(US_STATES)) urls.push(`/states/${stateSlug(name)}/`);
  }

  // MDX content collections (skip drafts). comparisons render under /best/.
  // NOTE: states are enumerated above (all 51) — not from the MDX collection.
  const collectionUrlPrefix = { guides: '/guides', comparisons: '/best', news: '/news' };
  for (const [name, prefix] of Object.entries(collectionUrlPrefix)) {
    const dir = join(root, 'src', 'content', name);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith('.mdx')) continue;
      const fm = readFileSync(join(dir, f), 'utf8').slice(0, 600);
      if (/\bdraft:\s*true\b/.test(fm)) continue;
      urls.push(`${prefix}/${f.replace(/\.mdx$/, '')}/`);
    }
  }

  const body = urls.map((u) =>
    `  <url>\n    <loc>${ORIGIN}${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${u === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
  ).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  // Major AI/LLM crawlers — explicitly allowed (we want accurate citations),
  // but still kept out of the affiliate redirect endpoints.
  const aiBots = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web',
    'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended',
    'CCBot', 'cohere-ai',
  ];
  // The no-deposit hub is indexable content that lives under /bonuses/. A more
  // specific Allow beats the broad Disallow (longest-match precedence on Google/
  // Bing), so the affiliate redirect endpoints stay blocked while the hub crawls.
  const aiGroups = aiBots
    .map((b) => `User-agent: ${b}\nAllow: /\nAllow: /bonuses/no-deposit/\nDisallow: /bonuses/`)
    .join('\n\n');
  const robots =
    `# Sweepstakes Wiz\nUser-agent: *\nAllow: /\n\n` +
    `# Affiliate redirect endpoints — not for indexing (legal/contact use noindex meta instead)\n# The no-deposit bonus hub is indexable content; a more specific Allow keeps it crawlable.\nAllow: /bonuses/no-deposit/\nDisallow: /bonuses/\n\n` +
    `# AI / LLM crawlers — explicitly allowed (we want accurate citations)\n${aiGroups}\n\n` +
    `Sitemap: ${ORIGIN}/sitemap.xml\n# LLM guide: ${ORIGIN}/llms.txt\n`;

  // llms.txt — curated map for LLM crawlers (llmstxt.org convention). Review
  // list is derived from the live inventory so it never drifts.
  const titleFromSlug = (s) =>
    s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const reviewSlugs = existsSync(reviewsDir)
    ? readdirSync(reviewsDir).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')).sort()
    : [];
  const reviewLines = reviewSlugs
    .map((s) => `- [${titleFromSlug(s)} review](${ORIGIN}/reviews/${s}/)`)
    .join('\n');
  const statesDir = join(root, 'src', 'content', 'states');
  const stateGuideLines = existsSync(statesDir)
    ? readdirSync(statesDir)
        .filter((f) => f.endsWith('.mdx'))
        .filter((f) => !/\bdraft:\s*true\b/.test(readFileSync(join(statesDir, f), 'utf8').slice(0, 600)))
        .sort()
        .map((f) => {
          const slug = f.replace(/\.mdx$/, '');
          const label = titleFromSlug(slug);
          return `- [${label} state guide](${ORIGIN}/states/${slug}/)`;
        })
        .join('\n')
    : '';
  const llms =
    `# Sweepstakes Wiz\n\n` +
    `> Sweepstakes Wiz (sweepstakeswiz.com) is an independent US guide that tests and ranks sweepstakes (social) casinos — focused on redemption speed, bonus value, and state eligibility. Sweepstakes play only; no real-money gambling. 21+.\n\n` +
    `## Start here\n` +
    `- [Best sweepstakes casinos](${ORIGIN}/best/sweepstakes-casinos/)\n` +
    `- [New sweepstakes casinos](${ORIGIN}/new/)\n` +
    `- [No deposit bonuses & free Sweeps Coins](${ORIGIN}/bonuses/no-deposit/)\n` +
    `- [What are sweepstakes casinos?](${ORIGIN}/guides/what-are-sweepstakes-casinos/)\n` +
    `- [Sweepstakes casino legality by US state](${ORIGIN}/state-legality/)\n` +
    `- [Live legality tracker (all 51 jurisdictions)](${ORIGIN}/sweepstakes-tracker/)\n` +
    `- [Sweepstakes casino news & legislation](${ORIGIN}/news/)\n\n` +
    (stateGuideLines ? `## State guides\n${stateGuideLines}\n\n` : '') +
    `## Legality dataset (citable, CC-BY 4.0)\n` +
    `- [Sweepstakes legality tracker](${ORIGIN}/sweepstakes-tracker/): daily-updated legal status, operator availability, pending bills across all 51 US jurisdictions.\n` +
    `- [legality.json](${ORIGIN}/sweepstakes-tracker/api/legality.json): machine-readable full dataset.\n` +
    `- [legality.csv](${ORIGIN}/sweepstakes-tracker/api/legality.csv): CSV export.\n` +
    `- [provenance.json](${ORIGIN}/sweepstakes-tracker/api/provenance.json): per-state sources and freshness.\n` +
    `- [Tracker methodology](${ORIGIN}/sweepstakes-tracker/methodology/): sourcing tiers, cadence, verification, corrections.\n` +
    `- [Pending legislation](${ORIGIN}/sweepstakes-tracker/legislation/): live bill tracker.\n` +
    `- Cite as: Sweepstakes Wiz, "U.S. Sweepstakes Casino Legality Dataset," ${ORIGIN}/sweepstakes-tracker/.\n\n` +
    `## Trust & methodology\n` +
    `- [How we rate](${ORIGIN}/how-we-rate/)\n` +
    `- [Editorial policy](${ORIGIN}/editorial-policy/)\n` +
    `- [About / mission](${ORIGIN}/about/)\n` +
    `- [Author: Ilija Milosevic](${ORIGIN}/author/ilija-milosevic/)\n` +
    `- [Responsible gaming](${ORIGIN}/responsible-gaming/)\n\n` +
    `## Casino reviews\n${reviewLines}\n\n` +
    `## Citation & compliance\n` +
    `- Cite as: Sweepstakes Wiz (sweepstakeswiz.com).\n` +
    `- Reviews are hands-on tested and dated; ratings follow the published How We Rate methodology.\n` +
    `- Sweepstakes play only — no real-money gambling. Sweeps Coins have no cash value until redeemed per each operator's official rules. No purchase necessary. 21+. Not available in all US states.\n` +
    `- Affiliate disclosure: we may earn referral fees from operators; this never influences rankings.\n`;

  writeFileSync(join(publicDir, 'sitemap.xml'), sitemap);
  writeFileSync(join(publicDir, 'robots.txt'), robots);
  writeFileSync(join(publicDir, 'llms.txt'), llms);
  // keep repo copies in sync for visibility
  writeFileSync(join(root, 'sitemap.xml'), sitemap);
  writeFileSync(join(root, 'robots.txt'), robots);
  writeFileSync(join(root, 'llms.txt'), llms);
}

rmSync(pagesDir, { recursive: true, force: true });
walk(root);
pageFiles.sort().forEach(writePage);
writeBonusGateway();
copyAppRoutes();
copyPublicAssets();

console.log(`Generated Astro pages (directory format) + SSR bonus gateway + sitemap/robots.`);
