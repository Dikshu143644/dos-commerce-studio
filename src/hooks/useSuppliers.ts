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
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      const formatted = ((data ?? []) as any[]).map((s) => ({
        ...s,
        name: s.name || s.company_name || 'Vendor',
        contact_name: s.contact_name || s.contact_person || 'Contact',
      }));
      return {
        data: formatted as Supplier[],
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
      const raw = data as any;
      return {
        ...raw,
        name: raw.name || raw.company_name || 'Vendor',
        contact_name: raw.contact_name || raw.contact_person || 'Contact',
      } as Supplier;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: any) => {
      const payload = {
        name: supplier.name || supplier.company_name || 'Supplier Inc',
        company_name: supplier.company_name || supplier.name || 'Supplier Inc',
        contact_name: supplier.contact_name || supplier.contact_person || 'Contact Person',
        contact_person: supplier.contact_person || supplier.contact_name || 'Contact Person',
        email: supplier.email || null,
        phone: supplier.phone || null,
        address: supplier.address || null,
        city: supplier.city || null,
        state: supplier.state || null,
        gst_number: supplier.gst_number || null,
        payment_terms: supplier.payment_terms || 'Net 30',
        rating: supplier.rating !== undefined ? supplier.rating : 3,
        is_active: supplier.is_active !== undefined ? supplier.is_active : true,
      };
      const { data, error } = await supabase
        .from('suppliers')
        .insert(payload)
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
