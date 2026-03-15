export interface ListOptions {
  familyId: string;
  page: number;
  limit: number;
  from?: Date;
  to?: Date;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

export interface TransactionListItem {
  id: string;
  amount: string;
  currency: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  source: 'MANUAL' | 'CSV_IMPORT' | 'RECURRING';
  description: string | null;
  merchant: string | null;
  date: string;
  isAiClassified: boolean;
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
  account: { id: string; name: string };
  createdAt: string;
}

export interface TransactionListResponse {
  data: TransactionListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
