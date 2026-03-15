export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionSource = 'MANUAL' | 'CSV_IMPORT' | 'RECURRING';

export interface TransactionCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface TransactionAccount {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  type: TransactionType;
  source: TransactionSource;
  description: string | null;
  merchant: string | null;
  date: string;
  isAiClassified: boolean;
  category: TransactionCategory | null;
  account: TransactionAccount;
  createdAt: string;
}

export interface TransactionListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
