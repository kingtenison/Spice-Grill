import { getServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Gets the authenticated user. Tries getUser() (network-verified) first
 * with a short timeout, then falls back to getSession() (local cookie).
 */
async function getSessionUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) return user;
  } catch (err) {
    console.warn('[getSessionUser] Auth check failed:', err);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(request.url);
    const dispatcherIdParam = searchParams.get('dispatcher_id');

    // If no session AND no dispatcher_id param, we can't look up anything
    if (!user && !dispatcherIdParam) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getServiceClient();
    
    // Find dispatcher profile with a short 3-second timeout
    let existingDispatcher = null;
    try {
      const queryPromise = dispatcherIdParam
        ? db.from("dispatchers").select("*").eq("id", dispatcherIdParam).maybeSingle()
        : db.from("dispatchers").select("*").eq("user_id", user!.id).maybeSingle();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 3000)
      );

      const result = await Promise.race([queryPromise, timeoutPromise]);
      existingDispatcher = result.data;
    } catch (dbErr: any) {
      console.warn('[API dispatcher GET] Database query timed out:', dbErr.message);
    }

    if (!existingDispatcher) {
      return NextResponse.json({ dispatcher: null, profile: null, active: [], completed: [] });
    }

    // Fetch active & completed deliveries with a short 3-second timeout
    let active: any[] = [];
    let completed: any[] = [];
    try {
      const deliveriesPromise = db
        .from("delivery_assignments")
        .select("*, orders!delivery_assignments_order_id_fkey(id, total_amount, delivery_address, created_at, customer_location, customer_confirmed, dispatcher_confirmed, delivery_completion_status)")
        .eq("dispatcher_id", existingDispatcher.id)
        .order("created_at", { ascending: false });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 3000)
      );

      const result = await Promise.race([deliveriesPromise, timeoutPromise]);

      const deliveries = result.data || [];
      active = deliveries.filter((d: any) => d.status !== 'delivered' && d.status !== 'cancelled');
      completed = deliveries.filter((d: any) => d.status === 'delivered' || d.status === 'cancelled');
    } catch (dbErr: any) {
      console.warn('[API dispatcher GET] Fetching deliveries timed out:', dbErr.message);
    }

    return NextResponse.json({
      dispatcher: existingDispatcher,
      profile: existingDispatcher,
      active,
      completed
    });
  } catch (error: any) {
    console.error('[API dispatcher GET] Global Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, vehicle_info, current_location } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // If only phone is provided (no name), this is a phone-login lookup
    if (!name) {
      const { data: dispatcher } = await db
        .from("dispatchers")
        .select("*")
        .eq("phone", phone)
        .eq("application_status", "approved")
        .maybeSingle();

      if (!dispatcher) {
        return NextResponse.json({ error: "Dispatcher not found or not approved", dispatcher: null }, { status: 404 });
      }

      return NextResponse.json({ dispatcher });
    }

    // Otherwise, this is a new application — require auth
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check duplicate
    const { data: existing } = await db
      .from("dispatchers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (existing) {
      return NextResponse.json({ error: "Application already exists" }, { status: 400 });
    }

    const { error: insertError } = await db
      .from("dispatchers")
      .insert({
        user_id: user.id,
        name,
        phone,
        email: email || user.email,
        vehicle_info,
        current_location,
        application_status: "pending"
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API dispatcher POST] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const db = getServiceClient();
  const { deliveryId, status, dispatcherId } = await request.json();

  if (!deliveryId || !status) {
    return NextResponse.json({ error: "Delivery ID and status required" }, { status: 400 });
  }

  const updates: any = { status };

  if (status === 'picked_up') {
    updates.picked_up_at = new Date().toISOString();
  } else if (status === 'on_the_way') {
    updates.estimated_delivery_time = new Date(Date.now() + 30 * 60000).toISOString();
  } else if (status === 'delivered') {
    updates.actual_delivery_time = new Date().toISOString();
  }

  const { error } = await db
    .from("delivery_assignments")
    .update(updates)
    .eq("id", deliveryId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (dispatcherId) {
    const { data: deliveries } = await db
      .from("delivery_assignments")
      .select("*, orders!delivery_assignments_order_id_fkey(id, total_amount, delivery_address, created_at)")
      .eq("dispatcher_id", dispatcherId)
      .order("created_at", { ascending: false });

    const active = deliveries?.filter((d: any) => d.status !== 'delivered' && d.status !== 'cancelled') || [];
    const completed = deliveries?.filter((d: any) => d.status === 'delivered' || d.status === 'cancelled') || [];

    return NextResponse.json({ success: true, active, completed });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const db = getServiceClient();
  const { dispatcherId, status } = await request.json();

  if (!dispatcherId || !status) {
    return NextResponse.json({ error: "Dispatcher ID and status required" }, { status: 400 });
  }

  const { error } = await db
    .from("dispatchers")
    .update({ status })
    .eq("id", dispatcherId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}