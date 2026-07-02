import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const bypassAuth = searchParams.has('bypass'); // For testing

  if (!bypassAuth) {
    // Check if user is admin/employee
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !['admin', 'employee'].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
  }

  // First, get all orders with delivery assignments
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      status,
      created_at,
      delivery_address,
      customer_location,
      user_id,
      delivery_assignments!delivery_assignments_order_id_fkey(
        id,
        status,
        dispatcher_id,
        dispatchers(
          name,
          phone
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get unique user IDs for profile lookup
  const userIds = orders?.filter(order => order.user_id).map(order => order.user_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

  // Transform the data to match the expected interface
  const transformedOrders = orders?.map(order => ({
    id: order.id,
    total_amount: order.total_amount,
    status: order.status,
    created_at: order.created_at,
    delivery_address: order.delivery_address,
    customer_location: order.customer_location,
    delivery_assignments: order.delivery_assignments?.[0] || null,
    profiles: order.user_id ?
      { full_name: profileMap.get(order.user_id) || 'Unknown User' } :
      { full_name: 'Guest User' }
  }));

  return NextResponse.json({
    orders: transformedOrders ?? [],
    debug: {
      totalFound: orders?.length || 0,
      userRole: bypassAuth ? 'bypassed' : 'admin',
      userIds: userIds.length
    }
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const isTest = url.searchParams.has('test'); // For creating test orders

  if (!isTest) {
    // Check admin permissions for non-test orders
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
  }

  // Create a test order
  const testOrder = {
    user_id: null, // Guest order
    total_amount: 25.99,
    delivery_address: "Test User - (555) 123-4567 - test@example.com - 123 Test St, Test City, TS 12345",
    status: "pending",
    payment_status: "paid"
  };

  const { data: order, error } = await supabase
    .from("orders")
    .insert(testOrder)
    .select()
    .single();

  if (error) {
    console.error("Error creating test order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order, message: "Test order created successfully" });
}