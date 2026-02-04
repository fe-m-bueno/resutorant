import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with service role for admin operations.
 * This should ONLY be used in secure server-side contexts.
 * It does not use browser cookies to avoid session conflicts.
 */
export async function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
