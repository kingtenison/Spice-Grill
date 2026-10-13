import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null;

export const createClient = (): SupabaseClient => {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (typeof window === 'undefined') {
    return createBrowserClient(url, anonKey);
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      url,
      anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      },
    );
  }

  return browserClient;
};

export const resetBrowserClient = () => {
  browserClient = null;
};

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
