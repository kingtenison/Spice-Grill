import { getServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const db = getServiceClient();
  const { searchParams } = new URL(request.url);
  const dispatcherId = searchParams.get("dispatcher_id");

  if (!dispatcherId) {
    return NextResponse.json({ error: "dispatcher_id is required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("dispatcher_earnings")
    .select("*")
    .eq("dispatcher_id", dispatcherId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalEarned = data.reduce((sum, e) => sum + (e.total_earned || 0), 0);
  const totalPaid = data.filter(e => e.is_paid).reduce((sum, e) => sum + (e.total_earned || 0), 0);
  const pendingPayout = totalEarned - totalPaid;

  return NextResponse.json({
    earnings: data,
    summary: {
      total_earned: Math.round(totalEarned * 100) / 100,
      total_paid: Math.round(totalPaid * 100) / 100,
      pending_payout: Math.round(pendingPayout * 100) / 100,
      total_deliveries: data.length,
    },
  });
}
