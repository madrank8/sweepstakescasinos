/**
 * Single source of truth for site origin + publisher branding.
 *
 * Anything that needs the production domain or the brand name (canonicals,
 * og:url, JSON-LD entity graph, sitemap/robots generation, astro.config `site`)
 * MUST read from here so a future domain/brand change is a one-line edit.
 */
const origin = 'https://sweepstakeswiz.com';
const authorSlug = 'ilija-milosevic';

export const SITE = {
  /** Production origin, no trailing slash. */
  origin,
  /** Publisher logo (absolute path under public/). */
  logo: '/sweepstakeslogo/sweepstakeswiz.png',
  publisher: {
    name: 'Sweepstakes Wiz',
    alternateName: 'SweepstakesWiz.com',
    description:
      'Independent review site comparing US sweepstakes (social) casinos, bonuses, and redemption policies.',
    sameAs: ['https://www.youtube.com/@SweepstakesWiz'],
  },
  author: {
    name: 'Ilija Milosevic',
    slug: authorSlug,
    path: `/author/${authorSlug}/`,
    jobTitle: 'iGaming Writer & Analyst',
    description:
      'iGaming writer and analyst with 8+ years of experience creating search-driven content for gambling brands and affiliate websites, including casino, slot, and sportsbook reviews.',
    image: '/sweepstakeslogo/ilija-milosevic.webp',
    sameAs: ['https://www.linkedin.com/in/ilija-milosevic-hiperion'],
  },
  contact: {
    email: 'contact@sweepstakeswiz.com',
    path: '/contact/',
    type: 'editorial inquiries',
  },
  ids: {
    organization: `${origin}/#organization`,
    website: `${origin}/#website`,
    logo: `${origin}/#logo`,
    author: `${origin}/author/${authorSlug}/#person`,
  },
} as const;
