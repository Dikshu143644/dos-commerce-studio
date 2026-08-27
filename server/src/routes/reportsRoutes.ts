import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/reportsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard-metrics', getDashboardMetrics);

export default router;
