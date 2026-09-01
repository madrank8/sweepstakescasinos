import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AFFILIATE_PARTNERS } from '../src/data/affiliates';
import {
  BRAND_ENTITIES,
  type BrandEntity,
} from '../src/data/brandEntities';
import {
  CANONICAL_OPERATOR_FIELDS,
  OPERATORS,
  verifiedValue,
  type CanonicalFact,
  type OperatorRecord,
} from '../src/data/operators';
import { ALL_US_STATE_CODES } from '../src/data/usStates';
import { prepareSsrAffiliateReviewHtml } from '../src/lib/affiliateHtml';
import { getStaticReviewHtml } from '../src/lib/staticHtml.js';
import { inventoryOperatorFacts } from './seo/audit-core';
import { findRenderedEditorScoreContexts } from './lib/rendered-editor-score-detector';

const ISO_DATE = /^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/;
const SOURCE_PATH =
  /^(?:https?:\/\/\S+|[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*(?:#[a-zA-Z0-9_.-]+)?)$/;
const SUPERLATIVE = /\b(?:best|fastest|highest|largest|lowest|only|smallest|strongest|widest)\b/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  if (value.length < 10) return true;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function walkStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(walkStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(walkStrings);
  return [];
}

function validateProvenance(
  provenance: {
    source: string;
    publishedOn?: string;
    modifiedOn?: string;
    verifiedOn?: string;
  },
  label: string,
  errors: string[],
): void {
  if (!provenance.source || !SOURCE_PATH.test(provenance.source)) {
    errors.push(`${label}: malformed provenance source`);
  }
  for (const [kind, date] of [
    ['publishedOn', provenance.publishedOn],
    ['modifiedOn', provenance.modifiedOn],
    ['verifiedOn', provenance.verifiedOn],
  ] as const) {
    if (date !== undefined && !isRealDate(date)) {
      errors.push(`${label}: invalid ${kind} date "${date}"`);
    }
  }
  if (!provenance.publishedOn && !provenance.modifiedOn && !provenance.verifiedOn) {
    errors.push(`${label}: provenance requires a publication, modification, or verification date`);
  }
}

function validateFact(
  fact: CanonicalFact<unknown>,
  label: string,
  errors: string[],
): void {
  if (!fact || !['verified', 'unresolved', 'missing'].includes(fact.status)) {
    errors.push(`${label}: missing explicit status`);
    return;
  }
  if (fact.status === 'verified') {
    if (!Array.isArray(fact.provenance) || fact.provenance.length === 0) {
      errors.push(`${label}: verified value has no provenance`);
    } else {
      fact.provenance.forEach((source, index) =>
        validateProvenance(source, `${label}.provenance[${index}]`, errors),
      );
    }
  } else if (fact.status === 'unresolved') {
    if (!fact.reason || !Array.isArray(fact.sources) || fact.sources.length < 2) {
      errors.push(`${label}: unresolved value requires a reason and at least two sources`);
    } else {
      fact.sources.forEach((source, index) =>
        validateProvenance(source.provenance, `${label}.sources[${index}]`, errors),
      );
    }
  } else if (!fact.reason) {
    errors.push(`${label}: missing value requires a reason`);
  }
}

export function validateOperatorRecords(
  records: OperatorRecord[],
  brandEntities: Record<string, BrandEntity>,
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    if (!SLUG.test(record.slug)) errors.push(`${record.slug}: malformed review slug`);
    if (seen.has(record.slug)) errors.push(`${record.slug}: duplicate review slug`);
    seen.add(record.slug);
    for (const field of CANONICAL_OPERATOR_FIELDS) {
      validateFact(record[field], `${record.slug}.${field}`, errors);
    }

    const score = verifiedValue(record.editorScore100);
    if (score !== undefined && (!Number.isFinite(score) || score < 0 || score > 100)) {
      errors.push(`${record.slug}.editorScore100: score must be within 0–100`);
    }
    if (score !== undefined && score <= 5) {
      errors.push(`${record.slug}.editorScore100: possible five-star value mislabeled as /100`);
    }

    const launchDate = verifiedValue(record.launchDate);
    if (launchDate !== undefined && !isRealDate(launchDate)) {
      errors.push(`${record.slug}.launchDate: invalid date "${launchDate}"`);
    }
    const verifiedDate = verifiedValue(record.lastVerifiedDate);
    if (verifiedDate !== undefined && !isRealDate(verifiedDate)) {
      errors.push(`${record.slug}.lastVerifiedDate: invalid date "${verifiedDate}"`);
    }

    const ratings = verifiedValue(record.externalRatings) ?? [];
    for (const rating of ratings) {
      if (
        !rating.sourceName.trim() ||
        !Number.isFinite(rating.value) ||
        !Number.isFinite(rating.scale) ||
        rating.scale <= 0 ||
        rating.value < 0 ||
        rating.value > rating.scale
      ) {
        errors.push(`${record.slug}.externalRatings: malformed value or scale`);
      }
      try {
        const url = new URL(rating.sourceUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol');
      } catch {
        errors.push(`${record.slug}.externalRatings: malformed source URL`);
      }
      if (!isRealDate(rating.asOf)) {
        errors.push(`${record.slug}.externalRatings: invalid as-of date "${rating.asOf}"`);
      }
    }

    for (const field of CANONICAL_OPERATOR_FIELDS) {
      const value = verifiedValue(record[field]);
      if (value === undefined || ['name', 'operatorName'].includes(field)) continue;
      if (walkStrings(value).some((text) => SUPERLATIVE.test(text))) {
        errors.push(`${record.slug}.${field}: unsupported superlative`);
      }
    }

    const identity = brandEntities[record.slug];
    if (!identity) {
      errors.push(`${record.slug}: missing brand identity`);
      continue;
    }
    if (identity.slug !== record.slug) errors.push(`${record.slug}: brand identity slug drift`);
    if (identity.name !== verifiedValue(record.name)) {
      errors.push(`${record.slug}: brand name drifts from operator data`);
    }
    if (identity.operatorName !== verifiedValue(record.operatorName)) {
      errors.push(`${record.slug}: brand operator drifts from operator data`);
    }
    validateProvenance(identity.provenance, `${record.slug}.brand.provenance`, errors);
    try {
      const official = new URL(identity.officialUrl);
      if (!['http:', 'https:'].includes(official.protocol)) throw new Error('protocol');
    } catch {
      errors.push(`${record.slug}: malformed official brand URL`);
    }
    for (const sameAs of identity.sameAs ?? []) {
      try {
        new URL(sameAs);
      } catch {
        errors.push(`${record.slug}: malformed brand sameAs URL`);
      }
    }
  }

  const identitySlugs = Object.keys(brandEntities);
  if (new Set(identitySlugs).size !== identitySlugs.length) {
    errors.push('duplicate brand identity');
  }
  for (const slug of identitySlugs) {
    if (!seen.has(slug)) errors.push(`${slug}: brand identity has no operator record`);
  }
  return errors;
}

function sourceBrand(html: string, slug: string): Record<string, unknown> | undefined {
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(match[1]) as Record<string, unknown>;
    } catch {
      continue;
    }
    const graph = parsed['@graph'];
    if (!Array.isArray(graph)) continue;
    const id = `https://sweepstakeswiz.com/reviews/${slug}/#brand`;
    const node = graph.find(
      (candidate) =>
        candidate &&
        typeof candidate === 'object' &&
        (candidate as Record<string, unknown>)['@id'] === id,
    );
    if (node) return node as Record<string, unknown>;
  }
  return undefined;
}

export function validateOperatorConsistency(root = process.cwd()): string[] {
  const errors = validateOperatorRecords(OPERATORS, BRAND_ENTITIES);
  const reviewDir = resolve(root, 'reviews');
  const reviewSlugs = readdirSync(reviewDir)
    .filter((file) => file.endsWith('.html'))
    .map((file) => file.replace(/\.html$/, ''))
    .sort();
  const recordSlugs = OPERATORS.map((record) => record.slug).sort();
  if (reviewSlugs.length !== 29) errors.push(`review inventory: expected 29, found ${reviewSlugs.length}`);
  if (recordSlugs.join('|') !== reviewSlugs.join('|')) {
    errors.push('operator records do not exactly match authored review slugs');
  }

  for (const record of OPERATORS) {
    const path = resolve(reviewDir, `${record.slug}.html`);
    if (!existsSync(path)) continue;
    const html = readFileSync(path, 'utf8');
    const marker = new RegExp(
      `<!--sc-operator-facts\\s+data-operator="${record.slug}"\\s+data-fields="([^"]+)"\\s*-->`,
      'g',
    );
    const markers = [...html.matchAll(marker)];
    if (markers.length !== 1) {
      errors.push(`${record.slug}: expected exactly one declarative operator marker`);
      continue;
    }
    const fields = markers[0][1].split(',');
    if (fields.join('|') !== CANONICAL_OPERATOR_FIELDS.join('|')) {
      errors.push(`${record.slug}: marker field inventory drift`);
    }
    const rendered = /href=["']\/bonuses\//i.test(html)
      ? prepareSsrAffiliateReviewHtml(
          html,
          null,
          record.slug,
          `review-${record.slug}`,
        )
      : getStaticReviewHtml(`reviews/${record.slug}.html`, record.slug);
    for (const field of CANONICAL_OPERATOR_FIELDS) {
      if (!rendered.includes(`${field}:${record[field].status}`)) {
        errors.push(
          `${record.slug}.${field}: rendered canonical status does not match ${record[field].status}`,
        );
      }
      const selector = `data-canonical-field="${field}"`;
      if (record[field].status === 'verified' && !rendered.includes(selector)) {
        errors.push(`${record.slug}.${field}: verified value is absent from rendered summary`);
      }
      if (record[field].status !== 'verified' && rendered.includes(selector)) {
        errors.push(`${record.slug}.${field}: internal status leaked into rendered summary`);
      }
    }
    const renderedScoreContexts = findRenderedEditorScoreContexts(rendered);
    const expectedScore = verifiedValue(record.editorScore100);
    if (expectedScore === undefined && renderedScoreContexts.length > 0) {
      errors.push(
        `${record.slug}.editorScore100: unresolved score leaked in rendered ` +
          `${renderedScoreContexts.map((context) => context.kind).join(', ')} context(s)`,
      );
    }
    for (const context of expectedScore === undefined ? [] : renderedScoreContexts) {
      if (context.scale !== 100 || context.value !== expectedScore) {
        errors.push(
          `${record.slug}.editorScore100: rendered ${context.kind} ` +
            `${context.value}/${context.scale} drifts from ${expectedScore}/100`,
        );
      }
    }

    const authoredBrand = sourceBrand(html, record.slug);
    const canonicalBrand = BRAND_ENTITIES[record.slug];
    if (!authoredBrand) {
      errors.push(`${record.slug}: authored schema brand identity is missing`);
    } else {
      const parent = authoredBrand.parentOrganization as Record<string, unknown> | undefined;
      if (
        authoredBrand.name !== canonicalBrand.name ||
        authoredBrand.url !== canonicalBrand.officialUrl ||
        parent?.name !== canonicalBrand.operatorName
      ) {
        errors.push(`${record.slug}: canonical brand identity drifts from authored schema`);
      }
    }
  }

  const audited = inventoryOperatorFacts(root);
  for (const conflict of audited.conflicts) {
    const record = OPERATORS.find((candidate) => candidate.slug === conflict.slug);
    if (!record) continue;
    const field =
      conflict.field === 'editorial score'
        ? record.editorScore100
        : conflict.field === 'welcome offer'
          ? record.signupOffer
          : undefined;
    if (field?.status === 'verified') {
      errors.push(`${conflict.slug}.${conflict.field}: verified despite disagreeing audited surfaces`);
    }
  }

  const states = new Set<string>(ALL_US_STATE_CODES);
  for (const partner of AFFILIATE_PARTNERS) {
    for (const state of [
      ...partner.restrictedStates,
      ...(partner.availableOnlyInStates ?? []),
    ]) {
      if (!states.has(state)) errors.push(`${partner.slug}: malformed affiliate state code "${state}"`);
    }
  }

  return [...new Set(errors)].sort();
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const errors = validateOperatorConsistency();
  if (errors.length > 0) {
    console.error(`[verify-operator-consistency] ${errors.length} error(s):`);
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }
  console.log('[verify-operator-consistency] OK — 29 canonical operators validated.');
}
