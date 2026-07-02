import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, dispatcher_id, current_location, delivery_notes, estimated_delivery_time } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updates: any = {};
    if (status) updates.status = status;
    if (dispatcher_id !== undefined) updates.dispatcher_id = dispatcher_id;
    if (current_location) updates.current_location = current_location;
    if (delivery_notes !== undefined) updates.delivery_notes = delivery_notes;
    if (estimated_delivery_time) updates.estimated_delivery_time = estimated_delivery_time;

    // Set timestamps based on status
    if (status === 'assigned' && !updates.assigned_at) {
      updates.assigned_at = new Date().toISOString();
    }
    if (status === 'picked_up' && !updates.picked_up_at) {
      updates.picked_up_at = new Date().toISOString();
    }
    if (status === 'delivered' && !updates.actual_delivery_time) {
      updates.actual_delivery_time = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('delivery_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ delivery: data });
  } catch (error: any) {
    console.error('Error updating delivery assignment:', error);
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
      .from('delivery_assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting delivery assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
