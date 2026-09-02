import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { AFFILIATE_PARTNERS } from '../../src/data/affiliates';
import { BRAND_ENTITIES } from '../../src/data/brandEntities';
import { READER_REPORT_AGGREGATES } from '../../src/data/readerReports.generated';
import { OPERATORS, verifiedValue } from '../../src/data/operators';
import {
  reconcileAvailabilityAuthorities,
  renderAvailabilityConflictReport,
} from '../../src/lib/availability';
import {
  fallbackAvailability,
  fallbackOperators,
  fallbackStates,
} from '../../src/lib/tracker/fallback';
import { selectComparisonOperators } from '../../src/lib/homepage';
import { operatorFactNote } from '../../src/lib/operatorPresentation';
import { visibleEditorialScore } from '../../src/lib/pageChrome';
import { selectReviewContextualLinks } from '../../src/lib/internalLinks';
import { validateAllResults } from '../../src/data/testingResults';
import { assessProductionRedemptionEvidence } from '../../src/lib/redemptionEvidenceAdapter';
import { runReviewQa, type ReviewQaResult } from '../verify-reviews';
import { findTestingClaims, type UnsupportedTestingClaim } from './claim-policy';

export const DETERMINISTIC_AUDIT_SNAPSHOT_AS_OF = '2026-08-31';

const HISTORICAL_HOMEPAGE_SCORES: Record<string, number> = {
  acebet: 4.6,
  'big-pirate': 4.7,
  'card-crush': 4.2,
  'casino-click': 4.7,
  'crown-coins': 4.8,
  dexyplay: 4.8,
  freespin: 4.9,
  'hello-millions': 4.6,
  high5: 4.9,
  'jackpot-go': 4.5,
  jackpota: 4.7,
  'lucky-bunny': 4.9,
  mcluck: 4.5,
  'mega-bonanza': 4.5,
  pulsz: 4.5,
  rolla: 5,
  spinblitz: 4.6,
  spinfinite: 4.5,
  'splash-coins': 4.9,
  spree: 4.6,
  sweepico: 4.6,
  'sweet-sweeps': 4.7,
  thrillzz: 4.3,
  'wow-vegas': 4.8,
  zula: 4.4,
};

const LEGACY_REVIEW_JSON_LD_SCORES: Record<string, number> = {
  acebet: 4.5,
  'big-pirate': 4.1,
  'card-crush': 4.2,
  'casino-click': 3.8,
  'crown-coins': 4.6,
  dexyplay: 4.5,
  freespin: 4.3,
  'hello-millions': 4.2,
  high5: 4.3,
  'jackpot-go': 4.4,
  jackpota: 4.3,
  'lucky-bunny': 3.9,
  mcluck: 4.5,
  'mega-bonanza': 4,
  pulsz: 4.5,
  rolla: 4.7,
  spinblitz: 4.4,
  spinfinite: 4.1,
  'splash-coins': 4.3,
  spree: 4,
  sweepico: 4.4,
  'sweet-sweeps': 4.5,
  thrillzz: 4.3,
  'wow-vegas': 4.5,
  zula: 4.4,
};

export interface AuditSnapshotOptions {
  redemptionIndexAsOf: string;
}

export type ConflictStatus = 'RESOLVED' | 'UNRESOLVED' | 'MANUAL_REVIEW';

export interface SourceValue {
  path: string;
  value: string;
}

export interface OperatorConflict {
  slug: string;
  field: string;
  sources: SourceValue[];
  status: ConflictStatus;
}

export interface ReviewInventory {
  slug: string;
  path: string;
  title: string;
  h1: string;
  description: string;
  canonical: string;
  robots: string;
  visibleScore?: number;
  schemaScore?: number;
  operatorName?: string;
  welcomeOffer?: string;
}

export interface HomepageOperator {
  slug: string;
  path: string;
  name: string;
  score?: number;
  offer: string;
}

export interface ComparisonOperator {
  slug: string;
  path: string;
  name: string;
  offer: string;
}

export interface HubOperatorFact {
  slug: string;
  path: string;
  field: string;
  value: string;
}

export interface OperatorAudit {
  reviews: ReviewInventory[];
  homepage: HomepageOperator[];
  comparison: ComparisonOperator[];
  hubs: HubOperatorFact[];
  conflicts: OperatorConflict[];
}

export interface HubApprovalGate {
  name:
    | 'canonical field coverage'
    | 'freshness'
    | 'distinct intent'
    | 'competing URLs'
    | 'internal-link sources'
    | 'conversion action';
  status: 'PASS' | 'FAIL';
  evidence: string;
}

export interface CommercialHubCandidateDecision {
  id: string;
  candidate: string;
  decision: 'DEFER';
  gates: HubApprovalGate[];
  unmetGates: string[];
}

export function evaluateCommercialHubCandidates(
  operators: readonly typeof OPERATORS[number][] = OPERATORS,
): CommercialHubCandidateDecision[] {
  const total = operators.length;
  const freshnessCount = operators.filter(
    (operator) => verifiedValue(operator.lastVerifiedDate) !== undefined,
  ).length;
  const payoutTimingCount = operators.filter(
    (operator) => verifiedValue(operator.publishedRedemptionTiming) !== undefined,
  ).length;
  const signupOfferCount = operators.filter(
    (operator) => verifiedValue(operator.signupOffer) !== undefined,
  ).length;

  const candidates: Array<Omit<CommercialHubCandidateDecision, 'decision' | 'unmetGates'>> = [
    {
      id: 'fastest-payout-superlative',
      candidate: 'Fastest payout sweepstakes casinos',
      gates: [
        {
          name: 'canonical field coverage',
          status: 'FAIL',
          evidence:
            `${payoutTimingCount}/${total} records have verified published timing text, ` +
            'but 0 have a normalized comparable payout-duration metric.',
        },
        {
          name: 'freshness',
          status: 'FAIL',
          evidence:
            `lastVerifiedDate current count: ${freshnessCount}/${total}; ` +
            `${freshnessCount}/${total} records have a verified lastVerifiedDate.`,
        },
        {
          name: 'distinct intent',
          status: 'PASS',
          evidence: 'A ranked payout-speed decision page would be distinct from the redemption explainer.',
        },
        {
          name: 'competing URLs',
          status: 'PASS',
          evidence: 'No existing route ranks operators by a comparable payout-duration metric.',
        },
        {
          name: 'internal-link sources',
          status: 'PASS',
          evidence: 'Reviews, the redemption guide, and the main comparison could supply contextual links.',
        },
        {
          name: 'conversion action',
          status: 'PASS',
          evidence: 'The supported action would be reading operator reviews after comparing published terms.',
        },
      ],
    },
    {
      id: 'free-sweeps-coins-superlative',
      candidate: 'Most free Sweeps Coins',
      gates: [
        {
          name: 'canonical field coverage',
          status: signupOfferCount === total ? 'PASS' : 'FAIL',
          evidence: `${signupOfferCount}/${total} records have a verified signup offer.`,
        },
        {
          name: 'freshness',
          status: 'FAIL',
          evidence:
            `lastVerifiedDate current count: ${freshnessCount}/${total}; ` +
            `${freshnessCount}/${total} records have a verified lastVerifiedDate.`,
        },
        {
          name: 'distinct intent',
          status: 'FAIL',
          evidence: 'The intent is already served by /bonuses/no-deposit/.',
        },
        {
          name: 'competing URLs',
          status: 'FAIL',
          evidence: '/bonuses/no-deposit/ is the existing canonical no-purchase offer destination.',
        },
        {
          name: 'internal-link sources',
          status: 'PASS',
          evidence: 'Reviews, the AMOE guide, and the homepage can link to the existing destination.',
        },
        {
          name: 'conversion action',
          status: 'PASS',
          evidence: 'The supported action is comparing published offers and then reading a review.',
        },
      ],
    },
  ];

  return candidates.map((candidate) => {
    const unmetGates = candidate.gates
      .filter((gate) => gate.status === 'FAIL')
      .map((gate) => `${gate.name}: ${gate.evidence}`);
    return { ...candidate, decision: 'DEFER', unmetGates };
  });
}

type JsonNode = Record<string, unknown>;

function read(root: string, path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
    nbsp: ' ',
    ndash: '–',
    mdash: '—',
  };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_match, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function plain(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function attribute(tag: string, name: string): string {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return decodeHtml(match?.[1] ?? match?.[2] ?? '');
}

function meta(html: string, name: string): string {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (
      attribute(tag, 'name').toLowerCase() === name.toLowerCase() ||
      attribute(tag, 'property').toLowerCase() === name.toLowerCase()
    ) {
      return attribute(tag, 'content');
    }
  }
  return '';
}

function canonical(html: string): string {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attribute(match[0], 'rel').toLowerCase() === 'canonical') {
      return attribute(match[0], 'href');
    }
  }
  return '';
}

function jsonLdNodes(html: string): JsonNode[] {
  const nodes: JsonNode[] = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(match[1]) as JsonNode;
      if (Array.isArray(parsed['@graph'])) {
        for (const node of parsed['@graph']) {
          if (node && typeof node === 'object') nodes.push(node as JsonNode);
        }
      } else {
        nodes.push(parsed);
      }
    } catch {
      // Parse failures are reported by the existing schema verifier. The audit
      // records absent values rather than inventing data from malformed JSON.
    }
  }
  return nodes;
}

function allFiles(root: string, start: string, extensions: Set<string>): string[] {
  const out: string[] = [];
  const absoluteStart = join(root, start);
  if (!existsSync(absoluteStart)) return out;
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir).sort()) {
      const absolute = join(dir, entry);
      const stats = statSync(absolute);
      if (stats.isDirectory()) walk(absolute);
      else if (extensions.has(extname(entry))) {
        out.push(relative(root, absolute).replaceAll('\\', '/'));
      }
    }
  };
  walk(absoluteStart);
  return out;
}

function reviewInventory(root: string): ReviewInventory[] {
  return readdirSync(join(root, 'reviews'))
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => {
      const path = `reviews/${file}`;
      const html = read(root, path);
      const nodes = jsonLdNodes(html);
      const review = nodes.find((node) => node['@type'] === 'Review');
      const rating = review?.reviewRating as JsonNode | undefined;
      const itemRef = review?.itemReviewed as JsonNode | undefined;
      const brandId = typeof itemRef?.['@id'] === 'string' ? itemRef['@id'] : '';
      const brand = nodes.find((node) => node['@id'] === brandId);
      const parent = brand?.parentOrganization as JsonNode | undefined;
      const title = plain(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
      const h1 = plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
      const score = visibleEditorialScore(html);
      const welcomeOffer = plain(
        html.match(
          /<div\b[^>]*class=["'][^"']*\boc-headline\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        )?.[1] ?? '',
      );
      return {
        slug: file.replace(/\.html$/, ''),
        path,
        title,
        h1,
        description: meta(html, 'description'),
        canonical: canonical(html),
        robots: meta(html, 'robots'),
        ...(score == null ? {} : { visibleScore: score }),
        ...(typeof rating?.ratingValue === 'string' || typeof rating?.ratingValue === 'number'
          ? { schemaScore: Number(rating.ratingValue) }
          : {}),
        ...(typeof parent?.name === 'string' ? { operatorName: parent.name } : {}),
        ...(welcomeOffer ? { welcomeOffer } : {}),
      };
    });
}

function homepageInventory(root: string): HomepageOperator[] {
  const html = read(root, 'index.html');
  const cards: HomepageOperator[] = [];
  for (const match of html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)) {
    if (!/\bclass=["'][^"']*\bcard\b/.test(match[1])) continue;
    const body = match[2];
    const slug = body.match(/href=["']\/reviews\/([a-z0-9-]+)\/["']/i)?.[1];
    if (!slug) continue;
    const name = plain(
      body.match(
        /<div\b[^>]*class=["'][^"']*\bcard-cname\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      )?.[1] ?? '',
    );
    const scoreText = plain(
      body.match(
        /<div\b[^>]*class=["'][^"']*\bcard-score\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      )?.[1] ?? '',
    );
    const score = Number(scoreText.match(/([0-9]+(?:\.[0-9]+)?)/)?.[1]);
    const offer = plain(
      body.match(
        /<h3\b[^>]*class=["'][^"']*\bcard-offer\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i,
      )?.[1] ?? '',
    );
    cards.push({
      slug,
      path: 'index.html',
      name,
      ...(Number.isFinite(score) ? { score } : {}),
      offer,
    });
  }
  return cards;
}

function slugForName(name: string, homepage: HomepageOperator[]): string | undefined {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return homepage.find(
    (card) =>
      card.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized ||
      card.slug.replaceAll('-', '') === normalized.replace(/casino|coins/g, ''),
  )?.slug;
}

function comparisonInventory(root: string, homepage: HomepageOperator[]): ComparisonOperator[] {
  void root;
  void homepage;
  const path = 'src/routes/best/[slug].astro';
  return selectComparisonOperators(OPERATORS, 10)
    .map((operator) => ({
      slug: operator.slug,
      path,
      name: operator.name,
      offer: operator.welcomeOffer ?? '',
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function hubInventory(root: string): HubOperatorFact[] {
  const facts: HubOperatorFact[] = [];
  const newPath = 'src/routes/new/index.astro';
  const newSource = read(root, newPath);
  for (const match of newSource.matchAll(/\bslug:\s*'([^']+)'/g)) {
    const operator = OPERATORS.find((candidate) => candidate.slug === match[1]);
    if (!operator) continue;
    facts.push({
      slug: match[1],
      path: newPath,
      field: 'curated hub note',
      value: operatorFactNote(operator),
    });
  }

  const bonusPath = 'src/routes/bonuses/no-deposit/index.astro';
  const bonusSource = read(root, bonusPath);
  for (const match of bonusSource.matchAll(/canonicalOffer\('([^']+)',\s*'[^']+'\)/g)) {
    const operator = OPERATORS.find((candidate) => candidate.slug === match[1]);
    if (!operator) continue;
    const signup =
      verifiedValue(operator.signupOffer) ??
      (operator.signupOffer.status === 'unresolved'
        ? 'Details omitted because canonical offer sources conflict'
        : undefined);
    const gift = verifiedValue(operator.giftCardRedemptionMinimum);
    const cash = verifiedValue(operator.cashRedemptionMinimum);
    const minimum = [
      ...(gift ? [`${gift.amount} ${gift.currency} (gift cards)`] : []),
      ...(cash ? [`${cash.amount} ${cash.currency} (cash)`] : []),
    ].join('; ');
    if (signup) {
      facts.push({
        slug: match[1],
        path: bonusPath,
        field: 'welcome offer',
        value: signup,
      });
    }
    if (minimum) {
      facts.push({
        slug: match[1],
        path: bonusPath,
        field: 'minimum redemption',
        value: minimum,
      });
    }
  }

  const statePath = 'src/routes/state-legality/index.astro';
  for (const partner of AFFILIATE_PARTNERS) {
    facts.push({
      slug: partner.slug,
      path: statePath,
      field: 'operator availability authority',
      value: 'AFFILIATE_PARTNERS + tracker status + site CTA policy',
    });
  }
  return facts.sort(
    (a, b) =>
      a.path.localeCompare(b.path) ||
      a.slug.localeCompare(b.slug) ||
      a.field.localeCompare(b.field),
  );
}

function distinctSources(sources: SourceValue[]): SourceValue[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.path}\0${source.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function inventoryOperatorFacts(root = process.cwd()): OperatorAudit {
  const reviews = reviewInventory(root);
  const homepage = homepageInventory(root);
  const comparison = comparisonInventory(root, homepage);
  const hubs = hubInventory(root);
  const conflicts: OperatorConflict[] = [];

  for (const review of reviews) {
    const home = homepage.find((card) => card.slug === review.slug);
    const canonicalOperator = OPERATORS.find((operator) => operator.slug === review.slug);
    const historicalHomepageScore = HISTORICAL_HOMEPAGE_SCORES[review.slug];
    const legacyReviewJsonLdScore = LEGACY_REVIEW_JSON_LD_SCORES[review.slug];
    const scoreSources = distinctSources([
      ...(home?.score == null
        ? []
        : [{ path: home.path, value: `${home.score}/5` }]),
      ...(review.visibleScore == null
        ? []
        : [{ path: review.path, value: `${review.visibleScore}/100 (${review.visibleScore / 20}/5)` }]),
      ...(review.schemaScore == null
        ? []
        : [{ path: `${review.path} JSON-LD Review.reviewRating`, value: `${review.schemaScore}/5` }]),
      ...(historicalHomepageScore == null
        ? []
        : [{ path: 'index.html', value: `${historicalHomepageScore}/5` }]),
      ...(legacyReviewJsonLdScore == null
        ? []
        : [{
            path: `${review.path}#review-jsonld`,
            value: `${legacyReviewJsonLdScore}/5`,
          }]),
    ]);
    const normalizedScores = new Set(
      scoreSources.map((source) => {
        const match = source.value.match(/(?:\(([\d.]+)\/5\)|^([\d.]+)\/5)/);
        return Number(match?.[1] ?? match?.[2]).toFixed(3);
      }),
    );
    if (normalizedScores.size > 1) {
      conflicts.push({
        slug: review.slug,
        field: 'editorial score',
        sources: scoreSources,
        status:
          canonicalOperator?.editorScore100.status === 'verified'
            ? 'RESOLVED'
            : 'UNRESOLVED',
      });
    }

    const canonicalBrand = BRAND_ENTITIES[review.slug];
    if (canonicalBrand?.operatorName && review.operatorName) {
      const operatorSources = distinctSources([
        { path: review.path, value: review.operatorName },
        {
          path: `src/data/brandEntities.ts#${review.slug}.operatorName`,
          value: canonicalBrand.operatorName,
        },
      ]);
      if (new Set(operatorSources.map((source) => source.value.toLowerCase())).size > 1) {
        conflicts.push({
          slug: review.slug,
          field: 'operator identity',
          sources: operatorSources,
          status: 'MANUAL_REVIEW',
        });
      }
    }

    const compared = comparison.find((entry) => entry.slug === review.slug);
    const hubOffer = hubs.find(
      (entry) => entry.slug === review.slug && entry.field === 'welcome offer',
    );
    const signupOffer = canonicalOperator?.signupOffer;
    if (
      signupOffer?.status === 'verified' &&
      signupOffer.provenance.some((provenance) => provenance.source.startsWith('http'))
    ) {
      const officialSources = signupOffer.provenance
        .filter((provenance) => provenance.source.startsWith('http'))
        .map((provenance) => ({
          path:
            provenance.source +
            (provenance.verifiedOn ? ` (captured ${provenance.verifiedOn})` : ''),
          value: signupOffer.value,
        }));
      const offerSources = distinctSources([
        {
          path: `src/data/operators.ts#${review.slug}.signupOffer`,
          value: signupOffer.value,
        },
        ...officialSources,
        ...(review.welcomeOffer
          ? [{ path: review.path, value: review.welcomeOffer }]
          : []),
        ...(compared?.offer
          ? [{ path: compared.path, value: compared.offer }]
          : []),
        ...(hubOffer ? [{ path: hubOffer.path, value: hubOffer.value }] : []),
      ]);
      conflicts.push({
        slug: review.slug,
        field: 'welcome offer',
        sources: offerSources,
        status: 'RESOLVED',
      });
    } else if (signupOffer?.status === 'unresolved') {
      const canonicalSources = signupOffer.sources.map(
        (source, index) => ({
          path:
            `src/data/operators.ts#${review.slug}.signupOffer.sources[${index}] ` +
            `(${source.provenance.source}` +
            (source.provenance.verifiedOn
              ? `; captured ${source.provenance.verifiedOn}`
              : '') +
            ')',
          value: source.value,
        }),
      );
      const servedReviewSources = signupOffer.sources
        .filter((source) => source.provenance.source.startsWith('reviews/'))
        .map((source) => ({
          path: source.provenance.source,
          value: source.value,
        }));
      const offerSources = distinctSources([
        ...canonicalSources,
        ...servedReviewSources,
        ...(compared?.offer
          ? [{ path: compared.path, value: compared.offer }]
          : []),
        ...(hubOffer ? [{ path: hubOffer.path, value: hubOffer.value }] : []),
      ]);
      conflicts.push({
        slug: review.slug,
        field: 'welcome offer',
        sources: offerSources,
        status: 'UNRESOLVED',
      });
    }
  }

  conflicts.sort(
    (a, b) => a.slug.localeCompare(b.slug) || a.field.localeCompare(b.field),
  );
  return { reviews, homepage, comparison, hubs, conflicts };
}

export function documentedTestingSlugs(root: string): Set<string> {
  try {
    const { rows, issues } = validateAllResults(root);
    const errors = new Set(
      issues.filter((issue) => issue.level === 'error').map((issue) => issue.slug),
    );
    return new Set(
      rows
        .filter((row) => row.could_test === 'Y' && !errors.has(row.brand_slug))
        .map((row) => row.brand_slug),
    );
  } catch {
    return new Set();
  }
}

function claimSourcePaths(root: string): string[] {
  const paths = [
    'about.html',
    'how-we-rate.html',
    'editorial-policy.html',
    'responsible-gaming.html',
    ...allFiles(root, 'reviews', new Set(['.html'])),
    ...allFiles(root, 'author', new Set(['.html'])),
    ...allFiles(root, 'src/content', new Set(['.mdx'])),
    ...allFiles(root, 'src/routes', new Set(['.astro'])),
  ];
  return [...new Set(paths)].filter((path) => existsSync(join(root, path))).sort();
}

export interface TestingClaimOccurrence extends UnsupportedTestingClaim {}

export function scanTestingClaims(root = process.cwd()): TestingClaimOccurrence[] {
  const documented = documentedTestingSlugs(root);
  const claims = claimSourcePaths(root).flatMap((path) => {
    const slug = path.match(/^reviews\/([a-z0-9-]+)\.html$/)?.[1];
    return findTestingClaims(read(root, path), path, Boolean(slug && documented.has(slug)));
  });
  return claims.sort(
    (a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.column - b.column,
  );
}

export interface AuthoredRoute {
  url: string;
  source: string;
  canonical: string;
  robots: string;
  sitemap: boolean;
}

export interface InternalLink {
  path: string;
  line: number;
  target: string;
  normalizedTarget: string;
  missing: boolean;
}

export interface RouteAudit {
  routes: AuthoredRoute[];
  links: InternalLink[];
  missingTargets: InternalLink[];
  orphanCandidates: AuthoredRoute[];
  prototypeNoindex: boolean;
}

function htmlUrl(path: string): string {
  if (path === 'index.html') return '/';
  return `/${path.replace(/\.html$/, '')}/`.replace(/\/+/g, '/');
}

function staticAstroUrl(path: string): string | null {
  const rel = path.replace(/^src\/routes\//, '').replace(/\.astro$/, '');
  if (rel.includes('[')) return null;
  if (rel === 'index') return '/';
  return `/${rel.replace(/\/index$/, '').replace(/\/?$/, '/')}`.replace(/\/+/g, '/');
}

function sourceRouteInventory(root: string): AuthoredRoute[] {
  const sitemap = new Set(
    [...read(root, 'sitemap.xml').matchAll(/<loc>https:\/\/sweepstakeswiz\.com([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    ),
  );
  const routes: AuthoredRoute[] = [];
  const htmlPaths = [
    ...readdirSync(root)
      .filter((file) => file.endsWith('.html'))
      .sort(),
    ...['reviews', 'legal', 'author', 'bonuses', 'prototypes'].flatMap((dir) =>
      allFiles(root, dir, new Set(['.html'])),
    ),
  ];
  for (const path of [...new Set(htmlPaths)].sort()) {
    const html = read(root, path);
    const url = htmlUrl(path);
    routes.push({
      url,
      source: path,
      canonical: canonical(html),
      robots: meta(html, 'robots') || 'unspecified',
      sitemap: sitemap.has(url),
    });
  }
  for (const path of allFiles(root, 'src/routes', new Set(['.astro']))) {
    const url = staticAstroUrl(path);
    if (!url) continue;
    const source = read(root, path);
    const canonicalPath = source.match(/canonicalPath\s*=\s*["']([^"']+)["']/)?.[1];
    const robots = source.match(/robots\s*=\s*["']([^"']+)["']/)?.[1] ?? 'layout default: index, follow';
    routes.push({
      url,
      source: path,
      canonical: canonicalPath ? `https://sweepstakeswiz.com${canonicalPath}` : 'computed by route/layout',
      robots,
      sitemap: sitemap.has(url),
    });
  }
  const contentRoutes: Array<[string, string, string]> = [
    ['src/content/guides', '/guides/', '.mdx'],
    ['src/content/comparisons', '/best/', '.mdx'],
    ['src/content/news', '/news/', '.mdx'],
  ];
  for (const [dir, prefix, extension] of contentRoutes) {
    for (const path of allFiles(root, dir, new Set([extension]))) {
      const body = read(root, path);
      if (/\bdraft:\s*true\b/.test(body.slice(0, 1000))) continue;
      const slug = path.split('/').pop()!.replace(/\.mdx$/, '');
      const url = `${prefix}${slug}/`;
      routes.push({
        url,
        source: path,
        canonical: `https://sweepstakeswiz.com${url}`,
        robots: 'layout default: index, follow',
        sitemap: sitemap.has(url),
      });
    }
  }
  return routes.sort((a, b) => a.url.localeCompare(b.url) || a.source.localeCompare(b.source));
}

function normalizeInternalTarget(target: string): string | null {
  if (/^(?:mailto:|tel:|javascript:|data:|#)/i.test(target)) return null;
  let url: URL;
  try {
    url = new URL(target, 'https://sweepstakeswiz.com/');
  } catch {
    return null;
  }
  if (url.origin !== 'https://sweepstakeswiz.com') return null;
  const path = url.pathname;
  if (
    ['/_external/', '/sweepstakeslogo/', '/partials/', '/images/', '/testing/'].some(
      (prefix) => path.startsWith(prefix),
    )
  ) {
    return null;
  }
  if (
    /\.(?:css|js|mjs|png|jpe?g|webp|svg|ico|xml|txt|json|csv|pdf|woff2?)$/i.test(path)
  ) {
    return null;
  }
  if (path === '/') return '/';
  return `${path.replace(/\/+$/, '')}/`;
}

function isKnownDynamicTarget(target: string): boolean {
  return (
    /^\/states\/[a-z0-9-]+\/$/.test(target) ||
    /^\/bonuses\/[a-z0-9-]+\/$/.test(target) ||
    /^\/sweepstakes-tracker\/api\/states\/[a-z]{2}\.json\/?$/.test(target)
  );
}

export function auditAuthoredRoutes(root = process.cwd()): RouteAudit {
  const routes = sourceRouteInventory(root);
  const routeUrls = new Set(routes.map((route) => route.url));
  const links: InternalLink[] = [];
  const files = [
    ...claimSourcePaths(root),
    ...allFiles(root, 'legal', new Set(['.html'])),
    ...allFiles(root, 'bonuses', new Set(['.html'])),
    'contact.html',
    'sitemap.html',
  ]
    .filter((path) => existsSync(join(root, path)))
    .filter((path, index, all) => all.indexOf(path) === index)
    .sort();
  for (const path of files) {
    const source = read(root, path);
    const lines = source.split('\n');
    lines.forEach((line, index) => {
      for (const match of line.matchAll(/\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/gi)) {
        const target = match[1] ?? match[2] ?? match[3] ?? '';
        if (target.includes('${')) continue;
        const normalizedTarget = normalizeInternalTarget(target);
        if (!normalizedTarget) continue;
        const missing = !routeUrls.has(normalizedTarget) && !isKnownDynamicTarget(normalizedTarget);
        links.push({ path, line: index + 1, target, normalizedTarget, missing });
      }
      for (const match of line.matchAll(/\[[^\]]+\]\((\/[^)\s]+)\)/g)) {
        const target = match[1];
        const normalizedTarget = normalizeInternalTarget(target);
        if (!normalizedTarget) continue;
        const missing = !routeUrls.has(normalizedTarget) && !isKnownDynamicTarget(normalizedTarget);
        links.push({ path, line: index + 1, target, normalizedTarget, missing });
      }
    });
  }
  links.sort(
    (a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.target.localeCompare(b.target),
  );
  const inbound = new Set(links.filter((link) => !link.missing).map((link) => link.normalizedTarget));
  const redirectOnlyUrls = new Set(
    routes
      .filter(
        (route) =>
          route.source.startsWith('src/routes/') &&
          /\breturn\s+Astro\.redirect\s*\(/.test(read(root, route.source)),
      )
      .map((route) => route.url),
  );
  const orphanCandidates = routes.filter(
    (route) =>
      route.url !== '/' &&
      !redirectOnlyUrls.has(route.url) &&
      !inbound.has(route.url) &&
      !route.url.startsWith('/bonuses/') &&
      !route.url.startsWith('/prototypes/'),
  );
  const prototypePath = join(root, 'prototypes/mcluck-firsthand-review-preview.html');
  const prototypeNoindex =
    existsSync(prototypePath) &&
    /\bnoindex\b/i.test(meta(readFileSync(prototypePath, 'utf8'), 'robots'));
  return {
    routes,
    links,
    missingTargets: links.filter((link) => link.missing),
    orphanCandidates,
    prototypeNoindex,
  };
}

export interface ReviewSchemaParity {
  slug: string;
  path: string;
  visibleScore?: number;
  sourceSchemaScore?: number;
  expectedSchemaScore?: number;
  parity: 'MATCH' | 'MISMATCH' | 'NO_VISIBLE_SCORE';
  usesExistingVisibleScoreHelper: true;
}

export interface SchemaAudit {
  reviews: ReviewSchemaParity[];
  mismatches: ReviewSchemaParity[];
}

export function auditSchemaParity(root = process.cwd()): SchemaAudit {
  const reviews = reviewInventory(root).map((review): ReviewSchemaParity => {
    const expectedSchemaScore =
      review.visibleScore == null ? undefined : review.visibleScore / 20;
    const parity =
      expectedSchemaScore == null
        ? 'NO_VISIBLE_SCORE'
        : review.schemaScore != null && Math.abs(review.schemaScore - expectedSchemaScore) < 0.001
          ? 'MATCH'
          : 'MISMATCH';
    return {
      slug: review.slug,
      path: review.path,
      ...(review.visibleScore == null ? {} : { visibleScore: review.visibleScore }),
      ...(review.schemaScore == null ? {} : { sourceSchemaScore: review.schemaScore }),
      ...(expectedSchemaScore == null ? {} : { expectedSchemaScore }),
      parity,
      usesExistingVisibleScoreHelper: true,
    };
  });
  return { reviews, mismatches: reviews.filter((review) => review.parity === 'MISMATCH') };
}

function md(value: unknown): string {
  return String(value ?? '—').replaceAll('|', '\\|').replace(/\s+/g, ' ').trim() || '—';
}

function reportHeader(title: string): string {
  return `# ${title}\n\nSource snapshot: repository authored sources. Generated deterministically without a runtime date.\n\n`;
}

function operatorReport(audit: OperatorAudit): string {
  const lines = [
    reportHeader('Operator Data Conflicts'),
    `Coverage: **${audit.reviews.length} authored reviews**, **${audit.homepage.length} homepage cards**, **${audit.comparison.length} comparison rows**, and **${audit.hubs.length} relevant hub facts**.\n\n`,
    'The audit reports canonical resolution status but never resolves a conflict itself. Values remain exactly as authored or captured from the cited official source.\n\n',
    '`src/data/operators.ts` records unresolved conflicts and verified canonical selections; canonical selectors omit unresolved values. Live `index.html` homepage /5 scores remain inventoried against canonical /100 review scores. Verified canonical values retain field-level provenance, while affiliate restrictions and schema identity remain in their separate data modules.\n\n',
    '| Operator | Field | Exact source values | Status |\n',
    '|---|---|---|---|\n',
    ...audit.conflicts.map(
      (conflict) =>
        `| ${md(conflict.slug)} | ${md(conflict.field)} | ${conflict.sources
          .map((source) => `\`${md(source.path)}\` = \`${md(source.value)}\``)
          .join('<br>')} | ${conflict.status} |\n`,
    ),
    '\n## Review inventory\n\n',
    audit.reviews.map((review) => `- \`${review.path}\` — ${md(review.title)}\n`).join(''),
    '\n## Homepage inventory\n\n',
    audit.homepage
      .map(
        (card) =>
          `- \`${card.slug}\` — \`${md(card.score == null ? 'no parsed score' : `${card.score}/5`)}\`; offer \`${md(card.offer)}\`\n`,
      )
      .join(''),
    '\n## Relevant hub inventory\n\n',
    audit.hubs
      .map(
        (fact) =>
          `- \`${fact.path}\` — \`${fact.slug}\` ${fact.field}: \`${md(fact.value)}\`\n`,
      )
      .join(''),
  ];
  return lines.join('');
}

function testingClaimsReport(
  root: string,
  claims: TestingClaimOccurrence[],
  redemptionIndexAsOf: string,
): string {
  const counts = new Map<string, number>();
  for (const claim of claims) counts.set(claim.classification, (counts.get(claim.classification) ?? 0) + 1);
  const testing = validateAllResults(root);
  const production = assessProductionRedemptionEvidence({
    testingRows: testing.rows,
    testingIssues: testing.issues,
    readerAggregates: READER_REPORT_AGGREGATES,
    asOf: redemptionIndexAsOf,
  });
  const indexAssessment = production.assessment;
  return [
    reportHeader('Testing Claims Audit'),
    `Evidence authority: \`evidence/testing-results.csv\` has **${production.testingRowsLoaded} data rows**, \`src/data/readerReports.generated.ts\` has **${production.readerAggregateOperatorsLoaded} aggregate operators**, and **${production.records.length} exact approved records** were adapted without pseudo-record expansion.\n\n`,
    `Redemption freshness date: ${redemptionIndexAsOf} is an explicit deterministic audit snapshot input, not a future publication default.\n\n`,
    `Redemption index publication state: **${indexAssessment.status === 'publishable' ? 'PUBLISHABLE' : 'NOT PUBLISHABLE'}** — ${
      indexAssessment.status === 'not-publishable' &&
      indexAssessment.reason === 'no-approved-records'
        ? 'no approved records'
        : indexAssessment.status
    }. No production result metric or route is generated.\n\n`,
    `Matched occurrences: **${claims.length}**. ` +
      ['DOCUMENTED_FIRST_HAND', 'THIRD_PARTY_OR_READER_DATA', 'UNSUPPORTED', 'AMBIGUOUS']
        .map((key) => `${key}: **${counts.get(key) ?? 0}**`)
        .join('; ') +
      '.\n\n',
    '| Source | Phrase | Surface | Classification | Evidence basis | Context |\n',
    '|---|---|---|---|---|---|\n',
    ...claims.map(
      (claim) =>
        `| \`${claim.path}:${claim.line}:${claim.column}\` | \`${md(claim.phrase)}\` | ${claim.surface} | ${claim.classification} | ${md(claim.evidenceBasis)} | ${md(claim.context)} |\n`,
    ),
  ].join('');
}

function schemaReport(audit: SchemaAudit): string {
  const canonicalScores = new Map(
    OPERATORS.map((operator) => [operator.slug, operator.editorScore100]),
  );
  const verifiedCount = [...canonicalScores.values()].filter(
    (fact) => fact.status === 'verified',
  ).length;
  return [
    reportHeader('Visible and Schema Parity Audit'),
    'Visible legacy scores are parsed with `visibleEditorialScore()` from `src/lib/pageChrome.ts`; schema ratings now use only verified `editorScore100` values from `src/data/operators.ts`.\n\n',
    `Coverage: **${audit.reviews.length} reviews**; source mismatches: **${audit.mismatches.length}**. Build-time consolidation emits **${verifiedCount}** verified canonical Review ratings and omits ratings for unresolved records; it never converts a five-star value.\n\n`,
    `Approved reader aggregate operators available to the rating gate: **${Object.keys(READER_REPORT_AGGREGATES).length}**. Answer blocks remain visible review content and are not added to FAQPage schema; all FAQPage nodes are rebuilt from visible FAQ questions and answers.\n\n`,
    '| Review | Visible score | Source JSON-LD score | Expected `/5` equivalent | Source parity |\n',
    '|---|---:|---:|---:|---|\n',
    ...audit.reviews.map(
      (review) =>
        `| \`${review.path}\` | ${md(review.visibleScore == null ? 'not detected' : `${review.visibleScore}/100`)} | ${md(review.sourceSchemaScore == null ? 'absent' : `${review.sourceSchemaScore}/5`)} | ${md(review.expectedSchemaScore == null ? 'n/a' : `${review.expectedSchemaScore}/5`)} | ${review.parity} |\n`,
    ),
  ].join('');
}

function technicalReport(
  routes: RouteAudit,
  claims: TestingClaimOccurrence[],
  reviewQa: ReviewQaResult,
): string {
  const unsupported = claims.filter((claim) => claim.classification === 'UNSUPPORTED');
  const legalPolicy = routes.routes
    .filter((route) => route.source.startsWith('legal/'))
    .map(
      (route) =>
        `- \`${route.source}\`: robots \`${route.robots}\`; sitemap ${route.sitemap ? 'included' : 'excluded'}; canonical \`${route.canonical || 'absent'}\`.\n`,
    )
    .join('');
  return [
    reportHeader('Technical SEO Audit'),
    '## CRITICAL\n\n',
    unsupported.length
      ? `- ${unsupported.length} unsupported matched testing claim(s) remain. See \`testing-claims-audit.md\`.\n`
      : '- No unsupported matched testing claims remain on audited publishable sources.\n',
    routes.prototypeNoindex
      ? '- `prototypes/mcluck-firsthand-review-preview.html` explicitly emits `noindex, nofollow`.\n'
      : '- Prototype noindex protection is missing.\n',
    '\n## HIGH IMPACT\n\n',
    `- ${reviewQa.sourceCount} review sources and ${reviewQa.renderCount} rendered reviews pass the dedicated review QA gate: ${reviewQa.uniqueTitleCount} unique titles, ${reviewQa.factSummaryCount} canonical summaries, ${reviewQa.answerBlockCount} evidence-gated answer blocks, and ${reviewQa.faqSchemaMismatchCount} FAQ/schema mismatches.\n`,
    `- Internal-link inventory found **${routes.missingTargets.length}** links whose targets are not represented by an authored exact or known dynamic route. These are documented, not redirected.\n`,
    `- The request-rendered review pipeline injects deterministic contextual navigation into **${OPERATORS.length} reviews**. Related-review tie-breaks use canonical editorial facts and slug order; affiliate CPA and tracking data are not inputs.\n`,
    '- Redirect-only routes are excluded from content-orphan findings; `/best/` remains a deliberate 301 to `/best/sweepstakes-casinos/`, not a content page.\n',
    '- `src/lib/htmlStamp.ts` replaces `__UPDATED_DATE__` with the build month and year. This is build freshness, not a substantive source date; retain for Phase 2/3 review rather than replacing it with another synthetic date.\n',
    '- Legal-page sitemap/noindex policy is internally mixed and requires a policy decision; no legal page was reindexed or removed here:\n',
    legalPolicy,
    '- Clean authored URL/canonical strategy remains unresolved: root `.html` sources are rendered at trailing-slash routes while canonical tags use the clean routes. No redirects or URL paths changed.\n',
    '\n## OPPORTUNISTIC\n\n',
    `- **${routes.orphanCandidates.length}** authored routes have no detected inbound source link and are candidates for manual review; dynamic and bonus endpoints are excluded from this count.\n`,
    '- Homepage and `/best/sweepstakes-casinos/` share a topic but now serve the original ranked toplist and a deeper evidence-based comparison respectively; see `cannibalisation-review.md`.\n',
    '\n## NOISE\n\n',
    '- `src/pages/` is generated and excluded from source findings. `index.html` is the served original homepage and is inventoried as the live root route.\n',
    '- Bonus source HTML is intentionally replaced by the SSR geo-aware gateway; its source-file presence alone is not treated as an indexation defect.\n',
  ].join('');
}

function cannibalisationReport(root: string): string {
  const homePath = 'index.html';
  const home = read(root, homePath);
  const reviewsPath = 'src/routes/reviews/index.astro';
  const reviews = read(root, reviewsPath);
  const comparison = read(root, 'src/content/comparisons/sweepstakes-casinos.mdx');
  const homeTitle = plain(home.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const reviewsTitle = reviews.match(/const title = '([^']+)'/)?.[1] ?? '';
  const comparisonTitle = comparison.match(/^title:\s*"([^"]+)"/m)?.[1] ?? '';
  return [
    reportHeader('Cannibalisation Review'),
    '| Surface | Exact title value | Distinct search intent | Status |\n',
    '|---|---|---|---|\n',
    `| \`/\` from \`${homePath}\` | \`${md(homeTitle)}\` | Original 28-operator ranked toplist of current welcome offers. | DISTINCT |\n`,
    `| \`/reviews/\` from \`${reviewsPath}\` | \`${md(reviewsTitle)}\` | Directory intent: find any of the 29 reviews alphabetically; no “best” ordering. | DISTINCT |\n`,
    `| \`/best/sweepstakes-casinos/\` from \`src/content/comparisons/sweepstakes-casinos.mdx\` | \`${md(comparisonTitle)}\` | Deeper comparison guidance and a 10-entry canonical evidence set without unsupported rank semantics. | DISTINCT |\n`,
    '\nFreshness-dependent superlative routes remain deferred. “Most free Sweeps Coins” overlaps `/bonuses/no-deposit/`, while a payout-speed route lacks normalized, freshly verified comparison data. No thin route or filter permutation was created.\n',
    '\nThe served original homepage is `index.html`. The generator wraps it with geo CTA suppression and no longer copies an authored `src/routes/index.astro` over that wrapper.\n',
  ].join('');
}

function commercialHubReport(audit: OperatorAudit): string {
  const candidates = evaluateCommercialHubCandidates();
  return [
    reportHeader('Commercial Hub Plan'),
    '## Current factual shape\n\n',
    `- Homepage: ${audit.homepage.length} ranked operator cards at \`/\` from \`index.html\`.\n`,
    `- Comparison: ${audit.comparison.length} operators to compare at \`/best/sweepstakes-casinos/\` from \`src/content/comparisons/sweepstakes-casinos.mdx\`.\n`,
    `- Relevant authored hubs: ${audit.hubs.length} operator facts across the new-casino, no-deposit, and state-legality routes.\n`,
    `- Affiliate authority: ${AFFILIATE_PARTNERS.length} partners in \`src/data/affiliates.ts\`; tracking and economics stay outside editorial facts.\n`,
    '- Geo authority: `src/data/geo.ts` remains the site-level CTA suppression layer.\n\n',
    '## Phase 2/3 plan\n\n',
    '1. Keep `/` as the original ranked arcade homepage with the 28-operator toplist.\n',
    '2. Keep `/reviews/` as the complete alphabetical directory without “best” ordering.\n',
    '3. Treat `/best/sweepstakes-casinos/` as deeper evidence-based comparison coverage without claiming an unsupported winner or rank order.\n',
    '4. Preserve affiliate tracking, per-partner availability, and site-level suppression as separate authorities.\n',
    '5. Resolve each `UNRESOLVED` or `MANUAL_REVIEW` row in `operator-data-conflicts.md` only against cited source evidence.\n\n',
    '## Candidate approval gates\n\n',
    'A candidate is created only when every gate passes. Current freshness-dependent candidates are explicitly deferred; no thin route or filter permutation is created.\n\n',
    '| Candidate | Gate | Status | Deterministic evidence |\n',
    '|---|---|---|---|\n',
    ...candidates.flatMap((candidate) =>
      candidate.gates.map(
        (gate) =>
          `| ${md(candidate.candidate)} | ${md(gate.name)} | ${gate.status} | ${md(gate.evidence)} |\n`,
      ),
    ),
    '\n## Decisions\n\n',
    ...candidates.map(
      (candidate) =>
        `- **${candidate.decision}: ${candidate.candidate}.** Unmet gates: ${candidate.unmetGates.map((gate) => md(gate).replace(/\.$/, '')).join('; ')}.\n`,
    ),
    '\nNo ranking, offer, legal status, redirect, or canonical winner is asserted here.\n',
  ].join('');
}

function internalLinkReport(routes: RouteAudit): string {
  const reviewContextSelections = OPERATORS.map((operator) =>
    selectReviewContextualLinks(operator.slug),
  );
  const injectedEdges = reviewContextSelections.reduce(
    (count, links) => count + links.length,
    0,
  );
  return [
    reportHeader('Internal Link Map'),
    `Inventory: **${routes.routes.length} authored routes**, **${routes.links.length} internal link occurrences**, **${routes.missingTargets.length} missing-target occurrences**, and **${routes.orphanCandidates.length} orphan candidates**.\n\n`,
    '## Target graph\n\n',
    `- Review rendering creates **${OPERATORS.length} review contextual blocks** with **${injectedEdges} deterministic destinations** before nearby-link de-duplication.\n`,
    '- Homepage → commercial hubs → reviews: the homepage links the review directory, detailed comparison, new-casino research, and no-purchase offer hub; each commercial hub links to reviews.\n',
    '- Review → hubs + related reviews + visitor context: canonical operator facts select hubs and similar/related alternatives. Unknown region points to `/state-legality/`; known region points to its `/states/<slug>/` page.\n',
    '- State → reviews + commercial hubs: every state template links `/reviews/`, `/best/sweepstakes-casinos/`, and alphabetically ordered eligible review destinations when available.\n',
    '- Guide/article → parent/topic hub + commercial destination: guide and news templates add concise contextual navigation.\n',
    '- Affiliate CPA, deal model, tracking URL, and source-array order are not ranking or tie-break inputs.\n\n',
    '## Missing targets\n\n',
    routes.missingTargets.length
      ? '| Source | Target | Normalized target |\n|---|---|---|\n' +
          routes.missingTargets
            .map(
              (link) =>
                `| \`${link.path}:${link.line}\` | \`${md(link.target)}\` | \`${md(link.normalizedTarget)}\` |\n`,
            )
            .join('')
      : 'None detected.\n',
    '\n## Orphan candidates\n\n',
    routes.orphanCandidates.length
      ? routes.orphanCandidates
          .map((route) => `- \`${route.url}\` from \`${route.source}\`\n`)
          .join('')
      : 'None detected.\n',
    '\n## Route signals\n\n',
    '| URL | Authored source | Robots | Canonical | Sitemap |\n',
    '|---|---|---|---|---|\n',
    ...routes.routes.map(
      (route) =>
        `| \`${route.url}\` | \`${route.source}\` | \`${md(route.robots)}\` | \`${md(route.canonical || 'absent')}\` | ${route.sitemap ? 'yes' : 'no'} |\n`,
    ),
  ].join('');
}

export function renderAuditReports(
  root: string,
  options: AuditSnapshotOptions,
): Map<string, string> {
  const operators = inventoryOperatorFacts(root);
  const claims = scanTestingClaims(root);
  const routes = auditAuthoredRoutes(root);
  const schema = auditSchemaParity(root);
  const reviewQa = runReviewQa(root);
  const availability = reconcileAvailabilityAuthorities({
    states: fallbackStates,
    partners: AFFILIATE_PARTNERS,
    trackerOperators: fallbackOperators,
    trackerAvailability: fallbackAvailability,
  });
  return new Map([
    ['operator-data-conflicts.md', operatorReport(operators)],
    [
      'testing-claims-audit.md',
      testingClaimsReport(root, claims, options.redemptionIndexAsOf),
    ],
    ['state-legality-conflicts.md', renderAvailabilityConflictReport(availability)],
    ['schema-audit.md', schemaReport(schema)],
    ['technical-audit.md', technicalReport(routes, claims, reviewQa)],
    ['cannibalisation-review.md', cannibalisationReport(root)],
    ['commercial-hub-plan.md', commercialHubReport(operators)],
    ['internal-link-map.md', internalLinkReport(routes)],
  ]);
}

export function findAuditReportDrift(
  root: string,
  reports: ReadonlyMap<string, string>,
): string[] {
  const drift: string[] = [];
  for (const [name, rendered] of reports) {
    const path = join(root, 'docs', 'seo', name);
    if (!existsSync(path)) {
      drift.push(`${name}: committed audit is missing`);
      continue;
    }
    if (readFileSync(path, 'utf8') !== rendered) {
      drift.push(`${name}: committed bytes differ from deterministic output`);
    }
  }
  return drift;
}

export interface LegalBriefCoverage {
  requiredCount: number;
  coveredCount: number;
  missingSubjects: string[];
}

function legalBriefHeading(subject: string, kind: string): string {
  if (kind === 'commercial / site policy') {
    const operator = subject
      .split('-')
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ');
    return `${operator} commercial/site policy intersection`;
  }
  return subject;
}

function escapedPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function legalBriefCoverage(root = process.cwd()): LegalBriefCoverage {
  const reportPath = join(root, 'docs', 'seo', 'state-legality-conflicts.md');
  const briefsPath = join(root, 'docs', 'seo', 'legal-review-briefs.md');
  if (!existsSync(briefsPath)) {
    throw new Error('Legal brief coverage failed: docs/seo/legal-review-briefs.md is missing.');
  }

  const report = readFileSync(reportPath, 'utf8');
  const briefs = readFileSync(briefsPath, 'utf8');
  const requiredHeadings = [...report.matchAll(
    /^\| ([^|]+?) \| (tracker \/ site policy|commercial \/ site policy) \|/gm,
  )].map((match) => legalBriefHeading(match[1].trim(), match[2].trim()));
  const missingSubjects = requiredHeadings.filter(
    (heading) =>
      !new RegExp(`^##\\s+${escapedPattern(heading)}\\s*$`, 'im').test(briefs),
  );
  if (missingSubjects.length > 0) {
    throw new Error(
      `Legal brief coverage failed for: ${missingSubjects.join(', ')}.`,
    );
  }
  return {
    requiredCount: requiredHeadings.length,
    coveredCount: requiredHeadings.length - missingSubjects.length,
    missingSubjects,
  };
}

export function auditSummary(root: string, options: AuditSnapshotOptions) {
  const operators = inventoryOperatorFacts(root);
  const claims = scanTestingClaims(root);
  const routes = auditAuthoredRoutes(root);
  const schema = auditSchemaParity(root);
  const reviewQa = runReviewQa(root);
  const testing = validateAllResults(root);
  const redemption = assessProductionRedemptionEvidence({
    testingRows: testing.rows,
    testingIssues: testing.issues,
    readerAggregates: READER_REPORT_AGGREGATES,
    asOf: options.redemptionIndexAsOf,
  });
  const availability = reconcileAvailabilityAuthorities({
    states: fallbackStates,
    partners: AFFILIATE_PARTNERS,
    trackerOperators: fallbackOperators,
    trackerAvailability: fallbackAvailability,
  });
  const legalBriefs = legalBriefCoverage(root);
  return {
    reviewCount: operators.reviews.length,
    homepageOperatorCount: operators.homepage.length,
    comparisonOperatorCount: operators.comparison.length,
    hubOperatorFactCount: operators.hubs.length,
    operatorConflictCount: operators.conflicts.length,
    testingClaimCount: claims.length,
    testingClaimClassifications: Object.fromEntries(
      ['DOCUMENTED_FIRST_HAND', 'THIRD_PARTY_OR_READER_DATA', 'UNSUPPORTED', 'AMBIGUOUS'].map(
        (classification) => [
          classification,
          claims.filter((claim) => claim.classification === classification).length,
        ],
      ),
    ),
    authoredRouteCount: routes.routes.length,
    internalLinkCount: routes.links.length,
    missingTargetCount: routes.missingTargets.length,
    orphanCandidateCount: routes.orphanCandidates.length,
    prototypeNoindex: routes.prototypeNoindex,
    schemaReviewCount: schema.reviews.length,
    schemaMismatchCount: schema.mismatches.length,
    reviewQaErrorCount: reviewQa.errors.length,
    reviewFactSummaryCount: reviewQa.factSummaryCount,
    reviewAnswerBlockCount: reviewQa.answerBlockCount,
    redemptionIndexStatus: redemption.assessment.status,
    redemptionTestingRowsLoaded: redemption.testingRowsLoaded,
    redemptionReaderAggregateOperatorsLoaded:
      redemption.readerAggregateOperatorsLoaded,
    redemptionRecordsAdapted: redemption.records.length,
    stateCount: availability.jurisdictionCount,
    affiliateCount: availability.partnerCount,
    stateAuthorityConflictCount: availability.warnings.filter((warning) =>
      ['tracker-policy-difference', 'impossible-commercial-intersection'].includes(
        warning.kind,
      ),
    ).length,
    legalBriefRequiredCount: legalBriefs.requiredCount,
    legalBriefCoveredCount: legalBriefs.coveredCount,
  };
}
