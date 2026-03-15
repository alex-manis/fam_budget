import { format } from 'date-fns';
import {
  SummaryWidget,
  ExpensesByCategoryChart,
  DailySpendingChart,
  RecentTransactions,
  AiInsightsWidget,
} from '@/components/dashboard';
import styles from './DashboardPage.module.css';

export const DashboardPage = () => {
  const monthLabel = format(new Date(), 'MMMM yyyy');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.header__inner}>
          <div className={styles.header__brand}>
            <span className={styles.header__logo} aria-hidden="true">💰</span>
            <span className={styles.header__name}>FamBudget</span>
          </div>
          <div className={styles.header__period}>
            <span className={styles.header__period__label}>Period</span>
            <span className={styles.header__period__value}>{monthLabel}</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Row 1: Full-width summary */}
        <section className={styles.row}>
          <div className={styles.col__full}>
            <SummaryWidget />
          </div>
        </section>

        {/* Row 2: Daily chart (wide) + Category pie (narrow) */}
        <section className={styles.row}>
          <div className={styles.col__wide}>
            <DailySpendingChart />
          </div>
          <div className={styles.col__narrow}>
            <ExpensesByCategoryChart />
          </div>
        </section>

        {/* Row 3: Recent transactions (wide) + AI insights (narrow) */}
        <section className={styles.row}>
          <div className={styles.col__wide}>
            <RecentTransactions />
          </div>
          <div className={styles.col__narrow}>
            <AiInsightsWidget />
          </div>
        </section>
      </main>
    </div>
  );
};
