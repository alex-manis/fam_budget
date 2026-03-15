import { Card, CardHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { useAnalyticsSummary } from '@/hooks/useAnalyticsSummary';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from './SummaryWidget.module.css';

const StatItem = ({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: 'income' | 'expense' | 'balance';
}) => (
  <div className={`${styles.stat} ${styles[`stat--${variant}`]}`}>
    <span className={styles.stat__label}>{label}</span>
    <span className={styles.stat__value}>{value}</span>
  </div>
);

export const SummaryWidget = () => {
  const { data, isLoading, isError, refetch } = useAnalyticsSummary();

  if (isLoading) return <Card><LoadingSpinner /></Card>;
  if (isError) return <Card><ErrorMessage onRetry={() => void refetch()} /></Card>;

  const currency = data?.currency ?? 'ILS';

  return (
    <Card>
      <CardHeader title="Monthly Overview" subtitle="Income vs Expenses" />
      <div className={styles.stats}>
        <StatItem
          label="Income"
          value={formatCurrency(data?.totalIncome ?? '0', currency)}
          variant="income"
        />
        <StatItem
          label="Expenses"
          value={formatCurrency(data?.totalExpense ?? '0', currency)}
          variant="expense"
        />
        <StatItem
          label="Net Balance"
          value={formatCurrency(data?.netBalance ?? '0', currency)}
          variant="balance"
        />
      </div>
      <p className={styles.count}>
        {data?.transactionCount ?? 0} transactions this month
      </p>
    </Card>
  );
};
