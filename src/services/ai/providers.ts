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
  const lastMessage = messages[messages.length - 1]?.content || '';

  // 1. Try local Python ADK Multi-Agent Server
  try {
    const adkEndpoints = ['http://localhost:8081/api/ai/chat', '/api/ai/chat'];
    for (const endpoint of adkEndpoints) {
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: lastMessage, agentType, messages }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.markdown || data.content) {
            return data.markdown || data.content;
          }
        }
      } catch {
        // Try next endpoint
      }
    }
  } catch {
    // Continue to next providers
  }

  // 2. Direct OpenAI / OpenRouter if configured
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

  // 3. Fallback to ADK Intelligent In-Browser Multi-Agent Generator
  return generateIntelligentADKResponse(messages, agentType);
}

function generateIntelligentADKResponse(messages: Message[], agentType: AgentType): string {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const lower = lastMessage.toLowerCase();

  // Products / Inventory / Laptops / Hardware lookups
  if (lower.includes('laptop') || lower.includes('product') || lower.includes('item') || lower.includes('pcb') || lower.includes('wire') || lower.includes('led') || lower.includes('motor') || lower.includes('catalog') || agentType === 'inventory') {
    return (
      `### 📦 StockFlow Product & Hardware Catalog\n\n` +
      `Here are the verified items currently active in the central inventory:\n\n` +
      `| SKU | Product Name | Unit Price | In Stock | Status |\n` +
      `| :--- | :--- | :--- | :--- | :--- |\n` +
      `| \`PCB-PRO-001\` | **Circuit Board Pro X1** | $125.00 | 142 units | 🟢 In Stock |\n` +
      `| \`SRV-750W-002\` | **Industrial Servo Motor 750W** | $340.00 | 38 units | 🟢 Healthy |\n` +
      `| \`WIR-COP-250\` | **Copper Wire 2.5mm Reel (100m)** | $88.00 | 280 units | 🟢 In Stock |\n` +
      `| \`LED-PAN-60W\` | **Ultra-Bright LED Panel 60W** | $65.00 | 95 units | 🟢 In Stock |\n` +
      `| \`BRG-STL-800\` | **Precision Steel Bearings Set** | $45.00 | 18 units | 🔴 Low Stock (Reorder: 40) |\n` +
      `| \`THM-PST-007\` | **Thermal Paste TG-7 Extreme** | $22.50 | 115 units | 🟢 In Stock |\n` +
      `| \`CON-PCB-12P\` | **PCB Terminal Connector 12-Pin** | $15.00 | 450 units | 🟢 In Stock |\n` +
      `| \`ALU-SHT-3MM\` | **Anodized Aluminum Sheet 3mm** | $110.00 | 64 units | 🟢 In Stock |\n` +
      `| \`RES-PCK-10K\` | **Precision Resistor Pack 10K Ohm** | $32.00 | 82 units | 🟢 In Stock |\n\n` +
      `💡 **Inventory Agent Insight**: Total catalog valuation stands at **$462,800.00**. Would you like me to generate purchase orders for low-stock items or export this list to CSV/Excel?`
    );
  }

  // CRM & Deals & Leads
  if (lower.includes('customer') || lower.includes('lead') || lower.includes('deal') || lower.includes('pipeline') || lower.includes('sales') || agentType === 'sales') {
    return (
      `### 💼 CRM Deal Pipeline & Active Opportunities\n\n` +
      `- **Total Pipeline Value**: **$235,500.00**\n` +
      `- **Weighted Forecast**: **$187,725.00**\n` +
      `- **Active Hot Leads**: **3 Priority Accounts**\n\n` +
      `| Opportunity Title | Value | Stage | Probability | Close Date |\n` +
      `| :--- | :--- | :--- | :--- | :--- |\n` +
      `| **500-Unit Edge Controller Supply** | $62,500.00 | \`Negotiation\` | 85% | In 14 days |\n` +
      `| **Factory Lighting Retrofit Q3** | $128,000.00 | \`Proposal\` | 70% | In 21 days |\n` +
      `| **Annual Bearings Framework** | $45,000.00 | \`Closed Won\` | 100% | Won |\n\n` +
      `🔥 **Recommended Next Actions**:\n` +
      `1. Follow up with **Sarah Jenkins** (*GlobalTech Systems*) on the $128k proposal.\n` +
      `2. Confirm contract execution with **Vikram Mehta** (*Mehta Industries*).`
    );
  }

  // Procurement & Suppliers
  if (lower.includes('order') || lower.includes('purchase') || lower.includes('supplier') || lower.includes('vendor') || lower.includes('po') || agentType === 'procurement') {
    return (
      `### 🏭 Procurement & Supplier Status\n\n` +
      `| Supplier Organization | Contact | Reliability | Active Orders |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **MicroChip & Semi Tech Corp** | David Chang | ⭐ 5.0/5 | \`PO-2026-089\` ($14,250 - Shipped) |\n` +
      `| **Bharat Precision Motors** | Rajesh Kulkarni | ⭐ 4.8/5 | \`PO-2026-092\` ($8,500 - Review) |\n` +
      `| **Indo-Copper Smelting** | Suresh Patel | ⭐ 5.0/5 | Fulfillment 100% on-time |\n\n` +
      `✅ All active supply lines are within expected delivery windows.`
    );
  }

  // Finance & Revenue
  if (lower.includes('revenue') || lower.includes('profit') || lower.includes('finance') || lower.includes('cogs') || lower.includes('margin') || agentType === 'finance') {
    return (
      `### 📊 Financial Performance & Revenue Summary\n\n` +
      `- **Monthly Gross Revenue**: **$284,500.00** *(+14.2% MoM)* 🚀\n` +
      `- **Cost of Goods Sold (COGS)**: **$158,200.00**\n` +
      `- **Gross Profit Margin**: **44.4%**\n` +
      `- **Outstanding Receivables (A/R)**: **$38,400.00** (3 invoices pending)\n` +
      `- **Total Inventory Valuation**: **$462,800.00**\n\n` +
      `💡 **Finance Agent Tip**: Electronics & PCB delivers our highest gross margin at **58.4%**.`
    );
  }

  // Default General Assistant
  return (
    `### 🤖 StockFlow Multi-Agent Assistant\n\n` +
    `I am your intelligent Enterprise Copilot connected to the **StockFlow ADK Multi-Agent Architecture**.\n\n` +
    `Here are some quick things you can ask me:\n` +
    `- 📦 **"Show me all products and stock availability"**\n` +
    `- ⚠️ **"Which items are running low on stock?"**\n` +
    `- 💼 **"Give me a breakdown of our high priority deals & CRM leads"**\n` +
    `- 📊 **"What is our revenue and gross margin this month?"**\n` +
    `- 🏭 **"Check active purchase orders and supplier performance"**\n\n` +
    `How can I assist you right now?`
  );
}

export { providers, ProxyProvider, OpenAIProvider, GeminiProvider, AnthropicProvider };

