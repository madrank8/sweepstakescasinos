/**
 * Curated enacted / key statutes referenced on news + state pages.
 * Facts only from our published news explainers and official bill URLs —
 * no invented Wikidata IDs or credentials.
 */
import type { LegislationLegalForce } from '../lib/schema';

export type KeyLegislation = {
  /** Stable fragment id for JSON-LD @id (lowercase, no spaces). */
  fragmentId: string;
  stateCode: string;
  billNumber: string;
  name: string;
  legislationDate?: string;
  legislationDateOfApplicability?: string;
  legalForce: LegislationLegalForce;
  url?: string;
  /** News explainer slug under /news/<slug>/ when one exists. */
  newsSlug?: string;
};

export const KEY_LEGISLATION: readonly KeyLegislation[] = [
  {
    fragmentId: 'ab831',
    stateCode: 'CA',
    billNumber: 'AB-831',
    name: 'California Assembly Bill 831 — dual-currency online sweepstakes prohibition',
    legislationDate: '2025-10-11',
    legislationDateOfApplicability: '2026-01-01',
    legalForce: 'InForce',
    url: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB831',
    newsSlug: 'california-ab831-sweepstakes-ban',
  },
  {
    fragmentId: 's5935a',
    stateCode: 'NY',
    billNumber: 'S5935A',
    name: 'New York Senate Bill 5935-A — dual-currency online sweepstakes ban',
    legislationDate: '2025-12-05',
    legislationDateOfApplicability: '2025-12-05',
    legalForce: 'InForce',
    url: 'https://www.nysenate.gov/legislation/bills/2025/S5935',
    newsSlug: 'new-york-s5935a-sweepstakes-ban',
  },
  {
    fragmentId: 'sb555',
    stateCode: 'MT',
    billNumber: 'SB 555',
    name: 'Montana Senate Bill 555 — illegal internet gambling expansion',
    legislationDate: '2025-05-16',
    legislationDateOfApplicability: '2025-10-01',
    legalForce: 'InForce',
    newsSlug: 'montana-sb555-sweepstakes-ban',
  },
  {
    fragmentId: 'sb1235',
    stateCode: 'CT',
    billNumber: 'SB 1235',
    name: 'Connecticut Senate Bill 1235 — unlicensed sweepstakes device ban',
    legislationDate: '2025-10-01',
    legislationDateOfApplicability: '2025-10-01',
    legalForce: 'InForce',
    newsSlug: 'connecticut-sb1235-sweepstakes-ban',
  },
  {
    fragmentId: 'a5447',
    stateCode: 'NJ',
    billNumber: 'A5447',
    name: 'New Jersey Assembly Bill 5447 — paid-entry sweepstakes as unlawful gambling',
    legislationDate: '2025-08-15',
    legislationDateOfApplicability: '2025-08-15',
    legalForce: 'InForce',
    newsSlug: 'new-jersey-a5447-sweepstakes-ban',
  },
];

export function keyLegislationForState(stateCode: string): KeyLegislation[] {
  const code = stateCode.toUpperCase();
  return KEY_LEGISLATION.filter((b) => b.stateCode === code);
}

export function keyLegislationForNewsSlug(slug: string): KeyLegislation | undefined {
  return KEY_LEGISLATION.find((b) => b.newsSlug === slug);
}
