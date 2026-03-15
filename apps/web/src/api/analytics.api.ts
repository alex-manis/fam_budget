import { apiFetch, buildQuery } from './client';
import type {
  AnalyticsSummary,
  CategoryBreakdownItem,
  DailySpendingItem,
} from '@/types/analytics.types';

interface DateRange {
  from: string; // ISO datetime string
  to: string;
  [key: string]: string | number | undefined;
}

export const fetchAnalyticsSummary = (range: DateRange): Promise<AnalyticsSummary> =>
  apiFetch<AnalyticsSummary>(`/analytics/summary${buildQuery(range)}`);

export const fetchAnalyticsByCategory = (
  range: DateRange,
  type: 'INCOME' | 'EXPENSE' = 'EXPENSE',
): Promise<CategoryBreakdownItem[]> =>
  apiFetch<CategoryBreakdownItem[]>(`/analytics/by-category${buildQuery({ ...range, type })}`);

export const fetchDailySpending = (range: DateRange): Promise<DailySpendingItem[]> =>
  apiFetch<DailySpendingItem[]>(`/analytics/daily${buildQuery(range)}`);
