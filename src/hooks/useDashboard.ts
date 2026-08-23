import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DashboardKPIs {
  totalProducts: number;
  lowStockCount: number;
  activeDealsValue: number;
  monthlyRevenue: number;
  pendingOrdersCount: number;
  totalCustomers: number;
  totalWarehouses: number;
  openLeadsCount: number;
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardKPIs> => {
      // Fetch all KPIs in parallel
      const [
        productsResult,
        dealsResult,
        revenueResult,
        pendingOrdersResult,
        customersResult,
        warehousesResult,
        leadsResult,
        inventoryResult,
      ] = await Promise.all([
        // Total products count
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        // Active deals value (not closed_lost)
        supabase
          .from('deals')
          .select('value')
          .not('stage', 'eq', 'closed_lost'),
        // Monthly revenue from sales orders (current month)
        supabase
          .from('sales_orders')
          .select('total_amount')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .in('status', ['confirmed', 'processing', 'shipped', 'delivered']),
        // Pending orders count
        supabase
          .from('sales_orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['draft', 'confirmed', 'processing']),
        // Total customers
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        // Total active warehouses
        supabase.from('warehouses').select('*', { count: 'exact', head: true }).eq('is_active', true),
        // Open leads count
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .not('status', 'in', '("won","lost")'),
        // Inventory with product join for low stock detection
        supabase
          .from('inventory')
          .select('quantity, product_id, products(min_stock_level)'),
      ]);

      const activeDealsValue = (dealsResult.data ?? []).reduce(
        (sum, deal) => sum + (deal.value ?? 0),
        0
      );

      const monthlyRevenue = (revenueResult.data ?? []).reduce(
        (sum, order) => sum + (order.total_amount ?? 0),
        0
      );

      // Calculate low stock from inventory data
      let lowStockCount = 0;
      if (inventoryResult.data) {
        for (const item of inventoryResult.data) {
          const products = item.products as unknown as { min_stock_level: number } | null;
          const minLevel = products?.min_stock_level ?? 0;
          if (item.quantity < minLevel) {
            lowStockCount++;
          }
        }
      }

      return {
        totalProducts: productsResult.count ?? 0,
        lowStockCount,
        activeDealsValue,
        monthlyRevenue,
        pendingOrdersCount: pendingOrdersResult.count ?? 0,
        totalCustomers: customersResult.count ?? 0,
        totalWarehouses: warehousesResult.count ?? 0,
        openLeadsCount: leadsResult.count ?? 0,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard
  });
}
