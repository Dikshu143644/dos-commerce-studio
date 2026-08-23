import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AuditLog } from '@/types/database';

export interface AuditLogFilters {
  user_id?: string;
  entity_type?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { page = 1, pageSize = 20, user_id, entity_type, action, date_from, date_to } = filters;

  return useQuery({
    queryKey: ['audit_logs', { page, pageSize, user_id, entity_type, action, date_from, date_to }],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (user_id) {
        query = query.eq('user_id', user_id);
      }
      if (entity_type) {
        query = query.eq('entity_type', entity_type);
      }
      if (action) {
        query = query.eq('action', action);
      }
      if (date_from) {
        query = query.gte('created_at', date_from);
      }
      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: data as AuditLog[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useAuditLogsByEntity(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['audit_logs', 'entity', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!entityId,
  });
}
