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

export interface RecurringForecastItem {
  id: string;
  name: string;
  amount: string;
  currency: string;
  frequency: string;
  nextRunAt: string;
  occurrences: number;
  totalAmount: string;
}

export interface ForecastResult {
  spentSoFar: string;
  daysElapsed: number;
  daysLeft: number;
  avgDailySpend: string;
  projectedVariableSpend: string;
  remainingRecurring: string;
  recurringItems: RecurringForecastItem[];
  forecastedTotal: string;
  currency: string;
}
