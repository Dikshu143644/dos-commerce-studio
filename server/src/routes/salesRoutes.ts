import { Router } from 'express';
import {
  getSalesOrders,
  createSalesOrder,
  getInvoices,
  createInvoice,
  getPayments,
  recordPayment,
  getReturns,
  processReturn,
} from '../controllers/salesController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Orders
router.get('/orders', getSalesOrders);
router.post('/orders', createSalesOrder);

// Invoices
router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);

// Payments
router.get('/payments', getPayments);
router.post('/payments', recordPayment);

// Returns
router.get('/returns', getReturns);
router.patch('/returns/:id', processReturn);

export default router;
