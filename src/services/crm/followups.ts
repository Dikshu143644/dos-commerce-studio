import { supabase } from '@/lib/supabase';
import type { CrmActivity, FollowUpRule } from '@/types/database';
import type { ScheduleFollowUpInput, SnoozeFollowUpInput, FollowUpAutoConfig } from './types';

/**
 * Schedules a follow-up activity with a specific date/time.
 */
export async function scheduleFollowUp(input: ScheduleFollowUpInput): Promise<CrmActivity> {
  const { data: activity, error } = await supabase
    .from('crm_activities')
    .insert({
      activity_type: 'follow_up',
      title: input.title,
      description: input.description ?? null,
      customer_id: input.customer_id ?? null,
      lead_id: input.lead_id ?? null,
      deal_id: input.deal_id ?? null,
      performed_by: input.performed_by,
      scheduled_at: input.scheduled_at,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to schedule follow-up: ${error.message}`);
  }

  return activity as CrmActivity;
}

/**
 * Returns all follow-ups that are past their due date and not completed.
 */
export async function getOverdueFollowUps(): Promise<CrmActivity[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('activity_type', 'follow_up')
    .is('completed_at', null)
    .lt('scheduled_at', now)
    .order('scheduled_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch overdue follow-ups: ${error.message}`);
  }

  return (data ?? []) as CrmActivity[];
}

/**
 * Returns follow-ups assigned to a specific user.
 */
export async function getFollowUpsByUser(userId: string): Promise<CrmActivity[]> {
  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('activity_type', 'follow_up')
    .eq('performed_by', userId)
    .is('completed_at', null)
    .order('scheduled_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch follow-ups by user: ${error.message}`);
  }

  return (data ?? []) as CrmActivity[];
}

/**
 * Automatically creates a follow-up based on configurable rules:
 * - After lead status change: schedule follow-up in 2 days
 * - After proposal sent: schedule follow-up in 5 days
 * - After meeting: schedule follow-up in 1 day
 * - After deal stalled for 7+ days: auto-reminder
 */
export async function autoScheduleFollowUp(config: FollowUpAutoConfig): Promise<CrmActivity | null> {
  // Fetch applicable rules for this trigger event
  const { data: rules, error: rulesError } = await supabase
    .from('followup_rules')
    .select('*')
    .eq('trigger_event', config.trigger_event)
    .eq('is_active', true);

  if (rulesError) {
    throw new Error(`Failed to fetch follow-up rules: ${rulesError.message}`);
  }

  if (!rules || rules.length === 0) {
    return null;
  }

  // Find the matching rule based on trigger condition
  const matchingRule = findMatchingRule(rules as FollowUpRule[], config);

  if (!matchingRule) {
    return null;
  }

  // Calculate scheduled date
  const delayDays = matchingRule.action_config.delay_days ?? 2;
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + delayDays);

  // Generate title from template
  const title = matchingRule.action_config.subject_template ?? 'Follow-up reminder';

  // Create the follow-up activity
  const { data: activity, error: actError } = await supabase
    .from('crm_activities')
    .insert({
      activity_type: matchingRule.action_config.activity_type ?? 'follow_up',
      title,
      description: `Auto-scheduled by rule: ${matchingRule.name}`,
      lead_id: config.entity_type === 'lead' ? config.entity_id : null,
      deal_id: config.entity_type === 'deal' ? config.entity_id : null,
      performed_by: config.performed_by,
      scheduled_at: scheduledDate.toISOString(),
    })
    .select()
    .single();

  if (actError) {
    throw new Error(`Failed to auto-schedule follow-up: ${actError.message}`);
  }

  return activity as CrmActivity;
}

/**
 * Reschedules a follow-up to a later date (snooze).
 */
export async function snoozeFollowUp(input: SnoozeFollowUpInput): Promise<CrmActivity> {
  const { data: activity, error } = await supabase
    .from('crm_activities')
    .update({
      scheduled_at: input.new_scheduled_at,
    })
    .eq('id', input.activity_id)
    .eq('activity_type', 'follow_up')
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to snooze follow-up: ${error.message}`);
  }

  return activity as CrmActivity;
}

/**
 * Finds a matching follow-up rule based on the trigger config context.
 */
function findMatchingRule(
  rules: FollowUpRule[],
  config: FollowUpAutoConfig
): FollowUpRule | null {
  for (const rule of rules) {
    const condition = rule.trigger_condition;

    if (!condition) {
      // Rule with no condition matches any trigger of the same event
      return rule;
    }

    // Check if context matches condition
    if (config.context) {
      const conditionEntries = Object.entries(condition);
      const allMatch = conditionEntries.every(([key, value]) => {
        return config.context?.[key] === value;
      });

      if (allMatch) {
        return rule;
      }
    }
  }

  // Return first rule as fallback if no specific condition matched
  return rules[0] ?? null;
}
