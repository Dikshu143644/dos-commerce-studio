import { supabase } from '@/lib/supabase';
import type { CrmActivity } from '@/types/database';
import type {
  CreateActivityInput,
  CompleteActivityInput,
  ActivityFilters,
  PaginatedResponse,
} from './types';

/**
 * Creates a new activity linked to a customer, lead, or deal.
 */
export async function createActivity(input: CreateActivityInput): Promise<CrmActivity> {
  const { data: activity, error } = await supabase
    .from('crm_activities')
    .insert({
      activity_type: input.activity_type,
      title: input.title,
      description: input.description ?? null,
      customer_id: input.customer_id ?? null,
      lead_id: input.lead_id ?? null,
      deal_id: input.deal_id ?? null,
      performed_by: input.performed_by,
      scheduled_at: input.scheduled_at ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create activity: ${error.message}`);
  }

  return activity as CrmActivity;
}

/**
 * Marks an activity as completed.
 * Optionally creates a follow-up activity.
 */
export async function completeActivity(input: CompleteActivityInput): Promise<CrmActivity> {
  // Fetch the activity
  const { data: activity, error: fetchError } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('id', input.activity_id)
    .single();

  if (fetchError || !activity) {
    throw new Error(`Activity not found: ${input.activity_id}`);
  }

  // Mark as completed
  const { data: updated, error: updateError } = await supabase
    .from('crm_activities')
    .update({
      completed_at: new Date().toISOString(),
    })
    .eq('id', input.activity_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to complete activity: ${updateError.message}`);
  }

  // Optionally create a follow-up
  if (input.create_follow_up) {
    const delayDays = input.follow_up_delay_days ?? 2;
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + delayDays);

    await supabase.from('crm_activities').insert({
      activity_type: 'follow_up',
      title: `Follow-up: ${activity.title as string}`,
      description: `Follow-up created after completing: ${activity.title as string}`,
      customer_id: (activity.customer_id as string) ?? null,
      lead_id: (activity.lead_id as string) ?? null,
      deal_id: (activity.deal_id as string) ?? null,
      performed_by: input.performed_by,
      scheduled_at: followUpDate.toISOString(),
    });
  }

  return updated as CrmActivity;
}

/**
 * Returns activities that are due today or overdue (scheduled but not completed).
 */
export async function getUpcomingActivities(userId?: string): Promise<CrmActivity[]> {
  const today = new Date().toISOString();

  let query = supabase
    .from('crm_activities')
    .select('*')
    .is('completed_at', null)
    .not('scheduled_at', 'is', null)
    .lte('scheduled_at', today)
    .order('scheduled_at', { ascending: true });

  if (userId) {
    query = query.eq('performed_by', userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch upcoming activities: ${error.message}`);
  }

  return (data ?? []) as CrmActivity[];
}

/**
 * Returns a paginated activity feed (timeline view) with entity details.
 */
export async function getActivityFeed(
  filters: ActivityFilters = {}
): Promise<PaginatedResponse<CrmActivity>> {
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('crm_activities')
    .select('*', { count: 'exact' });

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }
  if (filters.lead_id) {
    query = query.eq('lead_id', filters.lead_id);
  }
  if (filters.deal_id) {
    query = query.eq('deal_id', filters.deal_id);
  }
  if (filters.activity_type) {
    query = query.eq('activity_type', filters.activity_type);
  }
  if (filters.performed_by) {
    query = query.eq('performed_by', filters.performed_by);
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch activity feed: ${error.message}`);
  }

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as CrmActivity[],
    count: totalCount,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Bulk completes multiple activities.
 */
export async function bulkCompleteActivities(
  activityIds: string[]
): Promise<CrmActivity[]> {
  const { data, error } = await supabase
    .from('crm_activities')
    .update({
      completed_at: new Date().toISOString(),
    })
    .in('id', activityIds)
    .select();

  if (error) {
    throw new Error(`Failed to bulk complete activities: ${error.message}`);
  }

  return (data ?? []) as CrmActivity[];
}
