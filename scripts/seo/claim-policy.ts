export type TestingClaimClassification =
  | 'DOCUMENTED_FIRST_HAND'
  | 'THIRD_PARTY_OR_READER_DATA'
  | 'UNSUPPORTED'
  | 'AMBIGUOUS';

export type ClaimSurface = 'title' | 'h1' | 'meta' | 'body';

export interface ClaimClassificationInput {
  phrase: string;
  context: string;
  surface: ClaimSurface;
  hasDocumentedEvidence: boolean;
}

export interface ClaimClassification {
  classification: TestingClaimClassification;
  evidenceBasis: string;
}

export interface UnsupportedTestingClaim extends ClaimClassification {
  path: string;
  line: number;
  column: number;
  phrase: string;
  surface: ClaimSurface;
  context: string;
}

/**
 * Phrase vocabulary comes from `.planning/AI-AUTHORSHIP-DISCLOSURE-SPEC.md`
 * section 3 and `.planning/TESTING-TEAM-BRIEF.md` sections 1 and 4b.
 *
 * The first-person forms are grammatical families, not a list of complete
 * sentences. This catches noun forms and new phrasings such as "our own
 * tests", "our test", "test 1", and "we ran support checks" without requiring
 * every authored sentence to be anticipated literally.
 */
const FIRST_PERSON_TEST_NOUN =
  String.raw`our(?:\s+own)?\s+(?:tests?|checks?|test\s+results?|measurements?|observations?)`;
const FIRST_PERSON_TEST_ACTION =
  String.raw`we\s+(?:ran|conducted|performed|completed|carried\s+out)\s+(?:(?:[\w-]+)\s+){0,4}(?:tests?|checks?|trials?|measurements?)`;
const FIRST_PERSON_EDITOR_ACTION =
  String.raw`our\s+editors?\s+(?:registered|created|opened)\s+(?:(?:[\w-]+)\s+){0,5}(?:accounts?|profiles?)(?:\s+and\s+requested\s+(?:a\s+)?redemption)?`;
const NUMBERED_TEST = String.raw`test\s*(?:#\s*)?\d+`;
const SPEC_TESTING_CLAIM =
  String.raw`everything tested and verified|full hands-on expert review|14-day hands-on test|our own funded test account|our test redemption|we created an account|played for 14 days|made two real redemptions|real redemptions tested|tests every site|re-tests? every|our editors register|we(?:'ve| have)? tested|our testers?|testers? confirmed|we confirmed|i signed up|we signed up|we found|our team verified|we verified|we redeemed|we cashed out|observed in our test|payouts tested|tested and verified|hands-on test(?:ed|ing)?|first-hand|hands-on|tested`;

export const TESTING_CLAIM_PATTERN = new RegExp(
  String.raw`\b(?:${FIRST_PERSON_EDITOR_ACTION}|${FIRST_PERSON_TEST_ACTION}|${FIRST_PERSON_TEST_NOUN}|${SPEC_TESTING_CLAIM}|${NUMBERED_TEST})\b`,
  'gi',
);

const EXPLICIT_NEGATION =
  /\b(?:no|not|never|without|fabricated|unsupported|unverified|cannot|could not|did not|do not|does not|don't|doesn't|isn't|is not)\b/i;
const LIMITATION_OR_POLICY_CONTEXT =
  /\b(?:unless|if|where|when|future|policy)\b/i;
const EXPLICIT_FIRST_PARTY = /\b(?:we|our|i)\b/i;
const FIRST_PERSON_TEST_CONTEXT =
  /\bour\b[^.!?]{0,100}\b(?:tests?|checks?|test\s+results?|measurements?|observations?)\b|\bwe\s+(?:ran|conducted|performed|completed|carried\s+out|tested|found)\b|\bour\s+editors?\s+(?:register(?:ed)?|created|opened|requested)\b/i;
const DIRECT_ATTRIBUTION =
  /\b(?:operator|provider|laboratory|reader|player|third[- ]party)\b[^.!?]{0,80}\b(?:reports?|reported|says?|said|states?|stated|writes?|wrote|claims?|claimed)\b/i;
const NAMED_SOURCE_ATTRIBUTION =
  /\b(?:trustpilot|deadspin(?:\.com)?|sweepskings|google play|app store|[a-z0-9-]+\.(?:com|org|net))\b[^!?]{0,160}$/i;
const INTRINSIC_EXTERNAL_TEST =
  /\b(?:rng[- ]tested|independently\s+(?:rng[- ])?tested|certified)\b[^.!?]{0,100}\b(?:games?|slots?|providers?|studios?|laborator(?:y|ies)|fairness)\b|\b(?:games?|slots?|providers?|studios?|laborator(?:y|ies))\b[^.!?]{0,100}\b(?:rng[- ]tested|independently\s+(?:rng[- ])?tested|certified)\b/i;
const READER_SUBMISSION_REQUEST =
  /\b(?:share|submit|tell us about)\b[^.!?]{0,100}\bfirst-hand\b[^.!?]{0,140}\b(?:reader|player|experience|report)\b/i;

function phraseOffset(context: string, phrase: string): number {
  return context.toLocaleLowerCase().indexOf(phrase.toLocaleLowerCase());
}

function occurrenceClause(context: string, phrase: string): string {
  const offset = phraseOffset(context, phrase);
  if (offset < 0) return context;
  const boundaryText = context.replace(
    /\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\b/gi,
    (domain) => domain.replaceAll('.', '·'),
  );
  const previousBoundary = Math.max(
    boundaryText.lastIndexOf('.', offset - 1),
    boundaryText.lastIndexOf('!', offset - 1),
    boundaryText.lastIndexOf('?', offset - 1),
  );
  const tail = boundaryText.slice(offset + phrase.length);
  const nextBoundaryOffset = tail.search(/[.!?]/);
  const nextBoundary =
    nextBoundaryOffset < 0
      ? context.length
      : offset + phrase.length + nextBoundaryOffset + 1;
  return context.slice(previousBoundary + 1, nextBoundary).trim();
}

function occursInQuestion(context: string, phrase: string): boolean {
  const offset = phraseOffset(context, phrase);
  if (offset < 0) return false;
  const nextBoundary = context.slice(offset + phrase.length).match(/[.!?]/)?.[0];
  return nextBoundary === '?';
}

export function classifyTestingClaim(input: ClaimClassificationInput): ClaimClassification {
  const context = input.context.replace(/\s+/g, ' ').trim();
  const clause = occurrenceClause(context, input.phrase);
  const offset = phraseOffset(clause, input.phrase);
  const beforePhrase = offset < 0 ? '' : clause.slice(0, offset);
  const explicitFirstParty =
    EXPLICIT_FIRST_PARTY.test(input.phrase) ||
    FIRST_PERSON_TEST_CONTEXT.test(clause);
  const directlyAttributedBefore =
    DIRECT_ATTRIBUTION.test(beforePhrase) ||
    NAMED_SOURCE_ATTRIBUTION.test(beforePhrase);
  const explicitlyNegated = EXPLICIT_NEGATION.test(clause);
  const limitationOrPolicy = LIMITATION_OR_POLICY_CONTEXT.test(clause);

  if (occursInQuestion(context, input.phrase)) {
    return {
      classification: 'AMBIGUOUS',
      evidenceBasis: 'The phrase appears in a question; the occurrence does not itself assert that first-hand testing happened.',
    };
  }

  if (explicitFirstParty) {
    if (explicitlyNegated) {
      return {
        classification: 'AMBIGUOUS',
        evidenceBasis: 'The match is explicitly negated rather than presented as a first-hand result.',
      };
    }
    if (!input.hasDocumentedEvidence) {
      return {
        classification: 'UNSUPPORTED',
        evidenceBasis: 'The clause explicitly attributes testing, checks, or results to this site, but no valid first-party testing row and evidence files exist.',
      };
    }
    return {
      classification: 'DOCUMENTED_FIRST_HAND',
      evidenceBasis: 'A valid could_test=Y row and its referenced evidence files exist for this review slug.',
    };
  }

  if (
    directlyAttributedBefore ||
    INTRINSIC_EXTERNAL_TEST.test(clause) ||
    READER_SUBMISSION_REQUEST.test(clause)
  ) {
    return {
      classification: 'THIRD_PARTY_OR_READER_DATA',
      evidenceBasis: 'A named external source or external testing subject is directly tied to the claim.',
    };
  }

  if (explicitlyNegated || limitationOrPolicy) {
    return {
      classification: 'AMBIGUOUS',
      evidenceBasis: 'The match occurs in a conditional, limitation, or explicit negation rather than a documented first-hand result.',
    };
  }

  if (input.hasDocumentedEvidence) {
    return {
      classification: 'DOCUMENTED_FIRST_HAND',
      evidenceBasis: 'A valid could_test=Y row and its referenced evidence files exist for this review slug.',
    };
  }

  return {
    classification: 'UNSUPPORTED',
    evidenceBasis: `No valid first-party testing row or evidence files exist; the phrase presents an unqualified first-hand implication${input.surface === 'body' && !EXPLICIT_FIRST_PARTY.test(input.phrase) ? ' in body copy' : ' on a prominent or explicit claim surface'}.`,
  };
}

function surfaceRanges(html: string): Array<{ start: number; end: number; surface: ClaimSurface }> {
  const ranges: Array<{ start: number; end: number; surface: ClaimSurface }> = [];
  const add = (pattern: RegExp, surface: ClaimSurface) => {
    for (const match of html.matchAll(pattern)) {
      if (match.index == null) continue;
      ranges.push({ start: match.index, end: match.index + match[0].length, surface });
    }
  };
  add(/<title\b[^>]*>[\s\S]*?<\/title>/gi, 'title');
  add(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, 'h1');
  add(/<meta\b[^>]*(?:name|property)=["'][^"']+["'][^>]*>/gi, 'meta');
  return ranges;
}

function surfaceAt(
  offset: number,
  ranges: Array<{ start: number; end: number; surface: ClaimSurface }>,
): ClaimSurface {
  return ranges.find((range) => offset >= range.start && offset < range.end)?.surface ?? 'body';
}

function lineAndColumn(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, offset);
  const line = before.split('\n').length;
  const lastBreak = before.lastIndexOf('\n');
  return { line, column: offset - lastBreak };
}

function contextAt(html: string, offset: number, length: number): string {
  const lineStart = html.lastIndexOf('\n', offset - 1) + 1;
  const nextBreak = html.indexOf('\n', offset + length);
  const lineEnd = nextBreak === -1 ? html.length : nextBreak;
  const windowStart = Math.max(lineStart, offset - 180);
  const windowEnd = Math.min(lineEnd, offset + length + 220);
  return html
    .slice(windowStart, windowEnd)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findTestingClaims(
  html: string,
  path: string,
  hasDocumentedEvidence: boolean,
): UnsupportedTestingClaim[] {
  const ranges = surfaceRanges(html);
  const matches: UnsupportedTestingClaim[] = [];
  TESTING_CLAIM_PATTERN.lastIndex = 0;
  for (const match of html.matchAll(TESTING_CLAIM_PATTERN)) {
    if (match.index == null) continue;
    const commentOpen = html.lastIndexOf('<!--', match.index);
    const commentClose = html.lastIndexOf('-->', match.index);
    if (commentOpen > commentClose) continue;
    const rawLineStart = html.lastIndexOf('\n', match.index - 1) + 1;
    const rawLineEnd = html.indexOf('\n', match.index);
    const rawLine = html.slice(rawLineStart, rawLineEnd === -1 ? html.length : rawLineEnd);
    if (/^\s*<!--.*-->\s*$/.test(rawLine)) continue;
    const sourceLine = contextAt(html, match.index, match[0].length);
    const surface = surfaceAt(match.index, ranges);
    const classified = classifyTestingClaim({
      phrase: match[0],
      context: sourceLine,
      surface,
      hasDocumentedEvidence,
    });
    matches.push({
      path,
      ...lineAndColumn(html, match.index),
      phrase: match[0],
      surface,
      context: sourceLine,
      ...classified,
    });
  }
  return matches;
}

export function findUnsupportedTestingClaims(
  html: string,
  path: string,
  hasDocumentedEvidence: boolean,
): UnsupportedTestingClaim[] {
  return findTestingClaims(html, path, hasDocumentedEvidence).filter(
    (claim) => claim.classification === 'UNSUPPORTED',
  );
}
