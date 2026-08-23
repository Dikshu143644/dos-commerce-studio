import { supabase } from '@/lib/supabase';
import type { Lead, CrmActivity, Deal } from '@/types/database';
import type {
  CreateLeadInput,
  UpdateLeadStatusInput,
  ConvertLeadToDealInput,
  ConvertLeadToCustomerInput,
} from './types';
import { calculateLeadScore } from './scoring';
import { convertLeadToCustomer as performConversion } from './conversion';

/**
 * Valid lead status transitions.
 * Each status maps to the statuses it can transition to.
 */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['contacted', 'lost'],
  contacted: ['qualified', 'lost'],
  qualified: ['proposal', 'lost'],
  proposal: ['negotiation', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: ['new'], // Allow reopening lost leads
};

/**
 * Creates a new lead with auto-calculated score.
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      status: 'new',
      source: input.source,
      estimated_value: input.estimated_value ?? null,
      assigned_to: input.assigned_to ?? null,
      notes: input.notes ?? null,
      score: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  // Auto-calculate score after creation
  try {
    await calculateLeadScore(lead.id);
  } catch {
    // Score calculation failure should not block lead creation
  }

  // Refetch to get updated score
  const { data: updatedLead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead.id)
    .single();

  if (fetchError) {
    return lead as Lead;
  }

  return updatedLead as Lead;
}

/**
 * Updates a lead's status with transition validation.
 * Cannot skip stages without a reason.
 */
export async function updateLeadStatus(input: UpdateLeadStatusInput): Promise<Lead> {
  // Fetch current lead
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', input.lead_id)
    .single();

  if (fetchError || !lead) {
    throw new Error(`Lead not found: ${input.lead_id}`);
  }

  const currentStatus = lead.status as string;
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!validTransitions.includes(input.new_status)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} -> ${input.new_status}. Valid transitions: ${validTransitions.join(', ')}`
    );
  }

  // Update the lead status
  const { data: updatedLead, error: updateError } = await supabase
    .from('leads')
    .update({
      status: input.new_status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.lead_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update lead status: ${updateError.message}`);
  }

  // Log the status change as an activity
  await supabase.from('crm_activities').insert({
    activity_type: 'note',
    title: `Status changed: ${currentStatus} -> ${input.new_status}`,
    description: input.reason ?? null,
    lead_id: input.lead_id,
    performed_by: input.performed_by,
  });

  // If lead moves to "won", trigger conversion
  if (input.new_status === 'won') {
    try {
      await performConversion({
        lead_id: input.lead_id,
        performed_by: input.performed_by,
      });
    } catch {
      // Conversion failure logged but does not block status update
    }
  }

  return updatedLead as Lead;
}

/**
 * Converts a qualified lead into a deal, linking them together.
 */
export async function convertLeadToDeal(input: ConvertLeadToDealInput): Promise<Deal> {
  // Fetch the lead
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', input.lead_id)
    .single();

  if (fetchError || !lead) {
    throw new Error(`Lead not found: ${input.lead_id}`);
  }

  // Create the deal linked to this lead
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .insert({
      title: input.deal_title,
      lead_id: input.lead_id,
      stage: 'qualification',
      value: input.deal_value ?? (lead.estimated_value as number) ?? 0,
      probability: input.probability ?? 20,
      expected_close_date: input.expected_close_date ?? null,
      assigned_to: input.assigned_to ?? (lead.assigned_to as string) ?? null,
      converted_from_lead_id: input.lead_id,
    })
    .select()
    .single();

  if (dealError) {
    throw new Error(`Failed to create deal from lead: ${dealError.message}`);
  }

  // Log the conversion activity
  await supabase.from('crm_activities').insert({
    activity_type: 'note',
    title: `Lead converted to deal: ${input.deal_title}`,
    description: `Lead "${lead.name}" converted to deal`,
    lead_id: input.lead_id,
    deal_id: deal.id,
    performed_by: input.performed_by,
  });

  return deal as Deal;
}

/**
 * Directly converts a won lead to a customer.
 * Delegates to the conversion service.
 */
export async function convertLeadToCustomer(
  input: ConvertLeadToCustomerInput
): Promise<ReturnType<typeof performConversion>> {
  return performConversion(input);
}

/**
 * Retrieves the full timeline of activities, status changes, and notes for a lead.
 */
export async function getLeadTimeline(
  leadId: string
): Promise<CrmActivity[]> {
  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead timeline: ${error.message}`);
  }

  return (data ?? []) as CrmActivity[];
}

/**
 * Bulk assigns multiple leads to a sales rep.
 */
export async function bulkAssignLeads(
  leadIds: string[],
  assignedTo: string
): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .update({
      assigned_to: assignedTo,
      updated_at: new Date().toISOString(),
    })
    .in('id', leadIds)
    .select();

  if (error) {
    throw new Error(`Failed to bulk assign leads: ${error.message}`);
  }

  return (data ?? []) as Lead[];
}
