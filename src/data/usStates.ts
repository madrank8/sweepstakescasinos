/**
 * Canonical list of US state (+ DC) 2-letter codes used across the affiliate
 * data layer and geo-suppression logic. Keep this as the single source of truth
 * so availability matrices and middleware stay in sync.
 */

export const US_STATES = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
} as const;

export type UsStateCode = keyof typeof US_STATES;

export const ALL_US_STATE_CODES = Object.keys(US_STATES) as UsStateCode[];

/**
 * Verified against Wikidata's entity API on 2026-08-31. Keep this exhaustive:
 * state routes use these entities even when the live tracker has no Q-id.
 */
export const STATE_WIKIDATA_IDS = {
  AL: 'Q173',
  AK: 'Q797',
  AZ: 'Q816',
  AR: 'Q1612',
  CA: 'Q99',
  CO: 'Q1261',
  CT: 'Q779',
  DE: 'Q1393',
  DC: 'Q61',
  FL: 'Q812',
  GA: 'Q1428',
  HI: 'Q782',
  ID: 'Q1221',
  IL: 'Q1204',
  IN: 'Q1415',
  IA: 'Q1546',
  KS: 'Q1558',
  KY: 'Q1603',
  LA: 'Q1588',
  ME: 'Q724',
  MD: 'Q1391',
  MA: 'Q771',
  MI: 'Q1166',
  MN: 'Q1527',
  MS: 'Q1494',
  MO: 'Q1581',
  MT: 'Q1212',
  NE: 'Q1553',
  NV: 'Q1227',
  NH: 'Q759',
  NJ: 'Q1408',
  NM: 'Q1522',
  NY: 'Q1384',
  NC: 'Q1454',
  ND: 'Q1207',
  OH: 'Q1397',
  OK: 'Q1649',
  OR: 'Q824',
  PA: 'Q1400',
  RI: 'Q1387',
  SC: 'Q1456',
  SD: 'Q1211',
  TN: 'Q1509',
  TX: 'Q1439',
  UT: 'Q829',
  VT: 'Q16551',
  VA: 'Q1370',
  WA: 'Q1223',
  WV: 'Q1371',
  WI: 'Q1537',
  WY: 'Q1214',
} as const satisfies Record<UsStateCode, `Q${number}`>;

export function stateWikidataIri(code: UsStateCode): string {
  return `https://www.wikidata.org/entity/${STATE_WIKIDATA_IDS[code]}`;
}

export function isUsStateCode(value: string | null | undefined): value is UsStateCode {
  return value != null && Object.prototype.hasOwnProperty.call(US_STATES, value);
}

export function stateName(code: UsStateCode): string {
  return US_STATES[code];
}
