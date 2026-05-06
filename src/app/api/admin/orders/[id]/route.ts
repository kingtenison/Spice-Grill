import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const { id: orderId } = await params;
  const action = url.searchParams.get('action');

  console.log(`🔄 Admin order update request: orderId=${orderId}, action=${action}`);

  if (!orderId || !action) {
    console.log('❌ Missing orderId or action');
    return NextResponse.json({ error: "Order ID and action required" }, { status: 400 });
  }

  // Check admin permissions
  const { data: { user } } = await supabase.auth.getUser();
  console.log('User:', user?.id);

  if (!user) {
    console.log('No user found');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log('Profile:', profile, 'Error:', profileError);

  if (!profile || !['admin', 'employee'].includes(profile.role)) {
    console.log('Insufficient permissions:', profile?.role);
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const validActions = ['confirm', 'prepare', 'ready', 'deliver', 'cancel'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Map actions to status
  const statusMap: Record<string, string> = {
    confirm: 'accepted',
    prepare: 'preparing',
    ready: 'ready',
    deliver: 'delivered',
    cancel: 'cancelled'
  };

  const newStatus = statusMap[action];

  try {
    console.log(`🔄 Updating order ${orderId} to status ${newStatus}`);

    // First, just update the status without selecting complex relations
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    console.log('Update result:', { error: updateError });

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      throw updateError;
    }

    // Then fetch the updated order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles(full_name)
      `)
      .eq("id", orderId)
      .single();

    console.log('Fetch result:', { order, error: fetchError });

    if (fetchError) {
      console.warn('⚠️ Fetch failed, but update succeeded:', fetchError);
      // Still return success since the update worked
      return NextResponse.json({
        success: true,
        order: { id: orderId, status: newStatus },
        message: `Order ${action}ed successfully`
      });
    }

    // TODO: Send notification to user (could integrate with email service)

    console.log(`Order ${action}ed successfully`);
    return NextResponse.json({
      success: true,
      order,
      message: `Order ${action}ed successfully`
    });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}