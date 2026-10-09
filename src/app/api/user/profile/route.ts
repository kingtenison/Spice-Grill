import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';

/**
 * GET /api/user/profile
 * Returns the current authenticated user's profile and contact details.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getServiceClient();
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('[GET /api/user/profile] DB fetch warning:', profileError.message);
    }

    const phone = profile?.phone || user.phone || user.user_metadata?.phone || '';
    const fullName = profile?.full_name || user.user_metadata?.full_name || 'User';

    return NextResponse.json({
      profile: {
        id: user.id,
        full_name: fullName,
        email: user.email || '',
        phone: phone,
        role: profile?.role || 'customer',
        avatar_url: profile?.avatar_url || null,
        created_at: profile?.created_at || user.created_at,
      }
    });
  } catch (error: any) {
    console.error('[GET /api/user/profile] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile
 * Updates the user's full_name, phone, and/or email address.
 */
export async function PATCH(request: Request) {
  const cookieStore = await cookies();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, email } = body;

    const trimmedName = typeof full_name === 'string' ? full_name.trim() : undefined;
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : undefined;
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : undefined;

    if (trimmedEmail !== undefined && trimmedEmail !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }
    }

    const db = getServiceClient();

    // 1. Update the public.profiles table
    const profileUpdates: Record<string, any> = {};
    if (trimmedName !== undefined) profileUpdates.full_name = trimmedName;
    if (trimmedPhone !== undefined) profileUpdates.phone = trimmedPhone;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileUpdateError } = await db
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error('[PATCH /api/user/profile] Profiles table error:', profileUpdateError);
        return NextResponse.json({ error: 'Failed to update profile record: ' + profileUpdateError.message }, { status: 500 });
      }
    }

    // 2. Update Supabase Auth user record (email, phone, user_metadata)
    const authUpdates: Record<string, any> = {
      user_metadata: {
        ...(user.user_metadata || {}),
        ...(trimmedName !== undefined ? { full_name: trimmedName } : {}),
        ...(trimmedPhone !== undefined ? { phone: trimmedPhone } : {}),
      }
    };

    let emailChanged = false;
    if (trimmedEmail && trimmedEmail !== user.email?.toLowerCase()) {
      authUpdates.email = trimmedEmail;
      authUpdates.email_confirm = true; // Auto-confirm so user session isn't locked out
      emailChanged = true;
    }

    if (trimmedPhone !== undefined) {
      // In Supabase Auth, phone can also be stored in user metadata
      authUpdates.user_metadata.phone = trimmedPhone;
    }

    try {
      const { error: adminAuthError } = await db.auth.admin.updateUserById(user.id, authUpdates);
      if (adminAuthError) {
        console.warn('[PATCH /api/user/profile] Admin auth update failed, trying user update:', adminAuthError.message);
        // Fallback to client user update
        if (emailChanged) {
          await supabase.auth.updateUser({ email: trimmedEmail, data: authUpdates.user_metadata });
        } else {
          await supabase.auth.updateUser({ data: authUpdates.user_metadata });
        }
      }
    } catch (authErr: any) {
      console.warn('[PATCH /api/user/profile] Auth update warning:', authErr.message);
    }

    // 3. Update cached cookies for fast server-side checks
    const cookieOpts = {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    const finalName = trimmedName !== undefined ? trimmedName : (user.user_metadata?.full_name || 'User');
    const finalPhone = trimmedPhone !== undefined ? trimmedPhone : (user.user_metadata?.phone || '');
    const finalEmail = trimmedEmail || user.email || '';

    const response = NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        full_name: finalName,
        email: finalEmail,
        phone: finalPhone,
      },
      message: emailChanged
        ? 'Profile and email updated successfully!'
        : 'Profile updated successfully!'
    });

    response.cookies.set('sb-user-fullname', finalName, cookieOpts);
    response.cookies.set('sb-user-phone', finalPhone, cookieOpts);

    return response;
  } catch (error: any) {
    console.error('[PATCH /api/user/profile] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
