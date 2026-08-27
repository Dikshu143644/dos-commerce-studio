import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  updateExpenseStatus,
  getProfitLossSummary,
  getGSTReport,
  getCashFlowMetrics,
} from '../controllers/financeController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.patch('/expenses/:id/status', updateExpenseStatus);

// P&L, GST & Cash Flow Analytics
router.get('/pnl', getProfitLossSummary);
router.get('/gst', getGSTReport);
router.get('/cash-flow', getCashFlowMetrics);

export default router;
