import { useQuery } from '@tanstack/react-query';
import { fetchForecast } from '@/api/analytics.api';

export const useForecast = () =>
  useQuery({
    queryKey: ['analytics', 'forecast'],
    queryFn: fetchForecast,
    // Forecast changes as new transactions come in — refresh every 5 minutes
    staleTime: 5 * 60 * 1000,
  });
