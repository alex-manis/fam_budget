import type { SupportedBankFormat } from './csv/csv.types.js';

export type { SupportedBankFormat };

export type ImportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ImportJob {
  jobId: string;
  status: ImportJobStatus;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: ImportRowError[];
  completedAt: Date | null;
}

export interface ImportRowError {
  row: number;
  message: string;
}

export interface StartImportOptions {
  accountId: string;
  userId: string;
  familyId: string;
  /** Optional hint — if omitted, format is auto-detected from CSV headers. */
  formatHint?: SupportedBankFormat;
}
