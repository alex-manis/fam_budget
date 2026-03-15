import { useQuery } from '@tanstack/react-query';
import { fetchTransactions } from '@/api/transactions.api';

const RECENT_LIMIT = 8;

export const useRecentTransactions = () =>
  useQuery({
    queryKey: ['transactions', 'recent', RECENT_LIMIT],
    queryFn: () => fetchTransactions({ limit: RECENT_LIMIT, page: 1 }),
    staleTime: 2 * 60 * 1000,
  });
