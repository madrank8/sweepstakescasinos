/**
 * Presentation-only operator logo paths.
 *
 * These are visual identity assets, not editorial facts. A missing path must
 * omit the image rather than invent a badge, score, or ranking.
 */
export const OPERATOR_LOGO_SRC: Record<string, string> = {
  acebet: '/sweepstakeslogo/acebetlogo.webp',
  'american-luck': '/sweepstakeslogo/americanlucklogo.png',
  'big-pirate': '/sweepstakeslogo/bigpiratelogo.webp',
  'card-crush': '/sweepstakeslogo/card-crush.webp',
  'casino-click': '/sweepstakeslogo/casinoclicklogo.webp',
  'crown-coins': '/sweepstakeslogo/crowncoinslogo.webp',
  dexyplay: '/sweepstakeslogo/dexyplaylogo.webp',
  freespin: '/sweepstakeslogo/freespinlogo.webp',
  'hello-millions': '/sweepstakeslogo/hellomillionslogo.webp',
  high5: '/sweepstakeslogo/high5logo.webp',
  'jackpot-go': '/sweepstakeslogo/jackpotgologo.webp',
  jackpota: '/sweepstakeslogo/jackpotalogo.webp',
  legendz: '/sweepstakeslogo/legendz.webp',
  'lucky-bunny': '/sweepstakeslogo/luckybunny.webp',
  mcluck: '/sweepstakeslogo/mcluck.webp',
  'mega-bonanza': '/sweepstakeslogo/megabonanzalogo.webp',
  playfame: '/sweepstakeslogo/playfame.webp',
  pulsz: '/sweepstakeslogo/pulsz.webp',
  rolla: '/sweepstakeslogo/rollacasinologo.webp',
  spinblitz: '/sweepstakeslogo/spinblitzlogo.webp',
  spinfinite: '/sweepstakeslogo/spinfinitelogo.webp',
  'splash-coins': '/sweepstakeslogo/splashcoinslogo.webp',
  spree: '/sweepstakeslogo/spreelogo.webp',
  sweepico: '/sweepstakeslogo/sweepicologo.webp',
  'sweet-sweeps': '/sweepstakeslogo/sweetsweepslogo.webp',
  thrillzz: '/sweepstakeslogo/thrillzz.webp',
  'wow-vegas': '/sweepstakeslogo/wowvegaslogo.webp',
  zula: '/sweepstakeslogo/zula.webp',
};

export function operatorLogoSrc(slug: string): string | undefined {
  return OPERATOR_LOGO_SRC[slug];
}
