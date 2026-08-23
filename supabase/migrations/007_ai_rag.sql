-- ============================================================================
-- AI RAG (Retrieval-Augmented Generation) Schema
-- Adds vector search, knowledge base, tool execution logging, and context caching
-- ============================================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- AI Conversations Table (required by tool executions and Edge Function)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  agent_type agent_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL DEFAULT 'New Conversation',
  messages JSONB NOT NULL DEFAULT '[]',
  total_tokens INTEGER DEFAULT 0,
  provider TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own conversations" ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversations" ON ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Knowledge Base Table
-- Stores FAQ, SOPs, product info, policies, and guides for RAG retrieval
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('faq', 'sop', 'product_info', 'policy', 'guide', 'custom')),
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- AI Tool Executions Table
-- Logs every tool call made during AI conversations for auditing and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  tool_name TEXT NOT NULL,
  tool_input JSONB NOT NULL,
  tool_output JSONB,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- AI Context Cache Table
-- Caches assembled context for conversations to reduce redundant queries
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_context_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  context_type TEXT NOT NULL,
  context_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- (token tracking columns already added in CREATE TABLE above)

-- ============================================================================
-- Vector Similarity Search Function
-- Uses cosine distance to find the most relevant knowledge base entries
-- ============================================================================
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[],
  metadata JSONB,
  is_active BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    kb.tags,
    kb.metadata,
    kb.is_active,
    kb.created_by,
    kb.created_at,
    kb.updated_at,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE kb.is_active = true
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR kb.category = filter_category)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- Seed Knowledge Base with default entries
-- ============================================================================
INSERT INTO knowledge_base (title, content, category, tags, metadata, is_active) VALUES
(
  'Creating a Purchase Order',
  'To create a purchase order: 1) Navigate to Procurement > Purchase Orders. 2) Click "New PO". 3) Select supplier from dropdown. 4) Add line items with products and quantities. 5) Set expected delivery date. 6) Review total and submit for approval. POs over $10,000 require manager approval.',
  'sop',
  ARRAY['procurement', 'purchase-order', 'workflow'],
  '{}',
  true
),
(
  'Goods Receiving Process',
  'When goods arrive: 1) Go to Procurement > Goods Receipt. 2) Select the corresponding PO. 3) Verify quantities against delivery note. 4) Record any discrepancies or damages. 5) Confirm receipt to update stock levels. 6) System automatically creates stock movements and updates warehouse quantities.',
  'sop',
  ARRAY['procurement', 'receiving', 'warehouse'],
  '{}',
  true
),
(
  'Sales Order Workflow',
  'Sales order lifecycle: Draft > Confirmed > Processing > Shipped > Delivered > Completed. Each stage transition triggers notifications. Orders can be cancelled before shipping. Partial shipments are supported. Invoices are auto-generated on confirmation.',
  'sop',
  ARRAY['sales', 'orders', 'workflow'],
  '{}',
  true
),
(
  'Stock Movement Types',
  'Stock movements track all inventory changes: IN (goods receipt), OUT (sales/dispatch), TRANSFER (between warehouses), ADJUSTMENT (manual corrections), RETURN (customer returns). Each movement records product, quantity, source/destination warehouse, reference number, and timestamp.',
  'guide',
  ARRAY['inventory', 'stock-movements', 'warehouse'],
  '{}',
  true
),
(
  'Lead Scoring Methodology',
  'Leads are scored 0-100 based on: Company size (0-20pts), Budget indication (0-25pts), Engagement level (0-20pts), Source quality (0-15pts), Timeline urgency (0-20pts). Scores above 70 are "Hot", 40-70 are "Warm", below 40 are "Cold". Auto-reassignment occurs at score changes.',
  'guide',
  ARRAY['crm', 'leads', 'scoring'],
  '{}',
  true
),
(
  'Invoice and Payment Workflow',
  'Invoice lifecycle: Draft > Sent > Partially Paid > Paid > Overdue. Payment terms default to Net-30. Overdue invoices trigger automatic reminders at 7, 14, and 30 days. Partial payments are tracked. Credit notes can be issued for returns or adjustments.',
  'sop',
  ARRAY['finance', 'invoices', 'payments'],
  '{}',
  true
),
(
  'Warehouse Transfer Process',
  'To transfer stock between warehouses: 1) Go to Inventory > Transfers. 2) Select source and destination warehouses. 3) Add products and quantities. 4) Submit transfer request. 5) Source warehouse confirms dispatch. 6) Destination warehouse confirms receipt. Stock is in-transit between confirmations.',
  'sop',
  ARRAY['inventory', 'warehouse', 'transfer'],
  '{}',
  true
),
(
  'Low Stock Alert Configuration',
  'Low stock alerts trigger when quantity falls below the product reorder_point. Configure per product in Product Settings > Stock Levels. Set min_stock_level for critical threshold and reorder_point for warning threshold. Alerts appear in dashboard notifications and can trigger auto-PO generation if enabled.',
  'guide',
  ARRAY['inventory', 'alerts', 'reorder'],
  '{}',
  true
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- GIN index for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN (tags);

-- IVFFlat index for vector similarity search
-- NOTE: IVFFlat indexes require significant row counts to be effective.
-- With lists=N, you need at least N * 10-50 rows for reasonable recall.
-- Do NOT create this index until the knowledge_base table has >1000 rows.
-- Once sufficient data exists, run:
--   CREATE INDEX idx_knowledge_base_embedding ON knowledge_base
--     USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
-- For small tables (<1000 rows), sequential scan with cosine distance is sufficient.

-- Category index for filtered searches
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base (category)
  WHERE is_active = true;

-- Tool executions indexes
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_conversation ON ai_tool_executions (conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_user ON ai_tool_executions (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_tool_name ON ai_tool_executions (tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_created_at ON ai_tool_executions (created_at DESC);

-- Context cache indexes
CREATE INDEX IF NOT EXISTS idx_ai_context_cache_conversation ON ai_context_cache (conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_cache_expires ON ai_context_cache (expires_at);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Knowledge Base RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Knowledge base entries are viewable by authenticated users"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Knowledge base entries can be created by authenticated users"
  ON knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Knowledge base entries can be updated by their creator"
  ON knowledge_base FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR created_by IS NULL);

-- AI Tool Executions RLS
ALTER TABLE ai_tool_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tool executions"
  ON ai_tool_executions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tool executions"
  ON ai_tool_executions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- AI Context Cache RLS
ALTER TABLE ai_context_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Context cache is accessible by authenticated users"
  ON ai_context_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Context cache can be created by authenticated users"
  ON ai_context_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Context cache can be deleted by authenticated users"
  ON ai_context_cache FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- Trigger: auto-update updated_at on knowledge_base
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
