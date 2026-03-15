export interface AnalyticsSummary {
  totalIncome: string;
  totalExpense: string;
  netBalance: string;
  transactionCount: number;
  currency: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  color: string;
  total: string;
  percentage: number;
  transactionCount: number;
}

export interface DailySpendingItem {
  date: string; // YYYY-MM-DD
  income: string;
  expense: string;
}

export interface AnalyticsQueryParams {
  from: string;
  to: string;
  familyId: string;
}

export interface CategoryQueryParams extends AnalyticsQueryParams {
  type: 'INCOME' | 'EXPENSE';
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export interface RecurringForecastItem {
  id: string;
  name: string;
  amount: string;
  currency: string;
  frequency: string;
  /** ISO date of next scheduled run within the remaining month days */
  nextRunAt: string;
  occurrences: number;
  totalAmount: string;
}

export interface ForecastResult {
  /** Expenses recorded from the 1st to today */
  spentSoFar: string;
  /** Number of calendar days elapsed since start of month */
  daysElapsed: number;
  /** Number of calendar days remaining until end of month */
  daysLeft: number;
  /** spentSoFar / daysElapsed, 0 when no days elapsed */
  avgDailySpend: string;
  /** avg_daily_spend * days_left */
  projectedVariableSpend: string;
  /** Sum of remaining recurring expense payments */
  remainingRecurring: string;
  /** Individual recurring items that will fire before month end */
  recurringItems: RecurringForecastItem[];
  /** spentSoFar + projectedVariableSpend + remainingRecurring */
  forecastedTotal: string;
  currency: string;
}
