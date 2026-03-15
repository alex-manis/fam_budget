import { createHash } from 'crypto';
import { parse as parseDate, isValid } from 'date-fns';
import { getFormatByName, genericFormat } from './formats/index.js';
import { resolveGenericColumns } from './formats/generic.format.js';
import type { ParsedCsv, NormalizedTransaction, NormalizationOutcome, RawCsvRow } from './csv.types.js';
import type { BankFormatDefinition, ColumnMap } from './formats/bank-format.interface.js';

/**
 * Computes a stable SHA-256 fingerprint for a CSV row.
 * Uses a combination of date, amount, and description — not the full row —
 * so minor whitespace differences between re-imports do not create false duplicates.
 */
const computeImportHash = (date: string, amount: string, description: string): string =>
  createHash('sha256').update(`${date}|${amount}|${description}`).digest('hex');

/** Tries each date format string in order and returns the first valid Date. */
const tryParseDateFormats = (raw: string, formats: string[]): Date | null => {
  for (const fmt of formats) {
    const parsed = parseDate(raw.trim(), fmt, new Date());
    if (isValid(parsed)) return parsed;
  }
  return null;
};

/**
 * Resolves the effective ColumnMap.
 * For generic format, the actual column names vary per file and are resolved
 * from the file headers rather than hardcoded.
 */
const resolveColumns = (format: BankFormatDefinition, headers: string[]): ColumnMap =>
  format.name === 'generic' ? resolveGenericColumns(headers) : format.columns;

/** Normalizes a single raw CSV row into a transaction. */
const normalizeRow = (
  row: RawCsvRow,
  format: BankFormatDefinition,
  columns: ColumnMap,
): NormalizedTransaction => {
  const rawDate = row[columns.date] ?? '';
  const date = tryParseDateFormats(rawDate, format.dateFormats);
  if (!date) {
    throw new Error(`Cannot parse date "${rawDate}" with formats: ${format.dateFormats.join(', ')}`);
  }

  const { amount, type } = format.normalizeAmount(row);

  if (isNaN(parseFloat(amount))) {
    throw new Error(`Invalid amount value in row`);
  }

  const description = (row[columns.description] ?? '').trim() || null;
  const currency = (columns.currency ? (row[columns.currency] ?? 'ILS') : 'ILS')
    .trim()
    .toUpperCase()
    .slice(0, 3);
  const merchant = columns.merchant ? (row[columns.merchant] ?? '').trim() || null : null;

  const importHash = computeImportHash(rawDate, amount, description ?? '');

  return { amount, currency, type, description, merchant, date, importHash };
};

export interface NormalizationResult {
  transactions: NormalizedTransaction[];
  errors: Array<{ row: number; message: string }>;
}

/**
 * Normalizes all rows from a parsed CSV.
 * Continues on per-row failures — collects errors without aborting the batch.
 * This is intentional: a single bad row should not block 300 valid transactions.
 */
export const normalizeTransactions = ({ rows, headers, detectedFormat }: ParsedCsv): NormalizationResult => {
  const format = getFormatByName(detectedFormat);
  const columns = resolveColumns(format, headers);

  const transactions: NormalizedTransaction[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  rows.forEach((row, index) => {
    // row index is 1-based for the user (row 0 is headers)
    const rowNumber = index + 2;
    const outcome: NormalizationOutcome = (() => {
      try {
        return { ok: true, transaction: normalizeRow(row, format, columns) };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { ok: false, error: message };
      }
    })();

    if (outcome.ok) {
      transactions.push(outcome.transaction);
    } else {
      errors.push({ row: rowNumber, message: outcome.error });
    }
  });

  return { transactions, errors };
};
