import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsSummary } from '@/api/analytics.api';
import { useCurrentMonthRange } from './useCurrentMonthRange';

export const useAnalyticsSummary = () => {
  const range = useCurrentMonthRange();

  return useQuery({
    queryKey: ['analytics', 'summary', range],
    queryFn: () => fetchAnalyticsSummary(range),
    staleTime: 5 * 60 * 1000,
  });
};
