import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getInsights } from './insights.controller.js';

export const insightsRouter = Router();

insightsRouter.use(requireAuth);

insightsRouter.get('/', getInsights);
