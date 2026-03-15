import express from 'express';
import { importRouter } from './modules/import/import.router.js';
import { errorMiddleware } from './middleware/error.middleware.js';

export const createApp = (): express.Application => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Routes
  app.use('/api/v1/import', importRouter);

  // Must be last
  app.use(errorMiddleware);

  return app;
};
