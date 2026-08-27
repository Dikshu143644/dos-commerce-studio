import { Router } from 'express';
import authRoutes from './authRoutes.js';
import crmRoutes from './crmRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import salesRoutes from './salesRoutes.js';
import procurementRoutes from './procurementRoutes.js';
import financeRoutes from './financeRoutes.js';
import portalRoutes from './portalRoutes.js';
import aiRoutes from './aiRoutes.js';
import reportsRoutes from './reportsRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/crm', crmRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', salesRoutes);
router.use('/procurement', procurementRoutes);
router.use('/finance', financeRoutes);
router.use('/portal', portalRoutes);
router.use('/ai', aiRoutes);
router.use('/reports', reportsRoutes);
router.use('/settings', settingsRoutes);

export default router;
