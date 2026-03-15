import type { BankFormatDefinition } from './bank-format.interface.js';
import type { RawCsvRow } from '../csv.types.js';

/**
 * Bank Leumi (בנק לאומי) — current account (עו"ש) CSV export.
 * Also covers Bank Discount (בנק דיסקונט) which uses the same column structure.
 *
 * Export source: Leumi website → Account history → Export.
 * Encoding: Windows-1255 (Hebrew) or UTF-8.
 * Delimiter: comma.
 * Date format: DD/MM/YYYY.
 *
 * Columns (Hebrew):
 *   תאריך       — transaction date
 *   תאריך ערך   — value date
 *   פירוט       — description (Leumi uses "פירוט", not "תיאור")
 *   חיוב        — debit amount (expense), empty if credit
 *   זכות        — credit amount (income), empty if debit
 *   יתרה        — running balance (ignored)
 */
export const leumiFormat: BankFormatDefinition = {
  name: 'leumi',

  detect(headers) {
    // "פירוט" (description) distinguishes Leumi/Discount from Hapoalim's "תיאור"
    return headers.some((h) => h.includes('פירוט')) && headers.some((h) => h.includes('חיוב'));
  },

  columns: {
    date: 'תאריך',
    amount: 'חיוב',
    description: 'פירוט',
  },

  dateFormats: ['dd/MM/yyyy', 'dd/MM/yyyy HH:mm'],

  normalizeAmount(row: RawCsvRow) {
    const parseILS = (raw: string | undefined): number => {
      if (!raw || raw.trim() === '') return 0;
      return parseFloat(raw.replace(/,/g, '').trim());
    };

    const debit = parseILS(row['חיוב']);
    const credit = parseILS(row['זכות']);

    if (debit > 0) return { amount: debit.toFixed(2), type: 'EXPENSE' };
    return { amount: credit.toFixed(2), type: 'INCOME' };
  },
};
