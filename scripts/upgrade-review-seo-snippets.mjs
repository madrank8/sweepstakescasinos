#!/usr/bin/env node
/**
 * Phase-1 SEO snippet upgrades for high-impression review pages (GSC Jul 2026).
 * Updates title/meta/OG, injects AEO answer capsule before verdict H2, bumps
 * Review.dateModified in JSON-LD. Skips files that already have a capsule.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const REVIEWS = join(ROOT, 'reviews');
const MODIFIED = '2026-07-14T15:00:00Z';

const CAPSULE_CSS = `
.answer-capsule{background:linear-gradient(160deg,#f0fdf4,#ecfdf5);border:1px solid rgba(16,185,129,.22);border-left:4px solid #10b981;border-radius:12px;padding:14px 16px;margin:0 0 22px;}
.answer-capsule__label{font-size:.62rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#047857;margin:0 0 6px;}
.answer-capsule__text{font-size:.9rem;line-height:1.65;margin:0;color:#134e4a;}
`.trim();

const UPGRADES = {
  'roxymoxy.html': {
    title: 'RoxyMoxy Casino Review (2026): Legit, Payouts &amp; Restricted States',
    description:
      'Is RoxyMoxy legit? Yes — Rainforest LTD sweepstakes casino with 1× playthrough, bank payouts in 3–7 days, 100 SC min. 20 states restricted. Our 2026 review.',
    ogTitle: 'RoxyMoxy Review (2026): Legit, Payout Speed &amp; State Availability',
    ogDescription:
      'Is RoxyMoxy legit? 1× SC playthrough, bank transfer in 3–7 days, Trustpilot ~4.1/5. Full 2026 review — 20 restricted states including CA &amp; NY.',
    capsuleLabel: 'Is RoxyMoxy legit, and how fast does it pay out?',
    capsuleText:
      'Yes — RoxyMoxy (Rainforest LTD, launched July 2025) is a legitimate US sweepstakes casino with 1× Sweeps Coin playthrough and bank-transfer redemptions in roughly 3–7 business days from a 100 SC ($100) minimum. Trustpilot sits around 4.1/5 from ~200 reviews. Not available in 20 states including California and New York. Players must be 21+.',
  },
  'casino-click.html': {
    title: 'Casino Click Review (2026): Legit, Payout Speed &amp; Daily 5 SC Bonus',
    description:
      'Is Casino Click legit? Yes, but redemption friction is real — Trustpilot 2.5/5. Daily scratch card up to 5 SC, Bitcoin payouts, 1,000+ games. Full 2026 review.',
    ogTitle: 'Casino Click Review (2026): Legit, Redemption Times &amp; Daily Bonus',
    ogDescription:
      'Casino Click pays winners but KYC/redemption delays are common (Trustpilot 2.5/5). Daily 5 SC scratch card, 1,000+ games, Bitcoin payouts. Full 2026 review.',
    capsuleLabel: 'Is Casino Click legit, and how fast does it pay out?',
    capsuleText:
      'Casino Click is operated by Click Entertainment LLC and does pay out winners, but Trustpilot 2.5/5 from 497 reviews reflects real KYC and ACH delay complaints — often beyond the stated 3–5 day window. Bitcoin is available. Daily scratch cards award up to 5 SC free. Legitimate sweepstakes casino with bumpier redemption than top rivals.',
  },
  'playfame.html': {
    title: 'PlayFame Casino Review (2026): Legit, Payouts, iOS App &amp; Bonus',
    description:
      'Is PlayFame legit? Yes — B2 Services network, 4.4/5 Trustpilot, gift cards from 10 SC (~1–3 days), bank cash from 75 SC. iOS app. Full 2026 review.',
    ogTitle: 'PlayFame Review (2026): Legit, Payout Speed &amp; iOS App',
    ogDescription:
      'PlayFame is legit (4.4/5 Trustpilot, ~2,600 reviews). Gift cards from 10 SC, bank transfer from 75 SC, dedicated iOS app. 17 restricted states. 2026 review.',
    capsuleLabel: 'Is PlayFame legit, and how fast does it pay out?',
    capsuleText:
      'Yes — PlayFame (PlayFame Operations Limited / B2 Services, launched June 2024) is a legitimate sweepstakes casino with 4.4/5 Trustpilot from ~2,600 reviews. Gift card redemptions from 10 SC typically arrive in 1–3 days; bank-transfer cash from 75 SC in about 3–7 business days. Dedicated iOS app. Not available in 17 states including CA, NY, and NJ. 21+.',
  },
  'legendz.html': {
    title: 'Legendz Casino Review (2026): Legit, Payout Speed &amp; Sportsbook',
    description:
      'Is Legendz legit? Yes — casino + social sportsbook, Prizeout gift cards from 50 SC, Skrill/bank often within 24 hours. 3.5/5 Trustpilot. Full 2026 review.',
    ogTitle: 'Legendz Review (2026): Legit, Fast Payouts &amp; Social Sportsbook',
    ogDescription:
      'Legendz pairs a sweepstakes casino with a social sportsbook. Gift cards from 50 SC; Skrill/card often within 24 hours. 3.5/5 Trustpilot. 2026 review.',
    capsuleLabel: 'Is Legendz legit, and how fast does it pay out?',
    capsuleText:
      'Yes — Legendz (Platinum Panther Ltd., launched November 2024) is a legitimate sweepstakes casino plus social sportsbook. Prizeout gift cards from 50 SC and Skrill/debit redemptions are often processed within 24 hours; bank transfers take 1–5 business days from 100 SC. Trustpilot 3.5/5 from 2,600+ reviews. 17 restricted states. 18+.',
  },
  'dexyplay.html': {
    title: 'DexyPlay Casino Review (2026): Legit, PayPal Payouts &amp; Bonus',
    description:
      'Is DexyPlay legit? Yes — UTech Solutions, PayPal redemptions in 3–4 days, 1,600+ games, promo SWEEPSY. Purchase required before first cash-out. 2026 review.',
    ogTitle: 'DexyPlay Review (2026): Legit, PayPal Payouts &amp; Games',
    ogDescription:
      'DexyPlay (UTech Solutions) offers rare PayPal redemptions in 3–4 days, 1,600+ games, live dealer. Purchase required before first redemption. Full 2026 review.',
    capsule: false,
  },
  'hello-millions.html': {
    title: 'Hello Millions Review (2026): Legit, Payouts &amp; Phone Support',
    description:
      'Is Hello Millions legit? Yes — B-Two Operations, 4.2/5 Trustpilot, gift cards from 10 SC (1–2 days), live dealer + phone support. 17 states restricted. 2026 review.',
    ogTitle: 'Hello Millions Review (2026): Legit, Payout Speed &amp; Phone Support',
    ogDescription:
      'Hello Millions reviewed: 4.2/5 Trustpilot, Prizeout gift cards from 10 SC, phone line +1-424-842-2482, live dealer. B-Two network. 2026 review.',
    capsule: false,
  },
  'jackpota.html': {
    title: 'Jackpota Casino Review (2026): Legit, Payouts &amp; Jackpots',
    description:
      'Is Jackpota legit? Yes — B2Services network, gift cards in ~2 days from 10 SC, 4 progressive jackpots, 1,600+ games. 19 restricted states. 2026 review.',
    ogTitle: 'Jackpota Review (2026): Legit, Redemption Speed &amp; Jackpots',
    ogDescription:
      'Jackpota: 7,500 GC + 2.5 SC welcome, gift cards ~2 days from 10 SC, four sitewide jackpots, Unlimited Play mode. Full 2026 review.',
    capsule: false,
  },
  'zula.html': {
    title: 'Zula Casino Review (2026): Legit, Payouts &amp; 29K Trustpilot Reviews',
    description:
      'Is Zula legit? Yes — 4.6/5 Trustpilot (29K+ reviews), Skrill/bank from 50 SC, iOS &amp; Android apps, available in 48 states. 2026 review.',
    ogTitle: 'Zula Review (2026): Legit, Fast Payouts &amp; Wide Availability',
    ogDescription:
      'Zula Casino: 4.6/5 from 29,000+ Trustpilot reviews, 2,000+ games, cash from 50 SC, only 3 restricted states. Full 2026 review.',
    capsule: false,
  },
  'card-crush.html': {
    title: 'Card Crush Review (2026): Legit, Payouts — CA &amp; NY Only',
    description:
      'Is Card Crush legit? Vision NL platform — single Mystery Coin currency, CA &amp; NY only, gift cards from 10 MC, cash from 75 MC. Not dual-currency sweeps. 2026 review.',
    ogTitle: 'Card Crush Review (2026): Legit, Mystery Coins &amp; CA/NY Availability',
    ogDescription:
      'Card Crush: RPG card battles + casino games, 1 MC = $1, Trustpilot 4.4/5, California & New York only. Full 2026 review.',
    capsule: false,
  },
  'big-pirate.html': {
    title: 'Big Pirate Casino Review (2026): Legit, Payout Speed &amp; Bonus',
    description:
      'Is Big Pirate legit? Yes — 3-currency claw-machine sweepstakes casino, bank/crypto redemptions, 1,500+ games. Trustpilot mixed. Full 2026 review.',
    ogTitle: 'Big Pirate Review (2026): Legit, Redemptions &amp; Claw Machine',
    ogDescription:
      'Big Pirate Casino: unique 3-currency model, claw machine, 1,500+ games, redemption times and bonus breakdown. 2026 review.',
    capsule: false,
  },
};

function setMeta(html, key, content) {
  const re = new RegExp(`(<meta\\s+name="${key}"\\s+content=")[^"]*(")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${content}$2`);
  return html;
}

function setTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
}

function setOg(html, prop, content) {
  const re = new RegExp(`(<meta\\s+property="${prop}"\\s+content=")[^"]*(")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${content}$2`);
  return html;
}

function bumpSchemaDates(html) {
  return html.replace(/"dateModified":"[^"]+"/g, `"dateModified":"${MODIFIED}"`);
}

function injectCss(html) {
  if (html.includes('.answer-capsule{')) return html;
  return html.replace('</style>', `${CAPSULE_CSS}\n</style>`);
}

function injectCapsule(html, label, text) {
  if (/class="answer-capsule"|class="aeo-capsule"/.test(html)) return html;
  const block = `<div class="answer-capsule" role="note" aria-label="Quick answer">
<p class="answer-capsule__label">Quick answer</p>
<p class="answer-capsule__text"><strong>${label}</strong> ${text}</p>
</div>\n`;
  return html.replace(/(<main class="article">\s*)(<h2 id="verdict"[^>]*>)/, `$1${block}$2`);
}

let changed = 0;
for (const [file, cfg] of Object.entries(UPGRADES)) {
  const path = join(REVIEWS, file);
  let html = readFileSync(path, 'utf8');
  const before = html;

  html = setTitle(html, cfg.title);
  html = setMeta(html, 'description', cfg.description);
  html = setOg(html, 'og:title', cfg.ogTitle);
  html = setOg(html, 'og:description', cfg.ogDescription);
  html = bumpSchemaDates(html);
  html = injectCss(html);
  if (cfg.capsule !== false && cfg.capsuleLabel && cfg.capsuleText) {
    html = injectCapsule(html, cfg.capsuleLabel, cfg.capsuleText);
  }

  if (html !== before) {
    writeFileSync(path, html);
    changed++;
    console.log(`✓ ${file}`);
  }
}
console.log(`Done — ${changed} review(s) upgraded.`);
