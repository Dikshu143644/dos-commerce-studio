import { supabase } from '@/lib/supabase';
import type { KnowledgeEntry } from './types';
import { generateEmbedding } from './embeddings';
import { sanitizeFilterValue } from './utils';

/**
 * Add a new entry to the knowledge base with an auto-generated embedding.
 */
export async function addKnowledgeEntry(
  entry: Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at' | 'embedding'>
): Promise<KnowledgeEntry> {
  const embeddingResult = await generateEmbedding(`${entry.title} ${entry.content}`);

  const { data, error } = await supabase
    .from('knowledge_base')
    .insert({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      tags: entry.tags,
      embedding: JSON.stringify(embeddingResult.embedding),
      metadata: entry.metadata,
      is_active: entry.is_active,
      created_by: entry.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeEntry;
}

/**
 * Semantic search for knowledge entries using the match_knowledge RPC function.
 * Uses vector cosine distance for similarity matching.
 *
 * NOTE: Without the embeddings Edge Function deployed (supabase/functions/embeddings),
 * the client-side generateEmbedding() always returns a zero-vector. This causes the
 * match_knowledge RPC to return no meaningful results (cosine distance from zero-vector
 * is undefined/maximal), and the code falls through to fallbackTextSearch. This is the
 * expected development behavior - semantic search only works when the embeddings Edge
 * Function is deployed and OPENAI_API_KEY is configured on the Supabase project.
 */
export async function searchKnowledge(
  query: string,
  options: { limit?: number; threshold?: number; category?: string } = {}
): Promise<KnowledgeEntry[]> {
  const { limit = 5, threshold = 0.7, category } = options;

  const embeddingResult = await generateEmbedding(query);

  const params: Record<string, unknown> = {
    query_embedding: embeddingResult.embedding,
    match_threshold: threshold,
    match_count: limit,
  };

  if (category) {
    params['filter_category'] = category;
  }

  const { data, error } = await supabase.rpc('match_knowledge', params);

  if (error) {
    console.warn('[RAG] Knowledge search failed, falling back to text search:', error);
    return fallbackTextSearch(query, limit);
  }

  return (data || []) as KnowledgeEntry[];
}

/**
 * Fallback text search when vector search is unavailable.
 */
async function fallbackTextSearch(query: string, limit: number): Promise<KnowledgeEntry[]> {
  const sanitized = sanitizeFilterValue(query);
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('is_active', true)
    .or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`)
    .limit(limit);

  if (error) throw error;
  return (data || []) as KnowledgeEntry[];
}

/**
 * Update an existing knowledge base entry and regenerate its embedding.
 */
export async function updateEntry(
  id: string,
  updates: Partial<Pick<KnowledgeEntry, 'title' | 'content' | 'category' | 'tags' | 'metadata' | 'is_active'>>
): Promise<KnowledgeEntry> {
  const updatePayload: Record<string, unknown> = { ...updates };

  // Regenerate embedding if title or content changed
  if (updates.title || updates.content) {
    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('title, content')
      .eq('id', id)
      .single();

    const title = updates.title || existing?.title || '';
    const content = updates.content || existing?.content || '';
    const embeddingResult = await generateEmbedding(`${title} ${content}`);
    updatePayload['embedding'] = JSON.stringify(embeddingResult.embedding);
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeEntry;
}

/**
 * Soft-delete a knowledge base entry by marking it inactive.
 */
export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_base')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Seed the knowledge base with default entries for common operations.
 * Skips entries that already exist (by title match).
 */
export async function seedDefaultKnowledge(): Promise<void> {
  const defaultEntries = [
    {
      title: 'Creating a Purchase Order',
      content: 'To create a purchase order: 1) Navigate to Procurement > Purchase Orders. 2) Click "New PO". 3) Select supplier from dropdown. 4) Add line items with products and quantities. 5) Set expected delivery date. 6) Review total and submit for approval. POs over $10,000 require manager approval.',
      category: 'sop' as const,
      tags: ['procurement', 'purchase-order', 'workflow'],
    },
    {
      title: 'Goods Receiving Process',
      content: 'When goods arrive: 1) Go to Procurement > Goods Receipt. 2) Select the corresponding PO. 3) Verify quantities against delivery note. 4) Record any discrepancies or damages. 5) Confirm receipt to update stock levels. 6) System automatically creates stock movements and updates warehouse quantities.',
      category: 'sop' as const,
      tags: ['procurement', 'receiving', 'warehouse'],
    },
    {
      title: 'Sales Order Workflow',
      content: 'Sales order lifecycle: Draft > Confirmed > Processing > Shipped > Delivered > Completed. Each stage transition triggers notifications. Orders can be cancelled before shipping. Partial shipments are supported. Invoices are auto-generated on confirmation.',
      category: 'sop' as const,
      tags: ['sales', 'orders', 'workflow'],
    },
    {
      title: 'Stock Movement Types',
      content: 'Stock movements track all inventory changes: IN (goods receipt), OUT (sales/dispatch), TRANSFER (between warehouses), ADJUSTMENT (manual corrections), RETURN (customer returns). Each movement records product, quantity, source/destination warehouse, reference number, and timestamp.',
      category: 'guide' as const,
      tags: ['inventory', 'stock-movements', 'warehouse'],
    },
    {
      title: 'Lead Scoring Methodology',
      content: 'Leads are scored 0-100 based on: Company size (0-20pts), Budget indication (0-25pts), Engagement level (0-20pts), Source quality (0-15pts), Timeline urgency (0-20pts). Scores above 70 are "Hot", 40-70 are "Warm", below 40 are "Cold". Auto-reassignment occurs at score changes.',
      category: 'guide' as const,
      tags: ['crm', 'leads', 'scoring'],
    },
    {
      title: 'Invoice and Payment Workflow',
      content: 'Invoice lifecycle: Draft > Sent > Partially Paid > Paid > Overdue. Payment terms default to Net-30. Overdue invoices trigger automatic reminders at 7, 14, and 30 days. Partial payments are tracked. Credit notes can be issued for returns or adjustments.',
      category: 'sop' as const,
      tags: ['finance', 'invoices', 'payments'],
    },
    {
      title: 'Warehouse Transfer Process',
      content: 'To transfer stock between warehouses: 1) Go to Inventory > Transfers. 2) Select source and destination warehouses. 3) Add products and quantities. 4) Submit transfer request. 5) Source warehouse confirms dispatch. 6) Destination warehouse confirms receipt. Stock is in-transit between confirmations.',
      category: 'sop' as const,
      tags: ['inventory', 'warehouse', 'transfer'],
    },
    {
      title: 'Low Stock Alert Configuration',
      content: 'Low stock alerts trigger when quantity falls below the product reorder_point. Configure per product in Product Settings > Stock Levels. Set min_stock_level for critical threshold and reorder_point for warning threshold. Alerts appear in dashboard notifications and can trigger auto-PO generation if enabled.',
      category: 'guide' as const,
      tags: ['inventory', 'alerts', 'reorder'],
    },
  ];

  for (const entry of defaultEntries) {
    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('id')
      .eq('title', entry.title)
      .single();

    if (!existing) {
      await addKnowledgeEntry({
        ...entry,
        metadata: {},
        is_active: true,
      });
    }
  }
}
