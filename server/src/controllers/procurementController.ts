import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Supplier } from '../models/Supplier.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { GRN } from '../models/GRN.js';
import { Inventory } from '../models/Inventory.js';
import { StockMovement } from '../models/StockMovement.js';

// --- SUPPLIERS ---
export async function getSuppliers(_req: Request, res: Response): Promise<void> {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createSupplier(req: Request, res: Response): Promise<void> {
  try {
    const count = await Supplier.countDocuments();
    const code = `SUP-${String(count + 1).padStart(4, '0')}`;
    const supplier = await Supplier.create({ ...req.body, code });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- PURCHASE ORDERS ---
export async function getPurchaseOrders(_req: Request, res: Response): Promise<void> {
  try {
    const orders = await PurchaseOrder.find()
      .populate('supplier', 'name code email')
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .populate('created_by', 'full_name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createPurchaseOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const count = await PurchaseOrder.countDocuments();
    const po_number = `PO-2026-${String(count + 1).padStart(3, '0')}`;
    const po = await PurchaseOrder.create({ ...req.body, po_number, created_by: req.user?._id });
    res.status(201).json({ success: true, data: po });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- GOODS RECEIVING (GRN) ---
export async function getGRNs(_req: Request, res: Response): Promise<void> {
  try {
    const grns = await GRN.find()
      .populate('purchase_order', 'po_number')
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .populate('inspected_by', 'full_name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: grns.length, data: grns });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createGRN(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { purchase_order: poId, warehouse, items, delivery_challan_no, transporter, vehicle_no, notes } = req.body;
    const count = await GRN.countDocuments();
    const grn_number = `GRN-2026-${String(count + 1).padStart(3, '0')}`;

    const grn = await GRN.create({
      grn_number,
      purchase_order: poId,
      warehouse,
      items,
      delivery_challan_no,
      transporter,
      vehicle_no,
      notes,
      inspected_by: req.user?._id,
    });

    // Auto-update inventory and create stock movements for accepted items
    for (const item of items) {
      if (item.accepted_quantity > 0) {
        let inv = await Inventory.findOne({ product: item.product, warehouse });
        if (!inv) {
          inv = new Inventory({ product: item.product, warehouse, quantity: 0 });
        }
        inv.quantity += item.accepted_quantity;
        await inv.save();

        await StockMovement.create({
          product: item.product,
          warehouse,
          type: 'in',
          quantity: item.accepted_quantity,
          reference_type: 'purchase_order',
          reference_id: grn.grn_number,
          performed_by: req.user?._id,
        });
      }
    }

    // Update PO received quantities and status
    const po = await PurchaseOrder.findById(poId);
    if (po) {
      let allReceived = true;
      for (const item of items) {
        const poItem = po.items.find((p) => p.product.toString() === item.product.toString());
        if (poItem) {
          poItem.received_quantity = (poItem.received_quantity || 0) + item.accepted_quantity;
          if (poItem.received_quantity < poItem.quantity) {
            allReceived = false;
          }
        }
      }
      po.status = allReceived ? 'received' : 'partially_received';
      await po.save();
    }

    res.status(201).json({ success: true, message: 'GRN created and stock ingested successfully', data: grn });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
