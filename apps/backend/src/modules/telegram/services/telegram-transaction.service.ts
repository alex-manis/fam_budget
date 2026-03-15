import { prisma } from '../../../infrastructure/prisma/prisma.client.js';
import { classifyTransaction } from '../../ai/classification/classifier.service.js';
import type { AddedTransactionData } from '../formatters/message.formatter.js';

interface AddTransactionInput {
  description: string;
  amount: number;
  userId: string;
  familyId: string;
  accountId: string;
}

interface AddTransactionResult {
  data: AddedTransactionData;
}

/**
 * Creates a manual EXPENSE transaction from a Telegram /add command.
 *
 * Pipeline:
 *  1. Classify description via rule engine / AI
 *  2. Resolve categoryId from classification result
 *  3. Persist transaction
 */
export const addTransaction = async (
  input: AddTransactionInput,
): Promise<AddTransactionResult> => {
  const { description, amount, userId, familyId, accountId } = input;

  // Classify using the same service used during CSV import
  const classification = await classifyTransaction({
    description,
    amount,
    date: new Date(),
  });

  // Resolve the category from DB (may be null if not seeded yet)
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ isSystem: true }, { familyId }],
      name: { equals: classification.categoryName, mode: 'insensitive' },
    },
    select: { id: true, name: true },
  });

  await prisma.transaction.create({
    data: {
      amount: amount.toFixed(2),
      currency: 'ILS',
      type: 'EXPENSE',
      source: 'MANUAL',
      description,
      date: new Date(),
      categoryId: category?.id ?? null,
      isAiClassified: classification.source === 'ai',
      accountId,
      userId,
      familyId,
    },
  });

  return {
    data: {
      description,
      amount,
      categoryName: category?.name ?? classification.categoryName,
      source: classification.source,
    },
  };
};
