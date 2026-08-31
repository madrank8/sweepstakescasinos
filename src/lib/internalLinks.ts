import type { AffiliatePartner } from '../data/affiliates';
import { AFFILIATE_PARTNERS } from '../data/affiliates';
import {
  OPERATORS,
  getOperator,
  verifiedValue,
  type OperatorRecord,
  type RedemptionMinimum,
} from '../data/operators';
import { stateName, type UsStateCode } from '../data/usStates';
import { availabilityForPartner } from './availability';
import { decisionFactCompleteness } from './homepage';
import type { StateRecord } from './tracker/types';

export interface ContextualLink {
  href: string;
  label: string;
}

const SITE_ORIGIN = 'https://sweepstakeswiz.com';

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizedInternalDestination(value: string): string | null {
  if (/^(?:mailto:|tel:|javascript:|data:|#)/i.test(value)) return null;
  try {
    const url = new URL(value, SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return null;
    return url.pathname === '/' ? '/' : `${url.pathname.replace(/\/+$/, '')}/`;
  } catch {
    return null;
  }
}

/** Internal destinations authored in Markdown, MDX, or rendered HTML. */
export function internalDestinationsIn(content: string | undefined): Set<string> {
  if (!content) return new Set();
  const destinations = [
    ...[...content.matchAll(/\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)]
      .map((match) => match[1]),
    ...[...content.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)]
      .map((match) => match[1]),
  ]
    .map(normalizedInternalDestination)
    .filter((destination): destination is string => destination !== null);
  return new Set(destinations);
}

function sameMinimum(
  left: RedemptionMinimum | undefined,
  right: RedemptionMinimum | undefined,
): boolean {
  return Boolean(
    left &&
      right &&
      left.amount === right.amount &&
      left.currency === right.currency,
  );
}

function overlapCount(left: string[] | undefined, right: string[] | undefined): number {
  if (!left || !right) return 0;
  const rightValues = new Set(right.map(normalized));
  return new Set(left.map(normalized).filter((value) => rightValues.has(value))).size;
}

function similarity(left: OperatorRecord, right: OperatorRecord): number {
  let score = 0;
  const leftOperator = verifiedValue(left.operatorName);
  const rightOperator = verifiedValue(right.operatorName);
  if (
    leftOperator &&
    rightOperator &&
    normalized(leftOperator) === normalized(rightOperator)
  ) {
    score += 8;
  }

  const leftCash = verifiedValue(left.cashRedemptionMinimum);
  const rightCash = verifiedValue(right.cashRedemptionMinimum);
  if (sameMinimum(leftCash, rightCash)) score += 4;
  else if (leftCash && rightCash) score += 1;

  const leftGift = verifiedValue(left.giftCardRedemptionMinimum);
  const rightGift = verifiedValue(right.giftCardRedemptionMinimum);
  if (sameMinimum(leftGift, rightGift)) score += 4;
  else if (leftGift && rightGift) score += 1;

  score += overlapCount(
    verifiedValue(left.paymentMethods),
    verifiedValue(right.paymentMethods),
  );

  const leftLaunch = verifiedValue(left.launchDate)?.slice(0, 4);
  const rightLaunch = verifiedValue(right.launchDate)?.slice(0, 4);
  if (leftLaunch && rightLaunch && leftLaunch === rightLaunch) score += 1;
  return score;
}

/**
 * Canonical-fact similarity only. Editorial scores, affiliate economics,
 * tracking data, and input order are deliberately absent from the tie-break.
 */
export function selectReviewAlternatives(
  reviewSlug: string,
  operators: readonly OperatorRecord[] = OPERATORS,
  limit = 2,
): ContextualLink[] {
  const current = operators.find((operator) => operator.slug === reviewSlug);
  if (!current || limit <= 0) return [];
  return operators
    .filter((operator) => operator.slug !== reviewSlug)
    .map((operator) => ({
      operator,
      score: similarity(current, operator),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.operator.slug.localeCompare(right.operator.slug),
    )
    .slice(0, limit)
    .map(({ operator }) => ({
      href: `/reviews/${operator.slug}/`,
      label: `Related review: ${verifiedValue(operator.name) ?? operator.slug}`,
    }));
}

function stateSlug(code: UsStateCode): string {
  return stateName(code).toLowerCase().replaceAll('.', '').replaceAll(' ', '-');
}

function relevantCommercialHubs(operator: OperatorRecord): ContextualLink[] {
  const links: ContextualLink[] = [];
  const launchYear = Number(verifiedValue(operator.launchDate)?.slice(0, 4));
  if (Number.isFinite(launchYear) && launchYear >= 2024) {
    links.push({ href: '/new/', label: 'Recently reviewed casino research' });
  }
  if (
    verifiedValue(operator.signupOffer) ||
    verifiedValue(operator.dailyOffer)
  ) {
    links.push({
      href: '/bonuses/no-deposit/',
      label: 'Compare published no-purchase offers',
    });
  }
  if (
    decisionFactCompleteness(operator) >= 3 ||
    verifiedValue(operator.editorScore100) !== undefined
  ) {
    links.push({
      href: '/best/sweepstakes-casinos/',
      label: 'Explore the deeper casino comparison',
    });
  }
  return links.slice(0, 2);
}

export function selectReviewContextualLinks(
  reviewSlug: string,
  state?: UsStateCode | null,
): ContextualLink[] {
  const operator = getOperator(reviewSlug);
  if (!operator) return [];
  const regionLink: ContextualLink = state
    ? {
        href: `/states/${stateSlug(state)}/`,
        label: `Availability context for ${stateName(state)}`,
      }
    : {
        href: '/state-legality/',
        label: 'Check state availability context',
      };
  const links = [
    { href: '/reviews/', label: 'Browse every operator review' },
    ...relevantCommercialHubs(operator),
    ...selectReviewAlternatives(reviewSlug),
    regionLink,
  ];
  return links.filter(
    (link, index) => links.findIndex((candidate) => candidate.href === link.href) === index,
  );
}

export function selectAvailableStateReviews(
  state: UsStateCode,
  trackerState?: StateRecord,
  partners: readonly AffiliatePartner[] = AFFILIATE_PARTNERS,
): ContextualLink[] {
  return partners
    .filter(
      (partner) =>
        availabilityForPartner(partner, state, trackerState).cta.eligible,
    )
    .map((partner) => {
      const operator = getOperator(partner.slug);
      const name = operator ? verifiedValue(operator.name) : undefined;
      return {
        href: `/reviews/${partner.slug}/`,
        label: `${name ?? partner.name} review`,
        slug: partner.slug,
      };
    })
    .sort(
      (left, right) =>
        left.label.localeCompare(right.label) || left.slug.localeCompare(right.slug),
    )
    .map(({ href, label }) => ({ href, label }));
}

export function contextualLinksForGuide(
  guideSlug: string,
  body?: string,
): ContextualLink[] {
  let destinations: ContextualLink[];
  if (/law|legit/.test(guideSlug)) {
    destinations = [
      {
        href: '/state-legality/',
        label: 'Check the state-by-state availability hub',
      },
      {
        href: '/best/sweepstakes-casinos/',
        label: 'Compare the reviewed sweepstakes casinos',
      },
      { href: '/reviews/', label: 'Browse every operator review' },
    ];
  } else if (/amoe|coin|redeem/.test(guideSlug)) {
    destinations = [
      {
        href: '/bonuses/no-deposit/',
        label: 'Compare published no-purchase offers',
      },
      {
        href: '/best/sweepstakes-casinos/',
        label: 'Continue to the detailed operator comparison',
      },
      { href: '/reviews/', label: 'Browse every operator review' },
    ];
  } else {
    destinations = [
      {
        href: '/best/sweepstakes-casinos/',
        label: 'Continue to the detailed operator comparison',
      },
      { href: '/reviews/', label: 'Browse every operator review' },
      {
        href: '/bonuses/no-deposit/',
        label: 'Compare published no-purchase offers',
      },
    ];
  }
  const existing = internalDestinationsIn(body);
  const parent = { href: '/guides/', label: 'Browse all sweepstakes casino guides' };
  const destination = destinations.find((link) => !existing.has(link.href));
  return [
    ...(existing.has(parent.href) ? [] : [parent]),
    ...(destination ? [destination] : []),
  ];
}

export function contextualLinksForArticle(
  state?: UsStateCode | null,
  body?: string,
): ContextualLink[] {
  const existing = internalDestinationsIn(body);
  const parent = { href: '/guides/', label: 'Read the sweepstakes casino guides' };
  const destinations: ContextualLink[] = [
    ...(state
      ? [{
          href: `/states/${stateSlug(state)}/`,
          label: `${stateName(state)} availability and legal context`,
        }]
      : []),
    {
      href: '/state-legality/',
      label: 'Check state-by-state availability context',
    },
    {
      href: '/best/sweepstakes-casinos/',
      label: 'Continue to the detailed operator comparison',
    },
    { href: '/reviews/', label: 'Browse every operator review' },
  ];
  const destination = destinations.find((link) => !existing.has(link.href));
  return [
    ...(existing.has(parent.href) ? [] : [parent]),
    ...(destination ? [destination] : []),
  ];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const CONTEXT_MARKER = '<!--sc-contextual-nav-->';

function nearbyDestinations(html: string, insertionIndex: number): Set<string> {
  const nearby = html.slice(
    Math.max(0, insertionIndex - 2500),
    Math.min(html.length, insertionIndex + 500),
  );
  return new Set(
    [...nearby.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map(
      (match) => match[1],
    ),
  );
}

export function injectReviewContextualLinks(
  html: string,
  options: { reviewSlug: string; state?: UsStateCode | null },
): string {
  if (html.includes(CONTEXT_MARKER)) return html;
  const mainEnd = html.lastIndexOf('</main>');
  const bodyEnd = html.lastIndexOf('</body>');
  const insertionIndex =
    mainEnd >= 0 ? mainEnd : bodyEnd >= 0 ? bodyEnd : html.length;
  const nearby = nearbyDestinations(html, insertionIndex);
  const links = selectReviewContextualLinks(options.reviewSlug, options.state).filter(
    (link) => !nearby.has(link.href),
  );
  if (links.length === 0) return html;
  const markup = `${CONTEXT_MARKER}
<aside class="sc-contextual-nav" aria-labelledby="sc-contextual-nav-title">
  <h2 id="sc-contextual-nav-title">Continue your research</h2>
  <nav aria-label="Related casino research">
    ${links
      .map(
        (link) =>
          `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`,
      )
      .join('\n    ')}
  </nav>
  <p>Related links use published editorial facts and alphabetical tie-breaks, not affiliate value. State availability is context, not legal advice.</p>
</aside>
<style>
.sc-contextual-nav{max-width:880px;margin:28px auto;padding:18px 20px;border:1px solid rgba(15,23,42,.14);border-left:4px solid #b45309;border-radius:12px;background:#fffbeb;color:#1e293b;}
.sc-contextual-nav h2{margin:0 0 10px;font-size:1.15rem;}
.sc-contextual-nav nav{display:flex;flex-wrap:wrap;gap:8px 14px;}
.sc-contextual-nav a{font-weight:700;color:#1d4ed8;text-underline-offset:2px;}
.sc-contextual-nav p{margin:10px 0 0;font-size:.78rem;color:#64748b;}
</style>
`;
  return html.slice(0, insertionIndex) + markup + html.slice(insertionIndex);
}
