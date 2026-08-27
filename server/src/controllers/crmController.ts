import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Deal } from '../models/Deal.js';
import { Activity } from '../models/Activity.js';
import { Quotation } from '../models/Quotation.js';
import { SalesOrder } from '../models/SalesOrder.js';

// --- CUSTOMERS ---
export async function getCustomers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createCustomer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const count = await Customer.countDocuments();
    const code = `CUST-${String(count + 1).padStart(4, '0')}`;
    const customer = await Customer.create({ ...req.body, code, assigned_to: req.user?._id });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- LEADS ---
export async function getLeads(req: AuthRequest, res: Response): Promise<void> {
  try {
    const leads = await Lead.find().populate('assigned_to', 'full_name email').sort({ createdAt: -1 });
    res.json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createLead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const lead = await Lead.create({ ...req.body, assigned_to: req.user?._id });
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function updateLeadStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const lead = await Lead.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- DEALS ---
export async function getDeals(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deals = await Deal.find()
      .populate('customer', 'company_name code')
      .populate('lead', 'name company_name')
      .populate('assigned_to', 'full_name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: deals.length, data: deals });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createDeal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deal = await Deal.create({ ...req.body, assigned_to: req.user?._id });
    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function updateDealStage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { stage, probability } = req.body;
    const deal = await Deal.findByIdAndUpdate(id, { stage, probability }, { new: true });
    res.json({ success: true, data: deal });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- ACTIVITIES ---
export async function getActivities(req: AuthRequest, res: Response): Promise<void> {
  try {
    const activities = await Activity.find().populate('performed_by', 'full_name').sort({ createdAt: -1 });
    res.json({ success: true, count: activities.length, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createActivity(req: AuthRequest, res: Response): Promise<void> {
  try {
    const activity = await Activity.create({ ...req.body, performed_by: req.user?._id });
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- QUOTATIONS ---
export async function getQuotations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quotations = await Quotation.find().populate('created_by', 'full_name email').sort({ createdAt: -1 });
    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createQuotation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const count = await Quotation.countDocuments();
    const quotation_number = `QT-2026-${String(count + 1).padStart(3, '0')}`;
    const quotation = await Quotation.create({ ...req.body, quotation_number, created_by: req.user?._id });
    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function convertQuotationToOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    quotation.status = 'accepted';
    await quotation.save();

    const soCount = await SalesOrder.countDocuments();
    const order_number = `SO-2026-${String(soCount + 1).padStart(3, '0')}`;

    // Auto-create sales order
    const salesOrder = await SalesOrder.create({
      order_number,
      customer: quotation.customer || req.body.customer_id,
      warehouse: req.body.warehouse_id,
      status: 'confirmed',
      items: quotation.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        total: item.amount,
      })),
      subtotal: quotation.subtotal,
      tax_total: quotation.tax_total,
      total_amount: quotation.total_amount,
      notes: `Converted from commercial quotation ${quotation.quotation_number}`,
      created_by: req.user?._id,
    });

    res.json({
      success: true,
      message: `Quotation converted into Sales Order ${salesOrder.order_number}`,
      data: salesOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
