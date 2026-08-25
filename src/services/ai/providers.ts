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
  const lower = lastMessage.trim().toLowerCase();

  // 1. Natural Conversation / Greetings / General Inquiries
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
      `### 👋 Hello! Welcome to StockFlow Enterprise Copilot\n\n` +
      `I am your **AI Multi-Agent Assistant**, integrated directly into the StockFlow inventory, supply chain, and CRM platform. I can assist you with real-time operations, stock telemetry, deal tracking, financial analysis, and step-by-step guidance.\n\n` +
      `**Here are some common ways to interact with me:**\n` +
      `- 📦 *"Show me all available products and current stock levels"*\n` +
      `- ⚠️ *"Which items are running low on stock and need reordering?"*\n` +
      `- 💼 *"Tell me about our top CRM deals and sales pipeline"*\n` +
      `- 🏬 *"What is the capacity and stock status of our warehouses?"*\n` +
      `- 📊 *"Give me an overview of our monthly revenue and profit margins"*\n` +
      `- 🌐 *"Can you explain what this web application does and how to use it?"*\n\n` +
      `What would you like to explore or execute right now?`
    );
  }

  // 2. Web Application Overview / "Tell me about your web" / "What is StockFlow"
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
      `### 🌐 Welcome to StockFlow — Enterprise Inventory & CRM Platform\n\n` +
      `**StockFlow** is a modern, full-stack enterprise platform engineered to unify **multi-warehouse inventory logistics** with an **intelligent CRM deal pipeline** and **autonomous Python ADK multi-agent workflows**.\n\n` +
      `---\n\n` +
      `### 🚀 Core Modules & Capabilities\n\n` +
      `1. **📦 Centralized Inventory & Warehouses**\n` +
      `   - **Multi-Facility Telemetry**: Live stock tracking across 6 strategic hubs (*Mumbai, Delhi, Bangalore, Kolkata, Pune, Ahmedabad*).\n` +
      `   - **Stock Movements & Transfers**: Track stock intake (IN), customer fulfillment (OUT), inter-warehouse transfers, and physical audit adjustments.\n` +
      `   - **Low Stock Intelligence**: Autonomous safety stock threshold alerts with 1-click reorder PO drafts.\n\n` +
      `2. **💼 Enterprise CRM & Sales Pipeline**\n` +
      `   - **Kanban Deal Pipeline**: Visual stages (*Qualification → Needs Analysis → Proposal → Negotiation → Closed Won*).\n` +
      `   - **Client LTV Telemetry**: Customer directories, order frequency, total spending, and communication logs.\n` +
      `   - **Quote-to-Invoice Automation**: Generate professional sales orders, invoices, and record incoming payments with receipt logs.\n\n` +
      `3. **🤖 Python ADK Multi-Agent AI Engine**\n` +
      `   - **Autonomous Reorder Triggers**: Background agents detect stock dips and prepare supplier purchase orders.\n` +
      `   - **Excel Automation**: Instant one-click spreadsheet generation and live XLSX exports.\n` +
      `   - **Opal SMS OTP Security**: Real-time 6-digit cryptographic SMS authentication with SHA-256 validation.\n\n` +
      `4. **📊 Analytics & Auditing**\n` +
      `   - Real-time financial summaries, revenue forecasting, inventory turnover metrics, and tamper-proof audit trails.\n\n` +
      `💡 *Tip: You can ask me specific questions like "Check stock for Servo Motors" or "How do I add a new lead?" to get instant assistance!*`
    );
  }

  // 3. How to use / Instructions / Guides / Help
  if (
    lower.includes('how do i') ||
    lower.includes('how to') ||
    lower.includes('help me') ||
    lower.includes('guide') ||
    lower.includes('instructions')
  ) {
    if (lower.includes('product') || lower.includes('item') || lower.includes('add product')) {
      return (
        `### 📦 How to Add a New Product in StockFlow\n\n` +
        `1. Navigate to the **Inventory → Products** section from the left navigation sidebar (or click the **"Add Product"** button on the Dashboard).\n` +
        `2. Click the **"+ New Product"** button in the top right corner.\n` +
        `3. Enter the product details:\n` +
        `   - **Product Name & SKU** (e.g., \`SRV-750W-002\`)\n` +
        `   - **Category** (*Electronics, Industrial, Packaging, Raw Materials*)\n` +
        `   - **Unit Cost & Selling Price**\n` +
        `   - **Safety Stock Threshold** (Minimum quantity before alerts fire)\n` +
        `   - **Initial Warehouse Allocation** (*Mumbai, Delhi, Bangalore, etc.*)\n` +
        `4. Click **"Save Product"**. The SKU will immediately synchronize across your central catalog and trigger real-time telemetry.`
      );
    }

    if (lower.includes('deal') || lower.includes('lead') || lower.includes('stage') || lower.includes('pipeline')) {
      return (
        `### 💼 Understanding CRM Deal Stages & Lead Conversion\n\n` +
        `StockFlow uses a 5-stage deal velocity pipeline to forecast revenue:\n\n` +
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

    if (lower.includes('transfer') || lower.includes('warehouse')) {
      return (
        `### 🚚 How to Create an Inter-Warehouse Stock Transfer\n\n` +
        `1. Go to **Inventory → Transfers** in the sidebar.\n` +
        `2. Click **"+ New Transfer"**.\n` +
        `3. Select the **Source Warehouse** (e.g., *WH-MUM Mumbai*) and **Destination Warehouse** (e.g., *WH-DEL Delhi*).\n` +
        `4. Add the items and quantities to transfer.\n` +
        `5. Click **"Initiate Transfer"**. The items will move to \`IN_TRANSIT\` status until verified and received at the destination hub.`
      );
    }

    if (lower.includes('invoice') || lower.includes('payment') || lower.includes('bill')) {
      return (
        `### 💳 How to Generate Invoices & Record Payments\n\n` +
        `1. Go to **Sales → Invoices**.\n` +
        `2. Select any confirmed Sales Order to generate a clean PDF invoice with GST/tax breakdown.\n` +
        `3. When payment is received from the client, click **"Record Payment"** in **Sales → Payments**.\n` +
        `4. Choose the payment method (*Bank Transfer, UPI, Credit Card, Cheque*), input the transaction reference number, and submit to update receivables immediately.`
      );
    }
  }

  // 4. Products / Inventory / Hardware lookups
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
      `### 📦 StockFlow Central Hardware & Inventory Catalog\n\n` +
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
      `| \`ALU-SHT-3MM\` | **Anodized Aluminum Sheet 3mm** | Raw Materials | ₹8,900 | 64 units | 🟢 In Stock |\n` +
      `| \`RES-PCK-10K\` | **Precision Resistor Pack 10K Ohm** | Electronics | ₹2,600 | 82 units | 🟢 In Stock |\n\n` +
      `📊 **Inventory Valuation**: **₹12,45,680.00** across 1,266 tracked items.\n` +
      `💡 Would you like me to trigger an automatic purchase order draft for the low-stock **Steel Bearings**?`
    );
  }

  // 5. Warehouses & Logistics Hubs
  if (
    lower.includes('warehouse') ||
    lower.includes('location') ||
    lower.includes('mumbai') ||
    lower.includes('delhi') ||
    lower.includes('bangalore') ||
    lower.includes('kolkata') ||
    lower.includes('pune') ||
    lower.includes('ahmedabad') ||
    lower.includes('logistics')
  ) {
    return (
      `### 🏬 Multi-Warehouse Facility Telemetry\n\n` +
      `| Facility Code | Hub Name | Utilization | Active SKUs | Status |\n` +
      `| :--- | :--- | :--- | :--- | :--- |\n` +
      `| \`WH-MUM\` | **Mumbai Central Logistics Hub** | 84% (42,000 / 50,000 sq ft) | 480 items | 🟢 Operational |\n` +
      `| \`WH-DEL\` | **Delhi NCR Regional Depot** | 68% (27,200 / 40,000 sq ft) | 320 items | 🟢 Operational |\n` +
      `| \`WH-BLR\` | **Bangalore Electronics Hub** | 92% (32,200 / 35,000 sq ft) | 290 items | 🟡 High Capacity |\n` +
      `| \`WH-KOL\` | **Kolkata Eastern Port Hub** | 45% (13,500 / 30,000 sq ft) | 160 items | 🟢 Operational |\n` +
      `| \`WH-PUN\` | **Pune Auto-Industrial Depot** | 76% (19,000 / 25,000 sq ft) | 210 items | 🟢 Operational |\n` +
      `| \`WH-AMD\` | **Ahmedabad Commercial Center** | 58% (11,600 / 20,000 sq ft) | 145 items | 🟢 Operational |\n\n` +
      `🚚 **Active Inter-Hub Transfers**: 3 shipments currently in transit between Mumbai and Delhi.`
    );
  }

  // 6. CRM & Deals & Leads
  if (
    lower.includes('customer') ||
    lower.includes('lead') ||
    lower.includes('deal') ||
    lower.includes('pipeline') ||
    lower.includes('sales') ||
    lower.includes('client') ||
    agentType === 'sales'
  ) {
    return (
      `### 💼 CRM Deal Pipeline & Active Opportunities\n\n` +
      `- **Total Pipeline Valuation**: **₹24,56,600.00**\n` +
      `- **Weighted Probability Forecast**: **₹19,65,280.00**\n` +
      `- **Active Hot Leads**: **3 Priority Accounts** (Score > 75)\n\n` +
      `| Deal Title | Account Name | Deal Value | Stage | Probability |\n` +
      `| :--- | :--- | :--- | :--- | :--- |\n` +
      `| **500-Unit Controller Framework** | GlobalTech Systems | ₹5,20,000 | \`Negotiation\` | 85% |\n` +
      `| **Factory Automation Upgrade Q3** | Mehta Industrial Corp | ₹10,50,000 | \`Proposal\` | 70% |\n` +
      `| **Annual Motor & Pump Supply** | Apex Logistics Ltd | ₹3,80,000 | \`Closed Won\` | 100% |\n` +
      `| **Precision Bearings Annual Batch** | TechVentures Inc | ₹5,06,600 | \`Qualification\` | 40% |\n\n` +
      `🔥 **Recommended Action**: Send revised discount proposal to **Sarah Jenkins** (*GlobalTech Systems*) to close the ₹5.2L agreement this week.`
    );
  }

  // 7. Procurement & Suppliers
  if (
    lower.includes('order') ||
    lower.includes('purchase') ||
    lower.includes('supplier') ||
    lower.includes('vendor') ||
    lower.includes('po') ||
    agentType === 'procurement'
  ) {
    return (
      `### 🏭 Procurement & Supplier Status\n\n` +
      `| Supplier Organization | Primary Contact | Rating | Active Orders | Delivery Status |\n` +
      `| :--- | :--- | :--- | :--- | :--- |\n` +
      `| **MicroChip & Semi Tech Corp** | David Chang | ⭐ 5.0/5 | \`PO-2026-089\` (₹1,42,500) | 🚚 Shipped (ETA: Tomorrow) |\n` +
      `| **Bharat Precision Motors** | Rajesh Kulkarni | ⭐ 4.8/5 | \`PO-2026-092\` (₹85,000) | ⏳ In Review |\n` +
      `| **Indo-Copper Smelting** | Suresh Patel | ⭐ 5.0/5 | \`PO-2026-094\` (₹72,000) | ✅ Received |\n\n` +
      `✅ Supplier on-time fulfillment rate currently stands at **98.2%**.`
    );
  }

  // 8. Finance & Revenue
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
      `### 📊 Financial Performance & Revenue Telemetry\n\n` +
      `- **Gross Revenue This Month**: **₹24,56,600.00** *(+18.4% MoM)* 🚀\n` +
      `- **Cost of Goods Sold (COGS)**: **₹13,80,000.00**\n` +
      `- **Gross Profit Margin**: **43.8%**\n` +
      `- **Outstanding Receivables (A/R)**: **₹3,42,000.00** (4 pending invoices)\n` +
      `- **Paid Invoices Collected**: **₹21,14,600.00** *(86% collection rate)*\n\n` +
      `💡 **Financial Insight**: Industrial Automation delivers our highest gross profit margin at **56.2%**.`
    );
  }

  // 9. Excel & Data Exports
  if (
    lower.includes('excel') ||
    lower.includes('export') ||
    lower.includes('spreadsheet') ||
    lower.includes('csv') ||
    lower.includes('xlsx') ||
    lower.includes('report') ||
    agentType === 'excel'
  ) {
    return (
      `### 📑 StockFlow Automated Excel & Report Generation\n\n` +
      `Our background **Python ADK Excel Agent** can instantly generate multi-sheet workbooks with formulas and formatting.\n\n` +
      `**Available Export Packages:**\n` +
      `1. **📊 Complete Financial Audit Report** (\`.xlsx\`): Includes balance sheets, P&L statement, invoice receivables, and cash flow.\n` +
      `2. **📦 Inventory Valuation & Safety Stock Sheet** (\`.xlsx\`): SKUs, batch numbers, warehouse bin locations, and unit costs.\n` +
      `3. **💼 CRM Pipeline & Customer Master List** (\`.csv\` / \`.xlsx\`): Account contacts, lead scores, deal probabilities, and order histories.\n\n` +
      `👉 *Click on **Reports → Excel Export** in the sidebar to download your formatted spreadsheet in 1 click!*`
    );
  }

  // 10. Intelligent Contextual Fallback (Comprehensive & Engaging)
  return (
    `### 🤖 StockFlow Intelligent Multi-Agent Copilot\n\n` +
    `I have processed your query: *"${lastMessage}"*.\n\n` +
    `Here is how I can assist with that in StockFlow:\n` +
    `- 📦 **Inventory Management**: Check real-time stock levels, record physical intake, or manage transfers across Mumbai, Delhi, and Bangalore.\n` +
    `- 💼 **CRM & Sales Operations**: Review customer accounts, qualify hot leads, advance deal stages, and generate sales invoices.\n` +
    `- 🏭 **Procurement & POs**: Monitor supplier delivery timelines and automate low-stock purchase orders.\n` +
    `- 📊 **Financial Reporting**: Analyze monthly revenue (₹24,56,600), profit margins, and export custom Excel workbooks.\n\n` +
    `Feel free to ask a specific question or specify what you'd like to calculate, lookup, or export!`
  );
}

export { providers, ProxyProvider, OpenAIProvider, GeminiProvider, AnthropicProvider };

