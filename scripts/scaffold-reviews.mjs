import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const base = readFileSync(ROOT + 'reviews/pulsz.html', 'utf8');

// Pulsz (blue) source tokens -> brand tokens
const OLD = {
  t1:'#2563eb', t2:'#1d4ed8', t3:'#0b1f5c', tl:'#60a5fa', tll:'#eff6ff',
  bghero:'#0a1430', lttx:'#0f1b3d', lttx3:'#5a6a8a', l1:'#dbeafe', l3:'#eef3fb',
  t1rgb:'37,99,235', tlrgb:'96,165,250', bgheroRgb:'10,22,40', t3rgb:'20,8,43',
};

const brands = [
  { slug:'legendz', display:'Legendz', upper:'LEGENDZ', tracker:'68498faeb5a0aef86a89f63b',
    t1:'#059669',t2:'#047857',t3:'#022c22',tl:'#34d399',tll:'#ecfdf5',bghero:'#03120c',lttx:'#052e1f',lttx3:'#5a7a6a',l1:'#d1fae5',l3:'#eefbf5',t1rgb:'5,150,105',tlrgb:'52,211,153',bgheroRgb:'3,18,12',t3rgb:'2,44,34' },
  { slug:'playfame', display:'PlayFame', upper:'PLAYFAME', tracker:'6852b86a2811510748242f49',
    t1:'#db2777',t2:'#be185d',t3:'#500724',tl:'#f472b6',tll:'#fdf2f8',bghero:'#2a0716',lttx:'#3d0a1f',lttx3:'#8a5a6a',l1:'#fce7f3',l3:'#fbeef5',t1rgb:'219,39,119',tlrgb:'244,114,182',bgheroRgb:'42,7,22',t3rgb:'80,7,36' },
  { slug:'thrillzz', display:'Thrillzz', upper:'THRILLZZ', tracker:'68750a473eb8fc6bed64abbb',
    t1:'#ea580c',t2:'#c2410c',t3:'#431407',tl:'#fb923c',tll:'#fff7ed',bghero:'#1a0a04',lttx:'#3d1a0a',lttx3:'#8a6a5a',l1:'#ffedd5',l3:'#fbf3ee',t1rgb:'234,88,12',tlrgb:'251,146,60',bgheroRgb:'26,10,4',t3rgb:'67,20,7' },
  { slug:'zula', display:'Zula', upper:'ZULA', tracker:'68930e11bfbdf41d51d3d78b',
    t1:'#0891b2',t2:'#0e7490',t3:'#083344',tl:'#22d3ee',tll:'#ecfeff',bghero:'#04141a',lttx:'#0a2e3d',lttx3:'#5a7a8a',l1:'#cffafe',l3:'#eef9fb',t1rgb:'8,145,178',tlrgb:'34,211,238',bgheroRgb:'4,20,26',t3rgb:'8,51,68' },
  { slug:'card-crush', display:'Card Crush', upper:'CARD CRUSH', tracker:'69caa16701e1ec3e1f1d9a5c',
    t1:'#dc2626',t2:'#b91c1c',t3:'#450a0a',tl:'#f87171',tll:'#fef2f2',bghero:'#1a0606',lttx:'#3d0a0a',lttx3:'#8a5a5a',l1:'#fee2e2',l3:'#fbeeee',t1rgb:'220,38,38',tlrgb:'248,113,113',bgheroRgb:'26,6,6',t3rgb:'69,10,10' },
  { slug:'roxymoxy', display:'RoxyMoxy', upper:'ROXYMOXY', tracker:'68ad7b59acc04452caf30db3',
    t1:'#c026d3',t2:'#a21caf',t3:'#4a044e',tl:'#e879f9',tll:'#fdf4ff',bghero:'#20062a',lttx:'#3a0a3d',lttx3:'#7a5a8a',l1:'#fae8ff',l3:'#f8eefb',t1rgb:'192,38,211',tlrgb:'232,121,249',bgheroRgb:'32,6,42',t3rgb:'74,4,78' },
];

const bonusTpl = (slug, tracker) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex, nofollow">
<title>Activating Bonus FREE SC...</title>
<meta http-equiv="refresh" content="0; url=https://tracker.gemified.io/r/IfwzBLhob64t/${tracker}">
<style>
  html,body { margin:0; padding:0; height:100%; background:#fff; }
  p { display:none; }
</style>
</head>
<body>
<p>Activating Bonus SC...</p>
</body>
</html>
`;

for (const b of brands) {
  let html = base;
  // rename (uppercase first, then display, then slug)
  html = html.split('PULSZ').join(b.upper);
  html = html.split('Pulsz').join(b.display);
  html = html.split('pulsz').join(b.slug);
  // recolor
  for (const key of Object.keys(OLD)) {
    html = html.split(OLD[key]).join(b[key]);
  }
  writeFileSync(ROOT + `reviews/${b.slug}.html`, html);
  writeFileSync(ROOT + `bonuses/${b.slug}.html`, bonusTpl(b.slug, b.tracker));
  console.log(`scaffolded reviews/${b.slug}.html + bonuses/${b.slug}.html`);
}
console.log('done');
