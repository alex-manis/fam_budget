import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { TransactionListItem, ListOptions } from './transactions.types.js';

export const listTransactions = async (
  options: ListOptions,
): Promise<{ items: TransactionListItem[]; total: number }> => {
  const { familyId, page, limit, from, to, type } = options;

  const where = {
    familyId,
    ...(type && { type }),
    ...(from && to && { date: { gte: from, lte: to } }),
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        amount: true,
        currency: true,
        type: true,
        source: true,
        description: true,
        merchant: true,
        date: true,
        isAiClassified: true,
        createdAt: true,
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
        account: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items: items.map((tx) => ({
      id: tx.id,
      amount: tx.amount.toString(),
      currency: tx.currency,
      type: tx.type,
      source: tx.source,
      description: tx.description,
      merchant: tx.merchant,
      date: tx.date.toISOString(),
      isAiClassified: tx.isAiClassified,
      createdAt: tx.createdAt.toISOString(),
      category: tx.category
        ? {
            id: tx.category.id,
            name: tx.category.name,
            icon: tx.category.icon,
            color: tx.category.color,
          }
        : null,
      account: { id: tx.account.id, name: tx.account.name },
    })),
    total,
  };
};
