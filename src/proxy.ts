import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session with a timeout to prevent hanging on stale
  // sessions or network issues (the root cause of the infinite loading).
  let user = null
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('proxy_auth_timeout')), 8000),
      ),
    ])
    user = result.data?.user ?? null
  } catch (err) {
    // Timeout or network error — clear stale cookies and let through
    console.warn('[proxy] Auth check failed:', (err as Error).message)
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/menu') &&
    !request.nextUrl.pathname.startsWith('/cart') &&
    !request.nextUrl.pathname.startsWith('/checkout') &&
    !request.nextUrl.pathname.startsWith('/orders') &&
    !request.nextUrl.pathname.startsWith('/blog') &&
    !request.nextUrl.pathname.startsWith('/loyalty') &&
    !request.nextUrl.pathname.startsWith('/dispatcher') &&
    !request.nextUrl.pathname.startsWith('/track') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /login (public auth page)
     * - /register (public registration page)
     * - /auth (OAuth callback and auth routes)
     * - /api (API routes)
     * - /debug (debug pages)
     * - /blog (public blog)
     * - /loyalty (public rewards)
     * - /dispatcher (has own login)
     * - /track (public order tracking)
     */
      '/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|robots\\.txt|sitemap\\.xml|login|register|auth|debug|blog|loyalty|dispatcher|track|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css|xml)$).*)',
  ],
}
