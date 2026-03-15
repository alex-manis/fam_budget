import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getTransactions } from './transactions.controller.js';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.get('/', getTransactions);
