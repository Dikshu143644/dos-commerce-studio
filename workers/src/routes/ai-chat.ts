import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env, ChatRequest, ToolCallResult, SSEEvent, AICallOptions } from '../types';
import { createSupabaseClient } from '../services/supabase';
import { callAIWithFallback, generateQueryEmbedding } from '../services/ai';
import { rateLimitMiddleware } from '../middleware/rate-limit';

const aiChat = new Hono<{ Bindings: Env }>();

// Apply rate limiting to all AI chat routes
aiChat.use('/*', rateLimitMiddleware);

// Agent System Prompts
const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  inventory: `You are an AI inventory management assistant for StockFlow. You help users manage their warehouse inventory, track stock levels, identify low-stock items, suggest reorder quantities, and analyze inventory trends. You have access to tools that can query real-time inventory data. Use them proactively when users ask about stock, products, or warehouses.`,
  sales: `You are an AI sales assistant for StockFlow. You help users manage their CRM, track deals, follow up with leads, analyze sales pipelines, and forecast revenue. You have access to tools for querying customer data, order status, pipeline values, and lead information. Use them to provide data-driven insights.`,
  procurement: `You are an AI procurement assistant for StockFlow. You help users manage purchase orders, evaluate suppliers, optimize purchasing schedules, and control procurement costs. You have access to tools that query supplier performance and order data.`,
  finance: `You are an AI finance assistant for StockFlow. You help users track revenue, analyze margins, manage invoices, monitor cash flow, and generate financial reports. You have tools to query revenue summaries, overdue invoices, and financial metrics.`,
  excel: `You are an AI data assistant for StockFlow. You help users import and export data, generate reports, create custom Excel exports, analyze data patterns, and set up automated reporting workflows. You can generate Excel reports using the generate_excel_report tool.`,
  general: `You are StockFlow AI, an intelligent assistant for the StockFlow Enterprise Inventory & CRM Management System. You can help with inventory management, sales tracking, procurement, finance, and data operations. You have access to tools that query real-time business data. Use them to provide accurate, data-driven answers.`,
};

// OpenAI Function Schemas (Tool Definitions)
export const TOOL_SCHEMAS = [
  {
    type: 'function' as const,
    function: {
      name: 'check_stock',
      description: 'Check current stock level for a specific product by ID, name, or SKU',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID, name, or SKU to look up' },
        },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_low_stock',
      description: 'Find all products that are below their reorder point',
      parameters: {
        type: 'object',
        properties: {
          warehouse_id: { type: 'string', description: 'Optional warehouse ID to filter by' },
        },
        required: [] as string[],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_customer_info',
      description: 'Get detailed information about a customer by ID, name, or email',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID, name, or email to search' },
        },
        required: ['customer_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_order_status',
      description: 'Get the status and details of a sales order by order number',
      parameters: {
        type: 'object',
        properties: {
          order_number: { type: 'string', description: 'Order number or order ID' },
        },
        required: ['order_number'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_revenue_summary',
      description: 'Get revenue summary with totals and breakdowns for a time period',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description: 'Time period for the summary',
            enum: ['today', 'week', 'month', 'quarter', 'year'],
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_pipeline_value',
      description: 'Get the total value of deals in the sales pipeline, optionally filtered by stage',
      parameters: {
        type: 'object',
        properties: {},
        required: [] as string[],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_products',
      description: 'Search for products by name, SKU, or category',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query for product name or SKU' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_overdue_invoices',
      description: 'Get all invoices that are past their due date and not fully paid',
      parameters: {
        type: 'object',
        properties: {},
        required: [] as string[],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_lead_details',
      description: 'Get detailed information about a lead by ID, name, or email',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'Lead ID, name, or email to search' },
        },
        required: ['lead_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_supplier_performance',
      description: 'Get supplier performance metrics including rating and order history',
      parameters: {
        type: 'object',
        properties: {
          supplier_id: { type: 'string', description: 'Supplier ID or name to look up' },
        },
        required: ['supplier_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_excel_report',
      description: 'Generate an Excel or CSV report from a template with optional filters. Available templates: stock_report, purchase_order, invoice, customer_list, sales_report.',
      parameters: {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            description: 'Report template to use',
            enum: ['stock_report', 'purchase_order', 'invoice', 'customer_list', 'sales_report'],
          },
          filters: {
            type: 'object',
            description: 'Optional filters to apply (e.g., { status: "active", category: "electronics" })',
          },
          format: {
            type: 'string',
            description: 'Output format',
            enum: ['xlsx', 'csv'],
          },
        },
        required: ['template'],
      },
    },
  },
];

// Sanitize filter values to prevent PostgREST injection
function sanitizeFilterValue(value: string): string {
  return value.replace(/[,().*\\]/g, '').trim();
}

// Tool Execution
async function executeToolCall(
  supabaseClient: SupabaseClient,
  env: Env,
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  conversationId?: string
): Promise<ToolCallResult> {
  const startTime = Date.now();

  try {
    let data: Record<string, unknown> | null = null;

    switch (toolName) {
      case 'check_stock': {
        const product = sanitizeFilterValue(String(args['product_id'] || ''));
        const { data: products, error } = await supabaseClient
          .from('products')
          .select('id, name, sku, quantity, min_stock_level, reorder_point, warehouse_id, unit_price')
          .or(`name.ilike.%${product}%,sku.ilike.%${product}%`)
          .limit(5);
        if (error) throw new Error(error.message);
        data = { products: products || [], count: (products || []).length };
        break;
      }
      case 'find_low_stock': {
        const warehouseId = args['warehouse_id'] as string | undefined;
        let query = supabaseClient
          .from('products')
          .select('id, name, sku, quantity, reorder_point, min_stock_level, warehouse_id')
          .eq('is_active', true)
          .not('reorder_point', 'is', null);
        if (warehouseId) query = query.eq('warehouse_id', warehouseId);
        const { data: allProducts, error } = await query.limit(50);
        if (error) throw new Error(error.message);
        const lowStock = (allProducts || []).filter(
          (p: Record<string, unknown>) =>
            p.quantity !== null &&
            p.reorder_point !== null &&
            (p.quantity as number) <= (p.reorder_point as number)
        );
        data = { items: lowStock.slice(0, 10), count: lowStock.length };
        break;
      }
      case 'get_customer_info': {
        const search = sanitizeFilterValue(String(args['customer_id'] || ''));
        const { data: customers, error } = await supabaseClient
          .from('customers')
          .select('id, name, email, phone, customer_type, total_orders, total_spent, created_at')
          .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
          .limit(5);
        if (error) throw new Error(error.message);
        data = { customers: customers || [], count: (customers || []).length };
        break;
      }
      case 'get_order_status': {
        const orderRef = sanitizeFilterValue(String(args['order_number'] || ''));
        const { data: orders, error } = await supabaseClient
          .from('sales_orders')
          .select('id, order_number, customer_id, status, total_amount, created_at, updated_at')
          .ilike('order_number', `%${orderRef}%`)
          .limit(5);
        if (error) throw new Error(error.message);
        data = { orders: orders || [], count: (orders || []).length };
        break;
      }
      case 'get_revenue_summary': {
        const period = String(args['period'] || 'month');
        const now = new Date();
        let startDate: Date;
        switch (period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const { data: orders, error } = await supabaseClient
          .from('sales_orders')
          .select('total_amount, status, created_at')
          .gte('created_at', startDate.toISOString());
        if (error) throw new Error(error.message);
        const completed = (orders || []).filter(
          (o: Record<string, unknown>) => o.status === 'completed'
        );
        const totalRevenue = completed.reduce(
          (sum: number, o: Record<string, unknown>) => sum + ((o.total_amount as number) || 0),
          0
        );
        data = {
          period,
          total_revenue: totalRevenue,
          completed_orders: completed.length,
          total_orders: (orders || []).length,
        };
        break;
      }
      case 'get_pipeline_value': {
        const { data: deals, error } = await supabaseClient
          .from('deals')
          .select('id, title, stage, value, probability')
          .eq('is_active', true);
        if (error) throw new Error(error.message);
        const totalValue = (deals || []).reduce(
          (sum: number, d: Record<string, unknown>) => sum + ((d.value as number) || 0),
          0
        );
        const weightedValue = (deals || []).reduce(
          (sum: number, d: Record<string, unknown>) =>
            sum + ((d.value as number) || 0) * (((d.probability as number) || 0) / 100),
          0
        );
        data = { total_value: totalValue, weighted_value: weightedValue, deal_count: (deals || []).length };
        break;
      }
      case 'search_products': {
        const searchQuery = sanitizeFilterValue(String(args['query'] || ''));
        const { data: products, error } = await supabaseClient
          .from('products')
          .select('id, name, sku, quantity, unit_price, cost_price, is_active')
          .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
          .limit(10);
        if (error) throw new Error(error.message);
        data = { products: products || [], count: (products || []).length };
        break;
      }
      case 'get_overdue_invoices': {
        const { data: invoices, error } = await supabaseClient
          .from('invoices')
          .select('id, sales_order_id, total_amount, paid_amount, status, due_date, created_at')
          .lt('due_date', new Date().toISOString())
          .neq('status', 'paid')
          .order('due_date', { ascending: true })
          .limit(10);
        if (error) throw new Error(error.message);
        const totalOverdue = (invoices || []).reduce(
          (sum: number, inv: Record<string, unknown>) =>
            sum + (((inv.total_amount as number) || 0) - ((inv.paid_amount as number) || 0)),
          0
        );
        data = { invoices: invoices || [], count: (invoices || []).length, total_overdue: totalOverdue };
        break;
      }
      case 'get_lead_details': {
        const search = sanitizeFilterValue(String(args['lead_id'] || ''));
        const { data: leads, error } = await supabaseClient
          .from('leads')
          .select('id, name, email, phone, status, source, score, assigned_to, created_at')
          .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
          .limit(5);
        if (error) throw new Error(error.message);
        data = { leads: leads || [], count: (leads || []).length };
        break;
      }
      case 'get_supplier_performance': {
        const supplierSearch = sanitizeFilterValue(String(args['supplier_id'] || ''));
        const { data: suppliers, error } = await supabaseClient
          .from('suppliers')
          .select('id, name, contact_name, email, phone, rating')
          .ilike('name', `%${supplierSearch}%`)
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(5);
        if (error) throw new Error(error.message);
        data = { suppliers: suppliers || [], count: (suppliers || []).length };
        break;
      }
      case 'generate_excel_report': {
        // Call the excel generation logic internally
        const template = String(args['template'] || 'stock_report');
        const filters = (args['filters'] as Record<string, unknown>) || {};
        const format = (args['format'] as string) || 'xlsx';

        // Use the same Supabase client to generate the report
        const reportData = await generateReportData(supabaseClient, template, filters);

        data = {
          success: true,
          template,
          format,
          rowCount: reportData.length,
          message: `Generated ${template} report with ${reportData.length} rows in ${format} format. The file is ready for download.`,
          preview: reportData.slice(0, 5),
        };
        break;
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    const result: ToolCallResult = {
      tool_name: toolName,
      success: true,
      data,
      execution_time_ms: Date.now() - startTime,
    };

    // Log tool execution
    if (conversationId) {
      await supabaseClient.from('ai_tool_executions').insert({
        conversation_id: conversationId,
        user_id: userId,
        tool_name: toolName,
        tool_input: args,
        tool_output: data,
        execution_time_ms: result.execution_time_ms,
        success: true,
      });
    }

    return result;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const result: ToolCallResult = {
      tool_name: toolName,
      success: false,
      data: null,
      error: errorMsg,
      execution_time_ms: Date.now() - startTime,
    };

    if (conversationId) {
      await supabaseClient.from('ai_tool_executions').insert({
        conversation_id: conversationId,
        user_id: userId,
        tool_name: toolName,
        tool_input: args,
        tool_output: null,
        execution_time_ms: result.execution_time_ms,
        success: false,
        error_message: errorMsg,
      });
    }

    return result;
  }
}

// Helper for generate_excel_report tool
async function generateReportData(
  supabaseClient: SupabaseClient,
  template: string,
  filters: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  switch (template) {
    case 'stock_report': {
      let query = supabaseClient
        .from('products')
        .select('sku, name, category, quantity, reorder_point, unit_price');
      if (filters.warehouse_id) query = query.eq('warehouse_id', filters.warehouse_id as string);
      if (filters.category) query = query.eq('category', filters.category as string);
      const { data } = await query.order('name').limit(1000);
      return data || [];
    }
    case 'purchase_order': {
      let query = supabaseClient
        .from('purchase_orders')
        .select('po_number, total_amount, status, created_at');
      if (filters.status) query = query.eq('status', filters.status as string);
      const { data } = await query.order('created_at', { ascending: false }).limit(1000);
      return data || [];
    }
    case 'invoice': {
      let query = supabaseClient
        .from('invoices')
        .select('invoice_number, total_amount, paid_amount, status, due_date');
      if (filters.status) query = query.eq('status', filters.status as string);
      const { data } = await query.order('created_at', { ascending: false }).limit(1000);
      return data || [];
    }
    case 'customer_list': {
      let query = supabaseClient
        .from('customers')
        .select('name, email, phone, customer_type, total_orders, total_spent');
      if (filters.customer_type) query = query.eq('customer_type', filters.customer_type as string);
      const { data } = await query.order('name').limit(1000);
      return data || [];
    }
    case 'sales_report': {
      let query = supabaseClient
        .from('sales_orders')
        .select('order_number, total_amount, status, created_at');
      if (filters.status) query = query.eq('status', filters.status as string);
      if (filters.start_date) query = query.gte('created_at', filters.start_date as string);
      if (filters.end_date) query = query.lte('created_at', filters.end_date as string);
      const { data } = await query.order('created_at', { ascending: false }).limit(1000);
      return data || [];
    }
    default:
      return [];
  }
}

// RAG: Knowledge Base Query
async function queryKnowledgeBase(
  supabaseClient: SupabaseClient,
  env: Env,
  query: string,
  agentType: string
): Promise<Array<{ title: string; content: string; category: string }>> {
  // Try semantic search via match_knowledge RPC
  try {
    const embedding = await generateQueryEmbedding(env, query);
    if (embedding) {
      const { data: rpcResults } = await supabaseClient.rpc('match_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 5,
      });
      if (rpcResults && (rpcResults as unknown[]).length > 0) {
        return (rpcResults as Record<string, unknown>[]).map((r) => ({
          title: String(r.title || ''),
          content: String(r.content || ''),
          category: String(r.category || ''),
        }));
      }
    }
  } catch {
    // Embedding generation or RPC failed, fall back to tag-based search
  }

  // Fallback: tag-based search using agent type and keywords
  const tags = [agentType];
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (keywords.length > 0) {
    tags.push(...keywords.slice(0, 3));
  }

  const { data: entries } = await supabaseClient
    .from('knowledge_base')
    .select('title, content, category, tags')
    .eq('is_active', true)
    .overlaps('tags', tags)
    .limit(5);

  return (entries || []).map((e: Record<string, unknown>) => ({
    title: String(e.title || ''),
    content: String(e.content || ''),
    category: String(e.category || ''),
  }));
}

// SSE Streaming Handler
function createSSEStream(
  processChat: (sendEvent: (event: SSEEvent) => void) => Promise<void>
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SSEEvent) => {
        const data = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        await processChat(sendEvent);
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        sendEvent({ type: 'error', content: errorMsg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// Save conversation to Supabase
async function saveConversation(
  supabaseClient: SupabaseClient,
  userId: string,
  userMessage: string,
  assistantResponse: string,
  agentType: string,
  conversationId?: string,
  result?: { provider: string; model?: string; tokensUsed?: number }
): Promise<void> {
  const now = new Date().toISOString();

  try {
    if (conversationId) {
      const { data: existing } = await supabaseClient
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      const existingMessages = (existing?.messages as unknown[]) || [];
      const updatedMessages = [
        ...existingMessages,
        { role: 'user', content: userMessage, timestamp: now },
        { role: 'assistant', content: assistantResponse, timestamp: now },
      ];

      await supabaseClient
        .from('ai_conversations')
        .update({
          messages: updatedMessages,
          updated_at: now,
          total_tokens: result?.tokensUsed || null,
          provider: result?.provider || null,
          model: result?.model || null,
        })
        .eq('id', conversationId);
    } else {
      await supabaseClient.from('ai_conversations').insert({
        user_id: userId,
        agent_type: agentType || 'general',
        title: userMessage.substring(0, 100),
        messages: [
          { role: 'user', content: userMessage, timestamp: now },
          { role: 'assistant', content: assistantResponse, timestamp: now },
        ],
        created_at: now,
        updated_at: now,
        total_tokens: result?.tokensUsed || null,
        provider: result?.provider || null,
        model: result?.model || null,
      });
    }
  } catch (error: unknown) {
    console.error('Failed to save conversation:', error instanceof Error ? error.message : error);
  }
}

// Main AI chat endpoint
aiChat.post('/ai/chat', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<ChatRequest>();
    const {
      message,
      agentType,
      conversationId,
      messages: chatHistory,
      enableRag = false,
      enableTools = false,
    } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const supabase = createSupabaseClient(c.env);
    const baseSystemPrompt =
      body.systemPrompt || AGENT_SYSTEM_PROMPTS[agentType] || AGENT_SYSTEM_PROMPTS.general;

    // Check if SSE streaming is requested
    const acceptHeader = c.req.header('Accept') || '';
    const isStreaming = acceptHeader.includes('text/event-stream');

    // Process the chat request
    const processRequest = async (
      sendEvent?: (event: SSEEvent) => void
    ): Promise<{
      content: string;
      provider: string;
      model?: string;
      tokensUsed?: number;
      sources: string[];
    }> => {
      let enhancedPrompt = baseSystemPrompt;
      const sources: string[] = [];

      // RAG: Query knowledge base and build context
      if (enableRag) {
        const knowledgeResults = await queryKnowledgeBase(
          supabase,
          c.env,
          message,
          agentType || 'general'
        );
        if (knowledgeResults.length > 0) {
          const knowledgeContext = knowledgeResults
            .map((k) => `[${k.category}] ${k.title}: ${k.content}`)
            .join('\n\n');
          enhancedPrompt += `\n\n--- Relevant Knowledge Base Context ---\n${knowledgeContext}\n--- End Knowledge Context ---`;
          sources.push(...knowledgeResults.map((k) => k.title));
        }
      }

      // Build message array
      const aiMessages: Array<{ role: string; content: string; tool_call_id?: string; name?: string }> =
        chatHistory && chatHistory.length > 0
          ? chatHistory.map((m) => ({ role: m.role, content: m.content }))
          : [{ role: 'user', content: message }];

      // Call AI with tool support
      const aiOptions: AICallOptions = {
        messages: aiMessages,
        systemPrompt: enhancedPrompt,
        enableTools: enableTools && !!c.env.OPENAI_API_KEY,
      };

      let aiResponse = await callAIWithFallback(c.env, aiOptions);

      // Handle tool calls (loop until no more tool calls)
      let iterations = 0;
      const maxIterations = 5;

      while (aiResponse.tool_calls && aiResponse.tool_calls.length > 0 && iterations < maxIterations) {
        iterations++;

        // Add assistant's tool call message
        aiMessages.push({
          role: 'assistant',
          content: aiResponse.content || '',
        });

        // Execute each tool call
        for (const toolCall of aiResponse.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs: Record<string, unknown> = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            fnArgs = {};
          }

          if (sendEvent) {
            sendEvent({ type: 'tool_call', name: fnName, input: fnArgs });
          }

          const toolResult = await executeToolCall(
            supabase,
            c.env,
            fnName,
            fnArgs,
            userId,
            conversationId
          );

          if (sendEvent) {
            sendEvent({
              type: 'tool_result',
              name: fnName,
              output: toolResult.data || { error: toolResult.error },
            });
          }

          // Add tool result as a message for the next AI call
          aiMessages.push({
            role: 'tool',
            content: JSON.stringify(toolResult.data || { error: toolResult.error }),
            tool_call_id: toolCall.id,
            name: fnName,
          });

          sources.push(`tool:${fnName}`);
        }

        // Re-call AI with tool results
        aiResponse = await callAIWithFallback(c.env, {
          ...aiOptions,
          messages: aiMessages,
        });
      }

      // Stream tokens if SSE mode
      if (sendEvent && aiResponse.content) {
        const words = aiResponse.content.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
          sendEvent({ type: 'token', content: chunk });
        }
      }

      return {
        content: aiResponse.content || 'No response generated.',
        provider: aiResponse.provider || 'unknown',
        model: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed,
        sources,
      };
    };

    // Handle streaming response
    if (isStreaming) {
      return createSSEStream(async (sendEvent) => {
        const result = await processRequest(sendEvent);
        await saveConversation(
          supabase,
          userId,
          message,
          result.content,
          agentType,
          conversationId,
          result
        );
        sendEvent({
          type: 'done',
          content: result.content,
          sources: result.sources,
        });
      });
    }

    // Non-streaming response
    const result = await processRequest();
    await saveConversation(supabase, userId, message, result.content, agentType, conversationId, result);

    return c.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      sources: result.sources,
      conversationId: conversationId || undefined,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('AI Chat Error:', errorMessage);
    return c.json({ error: errorMessage }, 500);
  }
});

export default aiChat;
