import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('dispatchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ dispatchers: data });
  } catch (error: any) {
    console.error('Error fetching dispatchers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, avatar_url, is_active } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('dispatchers')
      .insert({
        name,
        phone,
        email,
        avatar_url,
        is_active: is_active !== undefined ? is_active : true,
        status: 'available'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ dispatcher: data });
  } catch (error: any) {
    console.error('Error creating dispatcher:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
