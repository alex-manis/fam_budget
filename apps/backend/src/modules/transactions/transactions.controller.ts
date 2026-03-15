import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCode } from '../../shared/errors/error-codes.js';
import { listTransactions } from './transactions.service.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
});

const resolveFamilyId = (req: Request): string => {
  const familyId = (req as Request & { familyId?: string }).familyId;
  if (!familyId) {
    throw AppError.unauthorized(ErrorCode.UNAUTHORIZED, 'Authentication required');
  }
  return familyId;
};

export const getTransactions = async (
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

    const { page, limit, from, to, type } = parsed.data;
    const familyId = resolveFamilyId(req);

    const options = {
      familyId,
      page,
      limit,
      ...(from !== undefined && { from: new Date(from) }),
      ...(to !== undefined && { to: new Date(to) }),
      ...(type !== undefined && { type }),
    };

    const { items, total } = await listTransactions(options);

    res.json({
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};
