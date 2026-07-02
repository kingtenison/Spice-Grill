import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getServiceClient();

  const [{ data: deliveriesData }, { data: dispatchersData }, { data: allOrders }] = await Promise.all([
    db
      .from("delivery_assignments")
      .select(`
        *,
        orders!delivery_assignments_order_id_fkey(id, total_amount, delivery_address, created_at, user_id, status),
        dispatchers(id, name, phone, status)
      `)
      .order("created_at", { ascending: false }),
    db
      .from("dispatchers")
      .select("*")
      .eq("is_active", true),
    db
      .from("orders")
      .select("id, total_amount, delivery_address, created_at, user_id, status, shipping_method")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const deliveryOrderIds = (deliveriesData || []).map(d => d.order_id).filter(Boolean);
  const pickupOrders = (allOrders || [])
    .filter(o => !deliveryOrderIds.includes(o.id))
    .filter(o => {
      const method = typeof o.shipping_method === 'string' ? o.shipping_method : (o.shipping_method?.name || '');
      return method !== 'pickup' && (o.status === 'ready' || o.status === 'preparing' || o.status === 'pending');
    })
    .map(o => ({
      id: o.id,
      total_amount: o.total_amount,
      delivery_address: o.delivery_address,
      created_at: o.created_at,
      user_id: o.user_id,
      status: o.status,
    }));

  return NextResponse.json({
    deliveries: deliveriesData ?? [],
    dispatchers: dispatchersData ?? [],
    pickupOrders,
  });
}

export async function PATCH(request: Request) {
  const db = getServiceClient();
  const { deliveryId, status, notes, dispatcherId } = await request.json();

  if (!deliveryId || !status) {
    return NextResponse.json({ error: "Delivery ID and status required" }, { status: 400 });
  }

  const updates: any = { status };
  if (notes !== undefined) updates.delivery_notes = notes;
  if (dispatcherId !== undefined) updates.dispatcher_id = dispatcherId;

  const { data: delivery, error: deliveryError } = await db
    .from("delivery_assignments")
    .update(updates)
    .eq("id", deliveryId)
    .select("order_id")
    .single();

  if (deliveryError) {
    return NextResponse.json({ error: deliveryError.message }, { status: 500 });
  }

  // Update order status based on delivery status
  const orderStatusMap: Record<string, string> = {
    'pending': 'pending',
    'preparing': 'accepted',
    'ready_for_pickup': 'ready',
    'assigned': 'out_for_delivery',
    'picked_up': 'out_for_delivery',
    'on_the_way': 'out_for_delivery',
    'arrived': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'delayed': 'out_for_delivery'
  };

  if (delivery?.order_id && orderStatusMap[status]) {
    await db
      .from("orders")
      .update({ status: orderStatusMap[status] })
      .eq("id", delivery.order_id);
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const db = getServiceClient();
  
  let body: { orderId: string; dispatcherId?: string };
  try {
    body = await request.json();
  } catch (e) {
    console.error("Invalid JSON in request:", e);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  
  const { orderId, dispatcherId } = body;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  console.log("Creating delivery assignment for order:", orderId, "dispatcher:", dispatcherId);

  // First check if order exists and is eligible for delivery assignment
  const { data: existingOrder, error: orderError } = await db
    .from("orders")
    .select("id, status, shipping_method")
    .eq("id", orderId)
    .single();

  if (orderError) {
    console.error("Error fetching order:", orderError);
    return NextResponse.json({ error: `Order not found: ${orderError.message}` }, { status: 404 });
  }

  if (!existingOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Check shipping method
  const shippingMethod = typeof existingOrder.shipping_method === 'string' 
    ? existingOrder.shipping_method 
    : (existingOrder.shipping_method?.name || '');
  
  console.log("Order shipping method:", shippingMethod);
  
  if (shippingMethod === 'pickup') {
    return NextResponse.json({ error: "Cannot create delivery assignment for pickup orders" }, { status: 400 });
  }

  // Check if order already has a delivery assignment (query delivery_assignments directly)
  const { data: existingAssignment, error: checkError } = await db
    .from("delivery_assignments")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  
  if (checkError && checkError.code !== 'PGRST116') {
    console.error("Error checking existing assignment:", checkError);
  }
  
  if (existingAssignment) {
    return NextResponse.json({ error: "Order already has a delivery assignment" }, { status: 400 });
  }

  const { data: delivery, error } = await db
    .from("delivery_assignments")
    .insert({ 
      order_id: orderId, 
      dispatcher_id: dispatcherId || null, 
      status: "assigned" 
    })
    .select(`
      *,
      orders!delivery_assignments_order_id_fkey(id, total_amount, delivery_address, created_at, user_id, status),
      dispatchers(id, name, phone, status)
    `)
    .single();

  if (error) {
    console.error("Error creating delivery assignment:", error);
    return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
  }

  // Update the order's status
  const { error: updateError } = await db
    .from("orders")
    .update({ 
      status: 'out_for_delivery'
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error updating order status:", updateError);
  }

  return NextResponse.json({ delivery, success: true });
}
