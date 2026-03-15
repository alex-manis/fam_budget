import type { Request, Response, NextFunction } from 'express';
import { importService } from './import.service.js';
import { importCsvBodySchema } from './import.schema.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCode } from '../../shared/errors/error-codes.js';
import type { SupportedBankFormat, StartImportOptions } from './import.types.js';

/**
 * POST /api/v1/import/csv
 *
 * Accepts a multipart upload, validates fields, starts the async import job,
 * and returns 202 immediately with the job ID for polling.
 */
export const uploadCsv = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.file) {
      throw AppError.badRequest(ErrorCode.INVALID_CSV, 'No file uploaded');
    }

    const bodyParse = importCsvBodySchema.safeParse(req.body);
    if (!bodyParse.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Invalid request body', {
        fields: bodyParse.error.flatten().fieldErrors,
      });
    }

    const userId = (req as Request & { userId?: string }).userId;
    const familyId = (req as Request & { familyId?: string }).familyId;
    if (!familyId || !userId) {
      throw AppError.unauthorized(ErrorCode.UNAUTHORIZED, 'Authentication required');
    }

    const options: StartImportOptions = {
      accountId: bodyParse.data.accountId,
      userId,
      familyId,
    };
    if (bodyParse.data.format) {
      options.formatHint = bodyParse.data.format as SupportedBankFormat;
    }
    const job = importService.start(req.file.buffer, options);

    res.status(202).json({
      data: {
        jobId: job.jobId,
        status: job.status,
        totalRows: job.totalRows,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/import/csv/jobs/:jobId
 *
 * Returns the current state of an import job for the client to poll.
 */
export const getImportJob = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { jobId } = req.params as { jobId: string };
    const job = importService.getJob(jobId);

    if (!job) {
      throw AppError.notFound(ErrorCode.IMPORT_JOB_NOT_FOUND, `Import job "${jobId}" not found`);
    }

    res.json({ data: job });
  } catch (err) {
    next(err);
  }
};
