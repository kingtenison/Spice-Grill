import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`total_amount, created_at, status`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0;
  const totalOrders = orders?.length ?? 0;

  return NextResponse.json({
    totalRevenue,
    totalOrders,
    orders: orders ?? [],
  });
}