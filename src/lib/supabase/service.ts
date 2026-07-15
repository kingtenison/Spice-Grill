import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceClient: SupabaseClient<any> | null = null;

export function getServiceClient() {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
    if (!key) throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');

    serviceClient = createClient<any>(url, key,
      {
        global: {
          fetch: (url: RequestInfo | URL, init?: RequestInit) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3_000);

            return fetch(url, {
              ...init,
              signal: controller.signal,
            }).finally(() => clearTimeout(timeoutId));
          },
        },
      }
    );
  }
  return serviceClient;
}
