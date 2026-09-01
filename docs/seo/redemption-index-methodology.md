# Redemption Index Methodology

## Publication status

CI evaluates the current approved first-party testing rows and reader aggregate
inputs on every run. A non-publishable assessment exposes no public result
route, median, sample size, observation, or ranking. Aggregate-only reader data
is loaded but is not expanded into synthetic individual redemption records
because it cannot preserve an exact minimum and record-level provenance.

## Source eligibility and moderation

The model accepts approved records only. Eligible records may come from:

- completed first-party redemption tests with retained, privacy-redacted
  evidence; or
- moderated reader reports whose status is explicitly `approved`.

Pending, rejected, anonymous aggregate-only, seeded, demonstration, and
synthetic records are excluded. Synthetic fixtures exist only in automated
tests and never enter production data. Reader-report moderation rejects
duplicates, unverifiable submissions, promotional content, and records missing
the required redemption fields.

## Required record fields

Every included record must identify the operator, evidence source, approval
status, payout duration, redemption method, enforced redemption minimum and
currency, and a real verification date. Durations and minimums must be finite
and non-negative/positive respectively. Dates must be valid ISO calendar dates,
must not be in the future, and must be no more than 180 days old at evaluation.

Records are compared only within a coherent operator cohort sharing the same
normalized redemption method, minimum amount, and currency. This avoids
presenting unlike payout rails or redemption thresholds as one measurement.

## Calculation and publication thresholds

For each operator, the model selects the largest coherent eligible cohort;
ties use the normalized cohort key for deterministic selection. A cohort needs
at least **5 approved records**. Its median payout duration is the middle
duration after numeric sorting, or the mean of the two middle durations for an
even sample. Published values round to two decimal places.

The full index needs at least **3 publishable operators**. Operators sort by
median duration ascending, then canonical slug ascending. A result may publish
only when every row has:

- the minimum 5-record approved sample;
- a valid median;
- one named redemption method;
- one valid redemption minimum and currency; and
- a qualifying freshness date.

If any site-wide threshold fails, the method returns an explicit
`not-publishable` state. Non-publishable assessments do not expose result
medians, sample sizes, rankings, or observations.

## Update policy

The index must be recomputed from the full approved record set after moderation.
Evaluation uses an explicit as-of date so freshness checks are reproducible.
The date recorded in generated audit documentation is a deterministic audit snapshot input, not a future publication default.
Any future production evaluation must receive its own current as-of date
explicitly.
Records older than 180 days age out automatically. Methodology or threshold
changes require a versioned code change, synthetic threshold tests, review QA,
and full CI before any future publication decision.

## Limitations

Payout duration can vary with identity checks, weekends, operator review,
payment processor, account history, amount, location, and rule changes. Reader
reports are self-selected. A median describes only its approved, method- and
minimum-matched cohort; it does not guarantee an individual payout time or
establish legality, reliability, or overall operator quality.

## No-seeding rule

Production records must never be seeded with invented, promotional, copied,
pilot, or synthetic values to cross a threshold. Empty or insufficient evidence
must remain visibly non-publishable until genuine approved records satisfy every
gate.
