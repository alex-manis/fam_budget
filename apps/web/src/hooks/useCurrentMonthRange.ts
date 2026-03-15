import { useMemo } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

// Memoized so the date range is stable throughout the session.
// Re-mounts on a new day will naturally recalculate.
export const useCurrentMonthRange = (): { from: string; to: string } =>
  useMemo(() => {
    const now = new Date();
    return {
      from: startOfMonth(now).toISOString(),
      to: endOfMonth(now).toISOString(),
    };
  }, []);
