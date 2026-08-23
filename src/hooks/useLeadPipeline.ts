import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Lead, LeadStatus, LeadScore } from '@/types/database';
import {
  convertLeadToCustomerWorkflow,
  bulkAssignLeads,
  calculateLeadScore,
  getHotLeads,
} from '@/services/crm';
import type { ConvertLeadToCustomerInput } from '@/services/crm';

/**
 * Fetches all active leads grouped by status for Kanban display.
 */
export function useLeadsByStage() {
  return useQuery({
    queryKey: ['leads', 'by-stage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const leads = (data ?? []) as Lead[];
      const grouped: Record<LeadStatus, Lead[]> = {
        new: [],
        contacted: [],
        qualified: [],
        proposal: [],
        negotiation: [],
        won: [],
        lost: [],
      };

      for (const lead of leads) {
        if (grouped[lead.status]) {
          grouped[lead.status].push(lead);
        }
      }

      return grouped;
    },
  });
}

/**
 * Fetches the current score and breakdown for a specific lead.
 */
export function useLeadScore(leadId: string | undefined) {
  return useQuery({
    queryKey: ['lead-scores', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('lead_scores')
        .select('*')
        .eq('lead_id', leadId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as LeadScore | null;
    },
    enabled: !!leadId,
  });
}

/**
 * Mutation to convert a lead into a customer using the conversion service workflow.
 */
export function useConvertLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConvertLeadToCustomerInput) => {
      return convertLeadToCustomerWorkflow(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['lead-scores'] });
    },
  });
}

/**
 * Fetches hot leads (score > 70) that are not won/lost.
 */
export function useHotLeads() {
  return useQuery({
    queryKey: ['leads', 'hot'],
    queryFn: async () => {
      return getHotLeads();
    },
  });
}

/**
 * Mutation to bulk assign multiple leads to a sales representative.
 */
export function useBulkAssignLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadIds, assignedTo }: { leadIds: string[]; assignedTo: string }) => {
      return bulkAssignLeads(leadIds, assignedTo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

/**
 * Mutation to recalculate a lead's score.
 */
export function useRecalculateLeadScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      return calculateLeadScore(leadId);
    },
    onSuccess: (_data, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['lead-scores', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
