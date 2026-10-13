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

    if (error) {
      console.warn('[getAuthenticatedUser] getUser failed:', error.message);
      // Fallback: If network issue, check session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) return session.user;
    }
  } catch (err: any) {
    console.warn('[getAuthenticatedUser] Secure auth check exception:', err?.message || err);
    try {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) return session.user;
    } catch {}
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

    // Check for cached role cookie matching this specific user to avoid DB query
    const cachedUserId = cookieStore.get('sb-user-id')?.value;
    const cachedRole = cookieStore.get('sb-user-role')?.value;
    const cachedName = cookieStore.get('sb-user-fullname')?.value;
    const cachedPhone = cookieStore.get('sb-user-phone')?.value;
    const cachedDispatcher = cookieStore.get('sb-user-dispatcher')?.value;

    if (cachedUserId === user.id && cachedRole) {
      return NextResponse.json({
        user,
        profile: {
          id: user.id,
          role: cachedRole,
          full_name: cachedName || user.user_metadata?.full_name || 'User',
          email: user.email,
          phone: cachedPhone || user.user_metadata?.phone || user.phone || ''
        },
        role: cachedRole,
        isApprovedDispatcher: cachedDispatcher === 'approved'
      });
    }

    // Fallback: Fetch profile and dispatcher status from DB with a generous timeout
    const db = getServiceClient();

    let profileData = null;
    let dispatcherData = null;
    let dbSuccess = false;
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
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 8000)
      );

      const [profileResult, dispatcherResult] = await Promise.all([
        Promise.race([profilePromise, timeoutPromise]),
        Promise.race([dispatcherPromise, timeoutPromise])
      ]);
      
      profileData = profileResult.data;
      dispatcherData = dispatcherResult.data;
      dbSuccess = true;
    } catch (dbErr: any) {
      console.warn('[API auth/me] DB fetch timed out or failed:', dbErr.message);
    }

    const role = profileData?.role ?? 'customer';
    const fullName = profileData?.full_name ?? user.user_metadata?.full_name ?? 'User';
    const phone = profileData?.phone ?? user.user_metadata?.phone ?? user.phone ?? '';
    const isApprovedDispatcher = dispatcherData?.application_status === 'approved';

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
        email: user.email,
        phone
      },
      role,
      isApprovedDispatcher
    });

    // Only cache if database lookup actually succeeded
    if (dbSuccess) {
      response.cookies.set('sb-user-id', user.id, cookieOpts);
      response.cookies.set('sb-user-role', role, cookieOpts);
      response.cookies.set('sb-user-fullname', fullName, cookieOpts);
      response.cookies.set('sb-user-phone', phone, cookieOpts);
      response.cookies.set('sb-user-dispatcher', isApprovedDispatcher ? 'approved' : 'none', cookieOpts);
    }

    return response;
  } catch (error: any) {
    console.error('[API auth/me] Global Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
