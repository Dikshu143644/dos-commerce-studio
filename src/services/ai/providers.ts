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

export async function chatWithFallback(messages: Message[], systemPrompt: string): Promise<string> {
  const configuredProviders = providers.filter((p) => p.isConfigured());

  if (configuredProviders.length === 0) {
    // No proxy configured and direct providers blocked in browser - use mock responses
    return generateMockResponse(messages);
  }

  for (const provider of configuredProviders) {
    try {
      return await provider.chat(messages, systemPrompt);
    } catch (error) {
      console.warn(`Provider ${provider.name} failed:`, error);
      continue;
    }
  }

  return generateMockResponse(messages);
}

function generateMockResponse(messages: Message[]): string {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const lower = lastMessage.toLowerCase();

  if (lower.includes('stock') || lower.includes('inventory')) {
    return "Based on the current inventory data, I can see that you have 2,847 products across 5 warehouses. There are 23 items below their reorder points that need attention. Would you like me to generate a detailed low-stock report or suggest reorder quantities?";
  }
  if (lower.includes('customer') || lower.includes('lead') || lower.includes('deal')) {
    return "Looking at your CRM data, you currently have 156 active deals in the pipeline with a total value of $2.4M. The conversion rate this month is 24%, up from 18% last month. Would you like me to break this down by stage or show top-performing deals?";
  }
  if (lower.includes('order') || lower.includes('purchase') || lower.includes('supplier')) {
    return "I can see 42 pending purchase orders with a total value of $186,400. 3 POs are overdue for delivery. Top suppliers by volume this month are TechComponents Ltd and Global Electronics. Want me to check specific PO statuses or supplier performance?";
  }
  if (lower.includes('revenue') || lower.includes('profit') || lower.includes('finance')) {
    return "This month's revenue stands at $284,920, which is 12% above target. Gross margin is at 34.2%. Top revenue categories are Electronics (38%), Industrial Parts (24%), and Office Supplies (18%). Shall I prepare a detailed financial breakdown?";
  }
  if (lower.includes('excel') || lower.includes('export') || lower.includes('report')) {
    return "I can help you generate various reports. Available templates include: Stock Report, Purchase Orders Summary, Sales Analysis, Customer List, and Inventory Valuation. Which report would you like me to prepare, and for what date range?";
  }

  return "I'm here to help you manage your inventory, track sales, monitor procurement, and analyze finances. You can ask me about stock levels, customer data, deal pipelines, purchase orders, revenue trends, or have me generate reports. What would you like to know?";
}

export { providers, ProxyProvider, OpenAIProvider, GeminiProvider, AnthropicProvider };
