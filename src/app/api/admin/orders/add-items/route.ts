import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { orderId, items } = await request.json();

  if (!orderId || !items) {
    return NextResponse.json({ error: "Order ID and items required" }, { status: 400 });
  }

  // Check admin permissions
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    // For testing, let's try to disable RLS temporarily for this operation
    // First, try normal insertion
    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      menu_item_id: item.id || item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    console.log("Manually inserting order items:", orderItems);

    let { data, error } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();

    if (error) {
      console.log("Normal insertion failed, trying alternative approach");
      // If RLS fails, try inserting one by one or with different approach
      // For now, just return the error but also try to show what we attempted
      return NextResponse.json({
        error: error.message,
        attempted: orderItems,
        suggestion: "RLS policies may be blocking insertion. Try running: ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;"
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}