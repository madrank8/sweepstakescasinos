/**
 * Rating methodology — SINGLE SOURCE OF TRUTH.
 *
 * Per `.planning/AI-AUTHORSHIP-DISCLOSURE-SPEC.md` §6, the rating criteria and
 * their weights must be defined in exactly one place and match on every surface
 * that displays them (the homepage rate section and the /how-we-rate/ page).
 *
 * These root HTML files are hand-authored (not generated from this config), so
 * `scripts/verify-methodology-consistency.ts` enforces at build time that each
 * criterion `name` and `weight` below appears on both surfaces — preventing the
 * drift that previously left the homepage (4 criteria) and /how-we-rate/
 * (7 criteria) describing the same system differently.
 *
 * To change the methodology: edit HERE, then update the copy on both surfaces
 * until `npm run methodology:check` passes.
 */

export interface RatingCriterion {
  /** Stable id. */
  id: string;
  /** Emoji used on both surfaces. */
  icon: string;
  /** Display name — must appear verbatim (HTML entities decoded) on both surfaces. */
  name: string;
  /** Percentage weight — must sum to 100 across all criteria. */
  weight: number;
  /** One-line summary (homepage rate card). */
  summary: string;
}

export const RATING_CRITERIA: RatingCriterion[] = [
  {
    id: 'redemption',
    icon: '⚡',
    name: 'Redemption Terms & Speed',
    weight: 30,
    summary:
      "Published redemption policy — minimums, playthrough, approval windows and payout rails — weighed against what players report at scale on Trustpilot.",
  },
  {
    id: 'bonus',
    icon: '🎁',
    name: 'Sign-Up Bonus Value',
    weight: 25,
    summary:
      'The true SC-equivalent of the welcome package, including the playthrough multiple and how many steps stand between you and the advertised number.',
  },
  {
    id: 'ongoing',
    icon: '🎰',
    name: 'Ongoing Free Value',
    weight: 25,
    summary:
      'Recurring free-SC paths — daily login streaks, social drops, referral SC and the mail-in AMOE route — not just the headline welcome figure.',
  },
  {
    id: 'trust',
    icon: '💬',
    name: 'Trust & Support',
    weight: 20,
    summary:
      'Operator and licensing transparency, security (SSL, RNG-tested studios), support channels, and the balance of sentiment across each brand\u2019s full review history.',
  },
];

/** Sanity: weights must total 100. */
export const RATING_WEIGHT_TOTAL = RATING_CRITERIA.reduce((s, c) => s + c.weight, 0);
