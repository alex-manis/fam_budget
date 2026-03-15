import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { uploadCsv, getImportJob } from './import.controller.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ErrorCode } from '../../shared/errors/error-codes.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    const isCsv =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/csv' ||
      file.originalname.toLowerCase().endsWith('.csv');

    if (isCsv) {
      cb(null, true);
    } else {
      cb(AppError.badRequest(ErrorCode.INVALID_CSV, 'Only CSV files are accepted'));
    }
  },
});

export const importRouter = Router();

importRouter.use(requireAuth);

importRouter.post('/csv', upload.single('file'), uploadCsv);
importRouter.get('/csv/jobs/:jobId', getImportJob);
