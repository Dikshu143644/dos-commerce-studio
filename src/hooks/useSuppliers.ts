import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types/database';

export interface SupplierFilters {
  search?: string;
  is_active?: boolean;
  min_rating?: number;
  page?: number;
  pageSize?: number;
}

export function useSuppliers(filters: SupplierFilters = {}) {
  const { page = 1, pageSize = 20, search, is_active, min_rating } = filters;

  return useQuery({
    queryKey: ['suppliers', { page, pageSize, search, is_active, min_rating }],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (is_active !== undefined) {
        query = query.eq('is_active', is_active);
      }
      if (min_rating !== undefined) {
        query = query.gte('rating', min_rating);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('name');

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: data as Supplier[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Supplier;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();
      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.setQueryData(['suppliers', data.id], data);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
