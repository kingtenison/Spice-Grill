import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Initiates Google OAuth flow via Supabase Auth.
 * Generates the OAuth authorization URL and redirects the user to Google.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const baseUrl = isLocal ? origin : (process.env.NEXT_PUBLIC_APP_URL || origin);

  const cookiesToSetList: Array<{ name: string; value: string; options?: any }> = [];

  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
    {
      cookies: {
        getAll() {
          return request.headers
            .get('cookie')
            ?.split('; ')
            .map((c) => {
              const [name, ...rest] = c.split('=');
              return { name, value: rest.join('=') };
            }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((item) => {
            cookiesToSetList.push(item);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${baseUrl}/api/auth/callback`,
    },
  });

  if (error || !data?.url) {
    console.error('Failed to generate Google OAuth URL:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_init_failed', origin));
  }

  // Redirect user to Google sign-in page with PKCE cookies preserved with full options
  const redirectResponse = NextResponse.redirect(data.url);
  cookiesToSetList.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, {
      path: '/',
      sameSite: 'lax',
      ...options,
    });
  });

  return redirectResponse;
}
