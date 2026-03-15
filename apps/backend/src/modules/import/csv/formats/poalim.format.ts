import type { BankFormatDefinition } from './bank-format.interface.js';
import type { RawCsvRow } from '../csv.types.js';

/**
 * Bank Hapoalim (בנק הפועלים) — current account (עו"ש) CSV export.
 *
 * Export source: Poalim website → Account details → Export to Excel/CSV.
 * Encoding: Windows-1255 (Hebrew) or UTF-8.
 * Delimiter: comma.
 * Date format: DD/MM/YYYY.
 *
 * Columns (Hebrew):
 *   תאריך       — transaction date
 *   תאריך ערך   — value date
 *   תיאור       — description
 *   אסמכתא     — reference number (unique to Poalim)
 *   חיוב        — debit amount (expense), empty if credit
 *   זכות        — credit amount (income), empty if debit
 *   יתרה        — running balance (ignored during import)
 */
export const poalimFormat: BankFormatDefinition = {
  name: 'poalim',

  detect(headers) {
    // "אסמכתא" (reference number) is Hapoalim-specific; combined with "תיאור" unambiguously identifies it
    return headers.some((h) => h.includes('אסמכתא')) && headers.some((h) => h.includes('תיאור'));
  },

  columns: {
    date: 'תאריך',
    amount: 'חיוב',    // primary amount column; זכות checked in normalizeAmount
    description: 'תיאור',
  },

  dateFormats: ['dd/MM/yyyy', 'dd/MM/yyyy HH:mm'],

  normalizeAmount(row: RawCsvRow) {
    const parseILS = (raw: string | undefined): number => {
      if (!raw || raw.trim() === '') return 0;
      // Remove thousands commas, parse float
      return parseFloat(raw.replace(/,/g, '').trim());
    };

    const debit = parseILS(row['חיוב']);
    const credit = parseILS(row['זכות']);

    if (debit > 0) return { amount: debit.toFixed(2), type: 'EXPENSE' };
    return { amount: credit.toFixed(2), type: 'INCOME' };
  },
};
