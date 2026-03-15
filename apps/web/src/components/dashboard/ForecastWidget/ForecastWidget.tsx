import { format, parseISO } from 'date-fns';
import { Card, CardHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { useForecast } from '@/hooks/useForecast';
import { formatCurrency, formatCompact } from '@/utils/formatCurrency';
import type { RecurringForecastItem } from '@/types/analytics.types';
import styles from './ForecastWidget.module.css';

// ─── Sub-components ───────────────────────────────────────────────────────────

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

const FormulaBar = ({
  label,
  value,
  currency,
  variant,
}: {
  label: string;
  value: string;
  currency: string;
  variant: 'neutral' | 'recurring' | 'projected' | 'total';
}) => (
  <div className={`${styles.formula__row} ${styles[`formula__row--${variant}`]}`}>
    <span className={styles.formula__label}>{label}</span>
    <span className={styles.formula__value}>{formatCurrency(value, currency)}</span>
  </div>
);

const SpendProgress = ({
  spentSoFar,
  forecastedTotal,
  currency,
}: {
  spentSoFar: string;
  forecastedTotal: string;
  currency: string;
}) => {
  const spent = parseFloat(spentSoFar);
  const total = parseFloat(forecastedTotal);
  const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;

  return (
    <div className={styles.progress}>
      <div className={styles.progress__labels}>
        <span className={styles.progress__spent}>
          Spent: {formatCompact(spent, currency)}
        </span>
        <span className={styles.progress__forecast}>
          Forecast: {formatCompact(total, currency)}
        </span>
      </div>
      <div className={styles.progress__bar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.progress__fill} style={{ width: `${pct}%` }} />
      </div>
      <p className={styles.progress__pct}>{pct}% of forecasted total spent</p>
    </div>
  );
};

const RecurringRow = ({ item }: { item: RecurringForecastItem }) => {
  const dueDate = format(parseISO(item.nextRunAt), 'MMM d');
  const freqLabel = FREQUENCY_LABEL[item.frequency] ?? item.frequency;

  return (
    <div className={styles.recurring__row}>
      <div className={styles.recurring__info}>
        <span className={styles.recurring__name}>{item.name}</span>
        <span className={styles.recurring__meta}>
          {freqLabel} · next {dueDate}
          {item.occurrences > 1 && ` · ×${item.occurrences}`}
        </span>
      </div>
      <span className={styles.recurring__amount}>
        −{formatCurrency(item.totalAmount, item.currency)}
      </span>
    </div>
  );
};

// ─── Main widget ──────────────────────────────────────────────────────────────

export const ForecastWidget = () => {
  const { data, isLoading, isError, refetch } = useForecast();

  if (isLoading) return <Card><LoadingSpinner /></Card>;
  if (isError) return <Card><ErrorMessage onRetry={() => void refetch()} /></Card>;

  if (!data) return null;

  const {
    spentSoFar,
    daysElapsed,
    daysLeft,
    avgDailySpend,
    projectedVariableSpend,
    remainingRecurring,
    recurringItems,
    forecastedTotal,
    currency,
  } = data;

  return (
    <Card>
      <CardHeader
        title="Month Forecast"
        subtitle={`${daysElapsed}d elapsed · ${daysLeft}d left`}
      />

      {/* Progress bar: spent vs forecasted */}
      <SpendProgress
        spentSoFar={spentSoFar}
        forecastedTotal={forecastedTotal}
        currency={currency}
      />

      {/* Formula breakdown */}
      <div className={styles.formula}>
        <FormulaBar
          label="Spent so far"
          value={spentSoFar}
          currency={currency}
          variant="neutral"
        />
        <div className={styles.formula__divider} aria-hidden="true">+</div>
        <FormulaBar
          label={`Avg daily (${formatCurrency(avgDailySpend, currency)}) × ${daysLeft}d`}
          value={projectedVariableSpend}
          currency={currency}
          variant="projected"
        />
        <div className={styles.formula__divider} aria-hidden="true">+</div>
        <FormulaBar
          label="Remaining recurring"
          value={remainingRecurring}
          currency={currency}
          variant="recurring"
        />
        <div className={styles.formula__separator} />
        <FormulaBar
          label="Forecasted total"
          value={forecastedTotal}
          currency={currency}
          variant="total"
        />
      </div>

      {/* Recurring items list */}
      {recurringItems.length > 0 && (
        <div className={styles.recurring}>
          <p className={styles.recurring__title}>Upcoming recurring payments</p>
          {recurringItems.map((item) => (
            <RecurringRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </Card>
  );
};
