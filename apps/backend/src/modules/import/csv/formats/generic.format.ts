import type { BankFormatDefinition } from './bank-format.interface.js';
import type { RawCsvRow } from '../csv.types.js';

/** Candidate column names for each field, ordered by priority. */
const DATE_COLUMNS = ['date', 'תאריך', 'תאריך עסקה', 'transaction date', 'תאריך ערך'];
const AMOUNT_COLUMNS = ['amount', 'סכום', 'סכום חיוב', 'סכום עסקה', 'חיוב', 'sum'];
const DESCRIPTION_COLUMNS = ['description', 'תיאור', 'פירוט', 'שם בית עסק', 'memo', 'note'];
const CURRENCY_COLUMNS = ['currency', 'מטבע', 'cur'];

const findColumn = (headers: string[], candidates: string[]): string | undefined =>
  candidates.find((c) => headers.map((h) => h.toLowerCase()).includes(c.toLowerCase()));

/**
 * Generic fallback format.
 * Tries to map common column names from any CSV that was not detected
 * as a known bank format. Always returned as a last resort.
 */
export const genericFormat: BankFormatDefinition = {
  name: 'generic',

  // Always matches — serves as the catch-all fallback
  detect: () => true,

  // Columns are resolved lazily per-file in the normalizer using findColumn()
  columns: {
    date: 'date',
    amount: 'amount',
    description: 'description',
  },

  dateFormats: ['dd.MM.yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd.MM.yyyy HH:mm:ss'],

  normalizeAmount(row: RawCsvRow) {
    const headers = Object.keys(row);
    const amountKey = findColumn(headers, AMOUNT_COLUMNS) ?? headers[1] ?? '';
    const raw = row[amountKey] ?? '0';
    const normalized = raw.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return {
      amount: Math.abs(num).toFixed(2),
      type: num < 0 ? 'EXPENSE' : 'INCOME',
    };
  },
};

/** Resolve actual column names from the file headers for a generic CSV. */
export const resolveGenericColumns = (headers: string[]): import('./bank-format.interface.js').ColumnMap => {
  const currency = findColumn(headers, CURRENCY_COLUMNS);
  const base = {
    date: findColumn(headers, DATE_COLUMNS) ?? headers[0] ?? 'date',
    amount: findColumn(headers, AMOUNT_COLUMNS) ?? headers[1] ?? 'amount',
    description: findColumn(headers, DESCRIPTION_COLUMNS) ?? headers[2] ?? 'description',
  };
  // Only include optional key when defined — required by exactOptionalPropertyTypes
  return currency !== undefined ? { ...base, currency } : base;
};
