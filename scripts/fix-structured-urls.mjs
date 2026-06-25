/* Post-migration fix: rewrite absolute/legacy URLs inside JSON-LD and any remaining
   text (domain + old path segments) in the migrated content files. */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const ORIGIN = 'https://sweepstakeslist.vercel.app';

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

function fix(text){
  let t = text;
  // unify domain (both casings, with/without trailing slash handled by later path fixes)
  t = t.replace(/https?:\/\/(www\.)?sweepstakescasinoslist\.com/gi, ORIGIN);
  // legacy path segments anywhere (JSON-LD, etc.)
  for(const [k,v] of Object.entries(reviewSlug)) t = t.split(`/sweepsreviews/${k}.html`).join(`/reviews/${v}/`);
  for(const [k,v] of Object.entries(bonusSlug))  t = t.split(`/sweepsbonus/${k}.html`).join(`/bonuses/${v}/`);
  for(const [k,v] of Object.entries(infoMap))    t = t.split(`/sweepstakes-casino/${k}.html`).join(v);
  // any stray review/bonus dirs without slug match
  t = t.split('/sweepsreviews/').join('/reviews/');
  t = t.split('/sweepstakes-casino/').join('/');
  t = t.split('/sweepsbonus/').join('/bonuses/');
  return t;
}

function walk(dir){
  for(const e of readdirSync(dir)){
    if(['node_modules','dist','public','src','.git','_external','sweepstakeslogo','.cursor','.planning','.vercel','output','scripts'].includes(e)) continue;
    const abs = join(dir,e);
    const st = statSync(abs);
    if(st.isDirectory()) walk(abs);
    else if(e.endsWith('.html')) writeFileSync(abs, fix(readFileSync(abs,'utf8')));
  }
}
walk(root);
console.log('Structured-data / legacy URL fix complete.');
