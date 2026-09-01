# State, Legality, and CTA Authority Reconciliation

Source snapshot: repository-authored tracker fallback, affiliate policy, and site CTA policy. Generated deterministically without a runtime date.

This report does not infer legality. Tracker legal display, partner commercial availability, and site CTA policy remain three distinct authorities.

Coverage: 51 jurisdictions; 13 affiliate partners; 0 validation errors; 13 reconciliation warnings.

## Reconciliation warnings

| Subject | Kind | Exact authority values | Note |
|---|---|---|---|
| card-crush | commercial / site policy | affiliate states = `CA, NY`<br>CTA states = `none` | Card Crush is commercially unavailable everywhere under current policy: its affiliate authority permits CA, NY, and site CTA policy suppresses every one. This is not a legal conclusion. |
| CA | tracker / site policy | tracker = `gray`<br>site CTA = `suppressed` | Neither authority overwrites the other. |
| FL | tracker / site policy | tracker = `pending_ban`<br>site CTA = `eligible` | Neither authority overwrites the other. |
| IN | tracker / site policy | tracker = `legal_unregulated`<br>site CTA = `suppressed` | Neither authority overwrites the other. |
| ME | tracker / site policy | tracker = `legal_unregulated`<br>site CTA = `suppressed` | Neither authority overwrites the other. |
| MS | tracker / site policy | tracker = `restricted`<br>site CTA = `eligible` | Neither authority overwrites the other. |
| TN | tracker / site policy | tracker = `legal_unregulated`<br>site CTA = `suppressed` | Neither authority overwrites the other. |

## Tracker and site CTA inventory

| State | Tracker legal display | Site CTA policy | Eligible partners |
|---|---|---|---:|
| AL | legal_unregulated | eligible | 9 |
| AK | legal_unregulated | eligible | 12 |
| AZ | legal_unregulated | eligible | 10 |
| AR | legal_unregulated | eligible | 12 |
| CA | gray | suppressed | 0 |
| CO | legal_unregulated | eligible | 12 |
| CT | pending_ban | suppressed | 0 |
| DE | legal_unregulated | eligible | 6 |
| DC | legal_unregulated | eligible | 12 |
| FL | pending_ban | eligible | 12 |
| GA | gray | eligible | 10 |
| HI | legal_unregulated | eligible | 11 |
| ID | banned | suppressed | 0 |
| IL | legal_unregulated | eligible | 10 |
| IN | legal_unregulated | suppressed | 0 |
| IA | legal_unregulated | eligible | 12 |
| KS | legal_unregulated | eligible | 12 |
| KY | legal_unregulated | eligible | 3 |
| LA | restricted | suppressed | 0 |
| ME | legal_unregulated | suppressed | 0 |
| MD | legal_unregulated | eligible | 3 |
| MA | legal_unregulated | eligible | 12 |
| MI | restricted | suppressed | 0 |
| MN | legal_unregulated | eligible | 11 |
| MS | restricted | eligible | 10 |
| MO | legal_unregulated | eligible | 12 |
| MT | restricted | suppressed | 0 |
| NE | legal_unregulated | eligible | 11 |
| NV | restricted | suppressed | 0 |
| NH | legal_unregulated | eligible | 12 |
| NJ | pending_ban | suppressed | 0 |
| NM | legal_unregulated | eligible | 12 |
| NY | pending_ban | suppressed | 0 |
| NC | gray | eligible | 12 |
| ND | legal_unregulated | eligible | 11 |
| OH | gray | eligible | 7 |
| OK | legal_unregulated | eligible | 12 |
| OR | legal_unregulated | eligible | 12 |
| PA | gray | eligible | 11 |
| RI | legal_unregulated | eligible | 12 |
| SC | legal_unregulated | eligible | 12 |
| SD | legal_unregulated | eligible | 12 |
| TN | legal_unregulated | suppressed | 0 |
| TX | gray | eligible | 12 |
| UT | legal_unregulated | eligible | 11 |
| VT | legal_unregulated | eligible | 12 |
| VA | legal_unregulated | eligible | 12 |
| WA | banned | suppressed | 0 |
| WV | legal_unregulated | eligible | 4 |
| WI | legal_unregulated | eligible | 12 |
| WY | legal_unregulated | eligible | 12 |

## Affiliate commercial inventory

| Operator | Restricted states | Available only in | Commercial states | CTA states |
|---|---|---|---:|---:|
| card-crush | none | CA, NY | 2 | 0 |
| casino-click | ID, KY, MI, MD, NV, WA, CA, CT, MT, NY | none | 41 | 36 |
| crown-coins | ID, MI, NV, WA, MT, LA, CT, NY, NJ, CA, IN | none | 40 | 38 |
| hello-millions | ID, KY, LA, MD, MI, MT, NV, NY, WA, WV, CA, TN, IN, DE, NJ, OH, CT | none | 34 | 33 |
| legendz | WA, NV, NE, MD, MI, ID, ND, KY, WV, CT, NY, LA, NJ, CA, TN, IL, IN | none | 34 | 32 |
| mcluck | ID, KY, MI, MT, NV, WA, LA, DE, NJ, NY, OH, MD, WV, CT, CA, TN, IN | none | 34 | 33 |
| playfame | ID, KY, MI, MT, NV, WA, LA, DE, NJ, NY, OH, MD, WV, CT, CA, TN, IN | none | 34 | 33 |
| pulsz | WA, ID, MI, MT, NV, AL, TN, CT, NY, LA, MS, WV, MD, AZ, CA, NJ, IN, ME | none | 33 | 33 |
| roxymoxy | CT, DE, ID, LA, MI, MT, NV, NJ, NY, PA, WA, WV, CA, AZ, KY, UT, MN, TN, MD, IN | none | 31 | 30 |
| spinblitz | ID, KY, MI, MT, NV, WA, LA, DE, NJ, NY, OH, MD, WV, CT, CA, TN, IN | none | 34 | 33 |
| spree | MT, AL, WA, ID, NV, KY, GA, LA, DE, WV, MI, MD, CT, NJ, NY, CA, TN, IL | none | 33 | 31 |
| thrillzz | AL, CT, GA, HI, ID, KY, LA, MI, MS, MT, NY, NV, OH, WA | none | 37 | 32 |
| zula | ID, MI, WA | none | 48 | 38 |
