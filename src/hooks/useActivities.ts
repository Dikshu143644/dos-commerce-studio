import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CrmActivity, ActivityType } from '@/types/database';

export interface ActivityFilters {
  activity_type?: ActivityType;
  customer_id?: string;
  lead_id?: string;
  deal_id?: string;
  performed_by?: string;
  page?: number;
  pageSize?: number;
}

export function useActivities(filters: ActivityFilters = {}) {
  const { page = 1, pageSize = 20, activity_type, customer_id, lead_id, deal_id, performed_by } = filters;

  return useQuery({
    queryKey: ['activities', { page, pageSize, activity_type, customer_id, lead_id, deal_id, performed_by }],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select('*', { count: 'exact' });

      if (activity_type) {
        query = query.eq('activity_type', activity_type);
      }
      if (customer_id) {
        query = query.eq('customer_id', customer_id);
      }
      if (lead_id) {
        query = query.eq('lead_id', lead_id);
      }
      if (deal_id) {
        query = query.eq('deal_id', deal_id);
      }
      if (performed_by) {
        query = query.eq('performed_by', performed_by);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: data as CrmActivity[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useActivity(id: string | undefined) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as CrmActivity;
    },
    enabled: !!id,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: Omit<CrmActivity, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single();
      if (error) throw error;
      return data as CrmActivity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmActivity> & { id: string }) => {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CrmActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.setQueryData(['activities', data.id], data);
    },
  });
}

export function useCompleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('activities')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CrmActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.setQueryData(['activities', data.id], data);
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
