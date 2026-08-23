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

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data as ConversationRow[]).map(rowToConversation);
    },
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return rowToConversation(data as ConversationRow);
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, agentType }: { title: string; agentType: AgentType }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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

      if (error) throw error;
      return rowToConversation(data as ConversationRow);
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

      const { error } = await supabase
        .from('ai_conversations')
        .update({
          messages: updatedMessages.map((m) => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
          })),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) throw error;
      return { conversationId, userMessage, updatedMessages };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
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

  const startStream = useCallback(
    async (message: string, agentType: AgentType, conversationId?: string) => {
      abortRef.current = false;
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
