import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import type { InsightItem, InsightType } from './insights.types.js';

export const listInsights = async (
  familyId: string,
  limit: number,
  type?: InsightType,
): Promise<InsightItem[]> => {
  const insights = await prisma.aiInsight.findMany({
    where: {
      familyId,
      ...(type && { type }),
    },
    orderBy: { generatedAt: 'desc' },
    take: limit,
  });

  return insights.map((insight) => ({
    id: insight.id,
    type: insight.type as InsightType,
    content: insight.content,
    periodStart: insight.periodStart.toISOString(),
    periodEnd: insight.periodEnd.toISOString(),
    generatedAt: insight.generatedAt.toISOString(),
  }));
};
