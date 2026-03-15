import { runRuleEngine, RULE_CONFIDENCE_THRESHOLD } from './rule-engine.js';
import { classifyWithAI } from './ai-classifier.js';
import { isOpenAIConfigured } from '../../../infrastructure/openai/openai.client.js';
import {
  FALLBACK_RESULT,
  type ClassificationInput,
  type ClassificationResult,
} from './classification.types.js';

/**
 * Classifies a single transaction using the two-stage pipeline:
 *
 *  Stage 1 — Rule engine (synchronous, free, no latency)
 *    If confidence ≥ threshold → return immediately, skip AI.
 *
 *  Stage 2 — OpenAI fallback (async, costs tokens)
 *    Only runs when the rule engine found no match or matched below threshold.
 *    If OpenAI is not configured or the call fails → return rule result (if any)
 *    or the safe FALLBACK_RESULT.
 */
export const classifyTransaction = async (
  input: ClassificationInput,
): Promise<ClassificationResult> => {
  // Stage 1: Rule engine
  const { matched, result: ruleResult } = runRuleEngine(input);

  if (matched && ruleResult !== undefined && ruleResult.confidence >= RULE_CONFIDENCE_THRESHOLD) {
    return ruleResult;
  }

  // Stage 2: AI fallback
  if (!isOpenAIConfigured()) {
    // AI unavailable — use sub-threshold rule result or fallback
    return ruleResult ?? FALLBACK_RESULT;
  }

  try {
    return await classifyWithAI(input);
  } catch (err) {
    // Log but never throw — classification failure must not break imports
    console.error('[AI Classifier] OpenAI call failed:', err instanceof Error ? err.message : err);
    return ruleResult ?? FALLBACK_RESULT;
  }
};

/**
 * Classifies an array of inputs with a bounded concurrency limit.
 *
 * Concurrency is capped to avoid saturating the OpenAI rate limit when
 * importing large CSV files. Rule-matched transactions run synchronously
 * and do not count against the AI concurrency window.
 */
export const classifyBatch = async (
  inputs: ClassificationInput[],
  concurrency = 5,
): Promise<ClassificationResult[]> => {
  const results: ClassificationResult[] = new Array(inputs.length);

  // Separate fast (rule) and slow (AI) paths to process rules without waiting
  const aiQueue: Array<{ index: number; input: ClassificationInput }> = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (input === undefined) continue;

    const { matched, result: ruleResult } = runRuleEngine(input);
    if (matched && ruleResult !== undefined && ruleResult.confidence >= RULE_CONFIDENCE_THRESHOLD) {
      results[i] = ruleResult;
    } else {
      // Temporarily store sub-threshold rule result; AI may override it
      results[i] = ruleResult ?? FALLBACK_RESULT;
      aiQueue.push({ index: i, input });
    }
  }

  // Process AI queue in fixed-size windows
  for (let i = 0; i < aiQueue.length; i += concurrency) {
    const window = aiQueue.slice(i, i + concurrency);
    await Promise.all(
      window.map(async ({ index, input }) => {
        const result = await classifyTransaction(input);
        results[index] = result;
      }),
    );
  }

  return results;
};
