// Mirrors the Prisma enum — defined locally to avoid importing ungenerated client in type-only files
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type SupportedBankFormat = 'poalim' | 'leumi' | 'isracard' | 'generic';

/** A single raw row from the CSV file — column names as keys, string values. */
export type RawCsvRow = Record<string, string>;

/**
 * Output of the CSV parser before any normalization.
 * The parser only reads the file — it applies no business logic.
 */
export interface ParsedCsv {
  rows: RawCsvRow[];
  headers: string[];
  detectedFormat: SupportedBankFormat;
}

/**
 * A transaction after normalization — ready for dedup check and DB insert.
 * Context fields (accountId, userId, familyId) are added by the service layer.
 */
export interface NormalizedTransaction {
  amount: string; // string to avoid float precision loss; Prisma accepts string for Decimal
  currency: string;
  type: TransactionType;
  description: string | null;
  merchant: string | null;
  date: Date;
  /** SHA-256 of a stable key derived from the raw row — used for dedup. */
  importHash: string;
}

/** Per-row normalization outcome. */
export type NormalizationOutcome =
  | { ok: true; transaction: NormalizedTransaction }
  | { ok: false; error: string };
