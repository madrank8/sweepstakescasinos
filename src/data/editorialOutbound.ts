/**
 * Non-partner /bonuses/<slug>/ destinations.
 *
 * These brands are reviewed editorially but are not in AFFILIATE_PARTNERS, so
 * they must not use Gemified partner tracking. Outbound clicks still go through
 * resolveBonusGateway so SITE_BANNED_STATES can block redirects. URLs are the
 * destinations previously baked into bonuses/<slug>.html meta-refresh pages.
 */

export type EditorialOutbound = {
  slug: string;
  name: string;
  /** Absolute https URL used after geo check passes. */
  url: string;
};

export const EDITORIAL_OUTBOUND: Record<string, EditorialOutbound> = {
  acebet: {
    slug: 'acebet',
    name: 'Acebet',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/BZ4JX2/?source_id=mega',
  },
  'big-pirate': {
    slug: 'big-pirate',
    name: 'Big Pirate',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/97HM5R/?source_id=mega',
  },
  dexyplay: {
    slug: 'dexyplay',
    name: 'DexyPlay',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/GR2KKR/?source_id=mega',
  },
  freespin: {
    slug: 'freespin',
    name: 'FreeSpin',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/7PT53K/?source_id=mega',
  },
  high5: {
    slug: 'high5',
    name: 'High 5',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/3GF5RC/?source_id=mega',
  },
  'jackpot-go': {
    slug: 'jackpot-go',
    name: 'JackpotGo',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/84Z6ZF/?source_id=mega',
  },
  jackpota: {
    slug: 'jackpota',
    name: 'Jackpota',
    url: 'https://tracker.silversocialgames.com/visit/?bta=35383&brand=jackpota&utm_campaign=mega',
  },
  'lucky-bunny': {
    slug: 'lucky-bunny',
    name: 'Lucky Bunny',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/K9TM4Q/?source_id=mega',
  },
  'mega-bonanza': {
    slug: 'mega-bonanza',
    name: 'Mega Bonanza',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/6BZDGK/?source_id=mega',
  },
  rolla: {
    slug: 'rolla',
    name: 'Rolla',
    url: 'https://www.rolla.com/',
  },
  spinfinite: {
    slug: 'spinfinite',
    name: 'Spinfinite',
    url: 'https://winara.o18a.com/c?s=IfkJC4De&source=mega',
  },
  'splash-coins': {
    slug: 'splash-coins',
    name: 'Splash Coins',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/CDLHJH/?source_id=mega',
  },
  sweepico: {
    slug: 'sweepico',
    name: 'Sweepico',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/K2X7FP/?source_id=mega',
  },
  'sweet-sweeps': {
    slug: 'sweet-sweeps',
    name: 'Sweet Sweeps',
    url: 'https://www.gmv0cw4gptrk.com/5RPW1X/9B9DM1/?source_id=mega',
  },
  'wow-vegas': {
    slug: 'wow-vegas',
    name: 'WOW Vegas',
    url: 'https://wlwowvegas.adsrv.eacdn.com/C.ashx?btag=a_1983b_3c_&affid=436&siteid=1983&adid=3&c=mega',
  },
};

export function getEditorialOutbound(slug: string): EditorialOutbound | undefined {
  return EDITORIAL_OUTBOUND[slug];
}
