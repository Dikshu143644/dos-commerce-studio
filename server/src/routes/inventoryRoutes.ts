import { Router } from 'express';
import {
  getProducts,
  createProduct,
  getProductById,
  getCategories,
  createCategory,
  getWarehouses,
  createWarehouse,
  getStockMovements,
  recordMovement,
  getLowStockProducts,
} from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Products
router.get('/products', getProducts);
router.post('/products', createProduct);
router.get('/products/low-stock', getLowStockProducts);
router.get('/products/:id', getProductById);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);

// Warehouses
router.get('/warehouses', getWarehouses);
router.post('/warehouses', createWarehouse);

// Stock Movements & Transfers
router.get('/movements', getStockMovements);
router.post('/movements', recordMovement);

export default router;
