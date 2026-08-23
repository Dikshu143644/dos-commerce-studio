import type { AgentType, Message } from '../types';
import type { KnowledgeEntry, QueryResult, RAGContext, ToolResult } from './types';
import { analyzeIntent } from '../router';
import { chatWithFallback } from '../providers';
import { searchKnowledge } from './knowledge-base';
import { executeTool, toolDefinitions } from './tools-executor';
import {
  buildInventoryContext,
  buildSalesContext,
  buildProcurementContext,
  buildFinanceContext,
  buildCRMContext,
} from './context-builder';

/**
 * Process a user query through the full RAG pipeline:
 * 1. Analyze intent to determine agent type
 * 2. Build domain-specific context from Supabase
 * 3. Search knowledge base for relevant entries
 * 4. Assemble prompt with context and knowledge
 * 5. Call AI provider
 * 6. Handle tool calls if needed
 * 7. Return final response with sources
 */
export async function processQuery(
  query: string,
  options: {
    conversationId?: string;
    userId?: string;
    agentType?: AgentType;
    conversationHistory?: Message[];
  } = {}
): Promise<QueryResult> {
  const { conversationId, userId, agentType: forceAgent, conversationHistory = [] } = options;

  // Step 1: Analyze intent
  const intent = analyzeIntent(query);
  const agentType = forceAgent || intent.agentType;

  // Step 2: Build domain context
  const context = await buildContext(agentType, intent.keywords);

  // Step 3: Search knowledge base for relevant info
  const knowledge = await searchKnowledgeEntries(query, agentType);
  context.knowledge = knowledge;

  // Step 4: Detect and execute tools if the query implies specific data lookup
  const toolResults = await executeRelevantTools(query, intent.keywords, conversationId, userId);
  context.toolResults = toolResults;

  // Step 5: Assemble the prompt with context
  const systemPrompt = buildSystemPrompt(agentType, context);
  const messages = buildMessages(conversationHistory, query);

  // Step 6: Call AI provider
  const response = await chatWithFallback(messages, systemPrompt);

  // Step 7: Return structured result
  return {
    response,
    sources: knowledge,
    toolsUsed: toolResults,
    context,
    agentType,
    provider: 'proxy',
  };
}

/**
 * Build domain-specific context based on the agent type.
 */
async function buildContext(
  agentType: AgentType,
  keywords: string[]
): Promise<RAGContext> {
  const context: RAGContext = {
    knowledge: [],
    toolResults: [],
  };

  try {
    switch (agentType) {
      case 'inventory':
        context.inventory = await buildInventoryContext(keywords);
        break;
      case 'sales':
        context.sales = await buildSalesContext(keywords);
        break;
      case 'procurement':
        context.procurement = await buildProcurementContext(keywords);
        break;
      case 'finance':
        context.finance = await buildFinanceContext(keywords);
        break;
      default:
        context.crm = await buildCRMContext(keywords);
        break;
    }
  } catch (error) {
    console.warn('[RAG] Context build error:', error);
  }

  return context;
}

/**
 * Search knowledge base filtered by the relevant category.
 */
async function searchKnowledgeEntries(
  query: string,
  agentType: AgentType
): Promise<KnowledgeEntry[]> {
  try {
    const categoryMap: Record<AgentType, string | undefined> = {
      inventory: undefined,
      sales: undefined,
      procurement: undefined,
      finance: undefined,
      excel: undefined,
      general: undefined,
    };

    return await searchKnowledge(query, {
      limit: 3,
      threshold: 0.5,
      category: categoryMap[agentType],
    });
  } catch (error) {
    console.warn('[RAG] Knowledge search error:', error);
    return [];
  }
}

/**
 * Detect which tools should be executed based on the query and keywords.
 */
async function executeRelevantTools(
  query: string,
  keywords: string[],
  conversationId?: string,
  userId?: string
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  const lower = query.toLowerCase();

  // Determine which tools to execute based on query content
  const toolsToRun: Array<{ name: string; params: Record<string, unknown> }> = [];

  if ((lower.includes('stock') || lower.includes('quantity')) && hasSpecificEntity(lower)) {
    toolsToRun.push({ name: 'check_stock', params: { product: extractEntity(lower, keywords) } });
  }

  if (lower.includes('low stock') || lower.includes('reorder') || lower.includes('below')) {
    toolsToRun.push({ name: 'find_low_stock', params: { limit: 10 } });
  }

  if (lower.includes('customer') && hasSpecificEntity(lower)) {
    toolsToRun.push({ name: 'get_customer_info', params: { search: extractEntity(lower, keywords) } });
  }

  if (lower.includes('order') && (lower.includes('status') || lower.includes('#'))) {
    toolsToRun.push({ name: 'get_order_status', params: { order_ref: extractEntity(lower, keywords) } });
  }

  if (lower.includes('revenue') || lower.includes('sales total') || lower.includes('earnings')) {
    const period = detectPeriod(lower);
    toolsToRun.push({ name: 'get_revenue_summary', params: { period } });
  }

  if (lower.includes('pipeline') || lower.includes('deal value') || lower.includes('deals')) {
    toolsToRun.push({ name: 'get_pipeline_value', params: {} });
  }

  if (lower.includes('overdue') && lower.includes('invoice')) {
    toolsToRun.push({ name: 'get_overdue_invoices', params: { limit: 10 } });
  }

  if (lower.includes('lead') && hasSpecificEntity(lower)) {
    toolsToRun.push({ name: 'get_lead_details', params: { search: extractEntity(lower, keywords) } });
  }

  if (lower.includes('supplier') && (lower.includes('performance') || lower.includes('rating'))) {
    const supplierName = extractEntity(lower, keywords);
    toolsToRun.push({ name: 'get_supplier_performance', params: { supplier_name: supplierName || undefined, limit: 5 } });
  }

  if (lower.includes('search') && lower.includes('product')) {
    toolsToRun.push({ name: 'search_products', params: { query: extractEntity(lower, keywords), limit: 10 } });
  }

  // Execute all identified tools
  for (const tool of toolsToRun) {
    const result = await executeTool(tool.name, tool.params, conversationId, userId);
    results.push(result);
  }

  return results;
}

/**
 * Build a system prompt that includes the gathered context and knowledge.
 */
function buildSystemPrompt(agentType: AgentType, context: RAGContext): string {
  const agentDescriptions: Record<AgentType, string> = {
    inventory: 'inventory management specialist',
    sales: 'sales and CRM specialist',
    procurement: 'procurement and supply chain specialist',
    finance: 'financial analysis specialist',
    excel: 'data export and reporting specialist',
    general: 'business operations assistant',
  };

  let prompt = `You are a ${agentDescriptions[agentType]} for StockFlow, an inventory and CRM management system. `;
  prompt += 'Provide helpful, accurate, and concise answers based on the context data provided.\n\n';

  // Add domain context
  const domainContext = context.inventory || context.sales || context.procurement || context.finance || context.crm;
  if (domainContext) {
    prompt += '## Current Data Context\n';
    prompt += JSON.stringify(domainContext, null, 2);
    prompt += '\n\n';
  }

  // Add knowledge base entries
  if (context.knowledge.length > 0) {
    prompt += '## Relevant Knowledge Base\n';
    for (const entry of context.knowledge) {
      prompt += `### ${entry.title}\n${entry.content}\n\n`;
    }
  }

  // Add tool results
  if (context.toolResults.length > 0) {
    prompt += '## Tool Execution Results\n';
    for (const result of context.toolResults) {
      if (result.success && result.data) {
        prompt += `### ${result.tool_name}\n`;
        prompt += JSON.stringify(result.data, null, 2);
        prompt += '\n\n';
      }
    }
  }

  prompt += '\nProvide answers using the data above. If information is unavailable, say so clearly. ';
  prompt += 'Use specific numbers and details from the context when available.';

  return prompt;
}

/**
 * Build message array for the AI provider.
 */
function buildMessages(history: Message[], currentQuery: string): Message[] {
  const messages: Message[] = [];

  // Include recent conversation history (last 10 messages)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push(msg);
  }

  // Add current query
  messages.push({
    id: crypto.randomUUID(),
    role: 'user',
    content: currentQuery,
    timestamp: new Date(),
  });

  return messages;
}

// ─── Helper Functions ────────────────────────────────────────────────

function hasSpecificEntity(text: string): boolean {
  // Check if the text mentions specific names/IDs beyond just generic queries
  const genericTerms = ['stock', 'inventory', 'customer', 'order', 'lead', 'supplier', 'product', 'all', 'the', 'my'];
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  return words.some((w) => !genericTerms.includes(w));
}

function extractEntity(text: string, keywords: string[]): string {
  // Try to extract specific entity names from the query
  const genericTerms = [
    'stock', 'inventory', 'customer', 'order', 'lead', 'supplier', 'product',
    'check', 'find', 'get', 'show', 'what', 'how', 'many', 'much', 'the',
    'is', 'are', 'for', 'status', 'level', 'info', 'details', 'performance',
    'search', 'low', 'overdue', 'invoice', 'revenue', 'pipeline', 'deal',
  ];

  const specificKeywords = keywords.filter((k) => !genericTerms.includes(k.toLowerCase()));
  if (specificKeywords.length > 0) {
    return specificKeywords[0];
  }

  // Fallback: extract quoted strings or capitalized words
  const quotedMatch = text.match(/"([^"]+)"|'([^']+)'/);
  if (quotedMatch) {
    return quotedMatch[1] || quotedMatch[2] || '';
  }

  return '';
}

function detectPeriod(text: string): string {
  if (text.includes('today')) return 'today';
  if (text.includes('week')) return 'week';
  if (text.includes('quarter')) return 'quarter';
  if (text.includes('year') || text.includes('annual')) return 'year';
  return 'month';
}

/**
 * Get the list of available tools as descriptions (for displaying to users or AI).
 */
export function getAvailableTools(): Array<{ name: string; description: string }> {
  return toolDefinitions.map((t) => ({
    name: t.name,
    description: t.description,
  }));
}
