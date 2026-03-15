import { Router } from 'express';
import { getInsights } from './insights.controller.js';

export const insightsRouter = Router();

insightsRouter.get('/', getInsights);
