import { copyFileSync, cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { AFFILIATE_PARTNERS } from '../src/data/affiliates.ts';
import { SITE } from '../src/data/site.ts';

const root = process.cwd();
const pagesDir = join(root, 'src', 'pages');
const publicDir = join(root, 'public');
const ORIGIN = SITE.origin;

// The 13 affiliate partners are served by the SSR gateway (src/pages/bonuses/[slug].astro),
// NOT as static interstitials. Skip generating static pages for their bonus slugs.
const PARTNER_SLUGS = new Set(AFFILIATE_PARTNERS.map((p) => p.slug));

// Directories that are assets/system, not content pages.
const ignoreDirs = new Set([
  '.git', 'node_modules', 'dist', 'public', 'src', 'scripts',
  '_external', 'sweepstakeslogo', 'partials', 'output',
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

/** A page is "affiliate" if it embeds at least one /bonuses/<partner-slug>/ CTA. */
function isAffiliatePage(sourcePath) {
  const html = readFileSync(join(root, sourcePath), 'utf8');
  for (const slug of PARTNER_SLUGS) {
    if (html.includes(`/bonuses/${slug}/`) || html.includes(`/bonuses/${slug}"`)) return true;
  }
  return false;
}

// With build.format: 'directory', `src/pages/reviews/crown-coins.astro`
// is emitted as `/reviews/crown-coins/index.html` -> clean URL `/reviews/crown-coins/`.
function writePage(sourcePath) {
  // The partner bonus interstitials are replaced by the SSR gateway route.
  const bonusMatch = sourcePath.match(/^bonuses\/([a-z0-9-]+)\.html$/);
  if (bonusMatch && PARTNER_SLUGS.has(bonusMatch[1])) return;

  const noExt = sourcePath.replace(/\.html$/, '');
  const destination = noExt === 'index'
    ? join(pagesDir, 'index.astro')
    : join(pagesDir, `${noExt}.astro`);
  mkdirSync(dirname(destination), { recursive: true });

  const staticHtmlImport = relImport(destination, join(root, 'src', 'lib', 'staticHtml.js'));

  let content;
  if (isAffiliatePage(sourcePath)) {
    // SSR + geo-suppression of affiliate CTAs per request.
    // Import the HTML via ?raw so it ships inside the Vercel function bundle
    // (runtime fs reads of source files are NOT available in serverless).
    const suppressImport = relImport(destination, join(root, 'src', 'lib', 'affiliateHtml'));
    const rawImport = relImport(destination, join(root, sourcePath));
    content =
      `---\n` +
      `export const prerender = false;\n` +
      `import rawHtml from '${rawImport}?raw';\n` +
      `import { prepareSsrAffiliateHtml } from '${suppressImport}';\n` +
      `const html = prepareSsrAffiliateHtml(rawHtml, Astro.locals.usState);\n` +
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

// SSR gateway: the single chokepoint where the Gemified link is emitted, and
// only after the geo check passes. Replaces the 13 static bonus interstitials.
function writeBonusGateway() {
  const destination = join(pagesDir, 'bonuses', '[slug].astro');
  mkdirSync(dirname(destination), { recursive: true });
  const gatewayImport = relImport(destination, join(root, 'src', 'lib', 'bonusGateway'));
  const content = `---
export const prerender = false;
import { resolveBonusGateway } from '${gatewayImport}';

const result = resolveBonusGateway(Astro.params.slug, Astro.locals.usState);
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
  for (const dir of ['_external', 'sweepstakeslogo', 'partials']) {
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

  // MDX content collections (skip drafts). comparisons render under /best/.
  const collectionUrlPrefix = { guides: '/guides', comparisons: '/best', states: '/states' };
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

  const robots = `User-agent: *\nAllow: /\n\n# Affiliate redirect endpoints — not for indexing (legal/contact use noindex meta instead)\nDisallow: /bonuses/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`;

  writeFileSync(join(publicDir, 'sitemap.xml'), sitemap);
  writeFileSync(join(publicDir, 'robots.txt'), robots);
  // keep repo copies in sync for visibility
  writeFileSync(join(root, 'sitemap.xml'), sitemap);
  writeFileSync(join(root, 'robots.txt'), robots);
}

rmSync(pagesDir, { recursive: true, force: true });
walk(root);
pageFiles.sort().forEach(writePage);
writeBonusGateway();
copyAppRoutes();
copyPublicAssets();

console.log(`Generated Astro pages (directory format) + SSR bonus gateway + sitemap/robots.`);
