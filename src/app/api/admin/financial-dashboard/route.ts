import { getServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const db = getServiceClient();
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const dispatcherId = searchParams.get("dispatcher_id");

  // Fetch all platform fees with order info
  let query = db
    .from("platform_fees")
    .select(`
      *,
      orders!platform_fees_order_id_fkey(id, total_amount, delivery_address, created_at, status, user_id, customer_location)
    `)
    .order("created_at", { ascending: false });

  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate + "T23:59:59");
  }

  const { data: fees, error: feesError } = await query;

  if (feesError) {
    return NextResponse.json({ error: feesError.message }, { status: 500 });
  }

  // Fetch dispatcher earnings
  let earningsQuery = db
    .from("dispatcher_earnings")
    .select("*")
    .order("created_at", { ascending: false });

  if (dispatcherId) {
    earningsQuery = earningsQuery.eq("dispatcher_id", dispatcherId);
  }
  if (startDate) {
    earningsQuery = earningsQuery.gte("created_at", startDate);
  }
  if (endDate) {
    earningsQuery = earningsQuery.lte("created_at", endDate + "T23:59:59");
  }

  const { data: earnings } = await earningsQuery;

  // Fetch dispatchers for name lookup
  const { data: dispatchers } = await db
    .from("dispatchers")
    .select("id, name");

  const dispatcherMap = new Map((dispatchers || []).map((d: any) => [d.id, d.name]));

  // Calculate summaries
  const totalRevenue = fees.reduce((sum, f) => sum + (f.total_collected || 0), 0);
  const totalDispatcherPayout = fees.reduce((sum, f) => sum + (f.dispatcher_payout || 0), 0);
  const totalPlatformNet = fees.reduce((sum, f) => sum + (f.platform_net || 0), 0);
  const totalDeliveryFees = fees.reduce((sum, f) => sum + (f.delivery_fee || 0), 0);
  const totalServiceFees = fees.reduce((sum, f) => sum + (f.service_fee || 0), 0);
  const totalSmallOrderFees = fees.reduce((sum, f) => sum + (f.small_order_fee || 0), 0);

  // Pending payouts (earnings not yet paid)
  const pendingPayouts = (earnings || [])
    .filter((e: any) => !e.is_paid)
    .reduce((sum, e) => sum + (e.total_earned || 0), 0);

  // Per-dispatcher breakdown
  const dispatcherBreakdown: Record<string, { name: string; totalEarned: number; totalDeliveries: number; pending: number }> = {};
  for (const e of earnings || []) {
    const dId = e.dispatcher_id;
    if (!dispatcherBreakdown[dId]) {
      dispatcherBreakdown[dId] = {
        name: dispatcherMap.get(dId) || "Unknown",
        totalEarned: 0,
        totalDeliveries: 0,
        pending: 0,
      };
    }
    dispatcherBreakdown[dId].totalEarned += e.total_earned || 0;
    dispatcherBreakdown[dId].totalDeliveries += 1;
    if (!e.is_paid) {
      dispatcherBreakdown[dId].pending += e.total_earned || 0;
    }
  }

  return NextResponse.json({
    summary: {
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_dispatcher_payout: Math.round(totalDispatcherPayout * 100) / 100,
      total_platform_net: Math.round(totalPlatformNet * 100) / 100,
      total_delivery_fees: Math.round(totalDeliveryFees * 100) / 100,
      total_service_fees: Math.round(totalServiceFees * 100) / 100,
      total_small_order_fees: Math.round(totalSmallOrderFees * 100) / 100,
      pending_payouts: Math.round(pendingPayouts * 100) / 100,
      total_orders: fees.length,
    },
    transactions: fees.map((f: any) => ({
      ...f,
      dispatcher_name: dispatcherBreakdown[earnings?.find((e: any) => e.order_id === f.order_id)?.dispatcher_id]?.name || null,
    })),
    dispatcher_breakdown: Object.entries(dispatcherBreakdown).map(([id, data]) => ({
      dispatcher_id: id,
      ...data,
      total_earned: Math.round(data.totalEarned * 100) / 100,
      pending: Math.round(data.pending * 100) / 100,
    })),
  });
}
