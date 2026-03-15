import type { BankFormatDefinition } from './bank-format.interface.js';
import type { SupportedBankFormat } from '../csv.types.js';
import { poalimFormat } from './poalim.format.js';
import { leumiFormat } from './leumi.format.js';
import { isracardFormat } from './isracard.format.js';
import { genericFormat } from './generic.format.js';

export { poalimFormat, leumiFormat, isracardFormat, genericFormat };
export type { BankFormatDefinition };

/**
 * Priority-ordered list of supported Israeli bank formats.
 * More specific formats must come before generic — generic always matches.
 *
 * Banks covered:
 *   poalim   — Bank Hapoalim current account (בנק הפועלים)
 *   leumi    — Bank Leumi / Bank Discount current account (לאומי / דיסקונט)
 *   isracard — Isracard & Max credit cards (ישראכרט / מקס)
 *   generic  — Auto-mapped fallback for any Israeli bank CSV
 */
const FORMATS: BankFormatDefinition[] = [poalimFormat, leumiFormat, isracardFormat, genericFormat];

export const detectBankFormat = (headers: string[]): SupportedBankFormat => {
  const match = FORMATS.find((f) => f.detect(headers));
  return (match ?? genericFormat).name;
};

export const getFormatByName = (name: SupportedBankFormat): BankFormatDefinition => {
  const format = FORMATS.find((f) => f.name === name);
  if (!format) throw new Error(`Unknown bank format: ${name}`);
  return format;
};
