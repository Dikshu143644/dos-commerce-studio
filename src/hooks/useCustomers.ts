import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Customer, CustomerType } from '@/types/database';

export interface CustomerFilters {
  search?: string;
  customer_type?: CustomerType;
  is_active?: boolean;
  page?: number;
  pageSize?: number;
}

export function useCustomers(filters: CustomerFilters = {}) {
  const { page = 1, pageSize = 20, search, customer_type, is_active } = filters;

  return useQuery({
    queryKey: ['customers', { page, pageSize, search, customer_type, is_active }],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
      }
      if (customer_type) {
        query = query.eq('customer_type', customer_type);
      }
      if (is_active !== undefined) {
        query = query.eq('is_active', is_active);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      const formattedData = ((data ?? []) as any[]).map((c) => ({
        ...c,
        name: c.name || c.contact_person || c.company_name || 'Client',
        company: c.company || c.company_name || 'Company',
      }));
      return {
        data: formattedData as Customer[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      const raw = data as any;
      return {
        ...raw,
        name: raw.name || raw.contact_person || raw.company_name || 'Client',
        company: raw.company || raw.company_name || 'Company',
      } as Customer;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: any) => {
      const payload = {
        name: customer.name || customer.contact_person || customer.company || 'Customer',
        company: customer.company || customer.company_name || customer.name || 'Company',
        company_name: customer.company_name || customer.company || customer.name || 'Company',
        contact_person: customer.contact_person || customer.name || 'Contact Person',
        email: customer.email || null,
        phone: customer.phone || null,
        customer_type: customer.customer_type || 'regular',
        address: customer.address || null,
        city: customer.city || null,
        country: customer.country || 'India',
        notes: customer.notes || null,
        is_active: customer.is_active !== undefined ? customer.is_active : true,
      };
      const { data, error } = await supabase
        .from('customers')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.setQueryData(['customers', data.id], data);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
