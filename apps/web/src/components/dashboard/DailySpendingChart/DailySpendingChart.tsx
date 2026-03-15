import { format, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { useDailySpending } from '@/hooks/useDailySpending';
import { formatCompact } from '@/utils/formatCurrency';
import styles from './DailySpendingChart.module.css';

const formatXAxis = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'd');
  } catch {
    return dateStr;
  }
};

export const DailySpendingChart = () => {
  const { data, isLoading, isError, refetch } = useDailySpending();

  if (isLoading) return <Card><LoadingSpinner /></Card>;
  if (isError) return <Card><ErrorMessage onRetry={() => void refetch()} /></Card>;

  const chartData = (data ?? []).map((item) => ({
    date: item.date,
    income: parseFloat(item.income),
    expense: parseFloat(item.expense),
  }));

  const hasAnyData = chartData.some((d) => d.income > 0 || d.expense > 0);

  return (
    <Card>
      <CardHeader title="Daily Spending" subtitle="Income and expenses per day" />
      {!hasAnyData ? (
        <div className={styles.empty}>
          <span className={styles.empty__icon}>📊</span>
          <p className={styles.empty__text}>No transactions this month yet.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v: number) => formatCompact(v)}
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCompact(value),
                name === 'income' ? 'Income' : 'Expense',
              ]}
              labelFormatter={(label: string) => {
                try { return format(parseISO(label), 'MMM d, yyyy'); } catch { return label; }
              }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradIncome)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#gradExpense)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
