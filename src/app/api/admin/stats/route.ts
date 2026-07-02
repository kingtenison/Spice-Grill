import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getServiceClient();
  
  const { data: orders, error } = await db
    .from("orders")
    .select("total_amount, status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0;
  const totalOrders = orders?.length ?? 0;

  return NextResponse.json({
    totalRevenue,
    totalOrders,
  });
}