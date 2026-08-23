import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CrmActivity, FollowUpRule } from '@/types/database';
import {
  scheduleFollowUp,
  getOverdueFollowUps,
  snoozeFollowUp,
} from '@/services/crm';
import type { ScheduleFollowUpInput, SnoozeFollowUpInput } from '@/services/crm';

/**
 * Fetches upcoming follow-ups: due today + next 7 days, not completed.
 */
export function useUpcomingFollowUps() {
  return useQuery({
    queryKey: ['follow-ups', 'upcoming'],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('activity_type', 'follow_up')
        .is('completed_at', null)
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', sevenDaysFromNow.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as CrmActivity[];
    },
  });
}

/**
 * Fetches overdue follow-ups: past due date and not completed.
 */
export function useOverdueFollowUps() {
  return useQuery({
    queryKey: ['follow-ups', 'overdue'],
    queryFn: async () => {
      return getOverdueFollowUps();
    },
  });
}

/**
 * Mutation to schedule a new follow-up activity.
 */
export function useScheduleFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ScheduleFollowUpInput) => {
      return scheduleFollowUp(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

/**
 * Mutation to snooze (reschedule) a follow-up to a later date.
 */
export function useSnoozeFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SnoozeFollowUpInput) => {
      return snoozeFollowUp(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

/**
 * Fetches all follow-up automation rules.
 */
export function useFollowUpRules() {
  return useQuery({
    queryKey: ['follow-up-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followup_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as FollowUpRule[];
    },
  });
}

/**
 * Mutation to toggle a follow-up rule's is_active status.
 */
export function useToggleRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('followup_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;
      return data as FollowUpRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-rules'] });
    },
  });
}

/**
 * Fetches the count of completed follow-up activities for calculating completion rate.
 */
export function useCompletedFollowUpsCount() {
  return useQuery({
    queryKey: ['follow-ups', 'completed-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('crm_activities')
        .select('*', { count: 'exact', head: true })
        .eq('activity_type', 'follow_up')
        .not('completed_at', 'is', null);

      if (error) throw error;
      return count ?? 0;
    },
  });
}
