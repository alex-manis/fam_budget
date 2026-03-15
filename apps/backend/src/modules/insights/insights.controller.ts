import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCode } from '../../shared/errors/error-codes.js';
import { listInsights } from './insights.service.js';
import type { InsightType } from './insights.types.js';

const insightTypeValues = [
  'SPENDING_PATTERN',
  'BUDGET_WARNING',
  'SAVING_OPPORTUNITY',
  'ANOMALY',
  'MONTHLY_SUMMARY',
] as const;

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  type: z.enum(insightTypeValues).optional(),
});

const resolveFamilyId = (req: Request): string =>
  (req as Request & { familyId?: string }).familyId ??
  (req.query['familyId'] as string | undefined) ??
  'placeholder-family-id';

export const getInsights = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Invalid query params', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const familyId = resolveFamilyId(req);
    const data = await listInsights(familyId, parsed.data.limit, parsed.data.type as InsightType | undefined);

    res.json({ data });
  } catch (err) {
    next(err);
  }
};
