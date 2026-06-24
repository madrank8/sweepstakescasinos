import { copyFileSync, cpSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = process.cwd();
const pagesDir = join(root, 'src', 'pages');
const publicDir = join(root, 'public');
const ORIGIN = 'https://sweepastro.vercel.app';

// Directories that are assets/system, not content pages.
const ignoreDirs = new Set([
  '.git', 'node_modules', 'dist', 'public', 'src', 'scripts',
  '_external', 'sweepstakeslogo', 'partials', 'output',
  '.cursor', '.planning', '.vercel'
]);

const pageFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry);
    const rel = relative(root, absolute);
    const stats = statSync(absolute);
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

// With build.format: 'directory', `src/pages/reviews/crown-coins.astro`
// is emitted as `/reviews/crown-coins/index.html` -> clean URL `/reviews/crown-coins/`.
function writePage(sourcePath) {
  const noExt = sourcePath.replace(/\.html$/, '');
  const destination = noExt === 'index'
    ? join(pagesDir, 'index.astro')
    : join(pagesDir, `${noExt}.astro`);
  const importPath = relImport(destination, join(root, 'src', 'lib', 'staticHtml.js'));
  mkdirSync(dirname(destination), { recursive: true });
  const content =
    `---\nimport { getStaticHtml } from '${importPath}';\nconst html = getStaticHtml('${sourcePath}');\n---\n<Fragment set:html={html} />\n`;
  writeFileSync(destination, content);
}

function copyPublicAssets() {
  rmSync(publicDir, { recursive: true, force: true });
  mkdirSync(publicDir, { recursive: true });

  for (const file of ['style.css']) {
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
copyPublicAssets();

console.log(`Generated ${pageFiles.length} Astro pages (directory format) + sitemap/robots.`);
