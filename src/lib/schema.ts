/**
 * Site-wide JSON-LD graph builder (docs/schema-markup-plan.md).
 *
 * One entity = one definition = @id refs everywhere else:
 *   - Publisher Organization  -> <origin>/#organization
 *   - WebSite                 -> <origin>/#website
 *   - Author Person           -> <origin>/author/<slug>/#person
 *   - Brand Organization      -> <origin>/reviews/<slug>/#brand
 *   - Per-page WebPage        -> <page-url>#webpage
 *   - Per-page BreadcrumbList -> <page-url>#breadcrumb
 *
 * `buildPageGraph()` emits ONE consolidated @graph per page (foundation +
 * content layer), auto-appends the full author Person / brand Organization
 * nodes when a content node references them (Google reads page-by-page, so
 * every referenced entity must be defined ON the page), and validates that
 * every internal @id reference resolves before the page ships.
 */
import { SITE } from '../data/site';
import { getBrandEntity, brandEntityId } from '../data/brandEntities';

const ORIGIN = SITE.origin;

export const ORG_ID = `${ORIGIN}/#organization`;
export const WEBSITE_ID = `${ORIGIN}/#website`;
export const LOGO_ID = `${ORIGIN}/#logo`;
export const AUTHOR_ID = `${ORIGIN}/author/${SITE.authorSlug}/#person`;

type Node = Record<string, unknown>;

/**
 * Publisher entity — the site-wide authority layer (plan §3.3).
 * Only true, verifiable values: no foundingDate / subjectOf / extra sameAs
 * until they exist (plan §6 open items 2-4).
 */
export function organizationNode(): Node {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    alternateName: SITE.altName,
    url: `${ORIGIN}/`,
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: `${ORIGIN}${SITE.logo}`,
      caption: SITE.name,
    },
    image: { '@id': LOGO_ID },
    description:
      'Independent review site comparing US sweepstakes (social) casinos, bonuses, and redemption policies.',
    founder: { '@id': AUTHOR_ID },
    areaServed: { '@type': 'Country', name: 'United States' },
    publishingPrinciples: `${ORIGIN}/editorial-policy/`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'editorial inquiries',
      email: 'contact@sweepstakeswiz.com',
      url: `${ORIGIN}/contact/`,
    },
    sameAs: ['https://www.youtube.com/@SweepstakesWiz'],
    // Mirrors the topical map's core + outer clusters (docs/topical-map.md).
    knowsAbout: [
      'Sweepstakes casinos',
      'Gold Coins and Sweeps Coins mechanics',
      'Sweeps Coins redemption',
      'US sweepstakes law by state',
      'Sweepstakes casino bonuses and promo codes',
      'Responsible gaming',
      'Social casino game providers',
    ],
  };
}

export function webSiteNode(): Node {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${ORIGIN}/`,
    name: SITE.name,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
  };
}

/**
 * The full author Person node. Must match the ProfilePage node on
 * /author/ilija-milosevic/ — same @id, same identity facts.
 */
export function authorPersonNode(): Node {
  return {
    '@type': 'Person',
    '@id': AUTHOR_ID,
    name: SITE.author,
    jobTitle: 'iGaming Writer & Analyst',
    description:
      'iGaming writer and analyst with 8+ years of experience creating search-driven content for gambling brands and affiliate websites, including casino, slot, and sportsbook reviews.',
    image: `${ORIGIN}/sweepstakeslogo/ilija-milosevic.webp`,
    url: `${ORIGIN}/author/${SITE.authorSlug}/`,
    sameAs: ['https://www.linkedin.com/in/ilija-milosevic-hiperion'],
    worksFor: { '@id': ORG_ID },
  };
}

/**
 * Canonical brand Organization node (identity facts only — never ratings or
 * offers). Same node, same @id on every page that mentions the brand.
 */
export function brandOrganizationNode(slug: string): Node | undefined {
  const brand = getBrandEntity(slug);
  if (!brand) return undefined;
  return {
    '@type': 'Organization',
    '@id': brandEntityId(slug),
    name: brand.name,
    url: brand.officialUrl,
    sameAs: [brand.officialUrl],
    ...(brand.operatorName
      ? {
          parentOrganization: {
            '@type': 'Organization',
            name: brand.operatorName,
            ...(brand.operatorAddress
              ? { address: { '@type': 'PostalAddress', ...brand.operatorAddress } }
              : {}),
          },
        }
      : {}),
  };
}

export interface DatasetNodeOptions {
  /** Absolute page URL that hosts the dataset (with trailing slash). */
  url: string;
  /** Stable fragment @id, e.g. `${url}#dataset`. */
  id: string;
  name: string;
  description: string;
  /** ISO 8601 last-modified (max of source freshness). */
  dateModified: string;
  datePublished?: string;
  keywords?: string[];
  variableMeasured?: string[];
  /** Absolute URLs for JSON / CSV distributions. */
  distributions?: Array<{ encodingFormat: string; contentUrl: string }>;
}

/**
 * Dataset node for the legality tracker (Google Dataset Search + AI-mode
 * surface). CC-BY-4.0, US spatial coverage, publisher = the site Organization.
 */
export function datasetNode(opts: DatasetNodeOptions): Node {
  return {
    '@type': 'Dataset',
    '@id': opts.id,
    name: opts.name,
    description: opts.description,
    url: opts.url,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    ...(opts.keywords ? { keywords: opts.keywords } : {}),
    ...(opts.variableMeasured ? { variableMeasured: opts.variableMeasured } : {}),
    spatialCoverage: {
      '@type': 'Place',
      geo: { '@type': 'GeoShape', addressCountry: 'US' },
    },
    temporalCoverage: '2020-01-01/..',
    dateModified: opts.dateModified,
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.distributions && opts.distributions.length > 0
      ? {
          distribution: opts.distributions.map((d) => ({
            '@type': 'DataDownload',
            encodingFormat: d.encodingFormat,
            contentUrl: d.contentUrl,
          })),
        }
      : {}),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbNode(pageUrl: string, crumbs: Crumb[]): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${ORIGIN}${c.path}`,
    })),
  };
}

export type WebPageType =
  | 'WebPage'
  | 'CollectionPage'
  | 'ItemPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'ProfilePage'
  | 'FAQPage';

export interface PageGraphOptions {
  /** Absolute canonical URL of the page (with trailing slash). */
  url: string;
  pageType?: WebPageType;
  title: string;
  description: string;
  breadcrumbs?: Crumb[];
  /** ISO 8601 dates (with timezone where known). */
  datePublished?: string;
  dateModified?: string;
  /** @id of the page's primary content entity (e.g. #article, #itemlist). */
  mainEntityId?: string;
  /** Content-layer nodes ('@context' is stripped if present). */
  nodes?: Node[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/;

function collectIds(value: unknown, defined: Set<string>, referenced: Set<string>): void {
  if (Array.isArray(value)) {
    for (const v of value) collectIds(v, defined, referenced);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  const obj = value as Node;
  const keys = Object.keys(obj);
  const id = obj['@id'];
  if (typeof id === 'string') {
    // A bare `{ "@id": ... }` (no other props) is a reference; otherwise a definition.
    if (keys.length === 1) referenced.add(id);
    else defined.add(id);
  }
  for (const k of keys) {
    if (k === '@id') continue;
    collectIds(obj[k], defined, referenced);
  }
}

/**
 * Assemble the consolidated per-page @graph: foundation (Organization +
 * WebSite + WebPage subtype + BreadcrumbList) + content nodes. Unresolved
 * references to the author or a brand entity are auto-satisfied by appending
 * the canonical node; any other dangling internal @id ref throws at build.
 */
export function buildPageGraph(opts: PageGraphOptions): Node {
  const {
    url,
    pageType = 'WebPage',
    title,
    description,
    breadcrumbs = [],
    datePublished,
    dateModified,
    mainEntityId,
    nodes = [],
  } = opts;

  for (const [label, d] of Object.entries({ datePublished, dateModified })) {
    if (d && !ISO_DATE.test(d)) {
      throw new Error(`[schema] ${label} for ${url} is not ISO 8601: ${d}`);
    }
  }

  const webPage: Node = {
    '@type': pageType,
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: 'en-US',
    ...(breadcrumbs.length > 0 ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(mainEntityId ? { mainEntity: { '@id': mainEntityId } } : {}),
  };

  const graph: Node[] = [organizationNode(), webSiteNode(), webPage];
  if (breadcrumbs.length > 0) graph.push(breadcrumbNode(url, breadcrumbs));

  for (const node of nodes) {
    const { ['@context']: _ctx, ...rest } = node;
    graph.push(rest);
  }

  // Resolve internal references: auto-append author / brand nodes, then verify.
  const defined = new Set<string>();
  const referenced = new Set<string>();
  collectIds(graph, defined, referenced);

  const brandRef = new RegExp(`^${ORIGIN}/reviews/([a-z0-9-]+)/#brand$`);
  for (const ref of referenced) {
    if (defined.has(ref)) continue;
    if (ref === AUTHOR_ID) {
      graph.push(authorPersonNode());
      defined.add(AUTHOR_ID);
      continue;
    }
    const m = ref.match(brandRef);
    if (m) {
      const brandNode = brandOrganizationNode(m[1]);
      if (brandNode) {
        graph.push(brandNode);
        defined.add(ref);
        continue;
      }
    }
    if (ref.startsWith(ORIGIN) && ref.includes('#')) {
      throw new Error(`[schema] Unresolved @id reference on ${url}: ${ref}`);
    }
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
