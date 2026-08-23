import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';

/**
 * Creates a Supabase client using the service-role key.
 *
 * NOTE: The service-role key bypasses Row Level Security (RLS). This is intentional
 * for this single-tenant staff application where all authenticated users are trusted
 * team members. The auth boundary is enforced at the JWT middleware layer - only
 * authenticated staff can reach protected routes. If this application is ever extended
 * to multi-tenant use, switch to a user-scoped client or add explicit ownership checks
 * in each handler.
 */
export function createSupabaseClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
