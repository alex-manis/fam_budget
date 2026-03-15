import { Router } from 'express';
import { getSummary, getByCategory, getDailySpending } from './analytics.controller.js';

export const analyticsRouter = Router();

analyticsRouter.get('/summary', getSummary);
analyticsRouter.get('/by-category', getByCategory);
analyticsRouter.get('/daily', getDailySpending);
