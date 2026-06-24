import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const file = ROOT + 'index.html';
let html = readFileSync(file, 'utf8');

const GRID_OPEN = '<div class="grid" id="casino-grid">';
const idx = html.indexOf(GRID_OPEN) + GRID_OPEN.length;
const rest = html.slice(idx);
const secIdx = rest.indexOf('<section class="rate-sec"');
const gridInner = rest.slice(0, secIdx);
const head = html.slice(0, idx);
const tail = rest.slice(secIdx);

// extract existing article blocks keyed by cname
const blocks = gridInner.match(/<article class="card fade-up"[\s\S]*?<\/article>/g) || [];
const map = {};
for (const b of blocks) {
  const m = b.match(/<div class="card-cname">([\s\S]*?)<\/div>/);
  if (m) map[m[1].trim().toUpperCase()] = b;
}

// new deal-brand cards (no preceding comment, __RANK__ placeholder)
const newCard = ({tags, line, badgeClass, badge, logo, cname, stars, score, offer, tagline, chips, slug, trust, nd='✅ No Purchase Required'}) => `<article class="card fade-up" data-tags="${tags}">
      <div class="card-line ${line}"></div>
      <div class="card-rank-wrap">
        __RANK__
        <span class="card-badge ${badgeClass}">${badge}</span>
      </div>
      <div class="card-logo-col">
        ${logo}
        <div class="card-cname">${cname}</div>
        <div class="card-stars">${stars}</div>
        <div class="card-score">${score} / 5</div>
        <div class="usa-flag"><svg width="22" height="14"><use href="#us-flag"/></svg> USA</div>
      </div>
      <div class="card-body">
        <div class="offer-lbl">🎁 Welcome Bonus</div>
        <h3 class="card-offer">${offer}</h3>
        <p class="card-tagline">${tagline}</p>
        <div class="chips">${chips}</div>
      </div>
      <div class="card-cta">
        <div class="nd-label">${nd}</div>
        <a href="/bonuses/${slug}/" class="btn-claim" rel="nofollow noopener" aria-label="Claim ${cname} bonus">🔥 Claim Bonus Now <span class="arr">→</span></a>
        <a href="/reviews/${slug}/" class="btn-review">Read Full Review ↗</a>
        <div class="card-trust">${trust}</div>
      </div>
    </article>`;

const img = (slug, name) => `<img class="card-logo" src="/sweepstakeslogo/${slug}.webp" alt="${name} sweepstakes casino logo" loading="lazy" width="128" height="76">`;

map['MCLUCK'] = newCard({tags:'no-deposit top', line:'line-purple', badgeClass:'b-gold', badge:'💰 Top Payout', logo:img('mcluck','McLuck'), cname:'MCLUCK', stars:'★★★★★', score:'4.5', offer:'7,500 GC + <span class="hl">2.5 SC</span> No Code', tagline:'McJackpots progressive jackpots, rare transparent-RTP display, and native iOS &amp; Android apps. Fast Skrill and gift-card redemptions on a low 1x playthrough — one of the most polished sweeps brands.', chips:'<span class="ch g">✓ No Code</span><span class="ch g">✓ iOS &amp; Android</span><span class="ch c">McJackpots</span><span class="ch">Skrill</span>', slug:'mcluck', trust:'🔒 Transparent RTP'});

map['PULSZ'] = newCard({tags:'no-deposit top', line:'line-cyan', badgeClass:'b-gold', badge:'💰 Top Payout', logo:img('pulsz','Pulsz'), cname:'PULSZ', stars:'★★★★★', score:'4.5', offer:'5,000 GC + <span class="hl">2.3 SC</span> No Code', tagline:'Live since 2020 with 22,000+ Trustpilot reviews — the biggest, most positive record in sweeps. Native iOS &amp; Android apps, exclusive Pulse 8 Studios games, and fast ACH/Skrill payouts.', chips:'<span class="ch g">✓ No Code</span><span class="ch g">✓ Native Apps</span><span class="ch c">22k Trustpilot</span><span class="ch">Pulse 8</span>', slug:'pulsz', trust:'🔒 22,000+ Reviews'});

map['PLAYFAME'] = newCard({tags:'no-deposit top', line:'line-pink', badgeClass:'b-purple', badge:'⭐ Rising', logo:img('playfame','PlayFame'), cname:'PLAYFAME', stars:'★★★★☆', score:'4.3', offer:'7,500 GC + <span class="hl">2.5 SC</span> No Code', tagline:'B2 Services network brand with 1,000+ games and a live-dealer lobby. Gift cards from a low 10 SC and a dedicated iOS app make redemptions and mobile play simple.', chips:'<span class="ch g">✓ No Code</span><span class="ch g">✓ 10 SC Gift Cards</span><span class="ch c">Live Dealer</span><span class="ch">iOS App</span>', slug:'playfame', trust:'🔒 Low 10 SC Min'});

map['LEGENDZ'] = newCard({tags:'no-deposit top', line:'line-green', badgeClass:'b-red', badge:'🏈 Sportsbook', logo:img('legendz','Legendz'), cname:'LEGENDZ', stars:'★★★★☆', score:'4.2', offer:'500 GC + <span class="hl">3 SC</span> No Code', tagline:'Social casino plus a Delasport-powered social sportsbook and a Live88 live-dealer room. Prizeout gift cards from 50 SC, fast Skrill/debit cash, and exclusive Legendz Originals games.', chips:'<span class="ch g">✓ Sportsbook</span><span class="ch g">✓ Live Dealer</span><span class="ch c">Skrill Cash</span><span class="ch">Originals</span>', slug:'legendz', trust:'🔒 Casino + Sportsbook'});

map['THRILLZZ'] = newCard({tags:'no-deposit top', line:'line-gold', badgeClass:'b-red', badge:'🏈 Sportsbook', logo:img('thrillzz','Thrillzz'), cname:'THRILLZZ', stars:'★★★★☆', score:'4.3', offer:'3,000 GC + <span class="hl">3 SC</span> No Code', tagline:'Mobile-first social sportsbook with Squads and prop/parlay picks plus a growing casino floor. Convert SC to Prize Tickets and redeem cash, PayPal, Skrill or gift cards from 50 SC.', chips:'<span class="ch g">✓ Sportsbook</span><span class="ch g">✓ PayPal Cash</span><span class="ch c">Squads</span><span class="ch">Prop Picks</span>', slug:'thrillzz', trust:'🔒 Mobile Sportsbook'});

map['CARD CRUSH'] = newCard({tags:'top', line:'line-red', badgeClass:'b-purple', badge:'🎴 Skill Game', logo:img('card-crush','Card Crush'), cname:'CARD CRUSH', stars:'★★★★☆', score:'4.2', offer:'2 Mystery Coins + <span class="hl">5 Cards</span> Free', tagline:'A real-money skill-based card-battle platform with a 200+ game floor — available in California &amp; New York. Single Mystery Coin currency ($1 each); cash prizes from 75 MC.', chips:'<span class="ch g">✓ CA &amp; NY</span><span class="ch g">✓ Real Cash</span><span class="ch c">Skill-Based</span><span class="ch">200+ Games</span>', slug:'card-crush', trust:'🔒 CA &amp; NY Only', nd:'✅ Free to Start'});

map['ROXYMOXY'] = newCard({tags:'no-deposit new2026', line:'line-pink', badgeClass:'b-green', badge:'🆕 New 2025', logo:`<div class="card-logo" style="display:flex;align-items:center;justify-content:center;height:76px;font-family:'Sora',sans-serif;font-weight:900;font-size:1.05rem;color:#c026d3">RoxyMoxy</div>`, cname:'ROXYMOXY', stars:'★★★★☆', score:'4.0', offer:'50,000 GC + <span class="hl">2.5 SC</span> No Code', tagline:'Newer 2025 sweeps casino (Rainforest LTD) with a focused slots library and progressive jackpots. No-code welcome and daily login coins; bank-transfer cash redemptions.', chips:'<span class="ch g">✓ No Code</span><span class="ch c">Slots + Jackpots</span><span class="ch">Daily Login</span><span class="ch">New 2025</span>', slug:'roxymoxy', trust:'🔒 New 2025 Brand'});

map['ZULA'] = newCard({tags:'no-deposit top', line:'line-cyan', badgeClass:'b-gold', badge:'🇺🇸 Wide Access', logo:img('zula','Zula'), cname:'ZULA', stars:'★★★★☆', score:'4.4', offer:'Up to 120,000 GC + <span class="hl">10 SC</span>', tagline:'Blazesoft brand (Fortune Coins family) with 2,000+ games from 50+ studios and progressive jackpots. Restricted in just 3 states — available almost everywhere — with fast Skrill/bank cash.', chips:'<span class="ch g">✓ 2,000+ Games</span><span class="ch g">✓ 47 States</span><span class="ch c">10 SC Welcome</span><span class="ch">Jackpots</span>', slug:'zula', trust:'🔒 Available Almost Everywhere'});

const order = [
  // DEALS by payout
  'MCLUCK','PULSZ','CROWN COINS','HELLO MILLIONS','PLAYFAME','CASINO CLICK','SPINBLITZ','LEGENDZ','THRILLZZ','CARD CRUSH','SPREE','ROXYMOXY','ZULA',
  // EDITORIAL (non-deal)
  'ROLLA CASINO','SPLASH COINS','SWEET SWEEPS','BIG PIRATE','LUCKY BUNNY','DEXYPLAY','SWEEPICO','WOW VEGAS','FREESPIN','ACEBET','JACKPOTA','HIGH 5 CASINO','JACKPOT GO','SPINFINITE','MEGA BONANZA',
];

const medal = (i) => i===1?'🥇':i===2?'🥈':i===3?'🥉':'🎯';
const out = [];
order.forEach((key, n0) => {
  const i = n0 + 1;
  let b = map[key];
  if (!b) throw new Error('Missing card: ' + key);
  const rankSpan = `<span class="card-rank">${medal(i)} #${i}</span>`;
  b = b.replace(/<span class="card-rank">[\s\S]*?<\/span>/, rankSpan).replace('__RANK__', rankSpan);
  out.push(`    <!-- #${i} ${key} -->\n    ${b}`);
});

const newHtml = head + '\n\n' + out.join('\n\n') + '\n\n  </div>\n\n' + tail;
writeFileSync(file, newHtml);
console.log(`Reordered ${order.length} cards (13 deals on top by payout, 15 editorial below).`);
