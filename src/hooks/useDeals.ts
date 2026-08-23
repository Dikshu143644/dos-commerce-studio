import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Deal, DealStage } from '@/types/database';

export interface DealFilters {
  stage?: DealStage;
  assigned_to?: string;
  customer_id?: string;
  page?: number;
  pageSize?: number;
}

export function useDeals(filters: DealFilters = {}) {
  const { page = 1, pageSize = 20, stage, assigned_to, customer_id } = filters;

  return useQuery({
    queryKey: ['deals', { page, pageSize, stage, assigned_to, customer_id }],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select('*', { count: 'exact' });

      if (stage) {
        query = query.eq('stage', stage);
      }
      if (assigned_to) {
        query = query.eq('assigned_to', assigned_to);
      }
      if (customer_id) {
        query = query.eq('customer_id', customer_id);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: data as Deal[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Deal;
    },
    enabled: !!id,
  });
}

export function useDealsValueByStage() {
  return useQuery({
    queryKey: ['deals', 'value-by-stage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('stage, value')
        .not('stage', 'eq', 'closed_lost');
      if (error) throw error;

      const stageValues: Record<string, number> = {};
      for (const deal of data ?? []) {
        stageValues[deal.stage] = (stageValues[deal.stage] ?? 0) + (deal.value ?? 0);
      }
      return stageValues;
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'won_at' | 'lost_at' | 'lost_reason'>) => {
      const { data, error } = await supabase
        .from('deals')
        .insert(deal)
        .select()
        .single();
      if (error) throw error;
      return data as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Deal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.setQueryData(['deals', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      const updates: Partial<Deal> = { stage };
      if (stage === 'closed_won') {
        updates.won_at = new Date().toISOString();
      }
      if (stage === 'closed_lost') {
        updates.lost_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Deal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.setQueryData(['deals', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
