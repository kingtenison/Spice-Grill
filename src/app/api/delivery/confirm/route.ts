import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const db = getServiceClient();
    const { deliveryId, status, confirmer } = await request.json();

    if (!deliveryId || !status || !confirmer) {
      return NextResponse.json({ error: "Delivery ID, status, and confirmer required" }, { status: 400 });
    }

    // Get the delivery assignment to find the order
    const { data: delivery, error: fetchError } = await db
      .from("delivery_assignments")
      .select("order_id")
      .eq("id", deliveryId)
      .single();

    if (fetchError || !delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    // Update the order with confirmation
    const updates: any = {
      delivery_completion_status: status
    };

    if (confirmer === 'dispatcher') {
      updates.dispatcher_confirmed = true;
    } else if (confirmer === 'customer') {
      updates.customer_confirmed = true;
    }

    const { error: updateError } = await db
      .from("orders")
      .update(updates)
      .eq("id", delivery.order_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If both confirmed and status is completed, mark delivery as delivered
    if (status === 'completed') {
      const { data: order } = await db
        .from("orders")
        .select("customer_confirmed, dispatcher_confirmed")
        .eq("id", delivery.order_id)
        .single();

      if (order?.customer_confirmed && order?.dispatcher_confirmed) {
        await db
          .from("delivery_assignments")
          .update({ 
            status: 'delivered',
            actual_delivery_time: new Date().toISOString()
          })
          .eq("id", deliveryId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error confirming delivery:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
