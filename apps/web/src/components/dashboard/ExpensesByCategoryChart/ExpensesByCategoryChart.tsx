import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { useAnalyticsByCategory } from '@/hooks/useAnalyticsByCategory';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from './ExpensesByCategoryChart.module.css';

const FALLBACK_COLORS = [
  '#6c63ff', '#10b981', '#ef4444', '#f59e0b', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

const EmptyState = () => (
  <div className={styles.empty}>
    <span className={styles.empty__icon}>🍕</span>
    <p className={styles.empty__text}>No expense data for this month yet.</p>
  </div>
);

export const ExpensesByCategoryChart = () => {
  const { data, isLoading, isError, refetch } = useAnalyticsByCategory('EXPENSE');

  if (isLoading) return <Card><LoadingSpinner /></Card>;
  if (isError) return <Card><ErrorMessage onRetry={() => void refetch()} /></Card>;

  const chartData = (data ?? []).map((item, idx) => ({
    name: item.categoryName,
    value: parseFloat(item.total),
    color: item.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length] || '#94a3b8',
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader title="Expenses by Category" subtitle="Current month breakdown" />
      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={styles.chart__wrapper}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value, 'ILS')}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                formatter={(value: string) => (
                  <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
