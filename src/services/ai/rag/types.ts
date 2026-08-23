import type { AgentType } from '../types';

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: 'faq' | 'sop' | 'product_info' | 'policy' | 'guide' | 'custom';
  tags: string[];
  embedding?: number[];
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ToolExecution {
  id: string;
  conversation_id: string;
  user_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown> | null;
  execution_time_ms: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface ContextCache {
  id: string;
  conversation_id: string;
  context_type: string;
  context_data: Record<string, unknown>;
  expires_at: string;
  created_at: string;
}

export interface RAGContext {
  inventory?: Record<string, unknown>;
  sales?: Record<string, unknown>;
  procurement?: Record<string, unknown>;
  finance?: Record<string, unknown>;
  crm?: Record<string, unknown>;
  knowledge: KnowledgeEntry[];
  toolResults: ToolResult[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
    enum?: string[];
  }>;
  handler: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
  tool_name: string;
  success: boolean;
  data: Record<string, unknown> | null;
  error?: string;
  execution_time_ms: number;
}

export interface QueryResult {
  response: string;
  sources: KnowledgeEntry[];
  toolsUsed: ToolResult[];
  context: RAGContext;
  agentType: AgentType;
  tokensUsed?: number;
  provider?: string;
  model?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokensUsed: number;
}
