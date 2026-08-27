import { Router } from 'express';
import {
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  getGRNs,
  createGRN,
} from '../controllers/procurementController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Suppliers
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);

// Purchase Orders
router.get('/orders', getPurchaseOrders);
router.post('/orders', createPurchaseOrder);

// GRN
router.get('/grn', getGRNs);
router.post('/grn', createGRN);

export default router;
