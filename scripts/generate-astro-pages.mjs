import { copyFileSync, cpSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = process.cwd();
const pagesDir = join(root, 'src', 'pages');
const publicDir = join(root, 'public');
const ignoreDirs = new Set(['.git', 'node_modules', 'dist', 'public', 'src', 'scripts', '_external', 'sweepstakeslogo', 'output', '.cursor', '.planning', '.vercel']);
const pageFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry);
    const rel = relative(root, absolute);
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      if (ignoreDirs.has(entry) || rel === 'sweepstakes-casino/partials') continue;
      walk(absolute);
      continue;
    }

    if (stats.isFile() && entry.endsWith('.html')) {
      pageFiles.push(rel);
    }
  }
}

function relImport(fromFile, toFile) {
  let path = relative(dirname(fromFile), toFile).replaceAll('\\', '/');
  if (!path.startsWith('.')) path = `./${path}`;
  return path;
}

function writePage(sourcePath) {
  const destination =
    sourcePath === 'index.html'
      ? join(pagesDir, 'index.astro')
      : join(pagesDir, `${sourcePath}.js`);

  const importPath = relImport(destination, join(root, 'src', 'lib', 'staticHtml.js'));
  mkdirSync(dirname(destination), { recursive: true });
  const content =
    sourcePath === 'index.html'
      ? `---\nimport { getStaticHtml } from '${importPath}';\nimport Analytics from '@vercel/analytics/astro';\nconst html = getStaticHtml('${sourcePath}');\n---\n<Fragment set:html={html} />\n<Analytics />\n`
      : `import { getStaticHtml } from '${importPath}';\n\nexport function GET() {\n  return new Response(getStaticHtml('${sourcePath}'), {\n    headers: {\n      'content-type': 'text/html; charset=utf-8'\n    }\n  });\n}\n`;

  writeFileSync(destination, content);
}

function copyPublicAssets() {
  mkdirSync(publicDir, { recursive: true });

  for (const file of ['style.css', 'robots.txt', 'sitemap.xml', 'mirror-report.json']) {
    copyFileSync(join(root, file), join(publicDir, file));
  }

  for (const dir of ['_external', 'sweepstakeslogo']) {
    cpSync(join(root, dir), join(publicDir, dir), { recursive: true, force: true });
  }

  mkdirSync(join(publicDir, 'sweepstakes-casino'), { recursive: true });
  cpSync(join(root, 'sweepstakes-casino', 'partials'), join(publicDir, 'sweepstakes-casino', 'partials'), {
    recursive: true,
    force: true
  });

  copyPilotReviews();
}

function copyPilotReviews() {
  const pilotSourceRoot = join(root, 'output', 'review-articles');
  const pilotPublicDir = join(publicDir, 'pilot');

  mkdirSync(pilotPublicDir, { recursive: true });

  let copied = 0;
  if (!statSync(pilotSourceRoot, { throwIfNoEntry: false })) {
    return;
  }

  for (const entry of readdirSync(pilotSourceRoot)) {
    const articleHtml = join(pilotSourceRoot, entry, `${entry}.html`);
    if (!statSync(articleHtml, { throwIfNoEntry: false })) continue;
    copyFileSync(articleHtml, join(pilotPublicDir, `${entry}.html`));
    copied += 1;
  }

  if (copied > 0) {
    console.log(`Copied ${copied} pilot review(s) to public/pilot/.`);
  }
}

rmSync(pagesDir, { recursive: true, force: true });
walk(root);
pageFiles.sort().forEach(writePage);
copyPublicAssets();

console.log(`Generated ${pageFiles.length} Astro pages from mirrored HTML.`);
