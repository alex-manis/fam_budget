import { buildQuery } from './client';
import type { Transaction, TransactionListMeta } from '@/types/transaction.types';

interface TransactionListParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

interface TransactionListResult {
  data: Transaction[];
  meta: TransactionListMeta;
}

// apiFetch only returns the `data` field from the envelope.
// For paginated list we need both data and meta, so we fetch the raw response.
export const fetchTransactions = async (
  params: TransactionListParams = {},
): Promise<TransactionListResult> => {
  const res = await fetch(`/api/v1/transactions${buildQuery({
    page: params.page,
    limit: params.limit,
    from: params.from,
    to: params.to,
    type: params.type,
  })}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch transactions: ${res.status}`);
  }

  return res.json() as Promise<TransactionListResult>;
};
