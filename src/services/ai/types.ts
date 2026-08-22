export type AgentType = 'inventory' | 'sales' | 'procurement' | 'finance' | 'excel' | 'general';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentType?: AgentType;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  agentType: AgentType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  tools: Tool[];
  icon: string;
  color: string;
  suggestedPrompts: string[];
}

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  chat(messages: Message[], systemPrompt: string): Promise<string>;
}

export interface AIResponse {
  content: string;
  provider: string;
  tokensUsed?: number;
}
