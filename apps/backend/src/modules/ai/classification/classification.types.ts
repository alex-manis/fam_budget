/**
 * Canonical category names used by the classification pipeline.
 * These must match the system Category records seeded in the database.
 */
export const SYSTEM_CATEGORIES = [
  'Groceries',
  'Fuel',
  'Telecom',
  'Transport',
  'Restaurants',
  'Rent',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Insurance',
  'Income',
  'Other',
] as const;

export type SystemCategoryName = (typeof SYSTEM_CATEGORIES)[number];

export interface ClassificationInput {
  description: string;
  merchant?: string | null;
  /** Absolute amount in ILS */
  amount: number;
  date: Date;
}

export interface ClassificationResult {
  categoryName: SystemCategoryName;
  /** 0.0 – 1.0 */
  confidence: number;
  /** True for necessities: rent, groceries, utilities, healthcare, fuel, telecom */
  isEssential: boolean;
  /** True for predictable monthly charges: rent, telecom bills, subscriptions */
  isRecurring: boolean;
  /** Human-readable reason for the classification */
  explanation: string;
  /** How the result was produced */
  source: 'rule' | 'ai' | 'fallback';
}

/** Returned when all classification attempts fail — safe no-op. */
export const FALLBACK_RESULT: ClassificationResult = {
  categoryName: 'Other',
  confidence: 0,
  isEssential: false,
  isRecurring: false,
  explanation: 'Could not classify transaction',
  source: 'fallback',
};
