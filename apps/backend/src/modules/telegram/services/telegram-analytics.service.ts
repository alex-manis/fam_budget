import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { prisma } from '../../../infrastructure/prisma/prisma.client.js';
import type { SummaryData, SpentData, ForecastData, CategoryLine } from '../formatters/message.formatter.js';

const toNumber = (decimal: unknown): number =>
  parseFloat(String(decimal ?? '0'));

// ─── Summary ─────────────────────────────────────────────────────────────────

export const getMonthlySummary = async (familyId: string): Promise<SummaryData> => {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  // Total income and expense for the month
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { familyId, type: 'INCOME', date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { familyId, type: 'EXPENSE', date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
  ]);

  // Top 5 expense categories for the month
  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { familyId, type: 'EXPENSE', date: { gte: from, lte: to }, categoryId: { not: null } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 5,
  });

  const categoryIds = grouped
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(categories.map((c: { id: string; name: string }) => [c.id, c.name]));

  const topCategories: CategoryLine[] = grouped.map((g) => ({
    name: categoryMap.get(g.categoryId ?? '') ?? 'Other',
    total: toNumber(g._sum.amount),
  }));

  return {
    monthLabel: format(now, 'MMMM yyyy'),
    totalIncome: toNumber(incomeAgg._sum.amount),
    totalExpense: toNumber(expenseAgg._sum.amount),
    topCategories,
  };
};

// ─── Category spending ────────────────────────────────────────────────────────

export const getCategorySpending = async (
  familyId: string,
  categoryQuery: string,
): Promise<SpentData | null> => {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  // Case-insensitive category name match against family + system categories
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ isSystem: true }, { familyId }],
      name: { contains: categoryQuery, mode: 'insensitive' },
    },
    select: { id: true, name: true },
  });

  if (!category) return null;

  const [spentAgg, txCount, budgetLine] = await Promise.all([
    prisma.transaction.aggregate({
      where: { familyId, type: 'EXPENSE', categoryId: category.id, date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { familyId, type: 'EXPENSE', categoryId: category.id, date: { gte: from, lte: to } },
    }),
    // Find budget limit for this category in the current month
    prisma.budgetCategory.findFirst({
      where: {
        categoryId: category.id,
        budget: { familyId, month: format(now, 'yyyy-MM') },
      },
      select: { limitAmount: true },
    }),
  ]);

  return {
    monthLabel: format(now, 'MMMM yyyy'),
    categoryName: category.name,
    spent: toNumber(spentAgg._sum.amount),
    budgetLimit: budgetLine ? toNumber(budgetLine.limitAmount) : null,
    transactionCount: txCount,
  };
};

// ─── Forecast ─────────────────────────────────────────────────────────────────

export const getSpendingForecast = async (familyId: string): Promise<ForecastData> => {
  const now = new Date();

  // Collect last 3 full months
  const months = [
    subMonths(now, 3),
    subMonths(now, 2),
    subMonths(now, 1),
  ];

  const monthlyHistory = await Promise.all(
    months.map(async (month) => {
      const agg = await prisma.transaction.aggregate({
        where: {
          familyId,
          type: 'EXPENSE',
          date: { gte: startOfMonth(month), lte: endOfMonth(month) },
        },
        _sum: { amount: true },
      });
      return {
        month: format(month, 'MMM yyyy'),
        total: toNumber(agg._sum.amount),
      };
    }),
  );

  const totals = monthlyHistory.map((m) => m.total);
  const predicted = totals.length > 0
    ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
    : 0;

  return {
    nextMonthLabel: format(now, 'MMMM yyyy'),
    predicted,
    monthlyHistory,
  };
};
