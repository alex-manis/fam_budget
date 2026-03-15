export type InsightType =
  | 'SPENDING_PATTERN'
  | 'BUDGET_WARNING'
  | 'SAVING_OPPORTUNITY'
  | 'ANOMALY'
  | 'MONTHLY_SUMMARY';

export interface InsightItem {
  id: string;
  type: InsightType;
  content: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
}
