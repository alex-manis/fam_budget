import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsByCategory } from '@/api/analytics.api';
import { useCurrentMonthRange } from './useCurrentMonthRange';

export const useAnalyticsByCategory = (type: 'INCOME' | 'EXPENSE' = 'EXPENSE') => {
  const range = useCurrentMonthRange();

  return useQuery({
    queryKey: ['analytics', 'by-category', type, range],
    queryFn: () => fetchAnalyticsByCategory(range, type),
    staleTime: 5 * 60 * 1000,
  });
};
