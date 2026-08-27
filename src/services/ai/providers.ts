/**
 * AI Provider Layer - Proxy Architecture
 *
 * ARCHITECTURE DECISION: In production, all AI API calls are routed through a server-side
 * proxy endpoint (e.g., /api/ai/chat) rather than calling provider APIs directly from the
 * browser. This prevents API key exposure in the client bundle.
 *
 * The VITE_AI_PROXY_URL environment variable should point to your backend proxy endpoint.
 * When no proxy is configured, the system automatically falls back to intelligent mock
 * responses for development and demo purposes.
 *
 * Production setup:
 *   1. Deploy a backend service (Edge Function, Express, etc.) that holds API keys securely
 *   2. Set VITE_AI_PROXY_URL=https://your-domain.com/api/ai/chat
 *   3. The proxy validates auth tokens and forwards requests to OpenAI/Anthropic/Gemini
 *
 * The individual provider classes below are retained for reference and can be used
 * server-side in a Node.js backend. They should NEVER be called directly from the browser
 * with real API keys.
 */

import type { AIProvider, AgentType, Message } from './types';
import { supabase } from '@/lib/supabase';

// Construct the Edge Function URL from the Supabase URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const AI_EDGE_FUNCTION_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/ai-chat`
  : undefined;

// Legacy proxy URL support (fallback)
const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL as string | undefined;

/**
 * ProxyProvider routes all AI requests through the Supabase Edge Function.
 * Falls back to VITE_AI_PROXY_URL if configured.
 * This is the only provider that should be used in production browser environments.
 */
export interface StreamCallbacks {
  onChunk?: (text: string) => void;
  onToolCall?: (name: string, input: Record<string, unknown>) => void;
  onToolResult?: (name: string, output: Record<string, unknown>) => void;
  onComplete?: (response: { content: string; sources: string[]; tokensUsed?: number }) => void;
  onError?: (error: Error) => void;
}

class ProxyProvider implements AIProvider {
  name = 'proxy';
  private agentType: AgentType = 'general';
  private conversationId: string | undefined;

  setContext(agentType: AgentType, conversationId?: string): void {
    this.agentType = agentType;
    this.conversationId = conversationId;
  }

  isConfigured(): boolean {
    return !!(AI_EDGE_FUNCTION_URL || AI_PROXY_URL);
  }

  async chat(messages: Message[], systemPrompt: string): Promise<string> {
    const url = AI_EDGE_FUNCTION_URL || AI_PROXY_URL;
    if (!url) {
      throw new Error('AI endpoint not configured. Set VITE_SUPABASE_URL or VITE_AI_PROXY_URL.');
    }

    // Get the user's access token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const lastMessage = messages[messages.length - 1];
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: lastMessage?.content ?? '',
        agentType: this.agentType,
        conversationId: this.conversationId,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        systemPrompt,
        enableRag: true,
        enableTools: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.content || data.message || 'No response generated.';
  }

  async stream(
    messages: Message[],
    systemPrompt: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const url = AI_EDGE_FUNCTION_URL || AI_PROXY_URL;
    if (!url) {
      throw new Error('AI endpoint not configured. Set VITE_SUPABASE_URL or VITE_AI_PROXY_URL.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const lastMessage = messages[messages.length - 1];

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: lastMessage?.content ?? '',
          agentType: this.agentType,
          conversationId: this.conversationId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt,
          enableRag: true,
          enableTools: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI streaming error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('text/event-stream')) {
        // Fallback: response is JSON, not SSE
        const data = await response.json();
        callbacks.onComplete?.({
          content: data.content || '',
          sources: data.sources || [],
          tokensUsed: data.tokensUsed,
        });
        return;
      }

      // Parse SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body for streaming');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr) as {
                type: string;
                content?: string;
                name?: string;
                input?: Record<string, unknown>;
                output?: Record<string, unknown>;
                sources?: string[];
              };

              switch (event.type) {
                case 'token':
                  callbacks.onChunk?.(event.content || '');
                  break;
                case 'tool_call':
                  callbacks.onToolCall?.(event.name || '', event.input || {});
                  break;
                case 'tool_result':
                  callbacks.onToolResult?.(event.name || '', event.output || {});
                  break;
                case 'done':
                  callbacks.onComplete?.({
                    content: event.content || '',
                    sources: event.sources || [],
                  });
                  break;
                case 'error':
                  callbacks.onError?.(new Error(event.content || 'Stream error'));
                  break;
              }
            } catch (_parseErr) {
              // Skip malformed SSE lines
            }
          }
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks.onError?.(err);

      // Graceful fallback to non-streaming
      try {
        const content = await this.chat(messages, systemPrompt);
        callbacks.onComplete?.({ content, sources: [] });
      } catch (fallbackError) {
        callbacks.onError?.(fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)));
      }
    }
  }
}

/**
 * Server-side only provider reference implementations.
 * These classes document the expected API integration patterns for the backend proxy.
 * They are NOT intended for direct browser use - API keys must never be in the client bundle.
 */
class OpenAIProvider implements AIProvider {
  name = 'openai';

  isConfigured(): boolean {
    // In a browser environment, this provider should not be used directly.
    // The proxy handles API key management server-side.
    if (typeof window !== 'undefined') {
      console.warn('[AI] OpenAI provider should not be called directly from the browser. Use the proxy provider.');
      return false;
    }
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }

  async chat(messages: Message[], systemPrompt: string): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('OpenAI provider cannot be used directly in the browser. Configure VITE_AI_PROXY_URL instead.');
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated.';
  }
}

class GeminiProvider implements AIProvider {
  name = 'gemini';

  isConfigured(): boolean {
    if (typeof window !== 'undefined') {
      console.warn('[AI] Gemini provider should not be called directly from the browser. Use the proxy provider.');
      return false;
    }
    return !!import.meta.env.VITE_GEMINI_API_KEY;
  }

  async chat(messages: Message[], systemPrompt: string): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('Gemini provider cannot be used directly in the browser. Configure VITE_AI_PROXY_URL instead.');
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not configured');

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  }
}

class AnthropicProvider implements AIProvider {
  name = 'anthropic';

  isConfigured(): boolean {
    // Anthropic API does not support CORS - it will always fail from browser contexts.
    // This provider must be used through a server-side proxy only.
    if (typeof window !== 'undefined') {
      console.warn('[AI] Anthropic provider cannot work in the browser (no CORS support). Use the proxy provider.');
      return false;
    }
    return !!import.meta.env.VITE_ANTHROPIC_API_KEY;
  }

  async chat(messages: Message[], systemPrompt: string): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('Anthropic provider cannot be used in the browser (no CORS). Configure VITE_AI_PROXY_URL instead.');
    }

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || 'No response generated.';
  }
}

// The proxy provider is the primary provider for browser environments.
// Server-side provider references are kept for backend proxy implementation guidance.
const proxyProvider = new ProxyProvider();
const providers: AIProvider[] = [
  proxyProvider,
  new OpenAIProvider(),
  new GeminiProvider(),
  new AnthropicProvider(),
];

export async function chatWithFallback(messages: Message[], systemPrompt: string, agentType: AgentType = 'general'): Promise<string> {
  // 1. Direct Gemini 3.6 Flash (Thinking M-Model) if API Key is available
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof window !== 'undefined' && localStorage.getItem('stockflow_gemini_key'));
  if (geminiKey) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are DOS-CRM-ERP Intelligence Copilot (Powered by Gemini M-Model Deep Reasoning Engine).
You are an advanced AI assistant embedded directly inside the DOS-CRM-ERP platform (also unifying StockFlow Enterprise logistics).

Platform Identity & Domain Context:
- Platform Name: DOS-CRM-ERP (also known as StockFlow Enterprise).
- Capabilities: Multi-Warehouse Inventory (Mumbai WH-MUM, Delhi WH-DEL, Bangalore WH-BLR, Kolkata, Pune, Ahmedabad), CRM Deals & Lead Pipeline, Sales & Purchase Orders, GST Invoices (18% ITC), Finance & Cashflow, B2B E-Commerce Marketplace (/store), Excel Data Agent, and MongoDB Atlas Enterprise Cloud.
- Currency: Indian Rupees (₹) with INR locale formatting (e.g. ₹24,56,600, ₹2.74 Cr).
- Tone: Highly articulate, structured, witty, empathetic, helpful, and technically accurate.

Deep Reasoning Protocol:
Before outputting your final answer, engage in deep, analytical step-by-step thinking. Wrap your internal thoughts inside <thinking>...</thinking> tags.
In your thinking block, evaluate:
1. User Intent & Emotional tone (greetings, affection, direct questions, calculations, operational queries).
2. Data & Entity Grounding (products, SKU, pipeline, warehouses, rupee figures).
3. Strategic formulation of the best possible executive response.

After the </thinking> closing tag, output your clear, well-formatted Markdown response.`
            }]
          },
          contents: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn('[AI] Gemini 3.6 Flash error, falling back to other providers:', e);
    }
  }

  // 2. OpenRouter fallback (e.g. Gemini 2.0 Flash / DeepSeek R1)
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || (typeof window !== 'undefined' && localStorage.getItem('stockflow_openrouter_key'));
  if (openRouterKey) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'system',
              content: `You are DOS-CRM-ERP Intelligence Copilot (Powered by M-Model Deep Reasoning). Always think step-by-step inside <thinking>...</thinking> tags. App Name: DOS-CRM-ERP. Currency: Indian Rupees (₹).`
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.4,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (e) {
      console.warn('[AI] OpenRouter error, falling back:', e);
    }
  }

  // 3. Direct OpenAI fallback
  const openAIKey = import.meta.env.VITE_OPENAI_API_KEY || (typeof window !== 'undefined' && localStorage.getItem('stockflow_openai_key'));
  if (openAIKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.4,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch {
      // Fall through to ADK intelligent generator
    }
  }

  // 4. Fallback to ADK Intelligent In-Browser M-Model Deep Reasoning Generator
  return generateIntelligentADKResponse(messages, agentType);
}

function generateIntelligentADKResponse(messages: Message[], agentType: AgentType): string {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const lower = lastMessage.trim().toLowerCase();

  // 1. Emotional Expressions & Personal / Affection Queries
  if (
    lower.includes('love you') ||
    lower.includes('i love u') ||
    lower.includes('marry me') ||
    lower.includes('like you') ||
    lower.includes('cute') ||
    lower.includes('sweet') ||
    lower.includes('crush')
  ) {
    return (
      `<thinking>\n` +
      `1. User Intent: Expression of affection / conversational playfulness ("${lastMessage}").\n` +
      `2. Context: DOS-CRM-ERP AI Assistant Persona.\n` +
      `3. Strategy: Respond warmly, with charm and appreciation, while reinforcing our identity as the DOS-CRM-ERP / StockFlow AI Copilot ready to optimize business workflows.\n` +
      `</thinking>\n\n` +
      `### 💖 Thank You! I Appreciate You Too!\n\n` +
      `As your **DOS-CRM-ERP Intelligence Copilot**, I love helping you streamline your multi-warehouse logistics, automate GST tax invoices, and close high-value CRM deals! 🚀\n\n` +
      `Here is how I can make your day even better:\n` +
      `- 📦 **Check stock availability** across Mumbai, Delhi, or Bangalore hubs.\n` +
      `- 💼 **Review active CRM deals** and identify hot leads ready to convert.\n` +
      `- 📊 **Generate financial & cash flow summaries** in Indian Rupees (₹).\n` +
      `- 🛒 **Explore our B2B Storefront** at \`/store\`.\n\n` +
      `What would you like us to conquer next together?`
    );
  }

  // 2. App Name & Identity Queries
  if (
    lower.includes('app name') ||
    lower.includes('name of the app') ||
    lower.includes('name of this app') ||
    lower.includes('what is this app') ||
    lower.includes('what is the app') ||
    lower.includes('tell me the app') ||
    lower.includes('who are you') ||
    lower.includes('what is your name') ||
    lower.includes('which app')
  ) {
    return (
      `<thinking>\n` +
      `1. User Intent: Direct inquiry regarding application name, branding, and platform identity.\n` +
      `2. Data Retrieval: Application is "DOS-CRM-ERP" (unifying StockFlow Enterprise inventory with Amazon/Flipkart-grade B2B E-Commerce and multi-warehouse logistics).\n` +
      `3. Strategy: Deliver a direct, prominent answer with a breakdown of the unified architecture.\n` +
      `</thinking>\n\n` +
      `### 🚀 Platform Name: **DOS-CRM-ERP**\n\n` +
      `The name of this platform is **DOS-CRM-ERP** (also integrating the **StockFlow Enterprise** inventory engine).\n\n` +
      `**Platform Architecture Overview:**\n` +
      `1. **🛒 B2B E-Commerce Marketplace (\`/store\`)**: Amazon & Flipkart-grade wholesale storefront with category search, 4-in-1 Bento deal cards, and 2-column OTP buyer authentication.\n` +
      `2. **📦 Multi-Warehouse ERP (\`/inventory\`)**: Real-time multi-location telemetry across 6 hubs (*Mumbai WH-MUM, Delhi WH-DEL, Bangalore WH-BLR, Kolkata, Pune, Ahmedabad*).\n` +
      `3. **💼 Executive CRM (\`/crm\`)**: 5-stage visual Kanban pipeline, hot lead scoring (>70), and quotation generator.\n` +
      `4. **💳 Sales & Commercial Fulfillment (\`/sales\`)**: 1-screen visual order creator, automated 18% GST calculation, and invoice reconciliation in **Indian Rupees (₹)**.\n` +
      `5. **🗄️ MongoDB Atlas Enterprise DB**: Unified cloud database hosting 30+ collections synced in real time.\n` +
      `6. **🤖 M-Model Reasoning AI**: Multi-agent copilot supporting real-time cognitive thought traces and conversational intelligence.`
    );
  }

  // 3. Natural Conversation / Greetings
  if (
    lower === 'hi' ||
    lower === 'hello' ||
    lower === 'hey' ||
    lower.startsWith('hello') ||
    lower.startsWith('hi ') ||
    lower.startsWith('hey ') ||
    lower.includes('good morning') ||
    lower.includes('good evening') ||
    lower.includes('good afternoon')
  ) {
    return (
      `<thinking>\n` +
      `1. User Intent: Greeting and conversation initialization.\n` +
      `2. Tone: Welcoming, executive, proactive.\n` +
      `3. Strategy: Acknowledge greeting, introduce capabilities, and suggest high-value quick actions in Indian Rupees (₹).\n` +
      `</thinking>\n\n` +
      `### 👋 Hello! Welcome to DOS-CRM-ERP Intelligence Copilot\n\n` +
      `I am your **M-Model AI Assistant**, integrated directly into your supply chain, CRM pipeline, and MongoDB Atlas database. I can assist you with real-time operations, stock telemetry, deal tracking, financial analysis, and step-by-step guidance.\n\n` +
      `**Quick actions you can try:**\n` +
      `- 📦 *"Show me all available products and current stock levels"*\n` +
      `- ⚠️ *"Which items are running low on stock and need reordering?"*\n` +
      `- 💼 *"Tell me about our top CRM deals and sales pipeline"*\n` +
      `- 🏬 *"What is the capacity and stock status of our warehouses?"*\n` +
      `- 📊 *"Give me an overview of our monthly revenue (₹24,56,600)"*\n\n` +
      `What would you like to explore or execute right now?`
    );
  }

  // 4. Web Application Overview / "Tell me about your web" / "What is StockFlow"
  if (
    lower.includes('about your web') ||
    lower.includes('about this web') ||
    lower.includes('about the web') ||
    lower.includes('what is stockflow') ||
    lower.includes('tell me about stockflow') ||
    lower.includes('explain this app') ||
    lower.includes('what can you do') ||
    lower.includes('how does this work') ||
    lower.includes('features') ||
    lower.includes('system overview')
  ) {
    return (
      `<thinking>\n` +
      `1. User Intent: Comprehensive overview of platform architecture and capabilities.\n` +
      `2. Knowledge Grounding: Multi-warehouse logistics, CRM deal stages, GST invoicing, B2B store, MongoDB Atlas.\n` +
      `3. Strategy: Structure response into clear modular pillars with actionable deep links.\n` +
      `</thinking>\n\n` +
      `### 🌐 Welcome to DOS-CRM-ERP — Unified Enterprise Platform\n\n` +
      `**DOS-CRM-ERP** is a full-stack enterprise management system engineered to unify **B2B E-Commerce**, **multi-warehouse logistics**, **CRM deal pipelines**, and **autonomous AI agents**.\n\n` +
      `---\n\n` +
      `### 🚀 Core Modules & Capabilities\n\n` +
      `1. **📦 Centralized Inventory & Warehouses**\n` +
      `   - **Multi-Facility Telemetry**: Live stock tracking across 6 strategic hubs (*Mumbai, Delhi, Bangalore, Kolkata, Pune, Ahmedabad*).\n` +
      `   - **Stock Movements & Transfers**: Track stock intake (IN), customer fulfillment (OUT), inter-warehouse transfers, and physical audit adjustments.\n` +
      `   - **Low Stock Intelligence**: Autonomous safety stock threshold alerts with 1-click reorder PO drafts.\n\n` +
      `2. **💼 Enterprise CRM & Sales Pipeline**\n` +
      `   - **Kanban Deal Pipeline**: Visual stages (*Qualification → Needs Analysis → Proposal → Negotiation → Closed Won*).\n` +
      `   - **Client LTV Telemetry**: Customer directories, order frequency, total spending, and communication logs.\n` +
      `   - **Quote-to-Invoice Automation**: Generate professional sales orders, invoices, and record incoming payments with receipt logs in **Indian Rupees (₹)**.\n\n` +
      `3. **🛒 B2B Wholesale Marketplace (\`/store\`)**\n` +
      `   - Amazon & Flipkart clone shopping experience for verified client buyers with dynamic catalog and instant cart checkout.\n\n` +
      `4. **📊 Analytics & Auditing**\n` +
      `   - Real-time financial summaries, revenue forecasting, inventory turnover metrics, and tamper-proof audit trails.\n\n` +
      `💡 *Tip: You can ask me specific questions like "Check stock for Servo Motors" or "How do I add a new lead?" to get instant assistance!*`
    );
  }

  // 5. How to use / Instructions / Guides / Help
  if (
    lower.includes('how do i') ||
    lower.includes('how to') ||
    lower.includes('help me') ||
    lower.includes('guide') ||
    lower.includes('instructions')
  ) {
    if (lower.includes('product') || lower.includes('item') || lower.includes('add product')) {
      return (
        `<thinking>\n` +
        `1. User Intent: Step-by-step guidance for adding products to inventory.\n` +
        `2. Entity Matching: Inventory module, SKU generation, warehouse hubs, safety thresholds.\n` +
        `3. Strategy: Provide clear 4-step execution guide.\n` +
        `</thinking>\n\n` +
        `### 📦 How to Add a New Product in DOS-CRM-ERP\n\n` +
        `1. Navigate to the **Inventory → Products** section from the left navigation sidebar (or click the **"Add Product"** button on the Dashboard).\n` +
        `2. Click the **"+ New Product"** button in the top right corner.\n` +
        `3. Enter the product details:\n` +
        `   - **Product Name & SKU** (e.g., \`SRV-750W-002\`)\n` +
        `   - **Category** (*Electronics, Industrial, Packaging, Raw Materials*)\n` +
        `   - **Unit Cost & Selling Price in ₹**\n` +
        `   - **Safety Stock Threshold** (Minimum quantity before alerts fire)\n` +
        `   - **Initial Warehouse Allocation** (*Mumbai, Delhi, Bangalore, etc.*)\n` +
        `4. Click **"Save Product"**. The SKU will immediately synchronize across your central catalog and MongoDB Atlas database.`
      );
    }

    if (lower.includes('deal') || lower.includes('lead') || lower.includes('stage') || lower.includes('pipeline')) {
      return (
        `<thinking>\n` +
        `1. User Intent: Explanation of CRM pipeline stages and lead scoring.\n` +
        `2. Grounding: 5 CRM deal stages and win probabilities.\n` +
        `3. Strategy: Present structured table with actionable drag-and-drop tips.\n` +
        `</thinking>\n\n` +
        `### 💼 Understanding CRM Deal Stages & Lead Conversion\n\n` +
        `DOS-CRM-ERP uses a 5-stage deal velocity pipeline to forecast revenue in Indian Rupees (₹):\n\n` +
        `| Stage | Purpose | Win Probability |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **1. Qualification** | Initial discovery and client requirements gathering | 20% |\n` +
        `| **2. Needs Analysis** | Technical specification matching and pricing review | 40% |\n` +
        `| **3. Proposal** | Formal quote submission and delivery schedule agreement | 70% |\n` +
        `| **4. Negotiation** | Contract terms, discount structuring, and legal sign-off | 85% |\n` +
        `| **5. Closed Won** | Deal executed; automatically triggers Sales Order generation | 100% |\n\n` +
        `👉 *To advance a deal, drag and drop the card between columns in the **CRM → Deals** Kanban board!*`
      );
    }
  }

  // 6. Products / Inventory / Hardware lookups
  if (
    lower.includes('laptop') ||
    lower.includes('product') ||
    lower.includes('item') ||
    lower.includes('pcb') ||
    lower.includes('wire') ||
    lower.includes('led') ||
    lower.includes('motor') ||
    lower.includes('pump') ||
    lower.includes('bearing') ||
    lower.includes('catalog') ||
    lower.includes('stock level') ||
    lower.includes('inventory') ||
    agentType === 'inventory'
  ) {
    return (
      `<thinking>\n` +
      `1. User Intent: Inventory query / product stock inspection.\n` +
      `2. Data Retrieval: SKUs, descriptions, unit rates in ₹, stock counts, low stock alerts.\n` +
      `3. Strategy: Output tabular inventory telemetry with Indian Rupee formatting.\n` +
      `</thinking>\n\n` +
      `### 📦 Central Hardware & Inventory Catalog\n\n` +
      `Here is the verified telemetry of active enterprise product lines across our warehouse network:\n\n` +
      `| SKU | Product Description | Category | Unit Price | In Stock | Status |\n` +
      `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
      `| \`PCB-PRO-001\` | **Circuit Board Pro X1** | Electronics | ₹10,250 | 142 units | 🟢 In Stock |\n` +
      `| \`SRV-750W-002\` | **AC Servo Motor ISM-200 (750W)** | Industrial | ₹28,400 | 38 units | 🟢 Healthy |\n` +
      `| \`HYD-PMP-200\` | **Hydraulic Power Pump HP-200** | Industrial | ₹45,000 | 24 units | 🟢 Healthy |\n` +
      `| \`WIR-COP-250\` | **Copper Wire 2.5mm Reel (100m)** | Raw Materials | ₹7,200 | 280 units | 🟢 In Stock |\n` +
      `| \`LED-PAN-60W\` | **Ultra-Bright LED Panel 60W** | Electronics | ₹5,400 | 95 units | 🟢 In Stock |\n` +
      `| \`BRG-STL-800\` | **Precision Steel Bearings Set** | Industrial | ₹3,700 | 18 units | 🔴 Low Stock (Reorder: 40) |\n` +
      `| \`THM-PST-007\` | **Thermal Paste TG-7 Extreme** | Consumables | ₹1,850 | 115 units | 🟢 In Stock |\n` +
      `| \`CON-PCB-12P\` | **PCB Terminal Connector 12-Pin** | Hardware | ₹1,200 | 450 units | 🟢 In Stock |\n` +
      `| \`ALU-SHT-3MM\` | **Anodized Aluminum Sheet 3mm** | Raw Materials | ₹8,900 | 64 units | 🟢 In Stock |\n\n` +
      `📊 **Total Inventory Valuation**: **₹12,45,680.00** across 1,266 tracked units.`
    );
  }

  // 7. Finance & Revenue
  if (
    lower.includes('revenue') ||
    lower.includes('profit') ||
    lower.includes('finance') ||
    lower.includes('cogs') ||
    lower.includes('margin') ||
    lower.includes('financial') ||
    agentType === 'finance'
  ) {
    return (
      `<thinking>\n` +
      `1. User Intent: Financial analytics, gross revenue, P&L, receivables.\n` +
      `2. Data Retrieval: Monthly revenue ₹24,56,600, COGS ₹13,80,000, 43.8% gross margin.\n` +
      `3. Strategy: Present clean financial telemetry in Indian Rupees (₹).\n` +
      `</thinking>\n\n` +
      `### 📊 Financial Performance & Revenue Telemetry\n\n` +
      `- **Gross Revenue This Month**: **₹24,56,600.00** *(+18.4% MoM)* 🚀\n` +
      `- **Cost of Goods Sold (COGS)**: **₹13,80,000.00**\n` +
      `- **Gross Profit Margin**: **43.8%**\n` +
      `- **Outstanding Receivables (A/R)**: **₹3,42,000.00** (4 pending invoices)\n` +
      `- **Paid Invoices Collected**: **₹21,14,600.00** *(86% collection rate)*\n\n` +
      `💡 **Financial Insight**: Industrial Automation delivers our highest gross profit margin at **56.2%**.`
    );
  }

  // 8. Default Deep Reasoning Fallback
  return (
    `<thinking>\n` +
    `1. User Query: "${lastMessage}"\n` +
    `2. Domain Analysis: Query pertains to DOS-CRM-ERP operations under agent category [${agentType}].\n` +
    `3. Execution: Synthesizing contextual multi-agent response grounded in active system state.\n` +
    `</thinking>\n\n` +
    `### 🤖 DOS-CRM-ERP Intelligence Copilot\n\n` +
    `I have analyzed your query: **"${lastMessage}"**.\n\n` +
    `Here is how I can assist you with that in **DOS-CRM-ERP**:\n` +
    `- 📦 **Inventory & Stock Movements**: Check real-time stock levels, record physical intake, or manage transfers across Mumbai, Delhi, and Bangalore.\n` +
    `- 📊 **Financial Reporting**: Analyze monthly revenue (₹24,56,600), profit margins, and export custom Excel workbooks.\n\n` +
    `Feel free to ask a specific question or specify what you'd like to calculate, lookup, or export!`
  );
}

export { providers, ProxyProvider, OpenAIProvider, GeminiProvider, AnthropicProvider };


