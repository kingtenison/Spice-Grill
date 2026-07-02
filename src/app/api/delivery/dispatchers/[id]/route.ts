import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, avatar_url, is_active, status, current_location } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (is_active !== undefined) updates.is_active = is_active;
    if (status !== undefined) updates.status = status;
    if (current_location !== undefined) updates.current_location = current_location;

    const { data, error } = await supabase
      .from('dispatchers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ dispatcher: data });
  } catch (error: any) {
    console.error('Error updating dispatcher:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('dispatchers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deactivating dispatcher:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
