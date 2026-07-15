# McLuck Firsthand Review — Execution Plan

**Prepared:** July 14, 2026  
**Target page:** `https://sweepstakeswiz.com/reviews/mcluck/`  
**Working session:** `mcluck-2026-07-14`  
**Status:** Path C selected; synthetic workflow preflight passed; real tester and manual session pending  
**Publication owner:** Niro  
**Final editorial reviewer:** Ilija Milosevic  
**Tester of record:** To be resolved before account access

## 1. Outcome

Replace the current McLuck editorial-only treatment with a review that visibly and truthfully separates:

1. firsthand observations from a real eligible session;
2. current operator terms and claims;
3. independent editorial analysis; and
4. anything not tested.

The finished system must produce a publishable HTML review, redacted screenshot set, session timeline, value-free redaction audit, hash-linked evidence manifest, and validated Review schema—without account sharing, fabricated experience, automated casino interaction, or publication of personal data.

## 2. Non-negotiable boundaries

- The person using McLuck must be 21+, physically in an eligible U.S. state, using their own truthful details and their own account.
- No VPN, proxy, remote browser, location masking, account sharing, automated signup, automated play, or automated support interaction.
- Do not create a duplicate account for someone who already has one.
- Do not submit identity documents solely to create review evidence.
- Do not purchase Gold Coins or manufacture redemption eligibility solely for this review.
- Never publish an original screenshot. Every image must pass OCR, solid redaction, and human visual review.
- The byline must not imply that Ilija performed the session if another person did.
- Current official terms control. Static state lists in the repository or skill are not authoritative.

McLuck's current Terms are version 2.5, dated July 1, 2026. They require personal recreational participation, prohibit location masking and automated play, and limit access geographically: [official Terms of Service](https://www.mcluck.com/terms-of-service).

## 3. Access ladder — resolve this first

**Selected path: Path C — operator-authorized testing.** Paths A, B, and D remain documented as fallbacks but are not the active execution route.

### Path A — Ilija personally tests

Use when Ilija is 21+, physically in an eligible U.S. state, has no conflicting or duplicate account issue, and is willing to use his own identity.

**Attribution:** `Tested and written by Ilija Milosevic.`  
**Risk:** Lowest attribution risk and strongest firsthand signal.

### Path B — an existing genuine McLuck user contributes evidence

Use only when the contributor already uses McLuck independently and voluntarily provides evidence from their own account. Do not hire someone to open and play an account merely to simulate a customer session.

**Attribution:** `Tested by [named contributor]; reviewed and written by Ilija Milosevic.`  
**Required records:** contributor consent, evidence-use license, compensation disclosure if applicable, relationship to the author, session date/state, and confirmation that the session was their own genuine activity.

### Path C — obtain written operator authorization

Ask the McLuck affiliate/press/compliance contact for written permission for an evidence-based editorial test, including whether a test account or credits are allowed. If access or credits are supplied, disclose that prominently and do not describe the review as fully independent.

**Current state:** Niro confirms that written operator authorization was obtained from the outset. Before the session, store the original authorization email/PDF or a sanitized copy in the encrypted evidence workspace and record:

- authorizing person/department;
- authorization date;
- permitted tester/account;
- permitted location and platform;
- whether a test account, credits, purchases, KYC, support contact, or redemption are in scope;
- confidentiality or quotation restrictions;
- whether McLuck receives a factual-corrections review before publication;
- confirmation that SweepstakesWiz retains independent editorial control.

Suggested request:

> We are updating the McLuck review on SweepstakesWiz using a documented evidence protocol. We will not automate play, mask location, share accounts, or publish personal data. Can you confirm in writing whether an eligible U.S.-based reviewer may document a normal session for editorial purposes, and whether any provided test access or credits are permitted? We will disclose any access, credits, or commercial relationship in the review.

### Path D — remain editorial-only

If A, B, and C are unavailable, do not manufacture a firsthand test. Update the page using current official sources, retain the existing editorial disclosure, and label the evidence module `No firsthand account test completed`.

## 4. Roles and approvals

| Role | Owner | Responsibility | Approval required |
|---|---|---|---|
| Publication owner | Niro | Commercial relationship, final go/no-go, publication | Final publish |
| Tester of record | TBD | Manual session, screenshots, contemporaneous notes | Evidence accuracy |
| Final editorial reviewer | Ilija | Review the completed evidence-backed draft, approve interpretation and attribution, and provide final signoff | Editorial copy |
| Evidence processor | Codex/local tools | Inventory, OCR, redaction, metadata, hashes, manifest | Technical QA |
| Compliance reviewer | Codex + optional lawyer | Disclosure, state legality, offer language, responsible gaming | Compliance gate |
| Operator contact | McLuck affiliate/press/compliance | Written permission or factual corrections, if needed | Access path C only |

## 5. Tool stack

### Required local tools

| Need | Tool | State | Reason |
|---|---|---|---|
| Native capture | macOS screenshots / iOS or Android native capture | Available | Preserves original pixels; no cloud upload |
| OCR | Tesseract | **Missing** | Mandatory fail-closed OCR backend; official macOS install supports Homebrew |
| Redaction | Python + Pillow pipeline | Available | Solid irreversible boxes and value-free audit |
| Metadata | Existing extractor + ExifTool | Available | Timestamp/source inspection; EXIF is supporting evidence only |
| Hashes | SHA-256 via `shasum` | Available | Original/derivative chain of custody |
| Image QA/format | ImageMagick + `cwebp` | Available | Visual checks and optimized public derivatives after redaction |
| HTML build | Existing static repository | Available | No framework migration required |

Install Tesseract before any screenshots are processed:

```bash
brew install tesseract
tesseract --version
```

Official installation guidance: [Tesseract macOS installation](https://github.com/tesseract-ocr/tessdoc/blob/main/Installation.md).

### Evidence storage and transfer

**Default for one Mac:** an encrypted APFS disk image created with Disk Utility. Store `audit-originals` inside it; eject it whenever processing is not in progress. Apple documents encrypted disk images for confidential files: [Apple Disk Utility guidance](https://support.apple.com/en-ie/guide/disk-utility/dskutl11888/mac).

**If a remote contributor is used:** Proton Drive with end-to-end encrypted, password-protected, expiring folder sharing. Send the link and password through separate channels. Proton states that file contents and names are end-to-end encrypted and supports password protection, expiry, and revocation: [Proton Drive security](https://proton.me/drive/security), [password-protected sharing](https://proton.me/drive/file-sharing/password-protection).

Do not use ordinary email attachments, WhatsApp image mode, public Google Drive links, Slack uploads, or image-hosting tools for originals. These may alter metadata, compress images, widen access, or retain sensitive copies.

### Publication QA

| Check | Tool |
|---|---|
| HTML validity | [W3C Markup Validator](https://validator.w3.org/) |
| Structured data graph | [Schema.org Markup Validator](https://schema.org/docs/validator.html) |
| Accessibility | [axe-core](https://github.com/dequelabs/axe-core) + manual keyboard/contrast review |
| Performance/SEO | [Chrome Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) |
| Content quality | `review-quality-gate` skill |
| Affiliate/legal | `affiliate-compliance-igaming` skill + current primary-source verification |

axe-core typically catches only part of the accessibility surface, so a clean automated result does not replace manual review.

## 6. Phase-by-phase execution

### Phase 0 — harden the skill and data model

**Owner:** Codex  
**Time:** 2–4 hours  
**Goal:** prevent the tooling from conflating the tester and writer.

Update `firsthand-review-casino` to version 1.2 before the live session:

- require `tester_name`, `tester_role`, `testing_basis`, and `tester_relationship_to_author`;
- support `testing_basis` values: `author_self_test`, `existing_user_contribution`, `operator_authorized_test`, or `editorial_only`;
- require `operator_support_or_credits` and disclosure text when applicable;
- require a private evidence-rights/consent record for contributed sessions;
- distinguish `captured`, `not_applicable`, `not_performed`, and `missing` for each moment;
- prevent a 12/12 score when a moment is merely not applicable;
- classify each published claim as `firsthand`, `operator_claim`, `public_source`, or `editorial_inference`;
- verify tester attribution in the manifest and final HTML;
- add tests for writer/tester mismatch, contributed evidence, operator-provided access, and honest partial coverage.

**Exit gate:** all old and new tests pass; installed Claude/Codex copy matches the private AI Brain source.

### Phase 1 — resolve access and attribution

**Owner:** Niro  
**Time:** 15–30 minutes after the authorization artifact and tester details are available.

Record privately:

- tester's legal name;
- age confirmation (`21+`, never exact DOB in project files);
- physical state during the session;
- account status: new, existing, or previously closed;
- relationship to Ilija and SweepstakesWiz;
- whether the tester received payment, access, credits, or instructions from McLuck;
- chosen access path A, B, C, or D;
- exact public attribution and disclosure language.
- authorization artifact path, scope, and any operator-provided access or credits.

**Exit gate:** Path C authorization is preserved and its scope covers the planned session; the tester is named and eligible; the config moves to `phase-1-approved`.

### Phase 2 — secure workspace and rehearsal

**Owner:** Codex + tester  
**Time:** 45–75 minutes.

1. Install and verify Tesseract.
2. Create encrypted storage for originals.
3. Create a fresh session ID on the actual test date rather than reusing an old date.
4. Re-open official Terms, responsible-play controls, privacy policy, sweepstakes rules, and current offer terms.
5. Update the capture checklist for the exact platform and access path.
6. Create a harmless mock screenshot containing fake email/phone/name/card fragments.
7. Run the full redaction pipeline and visually confirm all fake PII is blacked out.
8. Verify that originals cannot be reached from the web root.
9. Rehearse filenames and notes without opening or interacting with the casino account.

**Exit gate:** OCR works, the mock redaction passes visual review, encrypted storage is mounted only for the session, and no original path is web-accessible.

### Phase 3 — perform the real manual session

**Owner:** tester of record  
**Time:** 60–120 minutes, plus optional redemption follow-up.

The tester manually follows the existing 12-moment checklist:

1. landing and offer;
2. signup form before sensitive fields are entered;
3. email verification state;
4. visible KYC requirement/status, never the identity document;
5. first authenticated view;
6. free claim or currency presentation;
7. lobby navigation;
8. one ordinary free/GC slot session;
9. table/live availability or proven unavailability;
10. redemption requirements or real request only if naturally eligible;
11. status only if a real request exists;
12. one neutral support question.

Also capture the current Terms version, player-safety controls, and complete visible offer terms.

For every moment, record:

- local time and timezone;
- filename;
- action taken;
- what happened;
- exact wording worth quoting or paraphrasing;
- observed friction or clarity;
- whether the claim is firsthand or merely displayed by the operator;
- whether follow-up is required.

**Exit gate:** files are saved unchanged to encrypted originals, notes contain no passwords/codes/payment data, and the tester signs off that the record is accurate.

### Phase 4 — redemption follow-up

**Owner:** tester of record  
**Time:** only if naturally eligible; potentially several business days.

- Never purchase or alter play merely to unlock this phase.
- Capture only genuine pending/approved/paid states.
- Record elapsed time from documented timestamps.
- Do not generalize one tester's outcome to every player.
- If no request was possible, publish `Redemption not performed` and describe only the displayed requirements.

**Exit gate:** actual status is documented or the review transparently states that redemption was not tested.

### Phase 5 — local evidence processing

**Owner:** Codex/local pipeline  
**Time:** 2–4 hours.

1. Inventory images against the 12 moments and supplemental captures.
2. Compute original SHA-256 hashes before modification.
3. Extract metadata and record timestamp source/uncertainty.
4. Run local Tesseract OCR and PII detection.
5. Generate solid-redacted PNG derivatives and a value-free audit.
6. Perform a 200% visual inspection of every derivative.
7. Manually add redaction boxes for anything OCR misses, then re-run hashes/audit.
8. Generate captions only from notes and visible evidence.
9. Generate timeline, manifest, schema draft, and review draft.
10. Create optimized WebP copies only after the approved redacted PNGs are frozen.
11. Verify hashes and moment coverage.

**Two-person privacy gate:** a human other than the automated detector should inspect every publishable image. The human sees redacted derivatives by default and opens an original only when necessary inside the encrypted workspace.

**Exit gate:** every screenshot has an audit entry; no PII is visible; manifest hashes match; incomplete moments are explicitly classified.

### Phase 6 — editorial integration

**Owner:** Codex for the evidence-backed draft; Ilija for final editorial review and signoff  
**Time:** 4–6 hours.

Update the existing review rather than publishing the standalone prototype as-is:

- place a clear affiliate/material-connection disclosure before the first commercial CTA;
- add `Tested by` and `Written by` separately when they differ;
- add `Last tested` and `Terms checked` dates;
- lead with current eligibility and material restrictions;
- replace unsupported claims with evidence-backed wording;
- label offer amounts as observed on a specific date;
- use four visual claim labels: Firsthand, Operator says, Public source, Not tested;
- add the evidence timeline using only redacted images;
- retain genuine negatives and gaps;
- update state availability from primary sources on publication day;
- include 21+, no-purchase-necessary, void-where-prohibited, responsible-play, and 1-800-GAMBLER language;
- use `rel="nofollow sponsored"` on compensated links;
- ensure schema describes the review but does not claim to prove the session.

**Exit gate:** Ilija approves prose and attribution; Niro approves the material-connection disclosure and commercial claims.

### Phase 7 — quality and compliance gates

**Owner:** Codex + Niro; optional lawyer for high-risk questions  
**Time:** 2–4 hours.

Run, in order:

1. local pipeline tests;
2. manifest and hash verification;
3. search for original filenames or original-directory paths in public output;
4. `review-quality-gate`;
5. `affiliate-compliance-igaming` using current primary sources;
6. JSON parsing and Schema.org validation;
7. W3C HTML validation;
8. axe-core and manual keyboard/contrast/alt-text review;
9. Lighthouse mobile and desktop passes;
10. manual mobile/desktop visual review;
11. link and CTA check from an allowed test context without creating another account;
12. final diff review.

**Blocking failures:** uncertain tester attribution, unverified state availability, visible PII, originals in public output, misleading bonus terms, unsupported firsthand language, missing affiliate disclosure, missing responsible-gaming notice, or schema/content mismatch.

### Phase 8 — staged publication

**Owner:** Niro  
**Time:** 30–60 minutes.

1. Publish to a non-indexed staging URL.
2. Repeat page-source, structured-data, responsive, and link checks.
3. Confirm analytics and affiliate parameters do not expose evidence IDs or personal data.
4. Back up the existing live page.
5. Publish the approved page.
6. Re-check the live response, canonical, robots, images, disclosures, and schema.
7. Submit the updated URL through the site's normal indexing workflow.

**Rollback:** restore the previous HTML immediately if PII, broken layout, invalid schema, or incorrect restrictions appear on the live page.

### Phase 9 — retention and monitoring

**Owner:** Niro  
**Time:** ongoing.

- Keep redacted assets, manifest, audit, final notes, and published HTML as the durable record.
- Keep originals encrypted for 180 days unless a dispute or documented business need requires longer retention.
- At 180 days, delete originals and retain their SHA-256 hashes plus the redacted evidence pack.
- Revoke remote share links immediately after verified receipt.
- Re-check McLuck Terms/state availability monthly and before every material page update.
- Re-test product experience every 6–12 months or after a major operator change.
- Add a visible `What changed` note for material updates.

## 7. Timeline

| Scenario | Expected duration |
|---|---:|
| Ilija is eligible and self-tests; no redemption follow-up | 2–3 working days |
| Existing genuine user contributes evidence | 3–5 working days |
| Written operator permission required | 1–3 weeks, depending on response |
| Genuine redemption follow-up included | Add the observed processing period |
| No compliant tester/access | 1 day for editorial-only refresh |

## 8. Budget

### Core path

- Tesseract, ExifTool, ImageMagick, WebP tools, W3C validator, Schema.org validator, axe-core, and Lighthouse: free/open source or already available.
- Encrypted APFS disk image: included with macOS.
- Existing repository and AI Brain pipeline: already available.

### Optional spend

- Proton Drive: optional for remote evidence transfer; select a plan based on storage and team needs at execution time.
- Independent legal review: quote-dependent; recommended before establishing a repeatable paid-contributor program or when state/affiliate liability is uncertain.
- Operator-authorized test access: accept only with written terms and disclose any supplied credits/access.

Do not establish a “casino play budget” for a tester. Spending should never be required to generate review evidence.

## 9. Risk register

| Risk | Likelihood | Impact | Control |
|---|---|---|---|
| Ineligible or remote tester | High until resolved | Critical | Access ladder; no VPN/account sharing |
| Paid tester conflicts with personal-use terms | Medium | High | Prefer author/existing user; obtain written permission |
| Writer claims another person's experience | Medium | High | Separate Tested by/Written by; manifest validation |
| OCR misses PII | Medium | Critical | Fail-closed OCR + 200% human review |
| Originals leak into repository/public build | Low–medium | Critical | Encrypted external directory + path scan + staging gate |
| State restrictions change | High | High | Primary-source check on test and publish dates; monthly monitor |
| Offer/bonus changes | High | Medium–high | Timestamp every offer claim; link complete terms |
| Redemption cannot be tested | High | Medium | Honest `not performed` state; no synthetic eligibility |
| Operator provides access/credits | Medium | Medium | Written terms + conspicuous disclosure |
| Schema overstates evidence | Medium | Medium | Content/schema parity check; no “proof” wording |

## 10. Definition of done

The McLuck project is complete only when:

- tester eligibility and testing basis are recorded;
- attribution truthfully distinguishes tester and writer;
- each of the 12 moments is `captured`, `not_applicable`, `not_performed`, or `missing` with a reason;
- every publishable screenshot is locally OCR-processed, solid-redacted, human-reviewed, and hash-linked;
- the review contains no claim unsupported by firsthand evidence or a cited current source;
- current state/age/offer terms are verified on publication day;
- affiliate and any operator-supplied relationship are disclosed near the first relevant claim/CTA;
- responsible-gaming and no-purchase-necessary language is present;
- HTML, accessibility, performance, schema, review-quality, and compliance gates pass;
- only redacted derivatives enter the public repository;
- staging and live rollback checks pass;
- retention and re-verification dates are scheduled.

## 11. Immediate next action

Resolve one fact before installing or changing anything else:

Path C is selected. Collect two inputs before the session:

1. **The written authorization artifact and its exact scope** — original email/PDF or a sanitized copy that still shows permission, date, scope, and authorizing party.
2. **The tester of record** — name, 21+ confirmation, physical U.S. state during testing, account type, and whether McLuck supplies access or credits.

After those are recorded, harden the skill to version 1.2, install Tesseract, run the privacy rehearsal, and schedule the manual session. Ilija reviews and signs off only after the evidence-backed draft is complete.
