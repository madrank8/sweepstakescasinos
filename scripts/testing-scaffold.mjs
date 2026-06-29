/**
 * Scaffold evidence folders, per-brand checklists, and brands.json.
 * Run: npm run testing:scaffold
 */
import { mkdirSync, writeFileSync, existsSync, copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const EVIDENCE = join(ROOT, 'evidence');

const brands = JSON.parse(readFileSync(join(EVIDENCE, 'brands.json'), 'utf8'));

const PROTOCOL_STEPS = `
## Standard protocol (same steps, every brand)

1. **Register** — capture signup screen; record date/time, state, email verification.
2. **Claim welcome bonus** — note actual GC + SC credited; screenshot balance.
3. **First-purchase offer** (optional if budget allows) — real price + screenshot.
4. **Play a session** — confirm games load; lobby screenshots.
5. **Reach redemption threshold** — record minimum enforced in cashier.
6. **Request redemption** — screenshot request; note timestamp (clock start).
7. **Record KYC** — docs requested, submitted, approved; screenshot status (redact IDs).
8. **Time the payout** — screenshot confirmation; note timestamp (clock stop).
9. **Log one support interaction** — channel, first response time, resolved?
`;

function checklistMd(brand) {
  return `# ${brand.name} — Hands-On Test Checklist

**Slug:** \`${brand.slug}\`  
**Batch:** ${brand.batch}  
**Partner:** ${brand.isPartner ? 'Yes ★' : 'No'}  
**Overclaim priority:** ${brand.overclaimFlag ? 'Yes ⚠' : 'No'}

## Claim to verify or correct

${brand.claimsToVerify}

${PROTOCOL_STEPS}

## Capture log

| Step | Date/time | Screenshot file | Notes (actual result) |
|------|-----------|-----------------|------------------------|
| Account registration | | \`${brand.slug}-signup-YYYYMMDD.png\` | |
| Welcome bonus credited | | \`${brand.slug}-welcome-YYYYMMDD.png\` | |
| Store / first purchase | | \`${brand.slug}-store-YYYYMMDD.png\` | |
| Lobby / games | | \`${brand.slug}-lobby-YYYYMMDD.png\` | |
| KYC submission | | \`${brand.slug}-kyc-YYYYMMDD.png\` | |
| KYC approval | | \`${brand.slug}-kyc-approved-YYYYMMDD.png\` | |
| Redemption request | | \`${brand.slug}-redeem-request-YYYYMMDD.png\` | |
| Payout received | | \`${brand.slug}-payout-received-YYYYMMDD.png\` | |
| Support interaction | | \`${brand.slug}-support-YYYYMMDD.png\` | |

## Data row

Fill the matching row in \`evidence/testing-results.csv\`. See \`testing-results.template.csv\` for the header.

Full brief: \`.planning/TESTING-TEAM-BRIEF.md\`
`;
}

mkdirSync(EVIDENCE, { recursive: true });

let created = 0;
for (const brand of brands) {
  const dir = join(EVIDENCE, brand.slug);
  mkdirSync(dir, { recursive: true });
  const checklistPath = join(dir, 'CHECKLIST.md');
  if (!existsSync(checklistPath)) {
    writeFileSync(checklistPath, checklistMd(brand));
    created++;
  }
}

const templatePath = join(EVIDENCE, 'testing-results.template.csv');
const csvPath = join(EVIDENCE, 'testing-results.csv');
if (!existsSync(csvPath)) {
  copyFileSync(templatePath, csvPath);
}

console.log(`Scaffolded ${brands.length} brand folders (${created} new checklists).`);
console.log(`CSV template: evidence/testing-results.template.csv`);
console.log(`Fill results in: evidence/testing-results.csv`);
