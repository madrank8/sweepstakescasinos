/**
 * Single source of truth for site origin + publisher branding.
 *
 * Anything that needs the production domain or the brand name (canonicals,
 * og:url, JSON-LD entity graph, sitemap/robots generation, astro.config `site`)
 * MUST read from here so a future domain/brand change is a one-line edit.
 */
export const SITE = {
  /** Production origin, no trailing slash. */
  origin: 'https://sweepstakeswiz.com',
  /** Publisher / brand display name. */
  name: 'Sweepstakes Wiz',
  /** Schema alternateName. */
  altName: 'SweepstakesWiz.com',
  /** Publisher logo (absolute path under public/). */
  logo: '/sweepstakeslogo/sweepstakeswiz.png',
  /** Primary editorial author. */
  author: 'Ilija Milosevic',
  authorSlug: 'ilija-milosevic',
} as const;
