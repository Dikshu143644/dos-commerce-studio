import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Warehouse } from '../models/Warehouse.js';
import { Inventory } from '../models/Inventory.js';
import { StockMovement } from '../models/StockMovement.js';

// --- PRODUCTS ---
export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const products = await Product.find().populate('category', 'name slug').sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    const inventory = await Inventory.find({ product: product._id }).populate('warehouse');
    res.json({ success: true, data: { product, inventory } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- CATEGORIES ---
export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await Category.find().populate('parent', 'name');
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- WAREHOUSES ---
export async function getWarehouses(_req: Request, res: Response): Promise<void> {
  try {
    const warehouses = await Warehouse.find().populate('branch', 'name location');
    res.json({ success: true, count: warehouses.length, data: warehouses });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createWarehouse(req: Request, res: Response): Promise<void> {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- STOCK MOVEMENTS & ADJUSTMENTS ---
export async function getStockMovements(_req: Request, res: Response): Promise<void> {
  try {
    const movements = await StockMovement.find()
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .populate('destination_warehouse', 'name code')
      .populate('performed_by', 'full_name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: movements.length, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function recordMovement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { product, warehouse, destination_warehouse, type, quantity, reference_type, reference_id, notes } = req.body;

    const movement = await StockMovement.create({
      product,
      warehouse,
      destination_warehouse,
      type,
      quantity,
      reference_type: reference_type || 'manual_adjustment',
      reference_id,
      notes,
      performed_by: req.user?._id,
    });

    // Update inventory record
    let inv = await Inventory.findOne({ product, warehouse });
    if (!inv) {
      inv = new Inventory({ product, warehouse, quantity: 0 });
    }

    if (type === 'in') {
      inv.quantity += quantity;
    } else if (type === 'out') {
      inv.quantity = Math.max(0, inv.quantity - quantity);
    } else if (type === 'adjustment') {
      inv.quantity = quantity;
    } else if (type === 'transfer' && destination_warehouse) {
      inv.quantity = Math.max(0, inv.quantity - quantity);

      let destInv = await Inventory.findOne({ product, warehouse: destination_warehouse });
      if (!destInv) {
        destInv = new Inventory({ product, warehouse: destination_warehouse, quantity: 0 });
      }
      destInv.quantity += quantity;
      await destInv.save();
    }

    await inv.save();

    res.status(201).json({ success: true, message: 'Stock movement recorded successfully', data: movement });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function getLowStockProducts(_req: Request, res: Response): Promise<void> {
  try {
    const products = await Product.find().populate('category');
    const lowStockItems = [];

    for (const prod of products) {
      const invs = await Inventory.find({ product: prod._id });
      const totalQty = invs.reduce((acc, i) => acc + i.quantity, 0);

      if (totalQty <= prod.reorder_level) {
        lowStockItems.push({
          product: prod,
          current_stock: totalQty,
          reorder_level: prod.reorder_level,
          deficit: prod.reorder_level - totalQty,
        });
      }
    }

    res.json({ success: true, count: lowStockItems.length, data: lowStockItems });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
