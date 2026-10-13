import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceClient: SupabaseClient | null = null;

export function getServiceClient() {
  if (!serviceClient) {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!url) throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
    if (!key) throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');

    serviceClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serviceClient;
}
