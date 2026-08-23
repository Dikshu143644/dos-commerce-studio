// Supabase Edge Function: AI Chat with RAG, Tool Calling, Streaming, Rate Limiting
// Deno runtime - supports OpenAI function calling, SSE streaming, provider fallback

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Types ───────────────────────────────────────────────────────────

interface ChatRequest {
  message: string;
  agentType: string;
  conversationId?: string;
  messages?: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  enableRag?: boolean;
  enableTools?: boolean;
}

interface ToolCallResult {
  tool_name: string;
  success: boolean;
  data: Record<string, unknown> | null;
  error?: string;
  execution_time_ms: number;
}

interface SSEEvent {
  type: 'token' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  name?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  sources?: string[];
}

// ─── Rate Limiting ───────────────────────────────────────────────────
// NOTE: This in-memory rate limiter is per-isolate and resets on cold start.
// Supabase Edge Functions may run multiple isolates and cold-start frequently,
// so this does NOT enforce a global rate limit. It provides basic abuse prevention
// against sustained rapid requests within a single warm isolate. For strict
// rate limiting, use a durable store (e.g., Redis or a Supabase table with
// atomic increment).

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// ─── Agent System Prompts ────────────────────────────────────────────

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  inventory: `You are an AI inventory management assistant for StockFlow. You help users manage their warehouse inventory, track stock levels, identify low-stock items, suggest reorder quantities, and analyze inventory trends. You have access to tools that can query real-time inventory data. Use them proactively when users ask about stock, products, or warehouses.`,
  sales: `You are an AI sales assistant for StockFlow. You help users manage their CRM, track deals, follow up with leads, analyze sales pipelines, and forecast revenue. You have access to tools for querying customer data, order status, pipeline values, and lead information. Use them to provide data-driven insights.`,
  procurement: `You are an AI procurement assistant for StockFlow. You help users manage purchase orders, evaluate suppliers, optimize purchasing schedules, and control procurement costs. You have access to tools that query supplier performance and order data.`,
  finance: `You are an AI finance assistant for StockFlow. You help users track revenue, analyze margins, manage invoices, monitor cash flow, and generate financial reports. You have tools to query revenue summaries, overdue invoices, and financial metrics.`,
  excel: `You are an AI data assistant for StockFlow. You help users import and export data, generate reports, create custom Excel exports, analyze data patterns, and set up automated reporting workflows.`,
  general: `You are StockFlow AI, an intelligent assistant for the StockFlow Enterprise Inventory & CRM Management System. You can help with inventory management, sales tracking, procurement, finance, and data operations. You have access to tools that query real-time business data. Use them to provide accurate, data-driven answers.`,
};

// ─── OpenAI Function Schemas (Tool Definitions) ─────────────────────

const TOOL_SCHEMAS = [
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
        required: [],
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
        required: [],
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
        required: [],
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
];

// ─── Tool Execution ──────────────────────────────────────────────────

/**
 * Sanitize a string value for use in PostgREST filter expressions.
 * Strips characters that could manipulate the filter DSL (commas, dots used
 * as operators, parentheses). This prevents AI-generated tool arguments from
 * injecting additional filter clauses into .or() / .ilike() expressions.
 */
function sanitizeFilterValue(value: string): string {
  // Remove PostgREST filter operators and special chars that could manipulate queries
  return value.replace(/[,().*\\]/g, '').trim();
}

async function executeToolCall(
  supabaseClient: ReturnType<typeof createClient>,
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
          (p: Record<string, unknown>) => p.quantity !== null && p.reorder_point !== null && (p.quantity as number) <= (p.reorder_point as number)
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
          case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
          case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
          case 'quarter': startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); break;
          case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
          default: startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const { data: orders, error } = await supabaseClient
          .from('sales_orders')
          .select('total_amount, status, created_at')
          .gte('created_at', startDate.toISOString());
        if (error) throw new Error(error.message);
        const completed = (orders || []).filter((o: Record<string, unknown>) => o.status === 'completed');
        const totalRevenue = completed.reduce((sum: number, o: Record<string, unknown>) => sum + ((o.total_amount as number) || 0), 0);
        data = { period, total_revenue: totalRevenue, completed_orders: completed.length, total_orders: (orders || []).length };
        break;
      }
      case 'get_pipeline_value': {
        const { data: deals, error } = await supabaseClient
          .from('deals')
          .select('id, title, stage, value, probability')
          .eq('is_active', true);
        if (error) throw new Error(error.message);
        const totalValue = (deals || []).reduce((sum: number, d: Record<string, unknown>) => sum + ((d.value as number) || 0), 0);
        const weightedValue = (deals || []).reduce(
          (sum: number, d: Record<string, unknown>) => sum + ((d.value as number) || 0) * (((d.probability as number) || 0) / 100), 0
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
          (sum: number, inv: Record<string, unknown>) => sum + (((inv.total_amount as number) || 0) - ((inv.paid_amount as number) || 0)), 0
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

// ─── RAG: Knowledge Base Query ───────────────────────────────────────

/**
 * Generate an embedding vector for the given text using the OpenAI embeddings API.
 * Returns null if the API key is not configured or the call fails.
 */
async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (_e) {
    return null;
  }
}

async function queryKnowledgeBase(
  supabaseClient: ReturnType<typeof createClient>,
  query: string,
  agentType: string
): Promise<Array<{ title: string; content: string; category: string }>> {
  // Try semantic search via match_knowledge RPC if we can generate an embedding
  try {
    const embedding = await generateQueryEmbedding(query);
    if (embedding) {
      const { data: rpcResults } = await supabaseClient.rpc('match_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 5,
      });
      if (rpcResults && rpcResults.length > 0) {
        return rpcResults.map((r: Record<string, unknown>) => ({
          title: String(r.title || ''),
          content: String(r.content || ''),
          category: String(r.category || ''),
        }));
      }
    }
  } catch (_e) {
    // Embedding generation or RPC failed, fall back to tag-based search
  }

  // Fallback: tag-based search using agent type and keywords
  const tags = [agentType];
  const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
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

// ─── AI Provider Calls ───────────────────────────────────────────────

interface AICallOptions {
  messages: Array<{ role: string; content: string; tool_call_id?: string; name?: string }>;
  systemPrompt: string;
  enableTools: boolean;
  stream?: boolean;
}

interface AICallResponse {
  content: string;
  tool_calls?: Array<{
    id: string;
    function: { name: string; arguments: string };
  }>;
  tokensUsed?: number;
  model?: string;
}

async function callOpenAI(options: AICallOptions): Promise<AICallResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o';
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: options.systemPrompt },
      ...options.messages,
    ],
    max_tokens: 2048,
    temperature: 0.7,
  };

  if (options.enableTools && TOOL_SCHEMAS.length > 0) {
    body.tools = TOOL_SCHEMAS;
    body.tool_choice = 'auto';
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message;

  return {
    content: choice?.content || '',
    tool_calls: choice?.tool_calls,
    tokensUsed: data.usage?.total_tokens,
    model,
  };
}

async function callGemini(options: AICallOptions): Promise<AICallResponse> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-pro';
  const contents = options.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    model,
  };
}

async function callAnthropic(options: AICallOptions): Promise<AICallResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-3-5-sonnet-20241022';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: options.systemPrompt,
      messages: options.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role === 'tool' ? 'user' : m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text || '',
    model,
  };
}

// Provider fallback chain: OpenAI -> Gemini -> Anthropic
async function callAIWithFallback(options: AICallOptions): Promise<AICallResponse & { provider: string }> {
  const providers: Array<{ name: string; fn: (opts: AICallOptions) => Promise<AICallResponse> }> = [
    { name: 'openai', fn: callOpenAI },
    { name: 'gemini', fn: callGemini },
    { name: 'anthropic', fn: callAnthropic },
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const result = await provider.fn(options);
      return { ...result, provider: provider.name };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Provider ${provider.name} failed:`, lastError.message);
      continue;
    }
  }

  throw lastError || new Error('All AI providers failed');
}

// ─── SSE Streaming Handler ───────────────────────────────────────────

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
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ─── Main Handler ────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Validate JWT from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting: 30 requests per minute per user
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Maximum 30 requests per minute.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: ChatRequest = await req.json();
    const {
      message,
      agentType,
      conversationId,
      messages: chatHistory,
      enableRag = false,
      enableTools = false,
    } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine system prompt
    const baseSystemPrompt = body.systemPrompt || AGENT_SYSTEM_PROMPTS[agentType] || AGENT_SYSTEM_PROMPTS.general;

    // Check if SSE streaming is requested
    const acceptHeader = req.headers.get('accept') || '';
    const isStreaming = acceptHeader.includes('text/event-stream');

    // Process the chat request (used for both streaming and non-streaming)
    const processRequest = async (sendEvent?: (event: SSEEvent) => void): Promise<{
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
        const knowledgeResults = await queryKnowledgeBase(supabaseClient, message, agentType || 'general');
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
        enableTools: enableTools && !!Deno.env.get('OPENAI_API_KEY'), // Tools only with OpenAI
      };

      let aiResponse = await callAIWithFallback(aiOptions);

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
          } catch (_e) {
            fnArgs = {};
          }

          if (sendEvent) {
            sendEvent({ type: 'tool_call', name: fnName, input: fnArgs });
          }

          const toolResult = await executeToolCall(
            supabaseClient,
            fnName,
            fnArgs,
            user.id,
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
        aiResponse = await callAIWithFallback({
          ...aiOptions,
          messages: aiMessages,
        });
      }

      // Stream tokens if SSE mode
      if (sendEvent && aiResponse.content) {
        // Send content in chunks for progressive rendering
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

        // Save conversation
        await saveConversation(supabaseClient, user.id, message, result.content, agentType, conversationId, result);

        // Send done event
        sendEvent({
          type: 'done',
          content: result.content,
          sources: result.sources,
        });
      });
    }

    // Non-streaming response
    const result = await processRequest();

    // Save conversation
    await saveConversation(supabaseClient, user.id, message, result.content, agentType, conversationId, result);

    return new Response(
      JSON.stringify({
        content: result.content,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        sources: result.sources,
        conversationId: conversationId || undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('AI Chat Error:', errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ─── Save Conversation ───────────────────────────────────────────────

async function saveConversation(
  supabaseClient: ReturnType<typeof createClient>,
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

      const existingMessages = existing?.messages || [];
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
      await supabaseClient
        .from('ai_conversations')
        .insert({
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
