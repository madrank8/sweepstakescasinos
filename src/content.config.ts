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

const states = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/states' }),
  schema: z.object({
    /** 2-letter US state code this page covers. */
    stateCode: z.enum(ALL_US_STATE_CODES as [string, ...string[]]),
    title: z.string(),
    description: z.string(),
    /** Legal posture for affiliate offers in this state. */
    legalStatus: z.enum(['available', 'info-only', 'restricted']),
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
    /** Ordered AffiliatePartner.slug list featured in this comparison. */
    partnerSlugs: z.array(z.string()).default([]),
    published: isoDate.optional(),
    updated: isoDate.optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { states, reviews, comparisons };
