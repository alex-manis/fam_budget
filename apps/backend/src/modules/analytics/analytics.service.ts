import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type {
  AnalyticsSummary,
  CategoryBreakdownItem,
  DailySpendingItem,
} from './analytics.types.js';

const toDecimalString = (value: unknown): string =>
  parseFloat(String(value ?? '0')).toFixed(2);

// ─── Summary ──────────────────────────────────────────────────────────────────

export const getSummary = async (
  familyId: string,
  from: Date,
  to: Date,
): Promise<AnalyticsSummary> => {
  const baseWhere = { familyId, date: { gte: from, lte: to } };

  const [incomeAgg, expenseAgg, txCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...baseWhere, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: baseWhere }),
  ]);

  const totalIncome = parseFloat(String(incomeAgg._sum.amount ?? '0'));
  const totalExpense = parseFloat(String(expenseAgg._sum.amount ?? '0'));

  return {
    totalIncome: totalIncome.toFixed(2),
    totalExpense: totalExpense.toFixed(2),
    netBalance: (totalIncome - totalExpense).toFixed(2),
    transactionCount: txCount,
    currency: 'ILS',
  };
};

// ─── By Category ──────────────────────────────────────────────────────────────

export const getByCategory = async (
  familyId: string,
  from: Date,
  to: Date,
  type: 'INCOME' | 'EXPENSE',
): Promise<CategoryBreakdownItem[]> => {
  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      familyId,
      type,
      date: { gte: from, lte: to },
      categoryId: { not: null },
    },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  if (grouped.length === 0) return [];

  const categoryIds = grouped
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });

  const catMap = new Map(categories.map((c) => [c.id, c]));

  const total = grouped.reduce(
    (sum, g) => sum + parseFloat(String(g._sum.amount ?? '0')),
    0,
  );

  return grouped.map((g) => {
    const cat = catMap.get(g.categoryId ?? '');
    const amount = parseFloat(String(g._sum.amount ?? '0'));

    return {
      categoryId: g.categoryId ?? 'unknown',
      categoryName: cat?.name ?? 'Other',
      color: cat?.color ?? '#94A3B8',
      total: toDecimalString(g._sum.amount),
      percentage: total > 0 ? Math.round((amount / total) * 100 * 10) / 10 : 0,
      transactionCount: g._count.id,
    };
  });
};

// ─── Daily Spending ───────────────────────────────────────────────────────────

export const getDailySpending = async (
  familyId: string,
  from: Date,
  to: Date,
): Promise<DailySpendingItem[]> => {
  const transactions = await prisma.transaction.findMany({
    where: {
      familyId,
      type: { in: ['INCOME', 'EXPENSE'] },
      date: { gte: from, lte: to },
    },
    select: { date: true, amount: true, type: true },
  });

  // Build a map keyed by YYYY-MM-DD for fast lookup
  const dayMap = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    const key = format(tx.date, 'yyyy-MM-dd');
    const existing = dayMap.get(key) ?? { income: 0, expense: 0 };
    const amount = parseFloat(String(tx.amount));

    if (tx.type === 'INCOME') {
      existing.income += amount;
    } else {
      existing.expense += amount;
    }

    dayMap.set(key, existing);
  }

  // Fill every calendar day in the range (including days with no transactions)
  const days = eachDayOfInterval({ start: from, end: to });

  return days.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const data = dayMap.get(key) ?? { income: 0, expense: 0 };

    return {
      date: key,
      income: data.income.toFixed(2),
      expense: data.expense.toFixed(2),
    };
  });
};
