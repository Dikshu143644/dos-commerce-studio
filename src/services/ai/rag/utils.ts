/**
 * Sanitize a value before interpolating it into a PostgREST .or() or .ilike()
 * filter expression. Strips characters that PostgREST interprets as operators
 * (commas, dots followed by letters, parentheses, backslashes, asterisks).
 * This prevents user-derived strings from injecting additional filter clauses.
 *
 * The same logic exists in the Edge Function (supabase/functions/ai-chat/index.ts).
 * Keep them in sync.
 */
export function sanitizeFilterValue(value: string): string {
  // Remove PostgREST filter operators and special chars that could manipulate queries
  return value.replace(/[,().*\\]/g, '').trim();
}
