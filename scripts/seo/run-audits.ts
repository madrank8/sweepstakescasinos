/**
 * Deterministic, read-only SEO audit entrypoint.
 *
 * Default: validate required coverage and print a JSON summary.
 * `--report <name>`: print one committed-report representation to stdout.
 * The command never writes source files or reports.
 */
import {
  DETERMINISTIC_AUDIT_SNAPSHOT_AS_OF,
  auditSummary,
  findAuditReportDrift,
  renderAuditReports,
} from './audit-core';

const args = process.argv.slice(2);
const reportIndex = args.indexOf('--report');
const reportName = reportIndex >= 0 ? args[reportIndex + 1] : undefined;
const root = process.cwd();
const snapshot = {
  redemptionIndexAsOf: DETERMINISTIC_AUDIT_SNAPSHOT_AS_OF,
};

if (reportName) {
  const report = renderAuditReports(root, snapshot).get(reportName);
  if (!report) {
    console.error(`Unknown report: ${reportName}`);
    process.exit(2);
  }
  process.stdout.write(report);
  process.exit(0);
}

const summary = auditSummary(root, snapshot);
console.log(JSON.stringify(summary, null, 2));
const reportDrift = findAuditReportDrift(
  root,
  renderAuditReports(root, snapshot),
);

const unsupported =
  Number(summary.testingClaimClassifications.UNSUPPORTED ?? 0);
const failures = [
  summary.reviewCount !== 29
    ? `expected 29 reviews, found ${summary.reviewCount}`
    : '',
  summary.homepageOperatorCount < 1
    ? 'homepage operator inventory is empty'
    : '',
  summary.schemaReviewCount !== 29
    ? `expected schema coverage for 29 reviews, found ${summary.schemaReviewCount}`
    : '',
  summary.stateCount !== 51
    ? `expected 51 tracker jurisdictions, found ${summary.stateCount}`
    : '',
  summary.affiliateCount !== 13
    ? `expected 13 affiliate authorities, found ${summary.affiliateCount}`
    : '',
  !summary.prototypeNoindex
    ? 'prototype route is not protected by noindex'
    : '',
  unsupported > 0
    ? `${unsupported} unsupported first-hand/testing claims remain`
    : '',
  ...reportDrift,
].filter(Boolean);

if (failures.length > 0) {
  for (const failure of failures) console.error(`SEO audit failure: ${failure}`);
  process.exit(1);
}
