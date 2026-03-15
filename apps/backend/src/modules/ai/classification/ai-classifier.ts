import { getOpenAIClient } from '../../../infrastructure/openai/openai.client.js';
import { buildClassificationPrompt } from '../prompt/classification.prompt.js';
import {
  SYSTEM_CATEGORIES,
  type ClassificationInput,
  type ClassificationResult,
  type SystemCategoryName,
} from './classification.types.js';

/** Shape we expect from the OpenAI JSON response. */
interface RawAIResponse {
  categoryName?: unknown;
  confidence?: unknown;
  isEssential?: unknown;
  isRecurring?: unknown;
  explanation?: unknown;
}

const isValidCategory = (value: unknown): value is SystemCategoryName =>
  typeof value === 'string' && (SYSTEM_CATEGORIES as readonly string[]).includes(value);

const clampConfidence = (value: unknown): number => {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(n) ? 0.7 : Math.min(1, Math.max(0, n));
};

/**
 * Calls the OpenAI chat completions API and parses the JSON response.
 *
 * Uses `gpt-4o-mini` for cost-efficiency — classification is a simple
 * structured task that does not require a large model.
 *
 * `temperature: 0.1` keeps the output deterministic for the same input.
 * `max_tokens: 200` is sufficient for the fixed JSON schema we expect.
 */
export const classifyWithAI = async (
  input: ClassificationInput,
): Promise<ClassificationResult> => {
  const client = getOpenAIClient();
  const { systemPrompt, userPrompt } = buildClassificationPrompt(input);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const raw = JSON.parse(content) as RawAIResponse;

  return {
    categoryName: isValidCategory(raw.categoryName) ? raw.categoryName : 'Other',
    confidence: clampConfidence(raw.confidence),
    isEssential: raw.isEssential === true,
    isRecurring: raw.isRecurring === true,
    explanation:
      typeof raw.explanation === 'string' && raw.explanation.length > 0
        ? raw.explanation
        : 'Classified by AI',
    source: 'ai',
  };
};
