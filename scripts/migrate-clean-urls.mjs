/* One-time migration to Scheme B clean URLs.
   - Reviews:  sweepsreviews/<x>-review.html        -> reviews/<brand>.html        => /reviews/<brand>/
   - Bonuses:  sweepsbonus/<x>-promo-code.html      -> bonuses/<brand>.html        => /bonuses/<brand>/
   - Info:     sweepstakes-casino/<info>.html       -> <clean>.html / legal/...    => /how-we-rate/ etc.
   - Partials: sweepstakes-casino/partials/*        -> partials/*                  => /partials/*
   Rewrites every internal href/src/data-include/meta-refresh to an ABSOLUTE root-relative
   clean URL, sets per-page canonical + og:url to the absolute production origin, and fixes
   asset paths. Idempotent-ish: safe to run once on the post-Phase-1 tree.
*/
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = process.cwd();
const ORIGIN = 'https://sweepastro.vercel.app';

// brand slug for review source basenames (canonical + any dup spellings)
const reviewSlug = {
  'acebet-review':'acebet','big-pirate-review':'big-pirate','casino-click-review':'casino-click',
  'crown-coins-review':'crown-coins','dexyplay-review':'dexyplay','freespin-review':'freespin',
  'hello-millions-review':'hello-millions','high5-casino-review':'high5','jackpotgo-review':'jackpot-go',
  'jackpot-go-review':'jackpot-go','jackpota-review':'jackpota','jackpota-casino-review':'jackpota',
  'lucky-bunny-review':'lucky-bunny','mega-bonanza-review':'mega-bonanza','rolla-casino-review':'rolla',
  'spinblitz-review':'spinblitz','spinfinite-review':'spinfinite','splash-coins-review':'splash-coins',
  'spree-review':'spree','sweepico-review':'sweepico','sweepico-casino-review':'sweepico',
  'sweet-sweeps-review':'sweet-sweeps','wow-vegas-review':'wow-vegas'
};
const bonusSlug = {
  'acebet-promo-code':'acebet','big-pirate-promo-code':'big-pirate','casino-click-promo-code':'casino-click',
  'crown-coins-promo-code':'crown-coins','dexyplay-promo-code':'dexyplay','freespin-promo-code':'freespin',
  'hello-millions-promo-code':'hello-millions','high5-casino-promo-code':'high5','jackpot-go-promo-code':'jackpot-go',
  'jackpotgo-promo-code':'jackpot-go','jackpota-promo-code':'jackpota','jackpota-casino-promo-code':'jackpota',
  'lucky-bunny-promo-code':'lucky-bunny','mega-bonanza-promo-code':'mega-bonanza','rolla-casino-promo-code':'rolla',
  'spinblitz-promo-code':'spinblitz','spinfinite-promo-code':'spinfinite','splash-coins-promo-code':'splash-coins',
  'spree-promo-code':'spree','sweepico-promo-code':'sweepico','sweet-sweeps-promo-code':'sweet-sweeps',
  'wow-vegas-promo-code':'wow-vegas'
};
const infoMap = {
  'how-we-rate':'/how-we-rate/','our-mission':'/about/','responsible-gaming':'/responsible-gaming/',
  'contact':'/contact/','privacy-policy':'/legal/privacy/','terms-of-use':'/legal/terms/',
  'author-steffen-nadel':'/author/steffen-nadel/'
};

function basename(p){ return p.split('/').pop().replace(/\.html$/,''); }

// Resolve any URL found in an attribute to its clean destination (or unchanged).
function resolve(url){
  if(!url) return url;
  const u = url.trim();
  if(/^(https?:|mailto:|tel:|#|data:)/i.test(u)) return url;      // external / anchor
  // assets
  for(const a of ['sweepstakeslogo/','_external/']){
    const i = u.indexOf(a);
    if(i>=0) return '/'+u.slice(i);
  }
  // partials
  for(const p of ['partials/nav.html','partials/footer.html','partials/include.js']){
    if(u.endsWith(p)) return '/'+p;
  }
  if(u.endsWith('sitemap.xml')) return '/sitemap.xml';
  // strip query/hash for matching
  const [path, suffix=''] = u.split(/(?=[?#])/);
  const base = basename(path);
  const tail = suffix || '';
  if(base==='index' || path==='/' ) return '/'+tail;
  if(reviewSlug[base]) return '/reviews/'+reviewSlug[base]+'/'+tail;
  if(bonusSlug[base]) return '/bonuses/'+bonusSlug[base]+'/'+tail;
  if(infoMap[base]) return infoMap[base]+tail.replace(/^\//,'');
  return url; // unknown -> leave
}

function rewriteText(html, finalPath){
  let out = html;
  // attribute URLs
  out = out.replace(/(href|src|data-include)=("|')([^"']+)(\2)/g, (m,attr,q,val)=>{
    return `${attr}=${q}${resolve(val)}${q}`;
  });
  // meta refresh: content="0; url=..." (only internal; external http left as-is by resolve)
  out = out.replace(/(content=)("|')\s*0\s*;\s*url=([^"']+)(\2)/gi, (m,c,q,val,q2)=>{
    return `${c}${q}0; url=${resolve(val)}${q}`;
  });
  // asset paths inside content="..." (og:image, twitter:image, etc.)
  out = out.replace(/(content=)("|')([^"']*(?:sweepstakeslogo|_external)\/[^"']*)(\2)/g, (m,c,q,val)=>{
    return `${c}${q}${resolve(val)}${q}`;
  });
  // canonical -> absolute for this page
  if(finalPath){
    out = out.replace(/<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${ORIGIN}${finalPath}">`);
    out = out.replace(/<meta\s+property=["']og:url["'][^>]*>/i,
      `<meta property="og:url" content="${ORIGIN}${finalPath}">`);
  }
  return out;
}

function ensureNoindex(html){
  if(/<meta\s+name=["']robots["']/i.test(html)) return html;
  return html.replace(/<\/title>/i, '</title>\n<meta name="robots" content="noindex, nofollow">');
}

function processFile(srcAbs, destRel, finalPath, {noindex=false}={}){
  if(!existsSync(srcAbs)) { console.warn('MISSING', srcAbs); return; }
  let html = readFileSync(srcAbs,'utf8');
  html = rewriteText(html, finalPath);
  if(noindex) html = ensureNoindex(html);
  const destAbs = join(root, destRel);
  mkdirSync(dirname(destAbs), {recursive:true});
  writeFileSync(destAbs, html);
}

// 1) Reviews (canonical files only; dup slugs already deleted in Phase 1)
const reviewsDir = join(root,'sweepsreviews');
for(const f of readdirSync(reviewsDir)){
  if(!f.endsWith('-review.html')) continue;       // skip index/our-mission/etc stubs
  const slug = reviewSlug[basename(f)];
  if(!slug) { console.warn('no slug for', f); continue; }
  processFile(join(reviewsDir,f), `reviews/${slug}.html`, `/reviews/${slug}/`);
}

// 2) Bonuses — pick one source per brand (prefer homepage-linked spellings)
const bonusPrefer = { 'jackpot-go':'jackpot-go-promo-code', 'jackpota':'jackpota-casino-promo-code' };
const bonusDir = join(root,'sweepsbonus');
const doneBonus = new Set();
for(const f of readdirSync(bonusDir)){
  if(!f.endsWith('-promo-code.html')) continue;
  const slug = bonusSlug[basename(f)];
  if(!slug || doneBonus.has(slug)) continue;
  const preferred = bonusPrefer[slug];
  const srcName = preferred ? `${preferred}.html` : f;
  processFile(join(bonusDir,srcName), `bonuses/${slug}.html`, `/bonuses/${slug}/`, {noindex:true});
  doneBonus.add(slug);
}

// 3) Info / legal / author
const sc = join(root,'sweepstakes-casino');
processFile(join(sc,'how-we-rate.html'),      'how-we-rate.html',          '/how-we-rate/');
processFile(join(sc,'our-mission.html'),      'about.html',                '/about/');
processFile(join(sc,'responsible-gaming.html'),'responsible-gaming.html',  '/responsible-gaming/');
processFile(join(sc,'contact.html'),          'contact.html',              '/contact/', {noindex:true});
processFile(join(sc,'privacy-policy.html'),   'legal/privacy.html',        '/legal/privacy/', {noindex:true});
processFile(join(sc,'terms-of-use.html'),     'legal/terms.html',          '/legal/terms/', {noindex:true});
processFile(join(sc,'author-steffen-nadel.html'),'author/steffen-nadel.html','/author/steffen-nadel/');

// 4) Partials -> /partials/
mkdirSync(join(root,'partials'),{recursive:true});
for(const f of ['nav.html','footer.html','include.js']){
  const src = join(sc,'partials',f);
  if(!existsSync(src)) continue;
  let txt = readFileSync(src,'utf8');
  if(f.endsWith('.html')) txt = rewriteText(txt, null);
  writeFileSync(join(root,'partials',f), txt);
}

// 5) Homepage (root index.html stays; rewrite its links/assets/canonical)
processFile(join(root,'index.html'), 'index.html', '/');

// 6) Remove old folders
for(const d of ['sweepsreviews','sweepstakes-casino','sweepsbonus','sweepstakes']){
  rmSync(join(root,d), {recursive:true, force:true});
}

console.log('Migration complete: reviews + bonuses + info + partials moved; old folders removed.');
