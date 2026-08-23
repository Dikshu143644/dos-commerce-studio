/**
 * Streaming AI Chat Module
 *
 * Provides SSE-based streaming for progressive rendering of AI responses.
 * Connects to the Supabase Edge Function with Accept: text/event-stream header,
 * parses Server-Sent Events, and dispatches to callbacks for real-time UI updates.
 *
 * Falls back gracefully to non-streaming requests if SSE is not supported.
 */

import type { AgentType } from './types';
import { supabase } from '@/lib/supabase';
import { chatWithFallback } from './providers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const AI_EDGE_FUNCTION_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/ai-chat`
  : undefined;

export interface StreamCompleteEvent {
  content: string;
  sources: string[];
  tokensUsed?: number;
}

export interface StreamOptions {
  conversationId?: string;
  onChunk: (text: string) => void;
  onToolCall: (name: string, input: object) => void;
  onToolResult: (name: string, output: object) => void;
  onComplete: (response: StreamCompleteEvent) => void;
  onError: (error: Error) => void;
  /** Optional AbortSignal to cancel the stream and underlying fetch request. */
  signal?: AbortSignal;
}

/**
 * Stream a chat message from the AI Edge Function using Server-Sent Events.
 * Provides progressive rendering via callbacks for tokens, tool calls, and completion.
 *
 * If streaming fails or is not supported, falls back to a regular non-streaming request.
 */
export async function streamChat(
  message: string,
  agentType: AgentType,
  options: StreamOptions
): Promise<void> {
  const { conversationId, onChunk, onToolCall, onToolResult, onComplete, onError, signal } = options;

  if (!AI_EDGE_FUNCTION_URL) {
    // No Edge Function URL - fall back to non-streaming
    await fallbackToNonStreaming(message, agentType, onComplete, onError);
    return;
  }

  try {
    // Get the user's session token
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(AI_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        agentType,
        conversationId,
        messages: [{ role: 'user', content: message }],
        enableRag: true,
        enableTools: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stream request failed: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // If the server responded with JSON instead of SSE, handle gracefully
    if (!contentType.includes('text/event-stream')) {
      const data = await response.json();
      onComplete({
        content: data.content || '',
        sources: data.sources || [],
        tokensUsed: data.tokensUsed,
      });
      return;
    }

    // Parse the SSE stream using ReadableStream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream available in response');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

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
              onChunk(event.content || '');
              break;

            case 'tool_call':
              onToolCall(event.name || '', event.input || {});
              break;

            case 'tool_result':
              onToolResult(event.name || '', event.output || {});
              break;

            case 'done':
              onComplete({
                content: event.content || '',
                sources: event.sources || [],
              });
              break;

            case 'error':
              onError(new Error(event.content || 'Stream error from server'));
              break;
          }
        } catch (_parseError) {
          // Skip malformed JSON in SSE data lines
        }
      }
    }

    // Handle any remaining buffer
    if (buffer.startsWith('data: ')) {
      const jsonStr = buffer.slice(6).trim();
      if (jsonStr) {
        try {
          const event = JSON.parse(jsonStr) as {
            type: string;
            content?: string;
            sources?: string[];
          };
          if (event.type === 'done') {
            onComplete({
              content: event.content || '',
              sources: event.sources || [],
            });
          }
        } catch (_e) {
          // Ignore final malformed line
        }
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Graceful fallback: if streaming fails, try non-streaming
    try {
      await fallbackToNonStreaming(message, agentType, onComplete, onError);
    } catch (_fallbackError) {
      onError(err);
    }
  }
}

/**
 * Fallback to non-streaming request when SSE is not available or fails.
 */
async function fallbackToNonStreaming(
  message: string,
  agentType: AgentType,
  onComplete: (response: StreamCompleteEvent) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const messages = [
      {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
        agentType,
      },
    ];

    const systemPrompt = getDefaultSystemPrompt(agentType);
    const content = await chatWithFallback(messages, systemPrompt);

    onComplete({
      content,
      sources: [],
    });
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Get a default system prompt for fallback mode.
 */
function getDefaultSystemPrompt(agentType: AgentType): string {
  const prompts: Record<AgentType, string> = {
    inventory: 'You are an AI inventory management assistant for StockFlow.',
    sales: 'You are an AI sales assistant for StockFlow.',
    procurement: 'You are an AI procurement assistant for StockFlow.',
    finance: 'You are an AI finance assistant for StockFlow.',
    excel: 'You are an AI data assistant for StockFlow.',
    general: 'You are StockFlow AI, an intelligent assistant for the StockFlow Enterprise Inventory & CRM Management System.',
  };
  return prompts[agentType] || prompts.general;
}
