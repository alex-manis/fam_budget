import { createHash } from 'crypto';
import { parse as parseDate, isValid, format as formatDate } from 'date-fns';
import { getFormatByName } from './formats/index.js';
import { resolveGenericColumns } from './formats/generic.format.js';
import type { ParsedCsv, NormalizedTransaction, NormalizationOutcome, RawCsvRow } from './csv.types.js';
import type { BankFormatDefinition, ColumnMap } from './formats/bank-format.interface.js';

/**
 * Computes a stable SHA-256 fingerprint for a CSV row.
 *
 * All inputs are canonicalized before hashing so that equivalent transactions
 * always produce the same hash regardless of source formatting:
 *   - date  → ISO calendar day (yyyy-MM-dd) derived from the parsed Date,
 *             so "01/01/2024" and "2024-01-01" produce the same key
 *   - amount → fixed-precision decimal string (toFixed(2))
 *   - description + merchant are included together so that two transactions
 *     sharing the same date/amount but different merchants are not merged
 *     even when both have an empty description
 */
const computeImportHash = (
  date: Date,
  amount: string,
  description: string | null,
  merchant: string | null,
): string => {
  const normalizedDate = formatDate(date, 'yyyy-MM-dd');
  const normalizedAmount = parseFloat(amount).toFixed(2);
  const normalizedDesc = description?.trim() ?? '';
  const normalizedMerchant = merchant?.trim() ?? '';
  return createHash('sha256')
    .update(`${normalizedDate}|${normalizedAmount}|${normalizedDesc}|${normalizedMerchant}`)
    .digest('hex');
};

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
  // Detect rows whose required columns are undefined (not just empty strings).
  // This happens when relax_column_count is active and a row has fewer fields
  // than the header; without an explicit check, the error surfaces later as a
  // cryptic date-parse failure rather than a column-count mismatch.
  if (!(columns.date in row) || !(columns.amount in row)) {
    throw new Error('Row has fewer columns than the header — possible CSV format mismatch');
  }

  const rawDate = row[columns.date] ?? '';
  const date = tryParseDateFormats(rawDate, format.dateFormats);
  if (!date) {
    throw new Error(`Cannot parse date "${rawDate}" with formats: ${format.dateFormats.join(', ')}`);
  }

  const { amount, type } = format.normalizeAmount(row);

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    throw new Error(`Invalid amount value in row`);
  }
  // Zero-amount rows have no financial meaning and would create phantom
  // transactions that pollute analytics and waste dedup hash slots.
  if (parsedAmount === 0) {
    throw new Error(`Zero-amount row skipped`);
  }

  const description = (row[columns.description] ?? '').trim() || null;
  const currency = (columns.currency ? (row[columns.currency] ?? 'ILS') : 'ILS')
    .trim()
    .toUpperCase()
    .slice(0, 3);
  const merchant = columns.merchant ? (row[columns.merchant] ?? '').trim() || null : null;

  const importHash = computeImportHash(date, amount, description, merchant);

  return { amount, currency, type, description, merchant, date, importHash };
};

export interface NormalizationResult {
  transactions: NormalizedTransaction[];
  errors: Array<{ row: number; message: string }>;
}

/**
 * Validates that the resolved column names actually exist in the CSV headers.
 * Catches two failure modes early:
 *   1. Missing header row — csv-parse promotes the first data row to headers,
 *      so mandatory column names (e.g. "date", "amount") will be absent.
 *   2. Silent column drift — a format upgrade or bank export change renames
 *      a column; without this check the row silently parses with empty values.
 */
const assertRequiredColumnsPresent = (columns: ColumnMap, headers: string[]): void => {
  const headerSet = new Set(headers);
  const missing: string[] = [];
  for (const key of ['date', 'amount', 'description'] as const) {
    if (columns[key] && !headerSet.has(columns[key])) {
      missing.push(columns[key]);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `CSV is missing required columns: ${missing.join(', ')}. ` +
        `The file may be missing a header row or uses an unrecognised format.`,
    );
  }
};

/**
 * Normalizes all rows from a parsed CSV.
 * Continues on per-row failures — collects errors without aborting the batch.
 * This is intentional: a single bad row should not block 300 valid transactions.
 */
export const normalizeTransactions = ({ rows, headers, detectedFormat }: ParsedCsv): NormalizationResult => {
  const format = getFormatByName(detectedFormat);
  const columns = resolveColumns(format, headers);
  // Fail fast when required columns are absent — this indicates a structural
  // problem (missing header row, wrong format) that affects every row.
  assertRequiredColumnsPresent(columns, headers);

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
