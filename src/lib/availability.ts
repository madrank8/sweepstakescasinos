import {
  AFFILIATE_PARTNERS,
  type AffiliatePartner,
} from '../data/affiliates';
import {
  SITE_LEGAL_STATUS_VERIFIED_ON,
  SUPPRESS_WHEN_REGION_UNKNOWN,
  isPartnerAvailableInState,
  isStateBannedSitewide,
} from '../data/geo';
import {
  ALL_US_STATE_CODES,
  isUsStateCode,
  type UsStateCode,
} from '../data/usStates';
import {
  SWEEPS_STATUS_META,
  type OperatorAvailability,
  type StateRecord,
  type SweepsCasinoStatus,
} from './tracker/types';

const DAY_MS = 86_400_000;
export const TRACKER_FRESHNESS_DAYS = 30;

export type SiteCtaEligibility = {
  authority: 'site-policy';
  state: UsStateCode | null;
  status: 'eligible' | 'suppressed' | 'unknown-region';
  eligible: boolean;
  verifiedOn: string;
};

export type OperatorAffiliateAvailability = {
  authority: 'affiliate-commercial';
  operatorSlug: string;
  state: UsStateCode | null;
  status: 'available' | 'restricted' | 'unknown-region';
  available: boolean | null;
  rule: 'blocklist' | 'allowlist';
};

export type TrackerFreshness = {
  status: 'fresh' | 'stale' | 'missing';
  value: string | null;
  reviewedAt: string | null;
  updatedAt: string | null;
};

export type TrackerLegalDisplay = {
  authority: 'tracker-legal-display';
  state: UsStateCode;
  status: SweepsCasinoStatus;
  label: string;
  confidence: StateRecord['sweeps_status_confidence'];
  summary: string;
  freshness: TrackerFreshness;
};

export type AvailabilityWarningKind =
  | 'tracker-policy-difference'
  | 'commercial-site-policy-difference'
  | 'impossible-commercial-intersection'
  | 'cta-display-disagreement'
  | 'tracker-affiliate-difference'
  | 'missing-freshness'
  | 'stale-freshness';

export type AvailabilityErrorKind =
  | 'jurisdiction-coverage'
  | 'duplicate-state'
  | 'invalid-state-reference'
  | 'invalid-operator-reference'
  | 'conflicting-affiliate-rules';

export type AvailabilityDiagnostic = {
  kind: AvailabilityWarningKind | AvailabilityErrorKind;
  message: string;
  state?: string;
  operatorSlug?: string;
};

export type AvailabilityFacade = {
  state: UsStateCode | null;
  site: SiteCtaEligibility;
  affiliate: OperatorAffiliateAvailability | null;
  legal: TrackerLegalDisplay | null;
  cta: {
    eligible: boolean;
    reason:
      | 'allowed'
      | 'region-unknown'
      | 'site-policy-suppressed'
      | 'partner-restricted';
  };
  warnings: AvailabilityDiagnostic[];
};

export type ReconciliationResult = {
  jurisdictionCount: number;
  partnerCount: number;
  errors: AvailabilityDiagnostic[];
  warnings: AvailabilityDiagnostic[];
  states: Array<{
    code: UsStateCode;
    trackerStatus: SweepsCasinoStatus;
    siteStatus: SiteCtaEligibility['status'];
    availableCount: number;
  }>;
  partners: Array<{
    slug: string;
    restrictedStates: UsStateCode[];
    availableOnlyInStates: UsStateCode[];
    commerciallyAvailableStates: UsStateCode[];
    ctaEligibleStates: UsStateCode[];
  }>;
};

function validIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function latestIso(values: Array<string | null | undefined>): string | null {
  const valid = values.flatMap((value) => {
    const iso = validIso(value);
    return iso ? [iso] : [];
  });
  return valid.sort().at(-1) ?? null;
}

function trackerImpliesInfoOnly(status: SweepsCasinoStatus): boolean {
  return ['restricted', 'banned', 'pending_ban'].includes(status);
}

export function siteCtaEligibility(
  state: UsStateCode | null | undefined,
): SiteCtaEligibility {
  if (!state) {
    return {
      authority: 'site-policy',
      state: null,
      status: 'unknown-region',
      eligible: !SUPPRESS_WHEN_REGION_UNKNOWN,
      verifiedOn: SITE_LEGAL_STATUS_VERIFIED_ON,
    };
  }
  const suppressed = isStateBannedSitewide(state);
  return {
    authority: 'site-policy',
    state,
    status: suppressed ? 'suppressed' : 'eligible',
    eligible: !suppressed,
    verifiedOn: SITE_LEGAL_STATUS_VERIFIED_ON,
  };
}

export function operatorAffiliateAvailability(
  partner: AffiliatePartner,
  state: UsStateCode | null | undefined,
): OperatorAffiliateAvailability {
  const rule = partner.availableOnlyInStates ? 'allowlist' : 'blocklist';
  if (!state) {
    return {
      authority: 'affiliate-commercial',
      operatorSlug: partner.slug,
      state: null,
      status: 'unknown-region',
      available: null,
      rule,
    };
  }
  const available = isPartnerAvailableInState(partner, state);
  return {
    authority: 'affiliate-commercial',
    operatorSlug: partner.slug,
    state,
    status: available ? 'available' : 'restricted',
    available,
    rule,
  };
}

export function trackerLegalDisplay(
  state: StateRecord | null | undefined,
  asOf?: string,
): TrackerLegalDisplay | null {
  if (!state || !isUsStateCode(state.state_code)) return null;
  const reviewedAt = validIso(state.last_reviewed_at);
  const updatedAt = validIso(state.last_auto_updated_at);
  const value = reviewedAt ?? updatedAt;
  const reference = validIso(asOf) ?? latestIso([reviewedAt, updatedAt]);
  const stale =
    value !== null &&
    reference !== null &&
    (new Date(reference).getTime() - new Date(value).getTime()) / DAY_MS >
      TRACKER_FRESHNESS_DAYS;
  return {
    authority: 'tracker-legal-display',
    state: state.state_code,
    status: state.sweeps_casino_status,
    label: SWEEPS_STATUS_META[state.sweeps_casino_status].label,
    confidence: state.sweeps_status_confidence,
    summary: state.sweeps_status_summary,
    freshness: {
      status: value === null ? 'missing' : stale ? 'stale' : 'fresh',
      value,
      reviewedAt,
      updatedAt,
    },
  };
}

export function availabilityForPartner(
  partner: AffiliatePartner,
  state: UsStateCode | null | undefined,
  trackerState?: StateRecord,
  asOf?: string,
): AvailabilityFacade {
  const site = siteCtaEligibility(state);
  const affiliate = operatorAffiliateAvailability(partner, state);
  const legal = trackerLegalDisplay(trackerState, asOf);
  const warnings: AvailabilityDiagnostic[] = [];
  if (state && affiliate.available && !site.eligible) {
    warnings.push({
      kind: 'commercial-site-policy-difference',
      state,
      operatorSlug: partner.slug,
      message:
        `${partner.name} is commercially available in ${state}, while site policy suppresses its CTA.`,
    });
  }
  if (state && legal && trackerImpliesInfoOnly(legal.status) !== !site.eligible) {
    warnings.push({
      kind: 'tracker-policy-difference',
      state,
      message:
        `Tracker legal display is ${legal.status}; site CTA policy is ${site.status}. ` +
        'Neither authority overwrites the other.',
    });
  }

  if (!state) {
    return {
      state: null,
      site,
      affiliate,
      legal: null,
      cta: { eligible: false, reason: 'region-unknown' },
      warnings,
    };
  }
  if (!site.eligible) {
    return {
      state,
      site,
      affiliate,
      legal,
      cta: { eligible: false, reason: 'site-policy-suppressed' },
      warnings,
    };
  }
  if (!affiliate.available) {
    return {
      state,
      site,
      affiliate,
      legal,
      cta: { eligible: false, reason: 'partner-restricted' },
      warnings,
    };
  }
  return {
    state,
    site,
    affiliate,
    legal,
    cta: { eligible: true, reason: 'allowed' },
    warnings,
  };
}

export function availabilityForState(
  code: string | null | undefined,
  trackerState?: StateRecord,
  asOf?: string,
): AvailabilityFacade {
  const state = isUsStateCode(code) ? code : null;
  const site = siteCtaEligibility(state);
  const legal = trackerLegalDisplay(trackerState, asOf);
  const warnings: AvailabilityDiagnostic[] = [];
  if (state && legal && trackerImpliesInfoOnly(legal.status) !== !site.eligible) {
    warnings.push({
      kind: 'tracker-policy-difference',
      state,
      message:
        `Tracker legal display is ${legal.status}; site CTA policy is ${site.status}. ` +
        'Neither authority overwrites the other.',
    });
  }
  return {
    state,
    site,
    affiliate: null,
    legal,
    cta: {
      eligible: site.eligible,
      reason: !state
        ? 'region-unknown'
        : site.eligible
          ? 'allowed'
          : 'site-policy-suppressed',
    },
    warnings,
  };
}

function freshnessDiagnostics(
  label: string,
  reviewedAt: string | null | undefined,
  updatedAt: string | null | undefined,
  asOf: string | null,
  subject: Pick<AvailabilityDiagnostic, 'state' | 'operatorSlug'>,
): AvailabilityDiagnostic[] {
  const value = validIso(reviewedAt) ?? validIso(updatedAt);
  if (!value) {
    return [{
      kind: 'missing-freshness',
      ...subject,
      message: `${label} has no valid source freshness date.`,
    }];
  }
  if (
    asOf &&
    (new Date(asOf).getTime() - new Date(value).getTime()) / DAY_MS >
      TRACKER_FRESHNESS_DAYS
  ) {
    return [{
      kind: 'stale-freshness',
      ...subject,
      message: `${label} freshness ${value.slice(0, 10)} exceeds ${TRACKER_FRESHNESS_DAYS} days.`,
    }];
  }
  return [];
}

export function reconcileAvailabilityAuthorities(input: {
  states: StateRecord[];
  partners?: AffiliatePartner[];
  trackerOperators?: Array<{ operator_slug: string }>;
  trackerAvailability?: OperatorAvailability[];
  asOf?: string;
}): ReconciliationResult {
  const partners = input.partners ?? AFFILIATE_PARTNERS;
  const trackerOperators = input.trackerOperators ?? [];
  const trackerAvailability = input.trackerAvailability ?? [];
  const errors: AvailabilityDiagnostic[] = [];
  const warnings: AvailabilityDiagnostic[] = [];
  const stateRecords = new Map<UsStateCode, StateRecord>();
  const seenStates = new Set<string>();
  const asOf =
    validIso(input.asOf) ??
    latestIso(input.states.flatMap((state) => [
      state.last_reviewed_at,
      state.last_auto_updated_at,
    ]));

  for (const state of input.states) {
    if (!isUsStateCode(state.state_code)) {
      errors.push({
        kind: 'invalid-state-reference',
        state: state.state_code,
        message: `Tracker state reference "${state.state_code}" is not one of the 51 jurisdictions.`,
      });
    } else {
      if (seenStates.has(state.state_code)) {
        errors.push({
          kind: 'duplicate-state',
          state: state.state_code,
          message: `Tracker contains duplicate state ${state.state_code}.`,
        });
      }
      seenStates.add(state.state_code);
      stateRecords.set(state.state_code, state);
    }
    warnings.push(
      ...freshnessDiagnostics(
        `Tracker state ${state.state_code}`,
        state.last_reviewed_at,
        state.last_auto_updated_at,
        asOf,
        { state: state.state_code },
      ),
    );
  }
  const missingStates = ALL_US_STATE_CODES.filter((code) => !stateRecords.has(code));
  if (missingStates.length > 0 || stateRecords.size !== ALL_US_STATE_CODES.length) {
    errors.push({
      kind: 'jurisdiction-coverage',
      message:
        `Tracker must cover 51 unique jurisdictions; found ${stateRecords.size}. ` +
        `Missing: ${missingStates.join(', ') || 'none'}.`,
    });
  }

  const partnerRows: ReconciliationResult['partners'] = [];
  for (const partner of partners) {
    const restricted = partner.restrictedStates;
    const allowlist = partner.availableOnlyInStates ?? [];
    for (const state of [...restricted, ...allowlist]) {
      if (!isUsStateCode(state)) {
        errors.push({
          kind: 'invalid-state-reference',
          state,
          operatorSlug: partner.slug,
          message: `${partner.slug} references invalid affiliate state "${state}".`,
        });
      }
    }
    if (restricted.length > 0 && allowlist.length > 0) {
      errors.push({
        kind: 'conflicting-affiliate-rules',
        operatorSlug: partner.slug,
        message: `${partner.slug} defines both restricted states and an availability allowlist.`,
      });
    }
    const commerciallyAvailableStates = ALL_US_STATE_CODES.filter(
      (state) => operatorAffiliateAvailability(partner, state).available,
    );
    const ctaEligibleStates = commerciallyAvailableStates.filter(
      (state) => siteCtaEligibility(state).eligible,
    );
    if (commerciallyAvailableStates.length > 0 && ctaEligibleStates.length === 0) {
      warnings.push({
        kind: 'impossible-commercial-intersection',
        operatorSlug: partner.slug,
        message:
          `${partner.name} is commercially unavailable everywhere under current policy: ` +
          `its affiliate authority permits ${commerciallyAvailableStates.join(', ')}, ` +
          'and site CTA policy suppresses every one. This is not a legal conclusion.',
      });
    }
    partnerRows.push({
      slug: partner.slug,
      restrictedStates: restricted.filter(isUsStateCode),
      availableOnlyInStates: allowlist.filter(isUsStateCode),
      commerciallyAvailableStates,
      ctaEligibleStates,
    });
  }

  const stateRows = ALL_US_STATE_CODES.flatMap((code) => {
    const trackerState = stateRecords.get(code);
    if (!trackerState) return [];
    const view = availabilityForState(code, trackerState, asOf ?? undefined);
    warnings.push(...view.warnings);
    if (view.warnings.some((warning) => warning.kind === 'tracker-policy-difference')) {
      warnings.push({
        kind: 'cta-display-disagreement',
        state: code,
        message:
          `${code} CTA display follows ${view.site.status} site policy while the tracker displays ` +
          `${trackerState.sweeps_casino_status}; both labels must remain visible and distinct.`,
      });
    }
    const availableCount = partners.filter(
      (partner) => availabilityForPartner(partner, code, trackerState, asOf ?? undefined).cta.eligible,
    ).length;
    return [{
      code,
      trackerStatus: trackerState.sweeps_casino_status,
      siteStatus: view.site.status,
      availableCount,
    }];
  });

  const trackerOperatorSlugs = new Set(trackerOperators.map((operator) => operator.operator_slug));
  for (const availability of trackerAvailability) {
    if (!trackerOperatorSlugs.has(availability.operator_slug)) {
      errors.push({
        kind: 'invalid-operator-reference',
        operatorSlug: availability.operator_slug,
        message: `Tracker availability references missing operator "${availability.operator_slug}".`,
      });
    }
    if (!isUsStateCode(availability.state_code)) {
      errors.push({
        kind: 'invalid-state-reference',
        state: availability.state_code,
        operatorSlug: availability.operator_slug,
        message:
          `Tracker availability for ${availability.operator_slug} references invalid state ` +
          `"${availability.state_code}".`,
      });
    }
    warnings.push(
      ...freshnessDiagnostics(
        `Tracker availability ${availability.operator_slug}/${availability.state_code}`,
        availability.last_verified_at,
        undefined,
        asOf,
        {
          state: availability.state_code,
          operatorSlug: availability.operator_slug,
        },
      ),
    );
    const partner = partners.find((candidate) => candidate.slug === availability.operator_slug);
    if (partner && isUsStateCode(availability.state_code)) {
      const commercial = operatorAffiliateAvailability(partner, availability.state_code);
      const trackerAvailable = availability.status === 'available';
      if (commercial.available !== trackerAvailable) {
        warnings.push({
          kind: 'tracker-affiliate-difference',
          state: availability.state_code,
          operatorSlug: availability.operator_slug,
          message:
            `${availability.operator_slug}/${availability.state_code}: tracker operator status is ` +
            `${availability.status}; affiliate authority is ${commercial.status}.`,
        });
      }
    }
  }

  return {
    jurisdictionCount: stateRecords.size,
    partnerCount: partners.length,
    errors,
    warnings,
    states: stateRows,
    partners: partnerRows.sort((a, b) => a.slug.localeCompare(b.slug)),
  };
}

export function renderAvailabilityConflictReport(result: ReconciliationResult): string {
  const lines = [
    '# State, Legality, and CTA Authority Reconciliation',
    '',
    'Source snapshot: repository-authored tracker fallback, affiliate policy, and site CTA policy. Generated deterministically without a runtime date.',
    '',
    'This report does not infer legality. Tracker legal display, partner commercial availability, and site CTA policy remain three distinct authorities.',
    '',
    `Coverage: ${result.jurisdictionCount} jurisdictions; ${result.partnerCount} affiliate partners; ${result.errors.length} validation errors; ${result.warnings.length} reconciliation warnings.`,
    '',
    '## Reconciliation warnings',
    '',
    '| Subject | Kind | Exact authority values | Note |',
    '|---|---|---|---|',
  ];
  for (const warning of result.warnings.filter((item) =>
    ['tracker-policy-difference', 'impossible-commercial-intersection'].includes(item.kind)
  )) {
    if (warning.kind === 'tracker-policy-difference' && warning.state) {
      const state = result.states.find((candidate) => candidate.code === warning.state);
      lines.push(
        `| ${warning.state} | tracker / site policy | tracker = \`${state?.trackerStatus}\`<br>site CTA = \`${state?.siteStatus}\` | Neither authority overwrites the other. |`,
      );
    } else {
      const partner = result.partners.find(
        (candidate) => candidate.slug === warning.operatorSlug,
      );
      lines.push(
        `| ${warning.operatorSlug} | commercial / site policy | affiliate states = \`${partner?.commerciallyAvailableStates.join(', ') || 'none'}\`<br>CTA states = \`${partner?.ctaEligibleStates.join(', ') || 'none'}\` | ${warning.message} |`,
      );
    }
  }
  lines.push(
    '',
    '## Tracker and site CTA inventory',
    '',
    '| State | Tracker legal display | Site CTA policy | Eligible partners |',
    '|---|---|---|---:|',
  );
  for (const state of result.states) {
    lines.push(
      `| ${state.code} | ${state.trackerStatus} | ${state.siteStatus} | ${state.availableCount} |`,
    );
  }
  lines.push(
    '',
    '## Affiliate commercial inventory',
    '',
    '| Operator | Restricted states | Available only in | Commercial states | CTA states |',
    '|---|---|---|---:|---:|',
  );
  for (const partner of result.partners) {
    lines.push(
      `| ${partner.slug} | ${partner.restrictedStates.join(', ') || 'none'} | ` +
        `${partner.availableOnlyInStates.join(', ') || 'none'} | ` +
        `${partner.commerciallyAvailableStates.length} | ${partner.ctaEligibleStates.length} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}
