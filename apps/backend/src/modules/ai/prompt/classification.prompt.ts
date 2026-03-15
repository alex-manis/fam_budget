import { SYSTEM_CATEGORIES, type ClassificationInput } from '../classification/classification.types.js';

interface ClassificationPrompt {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Builds the prompt pair for transaction classification.
 *
 * System prompt is kept stable so OpenAI can cache it.
 * User prompt contains the transaction-specific data only.
 */
export const buildClassificationPrompt = (input: ClassificationInput): ClassificationPrompt => {
  const categories = SYSTEM_CATEGORIES.join(', ');

  const systemPrompt = `You are a financial transaction classifier for an Israeli family budget application.

Classify each transaction into exactly one of these categories:
${categories}

Context you must apply:
- Currency is Israeli Shekel (ILS / ₪)
- Descriptions arrive from Israeli bank statements — they may be in Hebrew, English, or a mix
- Common Israeli fuel stations: PAZ (פז), Sonol (סונול), Delek (דלק)
- Common Israeli supermarkets: Shufersal (שופרסל), Rami Levy (רמי לוי), Victory (ויקטורי), Yochananof (יוחננוף)
- Common Israeli telecoms: Cellcom (סלקום), Partner (פרטנר), Hot, Bezeq (בזק), Golan Telecom
- Common Israeli public transport: Rav Kav (רב קו), Egged (אגד), Dan, Israel Railways (רכבת)
- Common Israeli HMOs: Maccabi (מכבי), Clalit (כללית), Meuhedet (מאוחדת), Leumit (לאומית)
- Food delivery: Wolt, 10bis (תן ביס)

Definition of isEssential: true for rent, groceries, utilities, healthcare, fuel, telecom bills.
Definition of isRecurring: true for predictable monthly charges — rent, telecom, subscriptions, HMO.

Respond with a valid JSON object only. No markdown, no explanation outside the JSON.
Schema:
{
  "categoryName": "<one of the listed categories>",
  "confidence": <number 0.0–1.0>,
  "isEssential": <boolean>,
  "isRecurring": <boolean>,
  "explanation": "<one concise sentence in English>"
}`;

  const lines = [
    `Description: "${input.description}"`,
    input.merchant ? `Merchant: "${input.merchant}"` : null,
    `Amount: ₪${input.amount.toFixed(2)}`,
    `Date: ${input.date.toISOString().slice(0, 10)}`,
  ].filter(Boolean);

  const userPrompt = `Classify this transaction:\n${lines.join('\n')}`;

  return { systemPrompt, userPrompt };
};
