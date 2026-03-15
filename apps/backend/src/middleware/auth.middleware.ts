import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error.js';
import { ErrorCode } from '../shared/errors/error-codes.js';

/**
 * Minimal bearer-token auth middleware.
 *
 * Expected header:  Authorization: Bearer <familyId>:<userId>
 *
 * This is an intentional stub: the token format is not cryptographically
 * signed yet (JWT / session-cookie support goes here when the auth module
 * lands). The stub exists to enforce that:
 *   1. A token MUST be present — no anonymous access to family data.
 *   2. familyId is derived from the token, not from a query param that
 *      any caller can forge.
 *
 * Replace the parsing block with real JWT verification before production use.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized(ErrorCode.UNAUTHORIZED, 'Authentication required');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw AppError.unauthorized(ErrorCode.UNAUTHORIZED, 'Authentication required');
    }

    // TODO: replace with JWT.verify(token, process.env.JWT_SECRET) when auth module is ready.
    // Stub: token is "<familyId>:<userId>" — never use in production without JWT.
    const [familyId, userId] = token.split(':');
    if (!familyId || !userId) {
      throw AppError.unauthorized(ErrorCode.UNAUTHORIZED, 'Malformed token');
    }

    (req as Request & { familyId: string; userId: string }).familyId = familyId;
    (req as Request & { familyId: string; userId: string }).userId = userId;

    next();
  } catch (err) {
    next(err);
  }
};
