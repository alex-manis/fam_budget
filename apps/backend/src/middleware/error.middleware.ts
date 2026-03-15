import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error.js';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Central error handler. Must be the last middleware registered in app.ts. */
export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  // Four-argument signature is required for Express to treat this as an error handler
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Multer file size error
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'LIMIT_FILE_SIZE'
  ) {
    res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 10 MB limit' } });
    return;
  }

  console.error('[Unhandled error]', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
};
