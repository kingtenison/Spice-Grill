import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';

/**
 * Gets the authenticated user. Tries getUser() (network-verified) first
 * with a short timeout, then falls back to getSession() (local cookie) 
 * if the network is unavailable.
 */
async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) return user;
  } catch (err) {
    console.warn('[getAuthenticatedUser] Secure auth check failed:', err);
  }
  return null;
}

/**
 * GET /api/auth/me
 * 
 * Returns the current user's profile and role.
 */
export async function GET() {
  const cookieStore = await cookies();

  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ user: null, profile: null, role: 'customer' }, { status: 401 });
    }

    // Check for cached role cookie to avoid DB query
    const cachedRole = cookieStore.get('sb-user-role')?.value;
    const cachedName = cookieStore.get('sb-user-fullname')?.value;
    const cachedDispatcher = cookieStore.get('sb-user-dispatcher')?.value;

    if (cachedRole) {
      return NextResponse.json({
        user,
        profile: {
          id: user.id,
          role: cachedRole,
          full_name: cachedName || user.user_metadata?.full_name || 'User',
          email: user.email
        },
        role: cachedRole,
        isApprovedDispatcher: cachedDispatcher === 'approved'
      });
    }

    // Fallback: Fetch profile and dispatcher status from DB with a short timeout
    const db = getServiceClient();

    let profileData = null;
    let dispatcherData = null;
    try {
      const profilePromise = db
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const dispatcherPromise = db
        .from('dispatchers')
        .select('application_status')
        .eq('user_id', user.id)
        .maybeSingle();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 3000)
      );

      const [profileResult, dispatcherResult] = await Promise.all([
        Promise.race([profilePromise, timeoutPromise]),
        Promise.race([dispatcherPromise, timeoutPromise])
      ]);
      
      profileData = profileResult.data;
      dispatcherData = dispatcherResult.data;
    } catch (dbErr: any) {
      console.warn('[API auth/me] DB fetch timed out or failed:', dbErr.message);
    }

    const role = profileData?.role ?? 'customer';
    const fullName = profileData?.full_name ?? user.user_metadata?.full_name ?? 'User';
    const isApprovedDispatcher = dispatcherData?.application_status === 'approved';

    // Cache role/name/dispatcher in cookies for future requests (valid for 1 week)
    const cookieOpts = {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    const response = NextResponse.json({
      user,
      profile: {
        id: user.id,
        role,
        full_name: fullName,
        email: user.email
      },
      role,
      isApprovedDispatcher
    });

    response.cookies.set('sb-user-role', role, cookieOpts);
    response.cookies.set('sb-user-fullname', fullName, cookieOpts);
    response.cookies.set('sb-user-dispatcher', isApprovedDispatcher ? 'approved' : 'none', cookieOpts);

    return response;
  } catch (error: any) {
    console.error('[API auth/me] Global Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
