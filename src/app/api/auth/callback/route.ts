import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Server-side callback for Supabase OAuth (Google).
 * Exchanges the auth `code` for a session and stores it in cookies,
 * then redirects the user based on their role.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/menu';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url));
  }

  const cookiesToSetList: Array<{ name: string; value: string; options?: any }> = [];

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
          cookiesToSet.forEach((item) => {
            cookiesToSetList.push(item);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Supabase OAuth exchange failed:', error);
    const errRedirect = NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url),
    );
    cookiesToSetList.forEach(({ name, value, options }) => {
      errRedirect.cookies.set(name, value, {
        path: '/',
        sameSite: 'lax',
        ...options,
      });
    });
    return errRedirect;
  }

  // Session is now stored in cookies. Determine role for redirect.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=no_user', url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'customer';

  // Check if they are an approved dispatcher
  const { data: dispatcher } = await supabase
    .from('dispatchers')
    .select('application_status')
    .eq('user_id', user.id)
    .maybeSingle();

  const isApprovedDispatcher = dispatcher?.application_status === 'approved';

  const redirectUrl =
    role === 'admin'
      ? new URL('/admin', url)
      : role === 'employee'
        ? new URL('/employee', url)
        : isApprovedDispatcher
          ? new URL('/dispatcher', url)
          : new URL(next, url);

  // Build the redirect response and attach all authentication cookies with full options
  const redirectResponse = NextResponse.redirect(redirectUrl);
  cookiesToSetList.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, {
      path: '/',
      sameSite: 'lax',
      ...options,
    });
  });

  return redirectResponse;
}
