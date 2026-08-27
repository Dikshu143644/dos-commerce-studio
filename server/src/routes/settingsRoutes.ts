import { Router } from 'express';
import {
  getUsers,
  updateUserRole,
  getRoles,
  getBranches,
  createBranch,
  getAuditLogs,
  getSettings,
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/users', getUsers);
router.patch('/users/:id/role', authorizeRoles('super_admin', 'branch_manager'), updateUserRole);

router.get('/roles', getRoles);

router.get('/branches', getBranches);
router.post('/branches', authorizeRoles('super_admin'), createBranch);

router.get('/audit-logs', authorizeRoles('super_admin'), getAuditLogs);

router.get('/general', getSettings);

export default router;
