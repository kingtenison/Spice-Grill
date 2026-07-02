import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Initiates Google OAuth flow via Supabase Auth.
 * Generates the OAuth authorization URL and redirects the user to Google.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error || !data?.url) {
    console.error('Failed to generate Google OAuth URL:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_init_failed', origin));
  }

  // Redirect user to the Google sign-in page.
  // Copy any PKCE cookies that Supabase set (code_verifier) to the redirect response.
  const redirectResponse = NextResponse.redirect(data.url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });

  return redirectResponse;
}
