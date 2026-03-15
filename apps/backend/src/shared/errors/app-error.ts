import type { ErrorCode } from './error-codes.js';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public override readonly message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code: ErrorCode, message: string, details?: unknown): AppError {
    return new AppError(code, message, 400, details);
  }

  static notFound(code: ErrorCode, message: string): AppError {
    return new AppError(code, message, 404);
  }

  static unauthorized(code: ErrorCode, message: string): AppError {
    return new AppError(code, message, 401);
  }

  static forbidden(code: ErrorCode, message: string): AppError {
    return new AppError(code, message, 403);
  }
}
