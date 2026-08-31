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
const NUMBERED_TEST = String.raw`test\s*(?:#\s*)?\d+`;
const SPEC_TESTING_CLAIM =
  String.raw`everything tested and verified|full hands-on expert review|14-day hands-on test|our own funded test account|our test redemption|we created an account|played for 14 days|made two real redemptions|real redemptions tested|tests every site|re-tests? every|our editors register|we(?:'ve| have)? tested|our testers?|testers? confirmed|we confirmed|i signed up|we signed up|we found|our team verified|we verified|we redeemed|we cashed out|observed in our test|payouts tested|tested and verified|hands-on test(?:ed|ing)?|first-hand|hands-on|tested`;

export const TESTING_CLAIM_PATTERN = new RegExp(
  String.raw`\b(?:${FIRST_PERSON_TEST_ACTION}|${FIRST_PERSON_TEST_NOUN}|${SPEC_TESTING_CLAIM}|${NUMBERED_TEST})\b`,
  'gi',
);

const THIRD_PARTY_CONTEXT =
  /\b(?:trustpilot|deadspin|sweepskings|editorial (?:review|source)|cross-verified|reader(?:s|'s)?|players?\s+(?:report|reported|say|describe)|player-reported|third-party|operator(?:'s)?|published|terms|policy|provider|studio|rng[- ]tested|independently tested|certified|laboratory|payment rails)\b/i;
const NEGATION_OR_POLICY_CONTEXT =
  /\b(?:no|not|never|without|unless|if|where|when|future|fabricated|unsupported|unverified|cannot|could not|did not|do not|does not|don't|doesn't|isn't|is not)\b/i;
const EXPLICIT_FIRST_PARTY = /\b(?:we|our|i)\b/i;
const FIRST_PERSON_TEST_CONTEXT =
  /\bour\b[^.!?]{0,100}\b(?:tests?|checks?|test\s+results?|measurements?|observations?)\b|\bwe\s+(?:ran|conducted|performed|completed|carried\s+out)\b/i;
const DIRECT_ATTRIBUTION =
  /\b(?:operator|provider|laboratory|reader|player|third[- ]party)\b[^.!?]{0,80}\b(?:reports?|reported|says?|said|states?|stated|writes?|wrote|claims?|claimed)\b/i;

function phraseOffset(context: string, phrase: string): number {
  return context.toLocaleLowerCase().indexOf(phrase.toLocaleLowerCase());
}

function occurrenceClause(context: string, phrase: string): string {
  const offset = phraseOffset(context, phrase);
  if (offset < 0) return context;
  const previousBoundary = Math.max(
    context.lastIndexOf('.', offset - 1),
    context.lastIndexOf('!', offset - 1),
    context.lastIndexOf('?', offset - 1),
  );
  const tail = context.slice(offset + phrase.length);
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

  if (occursInQuestion(context, input.phrase)) {
    return {
      classification: 'AMBIGUOUS',
      evidenceBasis: 'The phrase appears in a question; the occurrence does not itself assert that first-hand testing happened.',
    };
  }

  if (NEGATION_OR_POLICY_CONTEXT.test(clause)) {
    return {
      classification: 'AMBIGUOUS',
      evidenceBasis: 'The match occurs in a conditional, limitation, or explicit negation rather than a documented first-hand result.',
    };
  }

  if (explicitFirstParty && DIRECT_ATTRIBUTION.test(beforePhrase)) {
    return {
      classification: 'THIRD_PARTY_OR_READER_DATA',
      evidenceBasis: 'The first-person wording is directly attributed to an operator, provider, laboratory, third party, or reader in the same clause.',
    };
  }

  if (explicitFirstParty) {
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

  if (THIRD_PARTY_CONTEXT.test(clause) || THIRD_PARTY_CONTEXT.test(context)) {
    return {
      classification: 'THIRD_PARTY_OR_READER_DATA',
      evidenceBasis: 'The same source clause explicitly attributes the statement to published, operator, laboratory, third-party, or reader data.',
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
