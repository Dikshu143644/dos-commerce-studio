import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Return } from '../models/Return.js';
import { Inventory } from '../models/Inventory.js';
import { StockMovement } from '../models/StockMovement.js';
import { OrderTracking } from '../models/OrderTracking.js';

// --- SALES ORDERS ---
export async function getSalesOrders(req: Request, res: Response): Promise<void> {
  try {
    const orders = await SalesOrder.find()
      .populate('customer', 'company_name code email')
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createSalesOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const count = await SalesOrder.countDocuments();
    const order_number = `SO-2026-${String(count + 1).padStart(3, '0')}`;

    const salesOrder = await SalesOrder.create({
      ...req.body,
      order_number,
      created_by: req.user?._id,
    });

    // Auto-create tracking record
    const awb_number = `BLD-${Math.floor(100000000 + Math.random() * 900000000)}`;
    await OrderTracking.create({
      sales_order: salesOrder._id,
      order_number: salesOrder.order_number,
      awb_number,
      courier_partner: 'BlueDart Express',
      current_status: 'confirmed',
      destination_city: req.body.destination_city || 'Regional Hub',
      origin_warehouse: salesOrder.warehouse,
      timeline: [
        {
          status_title: 'Order Confirmed & Approved',
          location: 'StockFlow Enterprise Hub',
          description: 'Sales Order verified and queued for pick-and-pack.',
          timestamp: new Date(),
          completed: true,
        },
      ],
    });

    res.status(201).json({ success: true, data: salesOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- INVOICES ---
export async function getInvoices(req: Request, res: Response): Promise<void> {
  try {
    const invoices = await Invoice.find()
      .populate('customer', 'company_name code email')
      .populate('sales_order', 'order_number')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createInvoice(req: AuthRequest, res: Response): Promise<void> {
  try {
    const count = await Invoice.countDocuments();
    const invoice_number = `INV-2026-${String(count + 1).padStart(3, '0')}`;
    const invoice = await Invoice.create({
      ...req.body,
      invoice_number,
      created_by: req.user?._id,
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- PAYMENTS ---
export async function getPayments(req: Request, res: Response): Promise<void> {
  try {
    const payments = await Payment.find()
      .populate('customer', 'company_name code')
      .populate('invoice', 'invoice_number total_amount')
      .populate('recorded_by', 'full_name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function recordPayment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { invoice: invoiceId, amount, payment_method, transaction_reference, notes } = req.body;
    const count = await Payment.countDocuments();
    const payment_number = `PAY-2026-${String(count + 1).padStart(3, '0')}`;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const payment = await Payment.create({
      payment_number,
      invoice: invoice._id,
      customer: invoice.customer,
      amount,
      payment_method,
      transaction_reference,
      notes,
      recorded_by: req.user?._id,
    });

    // Update invoice paid amount
    invoice.amount_paid = (invoice.amount_paid || 0) + amount;
    if (invoice.amount_paid >= invoice.total_amount) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially_paid';
    }
    await invoice.save();

    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- RETURNS ---
export async function getReturns(req: Request, res: Response): Promise<void> {
  try {
    const returns = await Return.find()
      .populate('customer', 'company_name code')
      .populate('sales_order', 'order_number')
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function processReturn(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, restock } = req.body;

    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      res.status(404).json({ success: false, message: 'Return not found' });
      return;
    }

    returnRecord.status = status;
    returnRecord.processed_by = req.user?._id;

    if (status === 'received' && restock) {
      returnRecord.restock_status = true;
      for (const item of returnRecord.items) {
        let inv = await Inventory.findOne({ product: item.product, warehouse: returnRecord.warehouse });
        if (inv) {
          inv.quantity += item.quantity;
          await inv.save();
        }
        await StockMovement.create({
          product: item.product,
          warehouse: returnRecord.warehouse,
          type: 'in',
          quantity: item.quantity,
          reference_type: 'return',
          reference_id: returnRecord.return_number,
          performed_by: req.user?._id,
        });
      }
    }

    await returnRecord.save();
    res.json({ success: true, message: 'Return processed successfully', data: returnRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
