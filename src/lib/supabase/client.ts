import { createBrowserClient } from '@supabase/ssr'

type SupabaseClient = ReturnType<typeof createBrowserClient>

export const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      fetch: (url: RequestInfo | URL, init?: RequestInit) => {
        // Wrap every single fetch made by the Supabase client with a 10-second timeout.
        // This ensures database queries, authentication requests, and storage operations
        // never hang indefinitely if the user's browser has network/cookie connection issues.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        return fetch(url, {
          ...init,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      },
    },
  },
);

export const createAuthClientBrowser = createClient;

/**
 * Safe wrapper around supabase.auth.getUser() that never hangs.
 * Returns the user if authenticated, or null if the call times out
 * or the session is invalid. Throws on timeout so callers can
 * distinguish between "not logged in" and "network failure".
 */
export async function safeGetUser(supabase: SupabaseClient, timeoutMs = 8000) {
  const result = await Promise.race([
    supabase.auth.getUser(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AUTH_TIMEOUT')), timeoutMs),
    ),
  ]);
  return result;
}
