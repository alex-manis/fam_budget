import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCode } from '../../shared/errors/error-codes.js';
import * as analyticsService from './analytics.service.js';

const dateRangeSchema = z.object({
  from: z.string().datetime({ message: 'from must be a valid ISO date' }),
  to: z.string().datetime({ message: 'to must be a valid ISO date' }),
});

const categoryQuerySchema = dateRangeSchema.extend({
  type: z.enum(['INCOME', 'EXPENSE']).default('EXPENSE'),
});

// Resolve familyId from auth context once auth module is wired up.
// For now falls back to a query param so the UI can be tested without auth.
const resolveFamilyId = (req: Request): string =>
  (req as Request & { familyId?: string }).familyId ??
  (req.query['familyId'] as string | undefined) ??
  'placeholder-family-id';

// ─── GET /api/v1/analytics/summary ───────────────────────────────────────────

export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = dateRangeSchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Invalid query params', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const familyId = resolveFamilyId(req);
    const from = new Date(parsed.data.from);
    const to = new Date(parsed.data.to);

    const data = await analyticsService.getSummary(familyId, from, to);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/analytics/by-category ───────────────────────────────────────

export const getByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = categoryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Invalid query params', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const familyId = resolveFamilyId(req);
    const from = new Date(parsed.data.from);
    const to = new Date(parsed.data.to);

    const data = await analyticsService.getByCategory(familyId, from, to, parsed.data.type);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/analytics/daily ─────────────────────────────────────────────

export const getDailySpending = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = dateRangeSchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Invalid query params', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const familyId = resolveFamilyId(req);
    const from = new Date(parsed.data.from);
    const to = new Date(parsed.data.to);

    const data = await analyticsService.getDailySpending(familyId, from, to);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/analytics/forecast ──────────────────────────────────────────
// No query params required — always forecasts the current calendar month.

export const getForecast = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { startOfMonth, endOfMonth } = await import('date-fns');
    const now = new Date();
    const familyId = resolveFamilyId(req);

    const data = await analyticsService.getForecast(
      familyId,
      startOfMonth(now),
      endOfMonth(now),
    );

    res.json({ data });
  } catch (err) {
    next(err);
  }
};
