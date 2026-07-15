import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { ALL_US_STATE_CODES } from './data/usStates';

/**
 * Typed content model (MDX) for NEW content. Existing hand-authored HTML reviews
 * keep working via the set:html pipeline; new content is authored here and
 * rendered through src/layouts/ContentLayout.astro (same global chrome + schema).
 *
 * `partnerSlug` values are validated at author time against the affiliate data
 * layer by scripts/verify-content.ts (kept out of the Zod schema so the data
 * layer stays the single source of truth without a hard build coupling).
 */

const isoDate = z.coerce.date();

const faqItem = z.object({ q: z.string(), a: z.string() });

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heroTitle: z.string().optional(),
    /** Optional FAQ rendered as a visible section + FAQPage JSON-LD. */
    faq: z.array(faqItem).default([]),
    published: isoDate.optional(),
    updated: isoDate.optional(),
    draft: z.boolean().default(false),
    /** Hub grouping + sort for the /guides/ index page. */
    category: z.string().optional(),
    order: z.number().optional(),
    /** Short card label for the hub grid (falls back to description). */
    cardSummary: z.string().optional(),
    /** Hero/inline image path for Article.image (must exist under public/). */
    image: z.string().optional(),
    /**
     * Optional inline visuals rendered by the MDX body. Each entry emits its
     * own ImageObject JSON-LD node in the page @graph and is anchored back to
     * the Article via `#article` -> `image` (multi-image arrays are valid on
     * schema.org). Width/height are used only as a fallback — the slug
     * renderer prefers the real dims read from the file at build time via
     * svgDimensions / pngDimensions.
     */
    figures: z
      .array(
        z.object({
          src: z.string(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
          alt: z.string().min(20).max(160),
          caption: z.string().optional(),
          id: z.string().optional(),
        }),
      )
      .default([]),
    /** Primary-source URLs cited in the visible text (Article.citation). */
    citations: z.array(z.string().url()).default([]),
    /**
     * Optional HowTo JSON-LD for procedural guides (LLM-extraction surface;
     * desktop rich results are deprecated). Steps MUST mirror visible content.
     */
    howTo: z
      .object({
        name: z.string(),
        steps: z.array(z.object({ name: z.string(), text: z.string() })),
      })
      .optional(),
    /**
     * Optional ItemList JSON-LD for guides that enumerate items (e.g. a
     * categorized list of casinos). Items MUST mirror a visible list in the
     * body; `url` is an absolute-from-root path (e.g. `/reviews/mcluck/`).
     */
    itemList: z
      .object({
        name: z.string(),
        items: z.array(z.object({ name: z.string(), url: z.string() })),
      })
      .optional(),
  }),
});

const states = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/states' }),
  schema: z.object({
    /** 2-letter US state code this page covers. */
    stateCode: z.enum(ALL_US_STATE_CODES as [string, ...string[]]),
    title: z.string(),
    description: z.string(),
    /** Legal posture for affiliate offers in this state. */
    legalStatus: z.enum(['available', 'info-only', 'restricted']),
    /** Optional FAQ rendered as a visible section + FAQPage JSON-LD. */
    faq: z.array(faqItem).default([]),
    updated: isoDate.optional(),
    draft: z.boolean().default(false),
  }),
});

const reviews = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/reviews' }),
  schema: z.object({
    /** Links to an AffiliatePartner.slug in src/data/affiliates.ts. */
    partnerSlug: z.string(),
    title: z.string(),
    description: z.string(),
    /** Visible rating; MUST match the on-page verdict (no fabrication). */
    rating: z.number().min(0).max(5).optional(),
    ratingCount: z.number().int().positive().optional(),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    published: isoDate.optional(),
    updated: isoDate.optional(),
    /** Disclose first-party hands-on testing vs editorial analysis. */
    handsOn: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/comparisons' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heroTitle: z.string().optional(),
    /** Ordered AffiliatePartner.slug list featured in this comparison. */
    partnerSlugs: z.array(z.string()).default([]),
    faq: z.array(faqItem).default([]),
    published: isoDate.optional(),
    updated: isoDate.optional(),
    draft: z.boolean().default(false),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Legislation, operator exit, enforcement, or industry change. */
    category: z.enum(['legislation', 'shutdown', 'enforcement', 'industry']).default('legislation'),
    /** Primary US state when the story is jurisdiction-specific. */
    stateCode: z.enum(ALL_US_STATE_CODES as [string, ...string[]]).optional(),
    published: isoDate,
    updated: isoDate.optional(),
    draft: z.boolean().default(false),
    faq: z.array(faqItem).default([]),
    /** Primary source URL (statute, regulator, operator notice). */
    sourceUrl: z.string().url().optional(),
    citations: z.array(z.string().url()).default([]),
  }),
});

export const collections = { states, reviews, comparisons, guides, news };
