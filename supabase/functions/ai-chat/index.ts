// Supabase Edge Function: AI Chat
// Deno runtime - routes AI requests to OpenAI/Gemini/Anthropic based on env config

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  message: string;
  agentType: string;
  conversationId?: string;
  messages?: Array<{ role: string; content: string }>;
  systemPrompt?: string;
}

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  inventory: `You are an AI inventory management assistant for StockFlow. You help users manage their warehouse inventory, track stock levels, identify low-stock items, suggest reorder quantities, and analyze inventory trends. Provide specific, actionable advice based on the data.`,
  sales: `You are an AI sales assistant for StockFlow. You help users manage their CRM, track deals, follow up with leads, analyze sales pipelines, and forecast revenue. Provide data-driven insights and actionable sales recommendations.`,
  procurement: `You are an AI procurement assistant for StockFlow. You help users manage purchase orders, evaluate suppliers, optimize purchasing schedules, and control procurement costs. Suggest best practices for vendor management.`,
  finance: `You are an AI finance assistant for StockFlow. You help users track revenue, analyze margins, manage invoices, monitor cash flow, and generate financial reports. Provide insights on profitability and cost optimization.`,
  excel: `You are an AI data assistant for StockFlow. You help users import and export data, generate reports, create custom Excel exports, analyze data patterns, and set up automated reporting workflows.`,
  general: `You are StockFlow AI, an intelligent assistant for the StockFlow Enterprise Inventory & CRM Management System. You can help with inventory management, sales tracking, procurement, finance, and data operations. Ask how you can help the user with their business operations.`,
};

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated.';
}

async function callGemini(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-pro';
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

async function callAnthropic(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') || 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.filter((m) => m.role !== 'system'),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'No response generated.';
}

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

    // Initialize Supabase client with the user's JWT
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

    // Parse request body
    const body: ChatRequest = await req.json();
    const { message, agentType, conversationId, messages: chatHistory } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the system prompt for the agent type
    const systemPrompt = body.systemPrompt || AGENT_SYSTEM_PROMPTS[agentType] || AGENT_SYSTEM_PROMPTS.general;

    // Build message history for the AI
    const aiMessages = chatHistory && chatHistory.length > 0
      ? chatHistory
      : [{ role: 'user', content: message }];

    // Determine which AI provider to use
    const provider = Deno.env.get('AI_PRIMARY_PROVIDER') || 'openai';
    let responseContent: string;

    switch (provider.toLowerCase()) {
      case 'gemini':
        responseContent = await callGemini(aiMessages, systemPrompt);
        break;
      case 'anthropic':
        responseContent = await callAnthropic(aiMessages, systemPrompt);
        break;
      case 'openai':
      default:
        responseContent = await callOpenAI(aiMessages, systemPrompt);
        break;
    }

    // Save conversation to ai_conversations table
    const now = new Date().toISOString();
    if (conversationId) {
      // Update existing conversation
      const { data: existing } = await supabaseClient
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      const existingMessages = existing?.messages || [];
      const updatedMessages = [
        ...existingMessages,
        { role: 'user', content: message, timestamp: now },
        { role: 'assistant', content: responseContent, timestamp: now },
      ];

      await supabaseClient
        .from('ai_conversations')
        .update({
          messages: updatedMessages,
          updated_at: now,
        })
        .eq('id', conversationId);
    } else {
      // Create new conversation
      await supabaseClient
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          agent_type: agentType || 'general',
          title: message.substring(0, 100),
          messages: [
            { role: 'user', content: message, timestamp: now },
            { role: 'assistant', content: responseContent, timestamp: now },
          ],
          created_at: now,
          updated_at: now,
        });
    }

    return new Response(
      JSON.stringify({
        content: responseContent,
        provider,
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
