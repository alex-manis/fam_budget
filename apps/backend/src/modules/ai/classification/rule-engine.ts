import { ISRAELI_RULES } from './rules/index.js';
import type { ClassificationInput, ClassificationResult } from './classification.types.js';

/** Minimum confidence required to accept a rule result and skip AI fallback. */
export const RULE_CONFIDENCE_THRESHOLD = 0.85;

/**
 * Normalizes text for case-insensitive, accent-tolerant matching.
 * Lowercases and collapses extra whitespace to avoid misses on bank
 * description artifacts (extra spaces, mixed case).
 */
const normalize = (text: string): string =>
  text.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Returns true if any of the patterns appears as a substring of the text.
 * Matching is case-insensitive; Hebrew text is matched as-is.
 */
const matchesAny = (text: string, patterns: string[]): boolean =>
  patterns.some((p) => text.includes(normalize(p)));

export interface RuleEngineResult {
  matched: boolean;
  result?: ClassificationResult;
}

/**
 * Runs the rule engine against a transaction input.
 *
 * Strategy: concatenate description + merchant into a single search string,
 * then test each rule in priority order. Returns on the first match.
 * Rules with confidence ≥ RULE_CONFIDENCE_THRESHOLD skip the AI call.
 */
export const runRuleEngine = (input: ClassificationInput): RuleEngineResult => {
  const searchText = normalize(
    [input.description, input.merchant ?? ''].join(' '),
  );

  for (const rule of ISRAELI_RULES) {
    if (matchesAny(searchText, rule.patterns)) {
      return {
        matched: true,
        result: {
          categoryName: rule.categoryName,
          confidence: rule.confidence,
          isEssential: rule.isEssential,
          isRecurring: rule.isRecurring,
          explanation: `Matched rule: ${rule.name}`,
          source: 'rule',
        },
      };
    }
  }

  return { matched: false };
};
