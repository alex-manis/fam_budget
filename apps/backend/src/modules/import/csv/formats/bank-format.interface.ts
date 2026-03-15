import type { TransactionType, RawCsvRow, SupportedBankFormat } from '../csv.types.js';

/** Column name mapping for a specific bank's CSV export. */
export interface ColumnMap {
  date: string;
  amount: string;
  currency?: string;
  description: string;
  merchant?: string;
}

export interface BankFormatDefinition {
  readonly name: SupportedBankFormat;

  /**
   * Returns true if the given CSV headers match this bank's format.
   * Used for auto-detection when the caller does not specify a format hint.
   */
  detect(headers: string[]): boolean;

  readonly columns: ColumnMap;

  /**
   * Expected date format string understood by date-fns `parse()`.
   * If a row might have multiple date formats, use `parseDate` override instead.
   */
  readonly dateFormats: string[];

  /**
   * Parses the raw amount string from a CSV row and returns the absolute
   * amount and transaction type. Handles sign conventions per bank.
   */
  normalizeAmount(row: RawCsvRow): { amount: string; type: TransactionType };
}
