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
