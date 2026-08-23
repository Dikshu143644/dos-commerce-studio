import { supabase } from '@/lib/supabase';
import type { Deal, CrmActivity, DealStage } from '@/types/database';
import type {
  CreateDealInput,
  AdvanceDealStageInput,
  CloseDealInput,
  PipelineValueResult,
} from './types';

/**
 * Valid deal stage transitions.
 */
const VALID_STAGE_TRANSITIONS: Record<string, string[]> = {
  qualification: ['needs_analysis', 'closed_lost'],
  needs_analysis: ['proposal', 'closed_lost'],
  proposal: ['negotiation', 'closed_lost'],
  negotiation: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: ['qualification'], // Allow reopening lost deals
};

/**
 * Default probability per stage.
 */
const STAGE_PROBABILITY: Record<string, number> = {
  qualification: 20,
  needs_analysis: 40,
  proposal: 60,
  negotiation: 80,
  closed_won: 100,
  closed_lost: 0,
};

/**
 * Creates a deal (from lead or standalone).
 */
export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      title: input.title,
      customer_id: input.customer_id ?? null,
      lead_id: input.lead_id ?? null,
      stage: input.stage ?? 'qualification',
      value: input.value,
      probability: input.probability ?? STAGE_PROBABILITY[input.stage ?? 'qualification'],
      expected_close_date: input.expected_close_date ?? null,
      assigned_to: input.assigned_to ?? null,
      notes: input.notes ?? null,
      converted_from_lead_id: input.converted_from_lead_id ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create deal: ${error.message}`);
  }

  return deal as Deal;
}

/**
 * Advances a deal through the pipeline stages with validation.
 */
export async function advanceDealStage(input: AdvanceDealStageInput): Promise<Deal> {
  // Fetch current deal
  const { data: deal, error: fetchError } = await supabase
    .from('deals')
    .select('*')
    .eq('id', input.deal_id)
    .single();

  if (fetchError || !deal) {
    throw new Error(`Deal not found: ${input.deal_id}`);
  }

  const currentStage = deal.stage as string;
  const validTransitions = VALID_STAGE_TRANSITIONS[currentStage] ?? [];

  if (!validTransitions.includes(input.new_stage)) {
    throw new Error(
      `Invalid stage transition: ${currentStage} -> ${input.new_stage}. Valid transitions: ${validTransitions.join(', ')}`
    );
  }

  // Update the deal stage and probability
  const updatePayload: Record<string, unknown> = {
    stage: input.new_stage,
    probability: STAGE_PROBABILITY[input.new_stage] ?? deal.probability,
    updated_at: new Date().toISOString(),
  };

  if (input.new_stage === 'closed_won') {
    updatePayload.won_at = new Date().toISOString();
  } else if (input.new_stage === 'closed_lost') {
    updatePayload.lost_at = new Date().toISOString();
  }

  const { data: updatedDeal, error: updateError } = await supabase
    .from('deals')
    .update(updatePayload)
    .eq('id', input.deal_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to advance deal stage: ${updateError.message}`);
  }

  // Log the stage change as an activity
  await supabase.from('crm_activities').insert({
    activity_type: 'note',
    title: `Deal stage changed: ${currentStage} -> ${input.new_stage}`,
    description: input.notes ?? null,
    deal_id: input.deal_id,
    performed_by: input.performed_by,
  });

  return updatedDeal as Deal;
}

/**
 * Closes a deal as won or lost.
 */
export async function closeDeal(input: CloseDealInput): Promise<Deal> {
  const { data: deal, error: fetchError } = await supabase
    .from('deals')
    .select('*')
    .eq('id', input.deal_id)
    .single();

  if (fetchError || !deal) {
    throw new Error(`Deal not found: ${input.deal_id}`);
  }

  const currentStage = deal.stage as string;
  if (currentStage === 'closed_won' || currentStage === 'closed_lost') {
    throw new Error(`Deal is already closed with stage: ${currentStage}`);
  }

  const newStage: DealStage = input.outcome === 'won' ? 'closed_won' : 'closed_lost';
  const updatePayload: Record<string, unknown> = {
    stage: newStage,
    probability: input.outcome === 'won' ? 100 : 0,
    updated_at: new Date().toISOString(),
  };

  if (input.outcome === 'won') {
    updatePayload.won_at = new Date().toISOString();
  } else {
    updatePayload.lost_at = new Date().toISOString();
    updatePayload.lost_reason = input.reason ?? null;
  }

  const { data: updatedDeal, error: updateError } = await supabase
    .from('deals')
    .update(updatePayload)
    .eq('id', input.deal_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to close deal: ${updateError.message}`);
  }

  // Log the closure activity
  const activityTitle = input.outcome === 'won'
    ? `Deal won: ${deal.title}`
    : `Deal lost: ${deal.title}`;

  await supabase.from('crm_activities').insert({
    activity_type: 'note',
    title: activityTitle,
    description: input.reason ?? null,
    deal_id: input.deal_id,
    customer_id: deal.customer_id ?? null,
    performed_by: input.performed_by,
  });

  return updatedDeal as Deal;
}

/**
 * Retrieves the full timeline of stage changes and activities for a deal.
 */
export async function getDealTimeline(dealId: string): Promise<CrmActivity[]> {
  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch deal timeline: ${error.message}`);
  }

  return (data ?? []) as CrmActivity[];
}

/**
 * Calculates the weighted pipeline value (value x probability) across all open deals.
 */
export async function calculatePipelineValue(): Promise<PipelineValueResult> {
  const { data: deals, error } = await supabase
    .from('deals')
    .select('stage, value, probability')
    .not('stage', 'in', '("closed_won","closed_lost")');

  if (error) {
    throw new Error(`Failed to calculate pipeline value: ${error.message}`);
  }

  const allDeals = (deals ?? []) as Array<{ stage: DealStage; value: number; probability: number }>;

  let totalValue = 0;
  let weightedValue = 0;
  const stageMap = new Map<string, { count: number; total_value: number; weighted_value: number }>();

  for (const deal of allDeals) {
    const weighted = deal.value * (deal.probability / 100);
    totalValue += deal.value;
    weightedValue += weighted;

    const existing = stageMap.get(deal.stage) ?? { count: 0, total_value: 0, weighted_value: 0 };
    existing.count += 1;
    existing.total_value += deal.value;
    existing.weighted_value += weighted;
    stageMap.set(deal.stage, existing);
  }

  const byStage = Array.from(stageMap.entries()).map(([stage, stats]) => ({
    stage: stage as DealStage,
    count: stats.count,
    total_value: stats.total_value,
    weighted_value: stats.weighted_value,
  }));

  return {
    total_value: totalValue,
    weighted_value: weightedValue,
    deal_count: allDeals.length,
    by_stage: byStage,
  };
}
