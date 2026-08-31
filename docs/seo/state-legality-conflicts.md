# State, Legality, and CTA Authority Reconciliation

Source snapshot: repository authored sources. Generated deterministically without a runtime date.

This report does not infer legal status. Tracker posture, partner availability, and site CTA suppression remain separate authorities.

## Manual-review differences

| Subject | Exact authority values | Status | Note |
|---|---|---|---|
| CA | `src/lib/tracker/fallback.ts#CA` = `gray`<br>`src/data/geo.ts#SITE_BANNED_STATES` = `listed` | MANUAL_REVIEW | The tracker describes legal posture; geo.ts controls site-level CTA suppression. This audit does not infer that either authority should overwrite the other. |
| FL | `src/lib/tracker/fallback.ts#FL` = `pending_ban`<br>`src/data/geo.ts#SITE_BANNED_STATES` = `not listed` | MANUAL_REVIEW | The tracker describes legal posture; geo.ts controls site-level CTA suppression. This audit does not infer that either authority should overwrite the other. |
| IN | `src/lib/tracker/fallback.ts#IN` = `legal_unregulated`<br>`src/data/geo.ts#SITE_BANNED_STATES` = `listed` | MANUAL_REVIEW | The tracker describes legal posture; geo.ts controls site-level CTA suppression. This audit does not infer that either authority should overwrite the other. |
| ME | `src/lib/tracker/fallback.ts#ME` = `legal_unregulated`<br>`src/data/geo.ts#SITE_BANNED_STATES` = `listed` | MANUAL_REVIEW | The tracker describes legal posture; geo.ts controls site-level CTA suppression. This audit does not infer that either authority should overwrite the other. |
| MS | `src/lib/tracker/fallback.ts#MS` = `restricted`<br>`src/data/geo.ts#SITE_BANNED_STATES` = `not listed` | MANUAL_REVIEW | The tracker describes legal posture; geo.ts controls site-level CTA suppression. This audit does not infer that either authority should overwrite the other. |
| TN | `src/lib/tracker/fallback.ts#TN` = `legal_unregulated`<br>`src/data/geo.ts#SITE_BANNED_STATES` = `listed` | MANUAL_REVIEW | The tracker describes legal posture; geo.ts controls site-level CTA suppression. This audit does not infer that either authority should overwrite the other. |
| card-crush | `src/data/affiliates.ts#card-crush.availableOnlyInStates` = `CA, NY`<br>`src/data/geo.ts#SITE_BANNED_STATES` = `CA, NY` | MANUAL_REVIEW | Partner availability and site-wide CTA policy are intentionally separate; the combined CTA decision remains suppressive. |

## Tracker and site CTA inventory

| State | Tracker fallback status | Site CTA authority |
|---|---|---|
| AK | legal_unregulated | site CTA layer permits evaluation |
| AL | legal_unregulated | site CTA layer permits evaluation |
| AR | legal_unregulated | site CTA layer permits evaluation |
| AZ | legal_unregulated | site CTA layer permits evaluation |
| CA | gray | suppress all affiliate CTAs |
| CO | legal_unregulated | site CTA layer permits evaluation |
| CT | pending_ban | suppress all affiliate CTAs |
| DC | legal_unregulated | site CTA layer permits evaluation |
| DE | legal_unregulated | site CTA layer permits evaluation |
| FL | pending_ban | site CTA layer permits evaluation |
| GA | gray | site CTA layer permits evaluation |
| HI | legal_unregulated | site CTA layer permits evaluation |
| IA | legal_unregulated | site CTA layer permits evaluation |
| ID | banned | suppress all affiliate CTAs |
| IL | legal_unregulated | site CTA layer permits evaluation |
| IN | legal_unregulated | suppress all affiliate CTAs |
| KS | legal_unregulated | site CTA layer permits evaluation |
| KY | legal_unregulated | site CTA layer permits evaluation |
| LA | restricted | suppress all affiliate CTAs |
| MA | legal_unregulated | site CTA layer permits evaluation |
| MD | legal_unregulated | site CTA layer permits evaluation |
| ME | legal_unregulated | suppress all affiliate CTAs |
| MI | restricted | suppress all affiliate CTAs |
| MN | legal_unregulated | site CTA layer permits evaluation |
| MO | legal_unregulated | site CTA layer permits evaluation |
| MS | restricted | site CTA layer permits evaluation |
| MT | restricted | suppress all affiliate CTAs |
| NC | gray | site CTA layer permits evaluation |
| ND | legal_unregulated | site CTA layer permits evaluation |
| NE | legal_unregulated | site CTA layer permits evaluation |
| NH | legal_unregulated | site CTA layer permits evaluation |
| NJ | pending_ban | suppress all affiliate CTAs |
| NM | legal_unregulated | site CTA layer permits evaluation |
| NV | restricted | suppress all affiliate CTAs |
| NY | pending_ban | suppress all affiliate CTAs |
| OH | gray | site CTA layer permits evaluation |
| OK | legal_unregulated | site CTA layer permits evaluation |
| OR | legal_unregulated | site CTA layer permits evaluation |
| PA | gray | site CTA layer permits evaluation |
| RI | legal_unregulated | site CTA layer permits evaluation |
| SC | legal_unregulated | site CTA layer permits evaluation |
| SD | legal_unregulated | site CTA layer permits evaluation |
| TN | legal_unregulated | suppress all affiliate CTAs |
| TX | gray | site CTA layer permits evaluation |
| UT | legal_unregulated | site CTA layer permits evaluation |
| VA | legal_unregulated | site CTA layer permits evaluation |
| VT | legal_unregulated | site CTA layer permits evaluation |
| WA | banned | suppress all affiliate CTAs |
| WI | legal_unregulated | site CTA layer permits evaluation |
| WV | legal_unregulated | site CTA layer permits evaluation |
| WY | legal_unregulated | site CTA layer permits evaluation |

## Affiliate availability inventory

| Operator | Restricted states | Available only in |
|---|---|---|
| card-crush | none | CA, NY |
| casino-click | ID, KY, MI, MD, NV, WA, CA, CT, MT, NY | none |
| crown-coins | ID, MI, NV, WA, MT, LA, CT, NY, NJ, CA, IN | none |
| hello-millions | ID, KY, LA, MD, MI, MT, NV, NY, WA, WV, CA, TN, IN, DE, NJ, OH, CT | none |
| legendz | WA, NV, NE, MD, MI, ID, ND, KY, WV, CT, NY, LA, NJ, CA, TN, IL, IN | none |
| mcluck | ID, KY, MI, MT, NV, WA, LA, DE, NJ, NY, OH, MD, WV, CT, CA, TN, IN | none |
| playfame | ID, KY, MI, MT, NV, WA, LA, DE, NJ, NY, OH, MD, WV, CT, CA, TN, IN | none |
| pulsz | WA, ID, MI, MT, NV, AL, TN, CT, NY, LA, MS, WV, MD, AZ, CA, NJ, IN, ME | none |
| roxymoxy | CT, DE, ID, LA, MI, MT, NV, NJ, NY, PA, WA, WV, CA, AZ, KY, UT, MN, TN, MD, IN | none |
| spinblitz | ID, KY, MI, MT, NV, WA, LA, DE, NJ, NY, OH, MD, WV, CT, CA, TN, IN | none |
| spree | MT, AL, WA, ID, NV, KY, GA, LA, DE, WV, MI, MD, CT, NJ, NY, CA, TN, IL | none |
| thrillzz | AL, CT, GA, HI, ID, KY, LA, MI, MS, MT, NY, NV, OH, WA | none |
| zula | ID, MI, WA | none |
