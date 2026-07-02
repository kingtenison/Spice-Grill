import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const db = getServiceClient();
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

  const validActions = ['confirm', 'prepare', 'ready', 'assign_dispatcher', 'pickup', 'on_way', 'arrive', 'deliver', 'cancel'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Map actions to order status and delivery status
  const statusMap: Record<string, { orderStatus: string; deliveryStatus?: string }> = {
    confirm: { orderStatus: 'accepted' },
    prepare: { orderStatus: 'preparing', deliveryStatus: 'preparing' },
    ready: { orderStatus: 'ready', deliveryStatus: 'ready_for_pickup' },
    assign_dispatcher: { orderStatus: 'ready', deliveryStatus: 'assigned' },
    pickup: { orderStatus: 'out_for_delivery', deliveryStatus: 'picked_up' },
    on_way: { orderStatus: 'out_for_delivery', deliveryStatus: 'on_the_way' },
    arrive: { orderStatus: 'out_for_delivery', deliveryStatus: 'arrived' },
    deliver: { orderStatus: 'delivered', deliveryStatus: 'delivered' },
    cancel: { orderStatus: 'cancelled', deliveryStatus: 'cancelled' }
  };

  const { orderStatus, deliveryStatus } = statusMap[action];

  try {
    console.log(`🔄 Updating order ${orderId} to status ${orderStatus}, delivery status ${deliveryStatus}`);

    const { error: updateError } = await db
      .from("orders")
      .update({ status: orderStatus })
      .eq("id", orderId);

    console.log('Update result:', { error: updateError });

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      throw updateError;
    }

    // Update delivery assignment status if applicable
    if (deliveryStatus) {
      const { error: deliveryUpdateError } = await db
        .from("delivery_assignments")
        .update({ status: deliveryStatus })
        .eq("order_id", orderId);

      console.log('Delivery update result:', { error: deliveryUpdateError });

      if (deliveryUpdateError) {
        console.warn('⚠️ Delivery update failed, but order update succeeded:', deliveryUpdateError);
        // Don't throw - order update is the critical part
      }
    }

    const { data: order, error: fetchError } = await db
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
        order: { id: orderId, status: orderStatus },
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