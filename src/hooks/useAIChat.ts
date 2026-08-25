import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { streamChat } from '@/services/ai/streaming';
import type { AgentType, Message, Conversation } from '@/services/ai/types';

interface ConversationRow {
  id: string;
  user_id: string;
  agent_type: AgentType;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    agentType?: AgentType;
  }>;
  total_tokens: number | null;
  provider: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
}

function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    messages: (row.messages || []).map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
    agentType: row.agent_type,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

const LOCAL_CONV_KEY = 'stockflow_local_conversations';

function getLocalConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(LOCAL_CONV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: (c.messages || []).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch {
    return [];
  }
}

function saveLocalConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(LOCAL_CONV_KEY, JSON.stringify(convs));
  } catch {
    // Ignore storage errors
  }
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

          if (!error && data && data.length > 0) {
            return (data as ConversationRow[]).map(rowToConversation);
          }
        }
      } catch {
        // Fall back to local
      }
      return getLocalConversations();
    },
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return rowToConversation(data as ConversationRow);
        }
      } catch {
        // Fall back to local
      }
      const local = getLocalConversations();
      return local.find((c) => c.id === id) || null;
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, agentType }: { title: string; agentType: AgentType }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('ai_conversations')
            .insert({
              user_id: user.id,
              agent_type: agentType,
              title,
              messages: [],
              total_tokens: 0,
            })
            .select()
            .single();

          if (!error && data) {
            return rowToConversation(data as ConversationRow);
          }
        }
      } catch {
        // Fallback to local
      }

      // Create resilient local conversation
      const newConv: Conversation = {
        id: crypto.randomUUID(),
        title,
        agentType,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const existing = getLocalConversations();
      saveLocalConversations([newConv, ...existing]);
      return newConv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      message,
      agentType,
      existingMessages,
    }: {
      conversationId: string;
      message: string;
      agentType: AgentType;
      existingMessages: Message[];
    }) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        agentType,
      };

      const updatedMessages = [...existingMessages, userMessage];

      // Update Supabase if reachable
      try {
        await supabase
          .from('ai_conversations')
          .update({
            messages: updatedMessages.map((m) => ({
              ...m,
              timestamp: m.timestamp.toISOString(),
            })),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
      } catch {
        // Fallback local update
      }

      // Update local storage
      const local = getLocalConversations();
      const idx = local.findIndex((c) => c.id === conversationId);
      if (idx !== -1) {
        local[idx].messages = updatedMessages;
        local[idx].updatedAt = new Date();
        saveLocalConversations(local);
      }

      return { conversationId, userMessage, updatedMessages };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.conversationId] });
    },
  });
}

export interface ToolCall {
  name: string;
  input: object;
  output?: object;
  status: 'running' | 'complete';
}

export interface StreamState {
  isStreaming: boolean;
  streamedContent: string;
  toolCalls: ToolCall[];
  sources: string[];
  error: string | null;
}

export function useStreamMessage() {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    streamedContent: '',
    toolCalls: [],
    sources: [],
    error: null,
  });
  const abortRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (message: string, agentType: AgentType, conversationId?: string) => {
      abortRef.current = false;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setState({
        isStreaming: true,
        streamedContent: '',
        toolCalls: [],
        sources: [],
        error: null,
      });

      return new Promise<{ content: string; sources: string[] }>((resolve, reject) => {
        streamChat(message, agentType, {
          conversationId,
          signal: controller.signal,
          onChunk: (text) => {
            if (abortRef.current) return;
            setState((prev) => ({
              ...prev,
              streamedContent: prev.streamedContent + text,
            }));
          },
          onToolCall: (name, input) => {
            if (abortRef.current) return;
            setState((prev) => ({
              ...prev,
              toolCalls: [...prev.toolCalls, { name, input, status: 'running' }],
            }));
          },
          onToolResult: (name, output) => {
            if (abortRef.current) return;
            setState((prev) => ({
              ...prev,
              toolCalls: prev.toolCalls.map((tc) =>
                tc.name === name && tc.status === 'running'
                  ? { ...tc, output, status: 'complete' as const }
                  : tc
              ),
            }));
          },
          onComplete: (response) => {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              streamedContent: response.content,
              sources: response.sources,
            }));
            resolve({ content: response.content, sources: response.sources });
          },
          onError: (error) => {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              error: error.message,
            }));
            reject(error);
          },
        });
      });
    },
    []
  );

  const stopStream = useCallback(() => {
    abortRef.current = true;
    // Signal the AbortController to cancel the underlying fetch request,
    // stopping the HTTP connection and preventing the Edge Function from
    // continuing to execute (and billing) after the user presses stop.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isStreaming: false,
      streamedContent: '',
      toolCalls: [],
      sources: [],
      error: null,
    });
  }, []);

  return { ...state, startStream, stopStream, reset };
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
