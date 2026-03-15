import { useQuery } from '@tanstack/react-query';
import { fetchInsights } from '@/api/insights.api';

export const useInsights = (limit = 5) =>
  useQuery({
    queryKey: ['insights', limit],
    queryFn: () => fetchInsights({ limit }),
    staleTime: 10 * 60 * 1000,
  });
