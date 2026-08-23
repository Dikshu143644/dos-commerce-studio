import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useBranchContext } from '@/contexts/BranchContext';

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
  const { activeBranchId } = useBranchContext();

  return useQuery({
    queryKey: ['dashboard', { activeBranchId }],
    queryFn: async (): Promise<DashboardKPIs> => {
      // Build queries with optional branch filter
      let productsQuery = supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
      let dealsQuery = supabase.from('deals').select('value').not('stage', 'eq', 'closed_lost');
      let revenueQuery = supabase
        .from('sales_orders')
        .select('total_amount')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered']);
      let pendingOrdersQuery = supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'confirmed', 'processing']);
      let customersQuery = supabase.from('customers').select('*', { count: 'exact', head: true }).eq('is_active', true);
      let warehousesQuery = supabase.from('warehouses').select('*', { count: 'exact', head: true }).eq('is_active', true);
      let leadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("won","lost")');
      let inventoryQuery = supabase.from('inventory').select('quantity, product_id, products(min_stock_level)');

      // Apply branch filter when a specific branch is selected
      // Note: customers are global and not filtered by branch
      if (activeBranchId) {
        productsQuery = productsQuery.eq('branch_id', activeBranchId);
        dealsQuery = dealsQuery.eq('branch_id', activeBranchId);
        revenueQuery = revenueQuery.eq('branch_id', activeBranchId);
        pendingOrdersQuery = pendingOrdersQuery.eq('branch_id', activeBranchId);
        warehousesQuery = warehousesQuery.eq('branch_id', activeBranchId);
        leadsQuery = leadsQuery.eq('branch_id', activeBranchId);
        inventoryQuery = inventoryQuery.eq('branch_id', activeBranchId);
      }

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
        productsQuery,
        dealsQuery,
        revenueQuery,
        pendingOrdersQuery,
        customersQuery,
        warehousesQuery,
        leadsQuery,
        inventoryQuery,
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
