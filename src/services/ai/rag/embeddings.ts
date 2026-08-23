import { supabase } from '@/lib/supabase';
import type { EmbeddingResult } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const EMBEDDING_FUNCTION_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/embeddings`
  : undefined;

/**
 * Generate an embedding vector for a given text using the OpenAI text-embedding-3-small model.
 * Routes through a Supabase Edge Function to keep API keys server-side.
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!EMBEDDING_FUNCTION_URL) {
    // Return a zero vector for development/demo environments
    return {
      embedding: new Array(1536).fill(0),
      model: 'text-embedding-3-small',
      tokensUsed: 0,
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(EMBEDDING_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, model: 'text-embedding-3-small' }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    embedding: data.embedding,
    model: data.model || 'text-embedding-3-small',
    tokensUsed: data.tokens_used || 0,
  };
}

/**
 * Generate embeddings for multiple texts in a single batch.
 */
export async function batchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];
  for (const text of texts) {
    const result = await generateEmbedding(text);
    results.push(result);
  }
  return results;
}

/**
 * Calculate cosine similarity between two vectors.
 * Returns a value between -1 and 1 where 1 means identical direction.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}
