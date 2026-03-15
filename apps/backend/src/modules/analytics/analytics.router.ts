import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getSummary, getByCategory, getDailySpending, getForecast } from './analytics.controller.js';

export const analyticsRouter = Router();

// All analytics endpoints expose family-scoped financial data.
analyticsRouter.use(requireAuth);

analyticsRouter.get('/summary', getSummary);
analyticsRouter.get('/by-category', getByCategory);
analyticsRouter.get('/daily', getDailySpending);
analyticsRouter.get('/forecast', getForecast);
