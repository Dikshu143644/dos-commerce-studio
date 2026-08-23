import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/database';
import type { LowStockAlert } from '@/services/inventory/types';

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['inventory', 'low_stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          product_id,
          warehouse_id,
          quantity,
          products:product_id (id, name, sku, reorder_point, min_stock_level),
          warehouses:warehouse_id (id, name)
        `);

      if (error) throw error;

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
    },
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['notifications', 'low_stock_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'warning')
        .ilike('title', '%Low Stock%')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
