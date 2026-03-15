import { format, parseISO } from 'date-fns';
import { Card, CardHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { useRecentTransactions } from '@/hooks/useRecentTransactions';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Transaction } from '@/types/transaction.types';
import styles from './RecentTransactions.module.css';

const TYPE_SIGN: Record<Transaction['type'], string> = {
  INCOME: '+',
  EXPENSE: '−',
  TRANSFER: '↔',
};

const TransactionRow = ({ tx }: { tx: Transaction }) => {
  const sign = TYPE_SIGN[tx.type];
  const label = tx.merchant ?? tx.description ?? 'Transaction';
  const categoryName = tx.category?.name ?? 'Uncategorized';
  const categoryColor = tx.category?.color ?? 'var(--color-text-muted)';
  const date = format(parseISO(tx.date), 'MMM d');

  return (
    <div className={styles.row}>
      <div
        className={styles.row__icon}
        style={{ backgroundColor: `${categoryColor}22`, color: categoryColor }}
        aria-hidden="true"
      >
        {tx.category?.icon ?? '💳'}
      </div>
      <div className={styles.row__info}>
        <span className={styles.row__label}>{label}</span>
        <span className={styles.row__category}>{categoryName}</span>
      </div>
      <div className={styles.row__right}>
        <span
          className={`${styles.row__amount} ${styles[`row__amount--${tx.type.toLowerCase()}`]}`}
        >
          {sign}
          {formatCurrency(tx.amount, tx.currency)}
        </span>
        <span className={styles.row__date}>{date}</span>
      </div>
    </div>
  );
};

export const RecentTransactions = () => {
  const { data, isLoading, isError, refetch } = useRecentTransactions();

  if (isLoading) return <Card><LoadingSpinner /></Card>;
  if (isError) return <Card><ErrorMessage onRetry={() => void refetch()} /></Card>;

  const transactions = data?.data ?? [];

  return (
    <Card>
      <CardHeader title="Recent Transactions" subtitle="Latest activity" />
      {transactions.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.empty__icon}>💳</span>
          <p className={styles.empty__text}>No transactions yet. Import a CSV to get started.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </Card>
  );
};
