import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  const db = getServiceClient();

  const { data: orderData, error: orderError } = await db
    .from("orders")
    .select("*, order_items(*, menu_items(name, image_url)), customer_location, customer_confirmed, dispatcher_confirmed, delivery_completion_status")
    .eq("id", orderId)
    .single();

  if (orderError || !orderData) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: deliveryData } = await db
    .from("delivery_assignments")
    .select("*, dispatchers(id, name, phone, avatar_url)")
    .eq("order_id", orderId)
    .single();

  return NextResponse.json({ order: orderData, delivery: deliveryData ?? null });
}
