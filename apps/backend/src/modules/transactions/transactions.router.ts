import { Router } from 'express';
import { getTransactions } from './transactions.controller.js';

export const transactionsRouter = Router();

transactionsRouter.get('/', getTransactions);
