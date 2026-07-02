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
    const dispatcherId = searchParams.get('dispatcher_id');

    let query = supabase
      .from('delivery_assignments')
      .select(`
        *,
        orders!delivery_assignments_order_id_fkey(id, total_amount, delivery_address, created_at, user_id),
        dispatchers(id, name, phone, status)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (dispatcherId) {
      query = query.eq('dispatcher_id', dispatcherId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ deliveries: data });
  } catch (error: any) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, dispatcher_id, status, estimated_delivery_time, delivery_notes } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('delivery_assignments')
      .insert({
        order_id,
        dispatcher_id: dispatcher_id || null,
        status: status || 'pending',
        estimated_delivery_time,
        delivery_notes,
        assigned_at: dispatcher_id ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ delivery: data });
  } catch (error: any) {
    console.error('Error creating delivery assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
