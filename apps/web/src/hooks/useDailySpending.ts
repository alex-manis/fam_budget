import { useQuery } from '@tanstack/react-query';
import { fetchDailySpending } from '@/api/analytics.api';
import { useCurrentMonthRange } from './useCurrentMonthRange';

export const useDailySpending = () => {
  const range = useCurrentMonthRange();

  return useQuery({
    queryKey: ['analytics', 'daily', range],
    queryFn: () => fetchDailySpending(range),
    staleTime: 5 * 60 * 1000,
  });
};
