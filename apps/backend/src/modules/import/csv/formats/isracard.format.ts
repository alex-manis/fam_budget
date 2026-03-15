import type { BankFormatDefinition } from './bank-format.interface.js';
import type { RawCsvRow } from '../csv.types.js';

/**
 * Isracard / Max (מקס) credit card CSV export.
 *
 * Isracard is the most common Israeli credit card network.
 * Max (formerly Leumi Card) uses an identical export format.
 *
 * Export source: Isracard/Max website → Transaction history → Download CSV.
 * Encoding: Windows-1255 (Hebrew) or UTF-8.
 * Delimiter: comma.
 * Date format: DD/MM/YYYY.
 *
 * Columns (Hebrew):
 *   תאריך עסקה   — transaction date
 *   שם בית עסק   — merchant name
 *   ענף           — merchant category (MCC-like)
 *   סכום עסקה    — original transaction amount (may be foreign currency)
 *   מטבע          — original currency
 *   סכום חיוב    — amount charged in ILS (this is what we store)
 *
 * All credit card rows are EXPENSE by default. Credits (refunds, cashback)
 * appear as negative values in "סכום חיוב".
 */
export const isracardFormat: BankFormatDefinition = {
  name: 'isracard',

  detect(headers) {
    // "שם בית עסק" (merchant name) combined with "תאריך עסקה" uniquely identifies credit card exports
    return (
      headers.some((h) => h.includes('שם בית עסק')) &&
      headers.some((h) => h.includes('תאריך עסקה'))
    );
  },

  columns: {
    date: 'תאריך עסקה',
    amount: 'סכום חיוב',
    description: 'שם בית עסק',
    merchant: 'ענף',
    currency: 'מטבע',
  },

  dateFormats: ['dd/MM/yyyy'],

  normalizeAmount(row: RawCsvRow) {
    const raw = row['סכום חיוב'] ?? row['סכום עסקה'] ?? '0';
    const num = parseFloat(raw.replace(/,/g, '').trim());
    // Negative = refund/credit, positive = charge
    return {
      amount: Math.abs(num).toFixed(2),
      type: num >= 0 ? 'EXPENSE' : 'INCOME',
    };
  },
};
