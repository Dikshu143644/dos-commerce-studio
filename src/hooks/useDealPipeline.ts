import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Deal, DealStage } from '@/types/database';
import {
  advanceDealStage,
  closeDeal,
  calculatePipelineValue,
  convertDealToOrder,
} from '@/services/crm';
import type {
  AdvanceDealStageInput,
  CloseDealInput,
  PipelineValueResult,
} from '@/services/crm';

/**
 * Fetches all deals grouped by stage for Kanban display.
 */
export function useDealsByStage() {
  return useQuery({
    queryKey: ['deals', 'by-stage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const deals = (data ?? []) as Deal[];
      const grouped: Record<DealStage, Deal[]> = {
        qualification: [],
        needs_analysis: [],
        proposal: [],
        negotiation: [],
        closed_won: [],
        closed_lost: [],
      };

      for (const deal of deals) {
        if (grouped[deal.stage]) {
          grouped[deal.stage].push(deal);
        }
      }

      return grouped;
    },
  });
}

/**
 * Fetches total weighted pipeline value across all open deals.
 */
export function usePipelineValue() {
  return useQuery<PipelineValueResult>({
    queryKey: ['deals', 'pipeline-value'],
    queryFn: async () => {
      return calculatePipelineValue();
    },
  });
}

/**
 * Mutation to advance a deal to a new stage in the pipeline.
 */
export function useAdvanceDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdvanceDealStageInput) => {
      return advanceDealStage(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Mutation to close a deal as won or lost.
 */
export function useCloseDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CloseDealInput) => {
      return closeDeal(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Mutation to convert a won deal into a sales order.
 */
export function useConvertDealToOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealId, performedBy }: { dealId: string; performedBy: string }) => {
      return convertDealToOrder(dealId, performedBy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
