import { supabase } from '@/lib/supabase';
import type { Lead, LeadScore } from '@/types/database';
import type { LeadScoreBreakdown } from './types';

/**
 * Calculates a lead score (0-100) based on multiple factors:
 * - Source (referral=30, trade_show=25, website=20, social_media=15, advertisement=15, cold_call=10, other=10)
 * - Estimated value (>100K=20, 50-100K=15, <50K=10)
 * - Engagement (activities count: 5+=20, 3-4=15, 1-2=10, 0=0)
 * - Recency (last activity <3 days=15, <7 days=10, <14 days=5, older=0)
 * - Company size indicator (enterprise=15, mid=10, small=5)
 */
export async function calculateLeadScore(leadId: string): Promise<LeadScore> {
  // Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  // Fetch activities count for this lead
  const { count: activityCount, error: actCountError } = await supabase
    .from('crm_activities')
    .select('*', { count: 'exact', head: true })
    .eq('lead_id', leadId);

  if (actCountError) {
    throw new Error(`Failed to count activities: ${actCountError.message}`);
  }

  // Fetch most recent activity date
  const { data: recentActivity, error: recentError } = await supabase
    .from('crm_activities')
    .select('created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentError) {
    throw new Error(`Failed to fetch recent activity: ${recentError.message}`);
  }

  const breakdown = computeScoreBreakdown(
    lead as Lead,
    activityCount ?? 0,
    recentActivity?.created_at ?? null
  );

  const totalScore = Math.min(
    100,
    breakdown.source + breakdown.value + breakdown.engagement + breakdown.recency + breakdown.size
  );

  // Store the score in lead_scores table
  const { data: scoreRecord, error: insertError } = await supabase
    .from('lead_scores')
    .insert({
      lead_id: leadId,
      score: totalScore,
      breakdown: breakdown,
      calculated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to insert lead score: ${insertError.message}`);
  }

  // Update the lead's score and last_scored_at
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      score: totalScore,
      last_scored_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (updateError) {
    throw new Error(`Failed to update lead score: ${updateError.message}`);
  }

  return scoreRecord as LeadScore;
}

/**
 * Bulk recalculates scores for all active leads (not won/lost).
 */
export async function scoreAllLeads(): Promise<LeadScore[]> {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id')
    .not('status', 'in', '("won","lost")');

  if (error) {
    throw new Error(`Failed to fetch leads for scoring: ${error.message}`);
  }

  const scores: LeadScore[] = [];
  for (const lead of leads ?? []) {
    const score = await calculateLeadScore(lead.id);
    scores.push(score);
  }

  return scores;
}

/**
 * Returns leads with a score greater than 70 (hot leads).
 */
export async function getHotLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .gt('score', 70)
    .not('status', 'in', '("won","lost")')
    .order('score', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch hot leads: ${error.message}`);
  }

  return (data ?? []) as Lead[];
}

/**
 * Computes the score breakdown for a lead based on scoring rules.
 */
function computeScoreBreakdown(
  lead: Lead,
  activityCount: number,
  lastActivityDate: string | null
): LeadScoreBreakdown {
  // Source score
  const sourceScores: Record<string, number> = {
    referral: 30,
    trade_show: 25,
    website: 20,
    social_media: 15,
    advertisement: 15,
    cold_call: 10,
    other: 10,
  };
  const sourceScore = sourceScores[lead.source] ?? 10;

  // Value score
  let valueScore = 0;
  if (lead.estimated_value) {
    if (lead.estimated_value > 100000) {
      valueScore = 20;
    } else if (lead.estimated_value >= 50000) {
      valueScore = 15;
    } else {
      valueScore = 10;
    }
  }

  // Engagement score
  let engagementScore = 0;
  if (activityCount >= 5) {
    engagementScore = 20;
  } else if (activityCount >= 3) {
    engagementScore = 15;
  } else if (activityCount >= 1) {
    engagementScore = 10;
  }

  // Recency score
  let recencyScore = 0;
  if (lastActivityDate) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity < 3) {
      recencyScore = 15;
    } else if (daysSinceActivity < 7) {
      recencyScore = 10;
    } else if (daysSinceActivity < 14) {
      recencyScore = 5;
    }
  }

  // Company size score (inferred from notes or company name keywords)
  let sizeScore = 5; // default: small
  const notesLower = (lead.notes ?? '').toLowerCase();
  const companyLower = (lead.company ?? '').toLowerCase();
  const combinedText = `${notesLower} ${companyLower}`;

  if (
    combinedText.includes('enterprise') ||
    combinedText.includes('corporation') ||
    combinedText.includes('global') ||
    combinedText.includes('international')
  ) {
    sizeScore = 15;
  } else if (
    combinedText.includes('mid-market') ||
    combinedText.includes('medium') ||
    combinedText.includes('regional')
  ) {
    sizeScore = 10;
  }

  return {
    source: sourceScore,
    value: valueScore,
    engagement: engagementScore,
    recency: recencyScore,
    size: sizeScore,
  };
}
