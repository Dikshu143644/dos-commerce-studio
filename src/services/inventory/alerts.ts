import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/database';
import type { LowStockAlert } from './types';

/**
 * Scans inventory and returns products below their reorder point.
 */
export async function checkLowStock(): Promise<LowStockAlert[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      product_id,
      warehouse_id,
      quantity,
      products:product_id (id, name, sku, reorder_point, min_stock_level),
      warehouses:warehouse_id (id, name)
    `);

  if (error) {
    throw new Error(`Failed to check low stock: ${error.message}`);
  }

  const alerts: LowStockAlert[] = [];

  for (const record of data ?? []) {
    const product = record.products as unknown as {
      id: string;
      name: string;
      sku: string;
      reorder_point: number;
      min_stock_level: number;
    };
    const warehouse = record.warehouses as unknown as {
      id: string;
      name: string;
    };

    if (product && warehouse && record.quantity < product.reorder_point) {
      alerts.push({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        warehouse_id: warehouse.id,
        warehouse_name: warehouse.name,
        current_quantity: record.quantity,
        reorder_point: product.reorder_point,
        min_stock_level: product.min_stock_level,
      });
    }
  }

  return alerts;
}

/**
 * Generates notification records for inventory managers about low-stock products.
 */
export async function generateAlerts(userId: string): Promise<Notification[]> {
  const lowStockProducts = await checkLowStock();

  if (lowStockProducts.length === 0) {
    return [];
  }

  const notifications = lowStockProducts.map((alert) => ({
    user_id: userId,
    type: 'warning' as const,
    title: `Low Stock Alert: ${alert.product_name}`,
    message: `${alert.product_name} (${alert.sku}) in ${alert.warehouse_name} is below reorder point. Current: ${alert.current_quantity}, Reorder Point: ${alert.reorder_point}`,
    is_read: false,
    action_url: `/inventory/products/${alert.product_id}`,
  }));

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) {
    throw new Error(`Failed to create low stock notifications: ${error.message}`);
  }

  return (data ?? []) as Notification[];
}

/**
 * Marks a notification as read (dismisses the alert).
 */
export async function dismissAlert(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    throw new Error(`Failed to dismiss alert: ${error.message}`);
  }
}

/**
 * Returns products below their min_stock_level with current vs required quantities.
 */
export async function getLowStockProducts(): Promise<LowStockAlert[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      product_id,
      warehouse_id,
      quantity,
      products:product_id (id, name, sku, reorder_point, min_stock_level),
      warehouses:warehouse_id (id, name)
    `);

  if (error) {
    throw new Error(`Failed to fetch low stock products: ${error.message}`);
  }

  const alerts: LowStockAlert[] = [];

  for (const record of data ?? []) {
    const product = record.products as unknown as {
      id: string;
      name: string;
      sku: string;
      reorder_point: number;
      min_stock_level: number;
    };
    const warehouse = record.warehouses as unknown as {
      id: string;
      name: string;
    };

    if (product && warehouse && record.quantity < product.min_stock_level) {
      alerts.push({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        warehouse_id: warehouse.id,
        warehouse_name: warehouse.name,
        current_quantity: record.quantity,
        reorder_point: product.reorder_point,
        min_stock_level: product.min_stock_level,
      });
    }
  }

  return alerts;
}
