import { Router } from 'express';
import {
  getCustomers,
  createCustomer,
  getLeads,
  createLead,
  updateLeadStatus,
  getDeals,
  createDeal,
  updateDealStage,
  getActivities,
  createActivity,
  getQuotations,
  createQuotation,
  convertQuotationToOrder,
} from '../controllers/crmController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Customers
router.get('/customers', getCustomers);
router.post('/customers', createCustomer);

// Leads
router.get('/leads', getLeads);
router.post('/leads', createLead);
router.patch('/leads/:id/status', updateLeadStatus);

// Deals
router.get('/deals', getDeals);
router.post('/deals', createDeal);
router.patch('/deals/:id/stage', updateDealStage);

// Activities
router.get('/activities', getActivities);
router.post('/activities', createActivity);

// Quotations
router.get('/quotations', getQuotations);
router.post('/quotations', createQuotation);
router.post('/quotations/:id/convert-to-order', convertQuotationToOrder);

export default router;
