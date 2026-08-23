import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CrmActivity } from '@/types/database';
import {
  createActivity,
  completeActivity,
  autoScheduleFollowUp,
} from '@/services/crm';
import type { CreateActivityInput, CompleteActivityInput } from '@/services/crm';

/**
 * Fetches a paginated activity feed with optional entity filtering.
 * Results are ordered by created_at descending (newest first).
 */
export function useActivityFeed(
  entityType?: 'customer' | 'lead' | 'deal',
  entityId?: string,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ['activity-feed', { entityType, entityId, page, pageSize }],
    queryFn: async () => {
      let query = supabase
        .from('crm_activities')
        .select('*', { count: 'exact' });

      if (entityType && entityId) {
        switch (entityType) {
          case 'customer':
            query = query.eq('customer_id', entityId);
            break;
          case 'lead':
            query = query.eq('lead_id', entityId);
            break;
          case 'deal':
            query = query.eq('deal_id', entityId);
            break;
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data ?? []) as CrmActivity[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

/**
 * Mutation to create a new activity with auto follow-up scheduling.
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const activity = await createActivity(input);

      // Auto-schedule follow-up if there is a linked entity
      if (input.lead_id || input.deal_id) {
        try {
          await autoScheduleFollowUp({
            trigger_event: 'activity_completed',
            entity_id: (input.lead_id ?? input.deal_id) as string,
            entity_type: input.lead_id ? 'lead' : 'deal',
            performed_by: input.performed_by,
            context: { activity_type: input.activity_type },
          });
        } catch {
          // Auto-scheduling failure should not block activity creation
        }
      }

      return activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    },
  });
}

/**
 * Mutation to complete an activity, which triggers next follow-up scheduling.
 */
export function useCompleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteActivityInput) => {
      return completeActivity(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    },
  });
}

/**
 * Fetches today's scheduled activities (not completed) for the current user.
 */
export function useTodayActivities(userId?: string) {
  return useQuery({
    queryKey: ['activities', 'today', userId],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      let query = supabase
        .from('crm_activities')
        .select('*')
        .is('completed_at', null)
        .gte('scheduled_at', startOfDay)
        .lt('scheduled_at', endOfDay)
        .order('scheduled_at', { ascending: true });

      if (userId) {
        query = query.eq('performed_by', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CrmActivity[];
    },
    enabled: userId !== undefined ? !!userId : true,
  });
}
