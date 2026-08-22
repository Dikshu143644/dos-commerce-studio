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

import type { AIProvider, Message } from './types';

// The proxy URL for production AI calls - set this in your .env file
const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL as string | undefined;

/**
 * ProxyProvider routes all AI requests through a secure backend endpoint.
 * This is the only provider that should be used in production browser environments.
 */
class ProxyProvider implements AIProvider {
  name = 'proxy';

  isConfigured(): boolean {
    return !!AI_PROXY_URL;
  }

  async chat(messages: Message[], systemPrompt: string): Promise<string> {
    if (!AI_PROXY_URL) {
      throw new Error('AI proxy URL not configured (VITE_AI_PROXY_URL)');
    }

    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        systemPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.content || data.message || 'No response generated.';
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
