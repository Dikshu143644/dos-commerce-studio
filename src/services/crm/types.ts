import type {
  LeadStatus,
  LeadSource,
  DealStage,
  ActivityType,
} from '@/types/database';

// Lead inputs
export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: LeadSource;
  estimated_value?: number;
  assigned_to?: string;
  notes?: string;
}

export interface UpdateLeadStatusInput {
  lead_id: string;
  new_status: LeadStatus;
  reason?: string;
  performed_by: string;
}

export interface ConvertLeadToCustomerInput {
  lead_id: string;
  performed_by: string;
  customer_type?: 'regular' | 'wholesale' | 'retail' | 'distributor';
}

export interface ConvertLeadToDealInput {
  lead_id: string;
  deal_title: string;
  deal_value?: number;
  probability?: number;
  expected_close_date?: string;
  assigned_to?: string;
  performed_by: string;
}

// Deal inputs
export interface CreateDealInput {
  title: string;
  customer_id?: string;
  lead_id?: string;
  stage?: DealStage;
  value: number;
  probability?: number;
  expected_close_date?: string;
  assigned_to?: string;
  notes?: string;
  converted_from_lead_id?: string;
}

export interface AdvanceDealStageInput {
  deal_id: string;
  new_stage: DealStage;
  performed_by: string;
  notes?: string;
}

export interface CloseDealInput {
  deal_id: string;
  outcome: 'won' | 'lost';
  reason?: string;
  performed_by: string;
}

// Activity inputs
export interface CreateActivityInput {
  activity_type: ActivityType;
  title: string;
  description?: string;
  customer_id?: string;
  lead_id?: string;
  deal_id?: string;
  performed_by: string;
  scheduled_at?: string;
}

export interface CompleteActivityInput {
  activity_id: string;
  performed_by: string;
  create_follow_up?: boolean;
  follow_up_delay_days?: number;
}

// Follow-up inputs
export interface ScheduleFollowUpInput {
  title: string;
  description?: string;
  customer_id?: string;
  lead_id?: string;
  deal_id?: string;
  performed_by: string;
  scheduled_at: string;
}

export interface SnoozeFollowUpInput {
  activity_id: string;
  new_scheduled_at: string;
}

// Scoring types
export interface LeadScoreBreakdown {
  source: number;
  value: number;
  engagement: number;
  recency: number;
  size: number;
}

// Follow-up auto config
export interface FollowUpAutoConfig {
  trigger_event: 'lead_status_change' | 'deal_stage_change' | 'activity_completed' | 'deal_stalled';
  entity_id: string;
  entity_type: 'lead' | 'deal';
  performed_by: string;
  context?: Record<string, unknown>;
}

// Activity filters
export interface ActivityFilters {
  customer_id?: string;
  lead_id?: string;
  deal_id?: string;
  activity_type?: ActivityType;
  performed_by?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Pipeline value result
export interface PipelineValueResult {
  total_value: number;
  weighted_value: number;
  deal_count: number;
  by_stage: Array<{
    stage: DealStage;
    count: number;
    total_value: number;
    weighted_value: number;
  }>;
}
