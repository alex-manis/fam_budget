import express from 'express';
import { importRouter } from './modules/import/import.router.js';
import { analyticsRouter } from './modules/analytics/analytics.router.js';
import { transactionsRouter } from './modules/transactions/transactions.router.js';
import { insightsRouter } from './modules/insights/insights.router.js';
import { errorMiddleware } from './middleware/error.middleware.js';

export const createApp = (): express.Application => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Allow dashboard dev server to call the API without CORS issues
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    next();
  });

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Routes
  app.use('/api/v1/import', importRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/transactions', transactionsRouter);
  app.use('/api/v1/insights', insightsRouter);

  // Must be last
  app.use(errorMiddleware);

  return app;
};
