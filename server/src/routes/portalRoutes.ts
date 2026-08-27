import { Router } from 'express';
import {
  getClientCatalog,
  getCart,
  updateCart,
  getMyOrders,
  getMyInvoices,
  trackOrder,
} from '../controllers/portalController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public / Client catalog and tracking
router.get('/catalog', getClientCatalog);
router.get('/tracking/:query?', trackOrder);

// Authenticated client portal actions
router.get('/cart', authenticate, getCart);
router.post('/cart', authenticate, updateCart);
router.get('/orders', authenticate, getMyOrders);
router.get('/invoices', authenticate, getMyInvoices);

export default router;
