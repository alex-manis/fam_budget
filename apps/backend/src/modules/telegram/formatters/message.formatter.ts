/** Maps canonical category names to display emoji. */
export const CATEGORY_EMOJI: Record<string, string> = {
  Groceries: '🛒',
  Fuel: '⛽',
  Telecom: '📱',
  Transport: '🚌',
  Restaurants: '🍽',
  Rent: '🏠',
  Utilities: '💡',
  Healthcare: '🏥',
  Entertainment: '🎬',
  Shopping: '🛍',
  Education: '📚',
  Insurance: '🛡',
  Income: '💰',
  Other: '📦',
};

export const categoryEmoji = (name: string): string =>
  CATEGORY_EMOJI[name] ?? '📦';

/** Formats a number as Israeli Shekel with comma thousands separator. */
export const formatILS = (amount: number): string => {
  const rounded = Math.round(amount);
  return `₪${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/** Returns a directional trend arrow with percentage. */
export const formatTrend = (current: number, previous: number): string => {
  if (previous === 0) return '';
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return ` ↑ +${pct}%`;
  if (pct < 0) return ` ↓ ${pct}%`;
  return ' → 0%';
};

// ─── Message builders ────────────────────────────────────────────────────────

export interface CategoryLine {
  name: string;
  total: number;
}

export interface SummaryData {
  monthLabel: string;
  totalIncome: number;
  totalExpense: number;
  topCategories: CategoryLine[];
}

export const buildSummaryMessage = (data: SummaryData): string => {
  const balance = data.totalIncome - data.totalExpense;
  const sign = balance >= 0 ? '+' : '';

  const topLines = data.topCategories
    .map((c) => `${categoryEmoji(c.name)} ${c.name}: <b>${formatILS(c.total)}</b>`)
    .join('\n');

  return [
    `📊 <b>Budget Summary — ${data.monthLabel}</b>`,
    '',
    `💰 Income: <b>${formatILS(data.totalIncome)}</b>`,
    `💸 Expenses: <b>${formatILS(data.totalExpense)}</b>`,
    `📈 Balance: <b>${sign}${formatILS(balance)}</b>`,
    '',
    data.topCategories.length > 0 ? '<b>Top expenses:</b>' : '',
    topLines,
  ]
    .filter((l) => l !== '')
    .join('\n');
};

export interface SpentData {
  monthLabel: string;
  categoryName: string;
  spent: number;
  budgetLimit: number | null;
  transactionCount: number;
}

export const buildSpentMessage = (data: SpentData): string => {
  const emoji = categoryEmoji(data.categoryName);
  const lines = [
    `${emoji} <b>${data.categoryName} — ${data.monthLabel}</b>`,
    '',
    `Spent: <b>${formatILS(data.spent)}</b>`,
  ];

  if (data.budgetLimit !== null && data.budgetLimit > 0) {
    const remaining = data.budgetLimit - data.spent;
    const pct = Math.round((data.spent / data.budgetLimit) * 100);
    const bar = pct >= 100 ? '🔴' : pct >= 80 ? '🟡' : '🟢';
    lines.push(`Budget: <b>${formatILS(data.budgetLimit)}</b>`);
    lines.push(`${bar} Remaining: <b>${formatILS(remaining)}</b> (${pct}% used)`);
  }

  lines.push('', `${data.transactionCount} transaction${data.transactionCount !== 1 ? 's' : ''} this month`);
  return lines.join('\n');
};

export interface MonthlyAverage {
  month: string;  // e.g. "Jan 2025"
  total: number;
}

export interface ForecastData {
  nextMonthLabel: string;
  predicted: number;
  monthlyHistory: MonthlyAverage[];
}

export const buildForecastMessage = (data: ForecastData): string => {
  const historyLines = data.monthlyHistory
    .map((m) => `  📅 ${m.month}: ${formatILS(m.total)}`)
    .join('\n');

  return [
    `🔮 <b>Forecast — ${data.nextMonthLabel}</b>`,
    '',
    `Expected expenses: <b>${formatILS(data.predicted)}</b>`,
    `<i>(3-month rolling average)</i>`,
    '',
    '<b>Recent months:</b>',
    historyLines,
  ].join('\n');
};

export interface AddedTransactionData {
  description: string;
  amount: number;
  categoryName: string;
  source: 'rule' | 'ai' | 'fallback';
}

export const buildAddedMessage = (data: AddedTransactionData): string => {
  const emoji = categoryEmoji(data.categoryName);
  const classifiedBy = data.source === 'rule' ? 'rule' : data.source === 'ai' ? 'AI' : '—';
  return [
    `✅ <b>Transaction added</b>`,
    '',
    `📝 ${data.description}`,
    `💰 Amount: <b>${formatILS(data.amount)}</b>`,
    `${emoji} Category: <b>${data.categoryName}</b> (${classifiedBy})`,
  ].join('\n');
};
