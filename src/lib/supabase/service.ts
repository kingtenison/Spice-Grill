import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceClient: SupabaseClient<any> | null = null;

export function getServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
