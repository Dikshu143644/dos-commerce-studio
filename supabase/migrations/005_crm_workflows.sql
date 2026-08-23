-- CRM Workflows Migration
-- Lead scoring, follow-up rules, email sequences, CRM activities

-- CRM Activities table (used by CRM service layer for pipeline activity tracking)
CREATE TABLE crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type activity_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    performed_by UUID REFERENCES auth.users(id),
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead scoring history
CREATE TABLE lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    breakdown JSONB NOT NULL,  -- { source: 30, value: 20, engagement: 15, recency: 10, size: 5 }
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-up rules (configurable automation)
CREATE TABLE followup_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,  -- 'lead_status_change', 'deal_stage_change', 'activity_completed', 'deal_stalled'
    trigger_condition JSONB,     -- { "new_status": "contacted" } or { "days_inactive": 7 }
    action_type TEXT NOT NULL DEFAULT 'create_followup',
    action_config JSONB NOT NULL, -- { "delay_days": 2, "activity_type": "follow_up", "subject_template": "Follow up on {{lead.company}}" }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRM email sequences (for automated follow-up chains)
CREATE TABLE email_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    trigger TEXT NOT NULL, -- 'lead_created', 'deal_won', 'follow_up_overdue'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_sequence_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    delay_days INTEGER NOT NULL DEFAULT 0,
    email_template TEXT NOT NULL,  -- references PHP email templates
    subject TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Add score column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMPTZ;

-- Add conversion tracking columns to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_customer_id UUID REFERENCES customers(id);

-- Add conversion tracking to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS converted_from_lead_id UUID REFERENCES leads(id);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sales_order_id UUID;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lost_at TIMESTAMPTZ;

-- Seed default follow-up rules
INSERT INTO followup_rules (name, trigger_event, trigger_condition, action_config) VALUES
('New Lead Follow-up', 'lead_status_change', '{"new_status": "contacted"}', '{"delay_days": 2, "activity_type": "follow_up", "subject_template": "Follow up with {{lead.company}}"}'),
('Proposal Follow-up', 'lead_status_change', '{"new_status": "proposal"}', '{"delay_days": 5, "activity_type": "follow_up", "subject_template": "Check proposal status - {{lead.company}}"}'),
('Post-Meeting Follow-up', 'activity_completed', '{"activity_type": "meeting"}', '{"delay_days": 1, "activity_type": "follow_up", "subject_template": "Follow up after meeting with {{entity.name}}"}'),
('Stalled Deal Reminder', 'deal_stalled', '{"days_inactive": 7}', '{"delay_days": 0, "activity_type": "task", "subject_template": "Deal stalled: {{deal.title}} - needs attention"}'),
('Won Deal - Create Order', 'deal_stage_change', '{"new_stage": "closed_won"}', '{"delay_days": 0, "activity_type": "task", "subject_template": "Create sales order for {{deal.title}}"}');

-- Indexes
CREATE INDEX idx_crm_activities_lead ON crm_activities(lead_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_customer ON crm_activities(customer_id);
CREATE INDEX idx_crm_activities_performed_by ON crm_activities(performed_by);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at);
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_lead_scores_lead ON lead_scores(lead_id);
CREATE INDEX idx_lead_scores_date ON lead_scores(calculated_at DESC);
CREATE INDEX idx_followup_rules_trigger ON followup_rules(trigger_event);
CREATE INDEX idx_email_sequences_trigger ON email_sequences(trigger);
CREATE INDEX idx_leads_score ON leads(score DESC);

-- RLS
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view crm activities" ON crm_activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert crm activities" ON crm_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update crm activities" ON crm_activities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete crm activities" ON crm_activities FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view lead scores" ON lead_scores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert lead scores" ON lead_scores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update lead scores" ON lead_scores FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete lead scores" ON lead_scores FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view followup rules" ON followup_rules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage followup rules" ON followup_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view email sequences" ON email_sequences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view email sequence steps" ON email_sequence_steps FOR SELECT USING (auth.role() = 'authenticated');
