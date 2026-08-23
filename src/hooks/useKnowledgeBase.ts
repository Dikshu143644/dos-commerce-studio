import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { KnowledgeEntry } from '@/services/ai/rag/types';

export interface KnowledgeFilters {
  category?: string;
  search?: string;
}

export function useKnowledgeEntries(filters: KnowledgeFilters = {}) {
  const { category, search } = filters;

  return useQuery({
    queryKey: ['knowledge-entries', { category, search }],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as KnowledgeEntry[];
    },
  });
}

/**
 * Search knowledge base entries using text-based search (ilike on title/content).
 * We cannot call match_knowledge RPC client-side because it requires a vector(1536)
 * embedding, and generating embeddings requires a server-side API key.
 * For semantic/vector search, use the Edge Function which has access to the OpenAI key.
 */
export function useSearchKnowledge(queryText: string) {
  return useQuery({
    queryKey: ['knowledge-search', queryText],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .or(`title.ilike.%${queryText}%,content.ilike.%${queryText}%`)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as KnowledgeEntry[];
    },
    enabled: !!queryText && queryText.length > 2,
  });
}

export function useCreateKnowledgeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      title: string;
      content: string;
      category: KnowledgeEntry['category'];
      tags: string[];
      metadata?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          title: entry.title,
          content: entry.content,
          category: entry.category,
          tags: entry.tags,
          metadata: entry.metadata || {},
          is_active: true,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
    },
  });
}

export function useUpdateKnowledgeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      content?: string;
      category?: KnowledgeEntry['category'];
      tags?: string[];
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
    },
  });
}

export function useDeleteKnowledgeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
    },
  });
}
